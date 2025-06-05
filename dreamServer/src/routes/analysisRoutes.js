// src/routes/analysisRoutes.js
const express = require('express');
const router = express.Router();
const DreamAnalysisEngine = require('../controllers/dreamAnalysisEngine');
const AdvancedHomonymProcessor = require('../controllers/advancedHomonymProcessor');

// 기본 분석 API 정보
router.get('/', (req, res) => {
  res.json({
    message: '🔮 고급 꿈해몽 분석 API',
    version: '2.0',
    description: '동음이의어 자동 처리가 포함된 향상된 꿈 분석 시스템',
    endpoints: {
      dreamAnalysis: 'POST /dream - 꿈 텍스트 종합 분석',
      homonymList: 'GET /homonyms - 지원하는 동음이의어 목록',
      feedback: 'POST /feedback - 분석 결과 피드백 제공'
    },
    features: [
      '다중 동음이의어 자동 감지',
      '문맥 기반 의미 추론',
      '자동/수동 해결 조합',
      '향상된 신뢰도 계산',
      '사용자 피드백 학습'
    ]
  });
});

// 꿈 텍스트 종합 분석
router.post('/dream', async (req, res) => {
  try {
    const { text, homonymChoices, options } = req.body;
    
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        error: '꿈 텍스트를 입력해주세요.',
        code: 'INVALID_INPUT'
      });
    }
    
    console.log('🔮 꿈 분석 요청:', {
      text: text.substring(0, 50) + '...',
      hasHomonymChoices: !!homonymChoices,
      options: options || {}
    });
    
    // 고급 꿈 분석 실행
    const analysisResult = await DreamAnalysisEngine.analyzeDream(text, {
      homonymChoices: homonymChoices || {},
      ...options
    });
    
    // 동음이의어 선택이 필요한 경우
    if (analysisResult.needsHomonymChoice) {
      return res.json({
        status: 'needs_homonym_choice',
        originalText: text,
        homonymChoices: analysisResult.pendingChoices,
        partialAnalysis: {
          detectedHomonyms: analysisResult.allHomonyms.length,
          autoResolved: analysisResult.partialResolutions.length,
          pendingChoices: analysisResult.pendingChoices.length
        },
        message: analysisResult.message,
        instructions: '각 동음이의어의 의미를 선택한 후 다시 요청해주세요.'
      });
    }
    
    // 완전한 분석 결과 반환
    res.json({
      status: 'completed',
      timestamp: new Date().toISOString(),
      ...analysisResult
    });
    
  } catch (error) {
    console.error('꿈 분석 오류:', error);
    res.status(500).json({
      error: '분석 중 오류가 발생했습니다.',
      details: error.message,
      code: 'ANALYSIS_ERROR'
    });
  }
});

// 지원하는 동음이의어 목록 조회
router.get('/homonyms', async (req, res) => {
  try {
    // 현재 지원하는 동음이의어 목록
    const homonymList = {
      '눈': [
        {
          id: 'eye',
          meaning: '사람의 시각 기관',
          category: '인체',
          numbers: [0, 1],
          examples: ['눈이 아프다', '눈을 깜빡이다', '눈물이 나다']
        },
        {
          id: 'snow',
          meaning: '하얀 결정체',
          category: '날씨',
          numbers: [37],
          examples: ['눈이 내리다', '눈이 쌓이다', '눈사람을 만들다']
        }
      ],
      '배': [
        {
          id: 'stomach',
          meaning: '사람의 복부',
          category: '인체', 
          numbers: [20],
          examples: ['배가 고프다', '배가 아프다', '배를 만지다']
        },
        {
          id: 'boat',
          meaning: '물에 뜨는 탈것',
          category: '탈것',
          numbers: [3],
          examples: ['배를 타다', '배가 출항하다', '낚시배']
        }
      ],
      '밤': [
        {
          id: 'night',
          meaning: '어두운 시간',
          category: '시간',
          numbers: [26],
          examples: ['밤에 자다', '밤이 되다', '밤하늘의 별']
        },
        {
          id: 'chestnut',
          meaning: '견과류',
          category: '음식',
          numbers: [23],
          examples: ['밤을 줍다', '군밤을 먹다', '밤나무']
        }
      ],
      '별': [
        {
          id: 'star',
          meaning: '하늘의 빛나는 천체',
          category: '자연',
          numbers: [5],
          examples: ['별이 빛나다', '별을 보다', '별자리']
        },
        {
          id: 'special',
          meaning: '특별한, 별다른',
          category: '형용사',
          numbers: [44],
          examples: ['별다른 문제', '별로 좋지 않다', '특별한 것']
        }
      ]
    };
    
    res.json({
      status: 'success',
      homonyms: homonymList,
      totalWords: Object.keys(homonymList).length,
      totalMeanings: Object.values(homonymList).flat().length,
      supportedCategories: ['인체', '날씨', '탈것', '시간', '음식', '자연', '형용사']
    });
    
  } catch (error) {
    console.error('동음이의어 목록 조회 오류:', error);
    res.status(500).json({
      error: '동음이의어 목록을 불러오는데 실패했습니다.',
      code: 'HOMONYM_LIST_ERROR'
    });
  }
});

