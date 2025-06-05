// src/controllers/dreamAnalysisEngine.js
const { parseDreamText } = require('../utils/dreamTextParser');
const AdvancedHomonymProcessor = require('./advancedHomonymProcessor');
const database = require('../config/database');

class DreamAnalysisEngine {
  
  // 종합 꿈 분석 (고급 동음이의어 처리 포함)
  static async analyzeDream(dreamText, options = {}) {
    try {
      console.log('🔮 꿈 분석 시작:', dreamText);
      
      // 1단계: 텍스트 파싱 (키워드 추출)
      console.log('📝 1단계: 텍스트 파싱 시작');
      const parsedResult = await parseDreamText(dreamText);
      
      // 2단계: 고급 동음이의어 처리
      console.log('🔤 2단계: 동음이의어 처리 시작');
      const homonymResult = await AdvancedHomonymProcessor.processAllHomonyms(
        dreamText, 
        options.homonymChoices || {}
      );
      
      // 동음이의어 선택이 필요한 경우 사용자에게 요청
      if (!homonymResult.isComplete) {
        return {
          needsHomonymChoice: true,
          pendingChoices: homonymResult.pendingChoices,
          allHomonyms: homonymResult.allHomonyms,
          partialResolutions: homonymResult.resolutions,
          message: "동음이의어 의미를 선택해주세요"
        };
      }
      
      // 3단계: 키워드 분석 (동음이의어 해결 적용)
      console.log('🧠 3단계: 키워드 분석 시작');
      const analyzedKeywords = await this.analyzeKeywords(parsedResult.keywords);
      
      // 동음이의어 해결 결과 적용
      const finalKeywords = AdvancedHomonymProcessor.applyHomonymResolutions(
        analyzedKeywords, 
        homonymResult.resolutions
      );
      
      // 4단계: 번호 추천
      console.log('🎯 4단계: 번호 추천 시작');
      const recommendation = await this.generateRecommendation(finalKeywords);
      
      // 5단계: 신뢰도 계산
      console.log('📊 5단계: 신뢰도 계산');
      const confidence = this.calculateConfidence(finalKeywords, homonymResult.resolutions);
      
      // 6단계: 최종 결과 생성
      const finalResult = {
        originalText: dreamText,
        analysis: {
          parsing: {
            sentences: parsedResult.sentences?.length || 1,
            extractedKeywords: finalKeywords.length,
            importantKeywords: finalKeywords.filter(k => k.importance >= 3).length
          },
          homonymProcessing: {
            detected: homonymResult.allHomonyms.length,
            autoResolved: homonymResult.resolutions.filter(r => r.method === 'auto_resolved').length,
            userResolved: homonymResult.resolutions.filter(r => r.method === 'user_choice').length,
            resolutions: homonymResult.resolutions
          },
          keywords: finalKeywords,
          recommendation: recommendation,
          confidence: confidence
        },
        suggestion: this.generateSuggestion(confidence, finalKeywords.length)
      };
      
      console.log('✅ 꿈 분석 완료');
      return finalResult;
      
    } catch (error) {
      console.error('❌ 꿈 분석 오류:', error);
      throw new Error('분석 중 오류가 발생했습니다: ' + error.message);
    }
  }
  
  // 키워드 분석 (기존 로직 개선)
  static async analyzeKeywords(rawKeywords) {
    try {
      const analyzedKeywords = [];
      
      for (const keyword of rawKeywords) {
        // 기본 키워드 정보 조회
        const keywordInfo = await this.getKeywordInfo(keyword);
        
        if (keywordInfo) {
          analyzedKeywords.push({
            keyword: keyword,
            importance: keywordInfo.importance || 1,
            numbers: keywordInfo.numbers || [],
            category: keywordInfo.category || '일반',
            meaning: keywordInfo.meaning || keyword,
            confidence: 85,
            finalResult: {
              keyword: keyword,
              numbers: keywordInfo.numbers || [],
              stars: '★'.repeat(keywordInfo.importance || 1)
            }
          });
        }
      }
      
      return analyzedKeywords;
    } catch (error) {
      console.error('키워드 분석 오류:', error);
      return [];
    }
  }
  
  // 키워드 정보 조회 (데이터베이스 또는 사전에서)
  static async getKeywordInfo(keyword) {
    // 실제 구현에서는 데이터베이스 조회
    // 현재는 간단한 매핑으로 시뮬레이션
    const keywordDatabase = {
      '강아지': { importance: 4, numbers: [3, 28], category: '동물', meaning: '애완동물' },
      '집': { importance: 3, numbers: [4, 17], category: '사물', meaning: '건물' },
      '뛰어놀고': { importance: 2, numbers: [10, 15], category: '행동', meaning: '활동' },
      '바다': { importance: 3, numbers: [1, 5], category: '자연', meaning: '물' },
      '별': { importance: 2, numbers: [5], category: '자연', meaning: '천체' },
      '고양이': { importance: 4, numbers: [25, 38], category: '동물', meaning: '애완동물' },
      '나타나서': { importance: 1, numbers: [12], category: '행동', meaning: '출현' },
      '함께': { importance: 2, numbers: [11, 22], category: '관계', meaning: '동반' },
      '놀았어요': { importance: 2, numbers: [7, 10], category: '행동', meaning: '활동' }
    };
    
    return keywordDatabase[keyword] || null;
  }
  
