// src/routes/advancedRoutes.js
const express = require('express');
const router = express.Router();
const { 
  advancedSearchKeyword, 
  analyzeComplexText 
} = require('../controllers/advancedDreamController');

// 고급 키워드 검색 API
// GET /api/advanced/search?keyword=강아지가&threshold=70
router.get('/search', advancedSearchKeyword);

// 복합 텍스트 분석 API
// POST /api/advanced/analyze
router.post('/analyze', analyzeComplexText);

// 고급 API 도움말
router.get('/', (req, res) => {
  res.json({
    message: '🔮 DreamRenewal 고급 검색 API',
    version: '1.0.0',
    features: [
      '조사 자동 제거 ("강아지가" → "강아지")',
      '오타 교정 ("강아찌" → "강아지")',
      '퍼지 매칭 (유사도 기반)',
      '복합 텍스트 분석',
      '신뢰도 기반 결과 정렬'
    ],
    endpoints: {
      'GET /api/advanced/search': {
        description: '고급 키워드 검색 (조사 제거, 오타 교정 포함)',
        params: {
          keyword: '검색할 키워드 (필수)',
          threshold: '유사도 임계값 (선택, 기본값: 70)'
        },
        example: '/api/advanced/search?keyword=강아지가&threshold=80'
      },
      'POST /api/advanced/analyze': {
        description: '복합 텍스트 분석 (여러 키워드 동시 처리)',
        body: {
          text: '분석할 꿈 내용'
        },
        example: {
          text: '어제 꿈에서 강아지가 집에서 뛰어놀았어요'
        }
      }
    },
    usage: {
      advancedSearch: 'curl "http://localhost:3000/api/advanced/search?keyword=강아지가"',
      textAnalysis: 'curl -X POST "http://localhost:3000/api/advanced/analyze" -H "Content-Type: application/json" -d \'{"text":"강아지가 집에서 놀아요"}\''
    },
    searchSteps: {
      step1: '정확한 매치 검색',
      step2: '조사 제거 후 검색',
      step3: '퍼지 매칭 (유사도 기반)',
      step4: '부분 문자열 검색'
    }
  });
});

module.exports = router;