// 특정 동음이의어 문맥 분석
router.get('/analyze-homonym', async (req, res) => {
  try {
    const { keyword, context } = req.query;
    
    if (!keyword || !context) {
      return res.status(400).json({
        error: 'keyword와 context 매개변수가 필요합니다.',
        code: 'MISSING_PARAMETERS'
      });
    }
    
    // 단일 동음이의어에 대한 문맥 분석
    const homonyms = await AdvancedHomonymProcessor.detectAllHomonyms(context);
    const targetHomonym = homonyms.find(h => h.keyword === keyword);
    
    if (!targetHomonym) {
      return res.json({
        keyword: keyword,
        context: context,
        result: 'not_homonym',
        message: '해당 키워드는 동음이의어가 아니거나 지원하지 않습니다.'
      });
    }
    
    res.json({
      keyword: keyword,
      context: context,
      result: 'analyzed',
      contextAnalysis: targetHomonym.contextAnalysis,
      recommendedMeaning: targetHomonym.contextAnalysis.bestMatch.meaning,
      confidence: targetHomonym.contextAnalysis.confidence,
      autoResolved: targetHomonym.contextAnalysis.autoResolved,
      allScores: targetHomonym.contextAnalysis.allScores
    });
    
  } catch (error) {
    console.error('동음이의어 분석 오류:', error);
    res.status(500).json({
      error: '동음이의어 분석 중 오류가 발생했습니다.',
      code: 'HOMONYM_ANALYSIS_ERROR'
    });
  }
});

// 분석 결과 피드백 처리
router.post('/feedback', async (req, res) => {
  try {
    const { dreamText, analysisResult, feedback } = req.body;
    
    if (!dreamText || !analysisResult || !feedback) {
      return res.status(400).json({
        error: 'dreamText, analysisResult, feedback가 모두 필요합니다.',
        code: 'MISSING_FEEDBACK_DATA'
      });
    }
    
    // 피드백 처리
    const result = await DreamAnalysisEngine.processFeedback(
      dreamText, 
      analysisResult, 
      feedback
    );
    
    res.json({
      status: 'success',
      message: '피드백이 처리되었습니다.',
      result: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('피드백 처리 오류:', error);
    res.status(500).json({
      error: '피드백 처리 중 오류가 발생했습니다.',
      code: 'FEEDBACK_ERROR'
    });
  }
});

// 분석 통계 조회
router.get('/stats', async (req, res) => {
  try {
    // 실제로는 데이터베이스에서 통계 조회
    const stats = {
      totalAnalyses: 1234,
      homonymDetections: 567,
      autoResolutions: 489,
      userChoices: 78,
      averageConfidence: 82.5,
      popularKeywords: [
        { keyword: '강아지', count: 234 },
        { keyword: '집', count: 198 },
        { keyword: '물', count: 156 },
        { keyword: '눈', count: 143 },
        { keyword: '차', count: 112 }
      ],
      homonymStats: {
        '눈': { total: 143, autoResolved: 128, userChoice: 15 },
        '배': { total: 89, autoResolved: 76, userChoice: 13 },
        '밤': { total: 67, autoResolved: 58, userChoice: 9 },
        '별': { total: 45, autoResolved: 41, userChoice: 4 }
      }
    };
    
    res.json({
      status: 'success',
      stats: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('통계 조회 오류:', error);
    res.status(500).json({
      error: '통계를 불러오는데 실패했습니다.',
      code: 'STATS_ERROR'
    });
  }
});

module.exports = router;