  // 번호 추천 알고리즘
  static async generateRecommendation(keywords) {
    try {
      const numberScores = {};
      
      // 각 키워드의 번호에 중요도 기반 점수 부여
      for (const keyword of keywords) {
        for (const number of keyword.numbers || []) {
          if (!numberScores[number]) {
            numberScores[number] = {
              number: number,
              score: 0,
              frequency: 0,
              sources: []
            };
          }
          
          numberScores[number].score += keyword.importance || 1;
          numberScores[number].frequency += 1;
          numberScores[number].sources.push({
            keyword: keyword.keyword,
            importance: keyword.importance
          });
        }
      }
      
      // 점수 기준으로 정렬
      const sortedNumbers = Object.values(numberScores)
        .sort((a, b) => {
          // 점수가 높은 것 우선, 같으면 빈도가 높은 것 우선
          if (b.score !== a.score) return b.score - a.score;
          return b.frequency - a.frequency;
        });
      
      return {
        numbers: sortedNumbers,
        totalKeywords: keywords.length,
        algorithm: 'importance_weighted'
      };
    } catch (error) {
      console.error('번호 추천 오류:', error);
      return { numbers: [], totalKeywords: 0, algorithm: 'error' };
    }
  }
  
  // 전체적인 신뢰도 계산
  static calculateConfidence(keywords, homonymResolutions) {
    try {
      let totalScore = 0;
      let maxScore = 0;
      
      // 키워드 기반 신뢰도
      for (const keyword of keywords) {
        const keywordScore = (keyword.importance || 1) * 10;
        totalScore += keywordScore;
        maxScore += 40; // 최대 중요도 4 * 10
      }
      
      // 동음이의어 해결 기반 신뢰도
      for (const resolution of homonymResolutions || []) {
        if (resolution.method === 'auto_resolved') {
          totalScore += resolution.confidence * 20;
        } else if (resolution.method === 'user_choice') {
          totalScore += 20; // 사용자 선택은 100% 신뢰
        }
        maxScore += 20;
      }
      
      // 0-100 범위로 정규화
      const confidence = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 50;
      return Math.min(Math.max(confidence, 30), 95); // 30-95% 범위로 제한
    } catch (error) {
      console.error('신뢰도 계산 오류:', error);
      return 50;
    }
  }
  
  // 사용자에게 제공할 제안 메시지 생성
  static generateSuggestion(confidence, keywordCount) {
    if (confidence >= 85) {
      return `분석 결과가 매우 신뢰할 만합니다! ${keywordCount}개의 키워드를 바탕으로 추천된 번호들을 참고해보세요.`;
    } else if (confidence >= 70) {
      return `좋은 분석 결과입니다. ${keywordCount}개의 키워드가 추출되었으며, 추천 번호들이 의미가 있을 것 같습니다.`;
    } else if (confidence >= 50) {
      return `분석이 완료되었지만, 꿈의 내용을 더 자세히 입력하시면 더 정확한 추천을 받을 수 있습니다.`;
    } else {
      return `추가 정보가 필요합니다. 꿈에서 본 사물, 사람, 행동 등을 더 구체적으로 입력해보세요.`;
    }
  }
  
  // 사용자 피드백 처리
  static async processFeedback(dreamText, analysisResult, feedback) {
    try {
      console.log('📝 사용자 피드백 처리:', feedback);
      
      // 동음이의어 해결에 대한 피드백 학습
      if (feedback.homonymFeedback) {
        for (const homonymFeedback of feedback.homonymFeedback) {
          await AdvancedHomonymProcessor.learnFromFeedback(
            homonymFeedback.keyword,
            homonymFeedback.meaningId,
            dreamText,
            homonymFeedback.wasCorrect
          );
        }
      }
      
      // 전체 분석 결과에 대한 피드백
      if (feedback.overallRating) {
        console.log('전체 분석 평가:', feedback.overallRating);
        // 데이터베이스에 피드백 저장 (실제 구현)
      }
      
      return { success: true, message: '피드백이 반영되었습니다.' };
    } catch (error) {
      console.error('피드백 처리 오류:', error);
      return { success: false, message: '피드백 처리 중 오류가 발생했습니다.' };
    }
  }
}

module.exports = DreamAnalysisEngine;