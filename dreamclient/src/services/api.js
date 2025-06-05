// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 고급 꿈 텍스트 분석 API (다중 동음이의어 처리 지원)
export const analyzeDream = async (text, options = {}) => {
  try {
    const requestData = { 
      text,
      homonymChoices: options.homonymChoices || {},
      options: options.analysisOptions || {}
    };
    
    console.log('🔮 꿈 분석 요청:', requestData);
    
    const response = await api.post('/analysis/dream', requestData);
    
    console.log('📊 분석 응답:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('분석 오류:', error);
    throw new Error(error.response?.data?.error || '분석 중 오류가 발생했습니다.');
  }
};

// 지원하는 동음이의어 목록 조회
export const getHomonymList = async () => {
  try {
    const response = await api.get('/analysis/homonyms');
    return response.data;
  } catch (error) {
    console.error('동음이의어 목록 조회 오류:', error);
    throw new Error('동음이의어 목록을 불러오는데 실패했습니다.');
  }
};

// 특정 동음이의어 문맥 분석
export const analyzeHomonym = async (keyword, context) => {
  try {
    const response = await api.get(`/analysis/analyze-homonym?keyword=${keyword}&context=${encodeURIComponent(context)}`);
    return response.data;
  } catch (error) {
    console.error('동음이의어 분석 오류:', error);
    throw new Error('동음이의어 분석에 실패했습니다.');
  }
};

// 분석 결과 피드백 제공
export const provideFeedback = async (dreamText, analysisResult, feedback) => {
  try {
    const response = await api.post('/analysis/feedback', {
      dreamText,
      analysisResult,
      feedback
    });
    return response.data;
  } catch (error) {
    console.error('피드백 제공 오류:', error);
    throw new Error('피드백 제공에 실패했습니다.');
  }
};

// 분석 통계 조회
export const getAnalysisStats = async () => {
  try {
    const response = await api.get('/analysis/stats');
    return response.data;
  } catch (error) {
    console.error('통계 조회 오류:', error);
    throw new Error('통계를 불러오는데 실패했습니다.');
  }
};

// 기존 키워드 검색 (호환성 유지)
export const searchKeyword = async (keyword) => {
  try {
    const response = await api.get(`/search?keyword=${keyword}`);
    return response.data;
  } catch (error) {
    throw new Error('키워드 검색에 실패했습니다.');
  }
};

// 기존 통계 정보 조회 (호환성 유지)
export const getStats = async () => {
  try {
    const response = await api.get('/stats');
    return response.data;
  } catch (error) {
    throw new Error('통계 정보를 불러오는데 실패했습니다.');
  }
};

export default api;