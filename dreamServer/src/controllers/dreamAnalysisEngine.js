// src/controllers/dreamAnalysisEngine.js
const { parseDreamText } = require('../utils/dreamTextParser');
const AdvancedHomonymProcessor = require('./advancedHomonymProcessor');
const database = require('../config/database');
const {
  generateKeywordCandidates,
  normalizeKeyword,
  calculateSimilarity
} = require('../utils/koreanUtils');

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
      if (!rawKeywords || rawKeywords.length === 0) {
        return analyzedKeywords;
      }

      const connection = await database.pool.getConnection();

      try {
        for (const keyword of rawKeywords) {
          const match = await this.findBestKeywordMatch(keyword, connection);

          if (!match) {
            console.log(`⚠️ 일치하는 사전 항목 없음: "${keyword.word}"`);
            continue;
          }

          const resolvedImportance = Math.min(
            Math.max(keyword.importance || 1, match.importance || 1),
            5
          );

          const keywordConfidence = this.calculateKeywordConfidence({
            similarity: match.similarity,
            importance: resolvedImportance,
            occurrences: keyword.occurrences || 1
          });

          analyzedKeywords.push({
            keyword: match.keyword,
            dictionaryKeyword: match.keyword,
            originalKeyword: keyword.word,
            normalizedKeyword: match.normalizedKeyword,
            importance: resolvedImportance,
            numbers: match.numbers,
            category: match.category || '일반',
            meaning: match.meaning || match.keyword,
            similarity: match.similarity,
            matchType: match.matchType,
            matchCandidates: match.candidatesTried,
            occurrences: keyword.occurrences || 1,
            variants: keyword.variants || [],
            confidence: keywordConfidence,
            finalResult: {
              keyword: match.keyword,
              originalKeyword: keyword.word,
              numbers: match.numbers,
              stars: '★'.repeat(resolvedImportance),
              similarity: match.similarity,
              matchType: match.matchType
            }
          });
        }

        return analyzedKeywords;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('키워드 분석 오류:', error);
      return [];
    }
  }

  static calculateKeywordConfidence({ similarity = 0, importance = 1, occurrences = 1 }) {
    const similarityScore = typeof similarity === 'number' ? similarity : 0;
    const importanceScore = (importance || 1) * 12;
    const occurrenceBonus = Math.min(Math.max((occurrences || 1) - 1, 0) * 4, 12);
    const baseScore = Math.round(similarityScore * 0.45 + importanceScore + occurrenceBonus);

    return Math.min(95, Math.max(40, baseScore));
  }

  static async findBestKeywordMatch(keywordInfo, existingConnection = null) {
    const keywordWord = typeof keywordInfo === 'string' ? keywordInfo : keywordInfo?.word;

    if (!keywordWord || keywordWord.length === 0) {
      return null;
    }

    const normalizedInput = normalizeKeyword(keywordWord) || keywordWord;
    const candidateSet = new Set();
    candidateSet.add(keywordWord);
    generateKeywordCandidates(normalizedInput || keywordWord)
      .map(candidate => normalizeKeyword(candidate) || candidate)
      .filter(Boolean)
      .forEach(value => candidateSet.add(value));
    candidateSet.add(normalizedInput);

    const candidates = Array.from(candidateSet).filter(Boolean);

    const connection = existingConnection || await database.pool.getConnection();
    const shouldRelease = !existingConnection;

    try {
      const whereParts = [];
      const params = [];

      candidates.forEach(candidate => {
        if (!candidate) return;
        whereParts.push('k.keyword LIKE ?');
        params.push(`%${candidate}%`);
        whereParts.push("? LIKE CONCAT('%', k.keyword, '%')");
        params.push(candidate);
      });

      const firstSyllable = normalizedInput?.[0];
      if (firstSyllable) {
        whereParts.push('k.keyword LIKE ?');
        params.push(`${firstSyllable}%`);
      }

      if (whereParts.length === 0) {
        whereParts.push('k.keyword = ?');
        params.push(normalizedInput);
      }

      const query = `
        SELECT
          k.id,
          k.keyword,
          k.importance,
          k.semantic_meaning,
          c.category_name,
          GROUP_CONCAT(kn.number ORDER BY kn.number) AS numbers
        FROM dream_keywords k
        LEFT JOIN keyword_numbers kn ON k.id = kn.keyword_id
        LEFT JOIN keyword_categories c ON k.category_id = c.id
        WHERE ${whereParts.join(' OR ')}
        GROUP BY k.id, k.keyword, k.importance, k.semantic_meaning, c.category_name
        ORDER BY k.importance DESC, k.keyword
        LIMIT 100
      `;

      const [rows] = await connection.execute(query, params);

      if (!rows || rows.length === 0) {
        return null;
      }

      const scored = rows.map(row => {
        const dbKeyword = row.keyword;
        const strippedKeyword = dbKeyword
          ? dbKeyword.replace(/\([^)]*\)/g, ' ').replace(/[\[\]]/g, ' ').trim()
          : '';
        const normalizedDbKeyword = normalizeKeyword(strippedKeyword) || strippedKeyword || dbKeyword;

        const similarityToOriginal = calculateSimilarity(keywordWord, dbKeyword || '');
        const similarityToNormalized = calculateSimilarity(normalizedInput, normalizedDbKeyword || '');
        const similarity = Math.max(similarityToOriginal, similarityToNormalized);

        const numbers = row.numbers
          ? Array.from(new Set(
              row.numbers
                .split(',')
                .map(num => parseInt(num, 10))
                .filter(num => !Number.isNaN(num))
            ))
          : [];

        return {
          id: row.id,
          keyword: dbKeyword,
          normalizedKeyword: normalizedDbKeyword || dbKeyword,
          numbers,
          importance: row.importance || 1,
          category: row.category_name || null,
          meaning: row.semantic_meaning || null,
          similarity,
          matchType: this.determineMatchType({
            original: keywordWord,
            normalizedOriginal: normalizedInput,
            dbKeyword,
            normalizedDbKeyword,
            similarity
          }),
          candidatesTried: candidates
        };
      });

      const filtered = scored.filter(item => item.similarity >= 55 || item.matchType === 'exact');
      const rankingPool = filtered.length > 0 ? filtered : scored;

      rankingPool.sort((a, b) => {
        if (b.similarity !== a.similarity) {
          return b.similarity - a.similarity;
        }
        if ((b.importance || 0) !== (a.importance || 0)) {
          return (b.importance || 0) - (a.importance || 0);
        }
        if (a.numbers.length !== b.numbers.length) {
          return b.numbers.length - a.numbers.length;
        }
        return a.keyword.length - b.keyword.length;
      });

      return rankingPool[0];
    } finally {
      if (shouldRelease) {
        connection.release();
      }
    }
  }

  static determineMatchType({ original, normalizedOriginal, dbKeyword, normalizedDbKeyword, similarity }) {
    const normalizedDb = normalizeKeyword(dbKeyword || '') || normalizedDbKeyword || dbKeyword;
    const normalizedOriginalWord = normalizeKeyword(original || '') || normalizedOriginal || original;

    if (normalizedDb && normalizedOriginalWord && normalizedDb === normalizedOriginalWord) {
      return 'exact';
    }

    if (dbKeyword && original && (dbKeyword.includes(original) || original.includes(dbKeyword))) {
      return 'partial';
    }

    if (
      normalizedDb &&
      normalizedOriginalWord &&
      (normalizedDb.includes(normalizedOriginalWord) || normalizedOriginalWord.includes(normalizedDb))
    ) {
      return 'partial';
    }

    if (typeof similarity === 'number' && similarity >= 80) {
      return 'fuzzy-high';
    }

    if (typeof similarity === 'number' && similarity >= 60) {
      return 'fuzzy';
    }

    return 'broad';
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

        if (typeof keyword.similarity === 'number') {
          const similarityBonus = Math.min(Math.max(keyword.similarity, 0), 100) * 0.2;
          totalScore += similarityBonus;
          maxScore += 20;
        }

        if (typeof keyword.confidence === 'number') {
          const normalizedConfidence = Math.min(Math.max(keyword.confidence, 0), 100);
          totalScore += normalizedConfidence * 0.1;
          maxScore += 10;
        }
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