// src/routes/homonymRoutes.js
const express = require('express');
const router = express.Router();
const { 
  analyzeHomonym, 
  recordUserChoice, 
  getHomonymList 
} = require('../controllers/homonymController');

// 동음이의어 분석 API
// GET /api/homonym/analyze?keyword=눈&context=눈이 아프다
router.get('/analyze', analyzeHomonym);

// 사용자 선택 기록 API
// POST /api/homonym/choice
router.post('/choice', recordUserChoice);

// 동음이의어 목록 조회 API
// GET /api/homonym/list
router.get('/list', getHomonymList);

// 동음이의어 API 도움말
router.get('/', (req, res) => {
  res.json({
    message: '🔮 DreamRenewal 동음이의어 처리 API',
    version: '1.0.0',
    description: '문맥을 분석하여 동음이의어의 올바른 의미를 찾는 시스템',
    features: [
      '동음이의어 자동 감지',
      '문맥 기반 의미 추론',
      '사용자 피드백 학습',
      '사용 통계 기반 추천'
    ],
    endpoints: {
      'GET /api/homonym/analyze': {
        description: '동음이의어 분석 및 문맥 추론',
        params: {
          keyword: '분석할 키워드 (필수)',
          context: '문맥 텍스트 (선택)'
        },
        examples: [
          '/api/homonym/analyze?keyword=눈&context=눈이 아프다',
          '/api/homonym/analyze?keyword=눈&context=눈이 온다',
          '/api/homonym/analyze?keyword=배&context=배가 고프다',
          '/api/homonym/analyze?keyword=배&context=배를 타고',
          '/api/homonym/analyze?keyword=밤&context=밤을 줍다',
          '/api/homonym/analyze?keyword=밤&context=밤에 잠을'
        ]
      },
      'POST /api/homonym/choice': {
        description: '사용자가 선택한 의미 기록 (학습용)',
        body: {
          keyword: '키워드',
          context: '문맥',
          selectedMeaningId: '선택한 의미 ID',
          confidence: '신뢰도 (선택)'
        },
        example: {
          keyword: '눈',
          context: '눈이 아프다',
          selectedMeaningId: 123,
          confidence: 95
        }
      },
      'GET /api/homonym/list': {
        description: '시스템에 등록된 동음이의어 목록',
        params: '없음',
        example: '/api/homonym/list'
      }
    },
    testCases: {
      bodyPart_vs_weather: {
        description: '인체 vs 날씨',
        tests: [
          { keyword: '눈', context: '눈이 아프다', expected: '인체' },
          { keyword: '눈', context: '눈이 온다', expected: '날씨' },
          { keyword: '눈', context: '눈을 깜빡', expected: '인체' },
          { keyword: '눈', context: '하얀 눈이', expected: '날씨' }
        ]
      },
      body_vs_vehicle: {
        description: '인체 vs 탈것',
        tests: [
          { keyword: '배', context: '배가 고프다', expected: '인체' },
          { keyword: '배', context: '배를 타고', expected: '사물' },
          { keyword: '배', context: '배가 아프다', expected: '인체' },
          { keyword: '배', context: '바다에서 배가', expected: '사물' }
        ]
      },
      food_vs_time: {
        description: '음식 vs 시간',
        tests: [
          { keyword: '밤', context: '밤을 줍다', expected: '음식' },
          { keyword: '밤', context: '밤에 잠을', expected: '시간' },
          { keyword: '밤', context: '가을 밤이', expected: '음식' },
          { keyword: '밤', context: '깊은 밤에', expected: '시간' }
        ]
      }
    },
    usage: {
      contextAnalysis: 'curl "http://localhost:3000/api/homonym/analyze?keyword=눈&context=눈이 아프다"',
      recordChoice: 'curl -X POST "http://localhost:3000/api/homonym/choice" -H "Content-Type: application/json" -d \'{"keyword":"눈","context":"눈이 아프다","selectedMeaningId":123}\'',
      getList: 'curl "http://localhost:3000/api/homonym/list"'
    }
  });
});

module.exports = router;