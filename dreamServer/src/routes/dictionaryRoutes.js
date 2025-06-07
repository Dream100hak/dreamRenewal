// src/routes/dictionaryRoutes.js (완전히 새로운 파일)
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

console.log('📖 새로운 사전 라우터 로드됨!');

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

// 기본 경로
router.get('/', (req, res) => {
  res.json({
    message: '📖 새로운 꿈사전 API',
    version: '2.0.0',
    endpoints: {
      'GET /test': 'API 테스트',
      'GET /consonants': '초성 목록',
      'GET /consonant/:consonant': '초성별 키워드',
      'GET /search': '키워드 검색'
    }
  });
});

// 테스트
router.get('/test', (req, res) => {
  res.json({
    message: '새로운 API 테스트 성공! 🎉',
    timestamp: new Date().toISOString()
  });
});

// 초성 목록
router.get('/consonants', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    try {
      const [keywords] = await connection.execute(`
        SELECT keyword FROM dream_keywords 
        WHERE keyword IS NOT NULL 
        ORDER BY keyword
      `);
      
      const consonantCount = {};
      keywords.forEach(row => {
        const consonant = getInitialConsonant(row.keyword.charAt(0));
        if (consonant) {
          consonantCount[consonant] = (consonantCount[consonant] || 0) + 1;
        }
      });
      
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
    console.error('❌ 초성 목록 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 초성별 키워드
router.get('/consonant/:consonant', async (req, res) => {
  try {
    const { consonant } = req.params;
    const connection = await pool.getConnection();
    
    try {
      const [allKeywords] = await connection.execute(`
        SELECT k.id, k.keyword, k.importance
        FROM dream_keywords k
        WHERE k.keyword IS NOT NULL
        ORDER BY k.keyword
      `);
      
      const filteredKeywords = allKeywords.filter(row => {
        const keywordConsonant = getInitialConsonant(row.keyword.charAt(0));
        return keywordConsonant === consonant;
      });
      
      const results = [];
      for (const keyword of filteredKeywords) {
        const [numbers] = await connection.execute(`
          SELECT number FROM keyword_numbers WHERE keyword_id = ? ORDER BY number
        `, [keyword.id]);
        
        results.push({
          id: keyword.id,
          keyword: keyword.keyword,
          numbers: numbers.map(n => n.number),
          importance: keyword.importance || 0,
          stars: '★'.repeat(keyword.importance || 0)
        });
      }
      
      res.json({
        success: true,
        consonant: consonant,
        keywords: results,
        count: results.length
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ 초성별 키워드 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔥 완전히 새로운 간단한 검색
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json({
        success: true,
        query: '',
        keywords: [],
        count: 0
      });
    }
    
    console.log(`🔍 새로운 검색: "${q}"`);
    
    const connection = await pool.getConnection();
    
    try {
      // 아주 간단한 검색
      const [results] = await connection.execute(`
        SELECT id, keyword, importance 
        FROM dream_keywords 
        WHERE keyword LIKE ? 
        ORDER BY importance DESC, keyword 
        LIMIT 20
      `, [`%${q}%`]);
      
      const keywords = [];
      for (const row of results) {
        const [numbers] = await connection.execute(`
          SELECT number FROM keyword_numbers WHERE keyword_id = ?
        `, [row.id]);
        
        keywords.push({
          id: row.id,
          keyword: row.keyword,
          numbers: numbers.map(n => n.number),
          importance: row.importance || 0,
          stars: '★'.repeat(row.importance || 0)
        });
      }
      
      console.log(`✅ 검색 완료: ${keywords.length}개`);
      
      res.json({
        success: true,
        query: q,
        keywords: keywords,
        count: keywords.length
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ 검색 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;