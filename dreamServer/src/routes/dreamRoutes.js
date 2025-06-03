// src/routes/dreamRoutes.js
const express = require('express');
const router = express.Router();
const { 
  searchKeyword, 
  searchByNumber, 
  getStats 
} = require('../controllers/dreamController');

// 키워드 검색 API
// GET /api/search?keyword=강아지
router.get('/search', searchKeyword);

// 번호로 키워드 역검색 API
// GET /api/number/7
router.get('/number/:number', searchByNumber);

// 통계 정보 API
// GET /api/stats
router.get('/stats', getStats);

// API 도움말
router.get('/', (req, res) => {
  res.json({
    message: '🔮 DreamRenewal API 엔드포인트',
    version: '1.0.0',
    endpoints: {
      'GET /api/search': {
        description: '키워드로 로또번호 검색',
        params: 'keyword (쿼리 파라미터)',
        example: '/api/search?keyword=강아지'
      },
      'GET /api/number/:number': {
        description: '번호로 키워드 역검색',
        params: 'number (1~45)',
        example: '/api/number/7'
      },
      'GET /api/stats': {
        description: '데이터베이스 통계 정보',
        params: '없음',
        example: '/api/stats'
      }
    },
    usage: {
      search: 'curl "http://localhost:3000/api/search?keyword=강아지"',
      reverse: 'curl "http://localhost:3000/api/number/7"',
      stats: 'curl "http://localhost:3000/api/stats"'
    }
  });
});

module.exports = router;