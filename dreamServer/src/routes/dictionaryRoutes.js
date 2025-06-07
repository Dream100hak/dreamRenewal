// src/routes/dictionaryRoutes.js (기능 확장 버전)
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

console.log('📖 사전 라우터가 로드되었습니다!');

// 한글 초성 추출 함수
function getInitialConsonant(char) {
  const code = char.charCodeAt(0) - 44032;
  if (code < 0 || code > 11171) return null;
  
  const consonants = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 
    'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
  ];
  
  return consonants[Math.floor(code / 588)];
}

// 기본 경로 - API 정보
router.get('/', (req, res) => {
  console.log('📝 사전 기본 경로 접근됨');
  res.json({
    message: '📖 꿈사전 API',
    version: '1.0.0',
    endpoints: {
      'GET /': '이 도움말',
      'GET /test': 'API 연결 테스트',
      'GET /consonants': '초성 목록 조회 (ㄱ,ㄴ,ㄷ...)',
      'GET /consonant/:consonant': '특정 초성의 키워드들 (예: /consonant/ㄱ)'
    },
    examples: [
      '/api/dictionary/consonants',
      '/api/dictionary/consonant/ㄱ',
      '/api/dictionary/consonant/ㅂ'
    ]
  });
});

// 테스트 API
router.get('/test', (req, res) => {
  console.log('🧪 테스트 경로 접근됨');
  res.json({
    message: '테스트 성공! 🎉',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// 초성 목록 조회 API
router.get('/consonants', async (req, res) => {
  try {
    console.log('🔍 초성 목록 조회 시작');
    
    const connection = await pool.getConnection();
    
    try {
      // 모든 키워드 가져오기
      const [keywords] = await connection.execute(`
        SELECT keyword 
        FROM dream_keywords 
        WHERE keyword IS NOT NULL AND keyword != ''
        ORDER BY keyword
      `);
      
      console.log(`📝 총 ${keywords.length}개 키워드 발견`);
      
      // 초성별 개수 계산
      const consonantCount = {};
      
      keywords.forEach(row => {
        const firstChar = row.keyword.charAt(0);
        const consonant = getInitialConsonant(firstChar);
        
        if (consonant) {
          consonantCount[consonant] = (consonantCount[consonant] || 0) + 1;
        }
      });
      
      console.log('📊 초성별 개수:', consonantCount);
      
      // 결과 정렬
      const result = Object.keys(consonantCount)
        .sort()
        .map(consonant => ({
          consonant: consonant,
          count: consonantCount[consonant]
        }));
      
      res.json({
        success: true,
        consonants: result,
        total: keywords.length
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ 초성 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '초성 목록을 불러오는데 실패했습니다',
      details: error.message
    });
  }
});

// 🔥 새로 추가: 특정 초성의 키워드들 조회
router.get('/consonant/:consonant', async (req, res) => {
  try {
    const { consonant } = req.params;
    console.log(`🔍 초성 "${consonant}" 키워드 조회 시작`);
    
    const connection = await pool.getConnection();
    
    try {
      // 모든 키워드와 관련 정보 가져오기
      const [allKeywords] = await connection.execute(`
        SELECT 
          k.id,
          k.keyword,
          k.importance,
          GROUP_CONCAT(kn.number ORDER BY kn.number) as numbers,
          GROUP_CONCAT(kn.is_end_digit ORDER BY kn.number) as end_digits
        FROM dream_keywords k
        LEFT JOIN keyword_numbers kn ON k.id = kn.keyword_id
        WHERE k.keyword IS NOT NULL AND k.keyword != ''
        GROUP BY k.id, k.keyword, k.importance
        ORDER BY k.keyword
      `);
      
      console.log(`📝 전체 ${allKeywords.length}개 키워드에서 필터링 중...`);
      
      // 해당 초성으로 시작하는 키워드만 필터링
      const filteredKeywords = allKeywords.filter(row => {
        const firstChar = row.keyword.charAt(0);
        const keywordConsonant = getInitialConsonant(firstChar);
        return keywordConsonant === consonant;
      });
      
      console.log(`✅ "${consonant}" 초성 키워드 ${filteredKeywords.length}개 발견`);
      
      // 결과 포맷팅
      const formattedResults = filteredKeywords.map(item => {
        const numbers = item.numbers ? item.numbers.split(',').map(n => parseInt(n)) : [];
        const stars = '★'.repeat(item.importance || 0);
        
        return {
          id: item.id,
          keyword: item.keyword,
          numbers: numbers,
          importance: item.importance || 0,
          stars: stars,
          display: `${item.keyword}${stars} [${numbers.join(',')}]`
        };
      });
      
      res.json({
        success: true,
        consonant: consonant,
        keywords: formattedResults,
        count: formattedResults.length
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ 초성별 키워드 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '키워드 조회 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

// 키워드 검색 API
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json({
        success: true,
        query: '',
        keywords: [],
        count: 0,
        message: '검색어를 입력해주세요'
      });
    }
    
    const searchTerm = q.trim();
    console.log(`🔍 키워드 검색: "${searchTerm}"`);
    
    const connection = await pool.getConnection();
    
    try {
      // 검색 쿼리 (키워드 이름으로 검색)
      const [searchResults] = await connection.execute(`
        SELECT 
          k.id,
          k.keyword,
          k.importance,
          k.semantic_meaning,
          c.category_name,
          GROUP_CONCAT(kn.number ORDER BY kn.number) as numbers,
          GROUP_CONCAT(kn.is_end_digit ORDER BY kn.number) as end_digits
        FROM dream_keywords k
        LEFT JOIN keyword_categories c ON k.category_id = c.id
        LEFT JOIN keyword_numbers kn ON k.id = kn.keyword_id
        WHERE k.keyword LIKE ? OR k.semantic_meaning LIKE ?
        GROUP BY k.id, k.keyword, k.importance, k.semantic_meaning, c.category_name
        ORDER BY 
          CASE 
            WHEN k.keyword = ? THEN 1          -- 정확한 매치 우선
            WHEN k.keyword LIKE ? THEN 2       -- 시작하는 단어 우선
            ELSE 3                             -- 포함하는 단어
          END,
          k.importance DESC,                   -- 중요도 높은 순
          k.keyword
        LIMIT ?
      `, [
        `%${searchTerm}%`,  // 키워드에 포함
        `%${searchTerm}%`,  // 의미에 포함
        searchTerm,         // 정확한 매치
        `${searchTerm}%`,   // 시작하는 단어
        parseInt(limit)
      ]);
      
      console.log(`✅ 검색 결과: ${searchResults.length}개 발견`);
      
      // 결과 포맷팅
      const formattedResults = searchResults.map(item => {
        const numbers = item.numbers ? item.numbers.split(',').map(n => parseInt(n)) : [];
        const endDigits = item.end_digits ? item.end_digits.split(',').map(d => d === '1') : [];
        const stars = '★'.repeat(item.importance || 0);
        
        return {
          id: item.id,
          keyword: item.keyword,
          meaning: item.semantic_meaning,
          category: item.category_name,
          numbers: numbers.map((num, idx) => ({
            number: num,
            isEndDigit: endDigits[idx] || false
          })),
          importance: item.importance || 0,
          stars: stars,
          display: `${item.keyword}${stars} [${numbers.join(',')}]`
        };
      });
      
      res.json({
        success: true,
        query: searchTerm,
        keywords: formattedResults,
        count: formattedResults.length,
        total: formattedResults.length,
        message: formattedResults.length > 0 
          ? `"${searchTerm}"에 대한 검색 결과` 
          : `"${searchTerm}"에 대한 검색 결과가 없습니다`
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ 키워드 검색 오류:', error);
    res.status(500).json({
      success: false,
      error: '검색 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

// API 도움말 업데이트 (기존 '/' 라우터 수정)
// 🔥 기존 검색 API 부분을 이것으로 완전히 교체하세요!

// 키워드 검색 API (수정된 버전)
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json({
        success: true,
        query: '',
        keywords: [],
        count: 0,
        message: '검색어를 입력해주세요'
      });
    }
    
    const searchTerm = q.trim();
    console.log(`🔍 키워드 검색: "${searchTerm}"`);
    
    const connection = await pool.getConnection();
    
    try {
      // 🔥 간단하고 안전한 검색 쿼리
      const [searchResults] = await connection.execute(`
        SELECT 
          k.id,
          k.keyword,
          k.importance,
          GROUP_CONCAT(kn.number ORDER BY kn.number) as numbers
        FROM dream_keywords k
        LEFT JOIN keyword_numbers kn ON k.id = kn.keyword_id
        WHERE k.keyword LIKE ?
        GROUP BY k.id, k.keyword, k.importance
        ORDER BY 
          CASE 
            WHEN k.keyword = ? THEN 1
            WHEN k.keyword LIKE ? THEN 2
            ELSE 3
          END,
          k.importance DESC,
          k.keyword
        LIMIT ?
      `, [
        `%${searchTerm}%`,   // 키워드에 포함
        searchTerm,          // 정확한 매치
        `${searchTerm}%`,    // 시작하는 단어
        parseInt(limit)
      ]);
      
      console.log(`✅ 검색 결과: ${searchResults.length}개 발견`);
      
      // 결과 포맷팅
      const formattedResults = searchResults.map(item => {
        const numbers = item.numbers ? item.numbers.split(',').map(n => parseInt(n)) : [];
        const stars = '★'.repeat(item.importance || 0);
        
        return {
          id: item.id,
          keyword: item.keyword,
          numbers: numbers,
          importance: item.importance || 0,
          stars: stars,
          display: `${item.keyword}${stars} [${numbers.join(',')}]`
        };
      });
      
      res.json({
        success: true,
        query: searchTerm,
        keywords: formattedResults,
        count: formattedResults.length,
        message: formattedResults.length > 0 
          ? `"${searchTerm}"에 대한 검색 결과 ${formattedResults.length}개` 
          : `"${searchTerm}"에 대한 검색 결과가 없습니다`
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ 키워드 검색 오류:', error);
    res.status(500).json({
      success: false,
      error: '검색 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

module.exports = router;