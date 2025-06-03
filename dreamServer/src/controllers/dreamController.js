// src/controllers/dreamController.js
const { pool } = require('../config/database');

// 키워드 검색 API
async function searchKeyword(req, res) {
  try {
    const { keyword } = req.query;
    
    if (!keyword) {
      return res.status(400).json({
        error: '검색할 키워드를 입력해주세요',
        example: '/api/search?keyword=강아지'
      });
    }
    
    console.log(`🔍 키워드 검색: "${keyword}"`);
    
    const connection = await pool.getConnection();
    
    try {
      // 정확한 매치 검색
      const [results] = await connection.execute(`
        SELECT 
          k.keyword,
          k.importance,
          GROUP_CONCAT(kn.number ORDER BY kn.number) as numbers,
          GROUP_CONCAT(kn.is_end_digit ORDER BY kn.number) as end_digits
        FROM dream_keywords k
        LEFT JOIN keyword_numbers kn ON k.id = kn.keyword_id
        WHERE k.keyword LIKE ?
        GROUP BY k.id, k.keyword, k.importance
        ORDER BY k.importance DESC, k.keyword
      `, [`%${keyword}%`]);
      
      if (results.length === 0) {
        return res.json({
          keyword: keyword,
          found: false,
          message: '해당 키워드를 찾을 수 없습니다',
          suggestions: await getSuggestions(keyword, connection)
        });
      }
      
      // 결과 포맷팅
      const formattedResults = results.map(item => {
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
      
      res.json({
        keyword: keyword,
        found: true,
        count: formattedResults.length,
        results: formattedResults
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ 검색 오류:', error);
    res.status(500).json({
      error: '검색 중 오류가 발생했습니다',
      details: error.message
    });
  }
}

// 번호로 키워드 역검색 API
async function searchByNumber(req, res) {
  try {
    const { number } = req.params;
    const num = parseInt(number);
    
    if (isNaN(num) || num < 1 || num > 45) {
      return res.status(400).json({
        error: '1~45 사이의 번호를 입력해주세요',
        example: '/api/number/7'
      });
    }
    
    console.log(`🔢 번호 검색: ${num}`);
    
    const connection = await pool.getConnection();
    
    try {
      const [results] = await connection.execute(`
        SELECT 
          k.keyword,
          k.importance,
          kn.number,
          kn.is_end_digit
        FROM dream_keywords k
        JOIN keyword_numbers kn ON k.id = kn.keyword_id
        WHERE kn.number = ?
        ORDER BY k.importance DESC, k.keyword
      `, [num]);
      
      if (results.length === 0) {
        return res.json({
          number: num,
          found: false,
          message: `번호 ${num}에 해당하는 키워드가 없습니다`,
          keywords: []
        });
      }
      
      const keywords = results.map(item => {
        const stars = '★'.repeat(item.importance);
        return {
          keyword: item.keyword,
          importance: item.importance,
          stars: stars,
          isEndDigit: item.is_end_digit,
          display: `${item.keyword}${stars}`
        };
      });
      
      res.json({
        number: num,
        found: true,
        count: keywords.length,
        keywords: keywords
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ 번호 검색 오류:', error);
    res.status(500).json({
      error: '번호 검색 중 오류가 발생했습니다',
      details: error.message
    });
  }
}

// 유사 키워드 제안 함수
async function getSuggestions(keyword, connection) {
  try {
    const [suggestions] = await connection.execute(`
      SELECT keyword 
      FROM dream_keywords 
      WHERE keyword LIKE ?
      ORDER BY importance DESC
      LIMIT 5
    `, [`%${keyword.substring(0, 1)}%`]);
    
    return suggestions.map(item => item.keyword);
  } catch (error) {
    return [];
  }
}

// 통계 정보 API
async function getStats(req, res) {
  try {
    const connection = await pool.getConnection();
    
    try {
      const [stats] = await connection.execute(`
        SELECT 
          (SELECT COUNT(*) FROM dream_keywords) as total_keywords,
          (SELECT COUNT(*) FROM keyword_numbers) as total_mappings,
          (SELECT COUNT(*) FROM dream_keywords WHERE importance > 0) as important_keywords
      `);
      
      const [topKeywords] = await connection.execute(`
        SELECT k.keyword, k.importance
        FROM dream_keywords k
        WHERE k.importance > 0
        ORDER BY k.importance DESC, k.keyword
        LIMIT 10
      `);
      
      res.json({
        statistics: {
          totalKeywords: stats[0].total_keywords,
          totalMappings: stats[0].total_mappings,
          importantKeywords: stats[0].important_keywords
        },
        topKeywords: topKeywords.map(item => ({
          keyword: item.keyword,
          importance: item.importance,
          stars: '★'.repeat(item.importance)
        }))
      });
      
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ 통계 조회 오류:', error);
    res.status(500).json({
      error: '통계 조회 중 오류가 발생했습니다',
      details: error.message
    });
  }
}

module.exports = {
  searchKeyword,
  searchByNumber,
  getStats
};