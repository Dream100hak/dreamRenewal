// src/controllers/homonymController.js
const { pool } = require('../config/database');
const { removeParticles, normalizeKeyword } = require('../utils/koreanUtils');

// 동음이의어 감지 및 문맥 분석 API
async function analyzeHomonym(req, res) {
  try {
    const { keyword, context = '' } = req.query;
    
    if (!keyword) {
      return res.status(400).json({
        error: '분석할 키워드를 입력해주세요',
        example: '/api/homonym/analyze?keyword=눈&context=눈이 아프다'
      });
    }
    
    console.log(`🔍 동음이의어 분석: "${keyword}" (문맥: "${context}")`);
    
    const connection = await pool.getConnection();
    
    try {
      // 1. 키워드 정규화
      const normalizedKeyword = normalizeKeyword(keyword);
      
      // 2. 동음이의어 검색
      const homonyms = await findHomonyms(normalizedKeyword, connection);
      
      if (homonyms.length <= 1) {
        // 동음이의어가 아닌 경우
        return res.json({
          keyword: keyword,
          normalized: normalizedKeyword,
          isHomonym: false,
          result: homonyms[0] || null,
          message: homonyms.length === 0 ? '키워드를 찾을 수 없습니다' : '단일 의미 키워드입니다'
        });
      }
      
      // 3. 문맥 분석
      let selectedMeaning = null;
      let confidence = 0;
      let analysisMethod = 'none';
      
      if (context.trim()) {
        const contextAnalysis = await analyzeContext(homonyms, context, connection);
        selectedMeaning = contextAnalysis.selectedMeaning;
        confidence = contextAnalysis.confidence;
        analysisMethod = 'context';
      }
      
      // 4. 문맥 분석 실패 시 사용 빈도 기반 추천
      if (!selectedMeaning || confidence < 70) {
        const popularMeaning = await getMostPopularMeaning(homonyms, connection);
        if (!selectedMeaning) {
          selectedMeaning = popularMeaning;
          analysisMethod = 'popularity';
          confidence = 50;
        }
      }
      
      res.json({
        keyword: keyword,
        normalized: normalizedKeyword,
        context: context,
        isHomonym: true,
        totalMeanings: homonyms.length,
        allMeanings: homonyms,
        selectedMeaning: selectedMeaning,
        confidence: confidence,
        analysisMethod: analysisMethod,
        needsUserChoice: confidence < 70
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ 동음이의어 분석 오류:', error);
    res.status(500).json({
      error: '분석 중 오류가 발생했습니다',
      details: error.message
    });
  }
}

// 사용자 선택 기록 API
async function recordUserChoice(req, res) {
  try {
    const { keyword, context, selectedMeaningId, confidence } = req.body;
    
    if (!keyword || !selectedMeaningId) {
      return res.status(400).json({
        error: '필수 정보가 누락되었습니다',
        required: ['keyword', 'selectedMeaningId']
      });
    }
    
    const connection = await pool.getConnection();
    
    try {
      // 1. 선택 기록 저장
      const contextWords = extractContextWords(context || '');
      const userIp = req.ip || req.connection.remoteAddress;
      
      await connection.execute(`
        INSERT INTO homonym_selection_logs 
        (search_text, ambiguous_word, selected_meaning_id, context_words, was_auto_resolved, confidence_score, user_ip)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        context || keyword,
        keyword,
        selectedMeaningId,
        JSON.stringify(contextWords),
        false,
        confidence || 0,
        userIp
      ]);
      
      // 2. 사용 통계 업데이트
      await connection.execute(`
        INSERT INTO homonym_usage_stats (keyword_id, usage_count, context_pattern)
        VALUES (?, 1, ?)
        ON DUPLICATE KEY UPDATE
          usage_count = usage_count + 1,
          context_pattern = ?,
          last_used = CURRENT_TIMESTAMP
      `, [
        selectedMeaningId,
        JSON.stringify(contextWords),
        JSON.stringify(contextWords)
      ]);
      
      // 3. 문맥 키워드 가중치 업데이트 (학습)
      for (const word of contextWords) {
        await connection.execute(`
          INSERT INTO context_keywords (keyword_id, context_word, weight)
          VALUES (?, ?, 1.0)
          ON DUPLICATE KEY UPDATE
            weight = LEAST(weight + 0.1, 3.0)
        `, [selectedMeaningId, word]);
      }
      
      console.log(`📝 사용자 선택 기록됨: "${keyword}" -> 의미 ID ${selectedMeaningId}`);
      
      res.json({
        success: true,
        message: '선택이 기록되었습니다',
        learningEffect: '시스템이 학습하여 다음에는 더 정확하게 판단할 수 있습니다'
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ 사용자 선택 기록 오류:', error);
    res.status(500).json({
      error: '선택 기록 중 오류가 발생했습니다',
      details: error.message
    });
  }
}

// 동음이의어 목록 조회 API
async function getHomonymList(req, res) {
  try {
    const connection = await pool.getConnection();
    
    try {
      const [homonymWords] = await connection.execute(`
        SELECT 
          k.keyword,
          COUNT(*) as meaning_count,
          GROUP_CONCAT(
            CONCAT(c.category_name, ': ', k.semantic_meaning)
            ORDER BY c.category_name
            SEPARATOR ' | '
          ) as meanings
        FROM dream_keywords k
        JOIN keyword_categories c ON k.category_id = c.id
        WHERE k.category_id IS NOT NULL
        GROUP BY k.keyword
        HAVING meaning_count > 1
        ORDER BY meaning_count DESC, k.keyword
      `);
      
      res.json({
        message: '동음이의어 목록',
        count: homonymWords.length,
        homonyms: homonymWords.map(item => ({
          keyword: item.keyword,
          meaningCount: item.meaning_count,
          meanings: item.meanings.split(' | ')
        }))
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ 동음이의어 목록 조회 오류:', error);
    res.status(500).json({
      error: '목록 조회 중 오류가 발생했습니다',
      details: error.message
    });
  }
}

// 동음이의어 찾기 함수
async function findHomonyms(keyword, connection) {
  const [results] = await connection.execute(`
    SELECT 
      k.id,
      k.keyword,
      k.semantic_meaning,
      k.importance,
      c.category_name,
      GROUP_CONCAT(kn.number ORDER BY kn.number) as numbers
    FROM dream_keywords k
    LEFT JOIN keyword_categories c ON k.category_id = c.id
    LEFT JOIN keyword_numbers kn ON k.id = kn.keyword_id
    WHERE k.keyword = ?
    GROUP BY k.id, k.keyword, k.semantic_meaning, k.importance, c.category_name
    ORDER BY k.importance DESC
  `, [keyword]);
  
  return results.map(item => ({
    id: item.id,
    keyword: item.keyword,
    meaning: item.semantic_meaning,
    category: item.category_name,
    importance: item.importance,
    stars: '★'.repeat(item.importance),
    numbers: item.numbers ? item.numbers.split(',').map(n => parseInt(n)) : [],
    display: `${item.keyword} (${item.category_name || '분류없음'}): ${item.semantic_meaning}`
  }));
}

// 문맥 분석 함수
async function analyzeContext(homonyms, context, connection) {
  let bestMatch = null;
  let bestScore = 0;
  
  for (const homonym of homonyms) {
    // 해당 의미의 문맥 키워드들 가져오기
    const [contextKeywords] = await connection.execute(`
      SELECT context_word, weight
      FROM context_keywords
      WHERE keyword_id = ?
    `, [homonym.id]);
    
    let score = 0;
    for (const { context_word, weight } of contextKeywords) {
      if (context.includes(context_word)) {
        score += weight;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = homonym;
    }
  }
  
  return {
    selectedMeaning: bestMatch,
    confidence: Math.min(Math.round(bestScore * 20), 100) // 0-5점을 0-100%로 변환
  };
}

// 가장 인기 있는 의미 찾기
async function getMostPopularMeaning(homonyms, connection) {
  const [stats] = await connection.execute(`
    SELECT keyword_id, usage_count
    FROM homonym_usage_stats
    WHERE keyword_id IN (${homonyms.map(() => '?').join(',')})
    ORDER BY usage_count DESC
    LIMIT 1
  `, homonyms.map(h => h.id));
  
  if (stats.length > 0) {
    return homonyms.find(h => h.id === stats[0].keyword_id);
  }
  
  return homonyms[0]; // 첫 번째 의미 반환 (중요도 순)
}

// 문맥에서 키워드 추출
function extractContextWords(context) {
  const words = context.split(/\s+/)
    .map(word => removeParticles(word).cleanText)
    .filter(word => word.length > 1);
  
  return [...new Set(words)]; // 중복 제거
}

module.exports = {
  analyzeHomonym,
  recordUserChoice,
  getHomonymList
};