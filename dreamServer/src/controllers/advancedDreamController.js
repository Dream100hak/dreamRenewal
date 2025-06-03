// src/controllers/advancedDreamController.js
const { pool } = require('../config/database');
const { 
  removeParticles, 
  normalizeKeyword, 
  calculateSimilarity,
  generateKeywordCandidates 
} = require('../utils/koreanUtils');

// 고급 키워드 검색 API
async function advancedSearchKeyword(req, res) {
  try {
    const { keyword, threshold = 70 } = req.query;
    
    if (!keyword) {
      return res.status(400).json({
        error: '검색할 키워드를 입력해주세요',
        example: '/api/advanced/search?keyword=강아지가'
      });
    }
    
    console.log(`🔍 고급 검색: "${keyword}"`);
    
    const connection = await pool.getConnection();
    const results = [];
    
    try {
      // 1. 정확한 매치 검색
      console.log('📍 1단계: 정확한 매치 검색...');
      const exactMatches = await findExactMatches(keyword, connection);
      results.push(...exactMatches.map(item => ({ ...item, matchType: 'exact', confidence: 100 })));
      
      // 2. 조사 제거 후 검색
      console.log('📍 2단계: 조사 제거 후 검색...');
      const { cleanText, removedParticles } = removeParticles(keyword);
      if (cleanText !== keyword && cleanText.length > 0) {
        const particleMatches = await findExactMatches(cleanText, connection);
        const newMatches = particleMatches.filter(item => 
          !results.some(existing => existing.keyword === item.keyword)
        );
        results.push(...newMatches.map(item => ({ 
          ...item, 
          matchType: 'particle_removed', 
          confidence: 95,
          removedParticles: removedParticles 
        })));
      }
      
      // 3. 퍼지 매칭 (유사도 기반)
      console.log('📍 3단계: 퍼지 매칭...');
      const fuzzyMatches = await findFuzzyMatches(cleanText || keyword, threshold, connection);
      const newFuzzyMatches = fuzzyMatches.filter(item => 
        !results.some(existing => existing.keyword === item.keyword)
      );
      results.push(...newFuzzyMatches);
      
      // 4. 부분 문자열 검색
      console.log('📍 4단계: 부분 문자열 검색...');
      const partialMatches = await findPartialMatches(cleanText || keyword, connection);
      const newPartialMatches = partialMatches.filter(item => 
        !results.some(existing => existing.keyword === item.keyword)
      );
      results.push(...newPartialMatches.map(item => ({ 
        ...item, 
        matchType: 'partial', 
        confidence: 80 
      })));
      
      // 결과 정렬 (신뢰도 높은 순)
      results.sort((a, b) => b.confidence - a.confidence);
      
      // 응답 생성
      res.json({
        query: {
          original: keyword,
          normalized: cleanText,
          removedParticles: removedParticles
        },
        found: results.length > 0,
        count: results.length,
        results: results.slice(0, 20), // 상위 20개만
        searchSteps: {
          '1_exact': exactMatches.length,
          '2_particle_removed': removedParticles.length > 0 ? 'processed' : 'skipped',
          '3_fuzzy': newFuzzyMatches.length,
          '4_partial': newPartialMatches.length
        }
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ 고급 검색 오류:', error);
    res.status(500).json({
      error: '검색 중 오류가 발생했습니다',
      details: error.message
    });
  }
}

// 정확한 매치 검색
async function findExactMatches(keyword, connection) {
  const [results] = await connection.execute(`
    SELECT 
      k.keyword,
      k.importance,
      GROUP_CONCAT(kn.number ORDER BY kn.number) as numbers
    FROM dream_keywords k
    LEFT JOIN keyword_numbers kn ON k.id = kn.keyword_id
    WHERE k.keyword = ?
    GROUP BY k.id, k.keyword, k.importance
  `, [keyword]);
  
  return formatResults(results);
}

// 퍼지 매칭 검색
async function findFuzzyMatches(keyword, threshold, connection) {
  // 모든 키워드 가져오기
  const [allKeywords] = await connection.execute(`
    SELECT 
      k.keyword,
      k.importance,
      GROUP_CONCAT(kn.number ORDER BY kn.number) as numbers
    FROM dream_keywords k
    LEFT JOIN keyword_numbers kn ON k.id = kn.keyword_id
    GROUP BY k.id, k.keyword, k.importance
  `);
  
  const fuzzyMatches = [];
  
  for (const row of allKeywords) {
    const similarity = calculateSimilarity(keyword, row.keyword);
    
    if (similarity >= threshold) {
      const formatted = formatResults([row])[0];
      fuzzyMatches.push({
        ...formatted,
        matchType: 'fuzzy',
        confidence: similarity,
        similarity: similarity
      });
    }
  }
  
  return fuzzyMatches.sort((a, b) => b.confidence - a.confidence);
}

// 부분 문자열 검색
async function findPartialMatches(keyword, connection) {
  const [results] = await connection.execute(`
    SELECT 
      k.keyword,
      k.importance,
      GROUP_CONCAT(kn.number ORDER BY kn.number) as numbers
    FROM dream_keywords k
    LEFT JOIN keyword_numbers kn ON k.id = kn.keyword_id
    WHERE k.keyword LIKE ?
    GROUP BY k.id, k.keyword, k.importance
    ORDER BY k.importance DESC
    LIMIT 10
  `, [`%${keyword}%`]);
  
  return formatResults(results);
}

// 결과 포맷팅 함수
function formatResults(results) {
  return results.map(item => {
    const numbers = item.numbers ? item.numbers.split(',').map(n => parseInt(n)) : [];
    const stars = '★'.repeat(item.importance);
    
    return {
      keyword: item.keyword,
      numbers: numbers,
      importance: item.importance,
      stars: stars,
      display: `${item.keyword}${stars} [${numbers.join(',')}]`
    };
  });
}

// 복합 키워드 분석 API
async function analyzeComplexText(req, res) {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        error: '분석할 텍스트를 입력해주세요',
        example: 'POST /api/advanced/analyze\n{"text": "어제 꿈에서 강아지가 집에서 뛰어놀았어요"}'
      });
    }
    
    console.log(`🔍 복합 텍스트 분석: "${text}"`);
    
    // 텍스트를 단어로 분리
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const foundKeywords = [];
    const allNumbers = new Set();
    
    const connection = await pool.getConnection();
    
    try {
      for (const word of words) {
        console.log(`  단어 분석: "${word}"`);
        
        // 각 단어에 대해 고급 검색 수행
        const exactMatches = await findExactMatches(word, connection);
        if (exactMatches.length > 0) {
          foundKeywords.push({
            originalWord: word,
            matches: exactMatches,
            matchType: 'exact'
          });
          exactMatches.forEach(match => match.numbers.forEach(num => allNumbers.add(num)));
          continue;
        }
        
        // 조사 제거 후 검색
        const { cleanText } = removeParticles(word);
        if (cleanText !== word) {
          const particleMatches = await findExactMatches(cleanText, connection);
          if (particleMatches.length > 0) {
            foundKeywords.push({
              originalWord: word,
              normalizedWord: cleanText,
              matches: particleMatches,
              matchType: 'particle_removed'
            });
            particleMatches.forEach(match => match.numbers.forEach(num => allNumbers.add(num)));
            continue;
          }
        }
        
        // 퍼지 매칭
        const fuzzyMatches = await findFuzzyMatches(cleanText, 80, connection);
        if (fuzzyMatches.length > 0) {
          foundKeywords.push({
            originalWord: word,
            normalizedWord: cleanText,
            matches: fuzzyMatches.slice(0, 3), // 상위 3개만
            matchType: 'fuzzy'
          });
          fuzzyMatches.slice(0, 3).forEach(match => match.numbers.forEach(num => allNumbers.add(num)));
        }
      }
      
      // 추천 번호 생성 (빈도순)
      const numberFrequency = {};
      foundKeywords.forEach(item => {
        item.matches.forEach(match => {
          match.numbers.forEach(num => {
            numberFrequency[num] = (numberFrequency[num] || 0) + 1;
          });
        });
      });
      
      const recommendedNumbers = Object.entries(numberFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 6)
        .map(([num, freq]) => ({ number: parseInt(num), frequency: freq }));
      
      res.json({
        originalText: text,
        analyzedWords: words,
        foundKeywords: foundKeywords,
        recommendedNumbers: recommendedNumbers,
        allPossibleNumbers: Array.from(allNumbers).sort((a, b) => a - b),
        summary: {
          totalWords: words.length,
          matchedWords: foundKeywords.length,
          uniqueNumbers: allNumbers.size
        }
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ 복합 텍스트 분석 오류:', error);
    res.status(500).json({
      error: '분석 중 오류가 발생했습니다',
      details: error.message
    });
  }
}

module.exports = {
  advancedSearchKeyword,
  analyzeComplexText
};