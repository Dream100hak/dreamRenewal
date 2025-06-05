// src/controllers/advancedHomonymProcessor.js
console.log('🔤 AdvancedHomonymProcessor 모듈 로드됨');

class AdvancedHomonymProcessor {
  
  // 모든 동음이의어를 한 번에 감지
  static async detectAllHomonyms(text) {
    try {
      console.log('🔍 동음이의어 감지 시작:', text.substring(0, 50) + '...');
      
      // 현재 지원하는 동음이의어 목록 (확장 가능)
      const homonymDatabase = {
        '눈': [
          {
            id: 'eye',
            keyword: '눈',
            meaning: '사람의 시각 기관',
            category: '인체',
            numbers: [0, 1],
            contextKeywords: ['아프다', '보다', '깜빡', '시력', '빨갛다', '눈물', '감다'],
            weight: 1.0
          },
          {
            id: 'snow',
            keyword: '눈',
            meaning: '하얀 결정체',
            category: '날씨',
            numbers: [37],
            contextKeywords: ['내리다', '온다', '쌓이다', '하얗다', '차갑다', '겨울', '눈사람'],
            weight: 1.0
          }
        ],
        '배': [
          {
            id: 'stomach',
            keyword: '배',
            meaning: '사람의 복부',
            category: '인체',
            numbers: [20],
            contextKeywords: ['고프다', '아프다', '부르다', '만지다', '살', '뱃살'],
            weight: 1.0
          },
          {
            id: 'boat',
            keyword: '배',
            meaning: '물에 뜨는 탈것',
            category: '탈것',
            numbers: [3],
            contextKeywords: ['타다', '항해', '바다', '강', '선장', '출항', '정박', '낚시배'],
            weight: 1.0
          }
        ],
        '밤': [
          {
            id: 'night',
            keyword: '밤',
            meaning: '어두운 시간',
            category: '시간',
            numbers: [26],
            contextKeywords: ['자다', '어둡다', '별', '달', '늦다', '시간', '새벽', '밤하늘'],
            weight: 1.0
          },
          {
            id: 'chestnut',
            keyword: '밤',
            meaning: '견과류',
            category: '음식',
            numbers: [23],
            contextKeywords: ['줍다', '먹다', '달다', '군밤', '가을', '나무', '깎다'],
            weight: 1.0
          }
        ],
        '별': [
          {
            id: 'star',
            keyword: '별',
            meaning: '하늘의 빛나는 천체',
            category: '자연',
            numbers: [5],
            contextKeywords: ['빛나다', '하늘', '밤', '반짝', '보다', '달', '우주'],
            weight: 1.0
          },
          {
            id: 'special',
            keyword: '별',
            meaning: '특별한, 별다른',
            category: '형용사',
            numbers: [44],
            contextKeywords: ['특별', '다르다', '없다', '문제', '별로', '대단'],
            weight: 1.0
          }
        ]
      };

      const detectedHomonyms = [];
      const words = this.extractWords(text);
      
      console.log('📝 추출된 단어들:', words);

      // 각 단어에 대해 동음이의어 검사
      for (const word of words) {
        if (homonymDatabase[word]) {
          const meanings = homonymDatabase[word];
          
          console.log(`🔤 동음이의어 발견: "${word}" (${meanings.length}개 의미)`);
          
          // 문맥 기반 자동 추론 시도
          const contextAnalysis = this.analyzeContext(text, word, meanings);
          
          detectedHomonyms.push({
            keyword: word,
            position: text.indexOf(word),
            meanings: meanings,
            contextAnalysis: contextAnalysis,
            requiresUserChoice: contextAnalysis.confidence < 0.8
          });
        }
      }

      console.log(`✅ 동음이의어 감지 완료: ${detectedHomonyms.length}개 발견`);
      return detectedHomonyms.sort((a, b) => a.position - b.position);
    } catch (error) {
      console.error('❌ 동음이의어 감지 오류:', error);
      return [];
    }
  }

  // 문맥 기반 의미 추론 (개선된 매칭)
  static analyzeContext(text, keyword, meanings) {
    console.log(`🧠 문맥 분석 시작: "${keyword}"`);
    
    const scores = meanings.map(meaning => {
      let score = 0;
      let matchedKeywords = [];

      // 문맥 키워드 매칭 (유연한 매칭)
      for (const contextKeyword of meaning.contextKeywords) {
        // 1. 정확한 매칭
        if (text.includes(contextKeyword)) {
          score += meaning.weight * 2; // 정확한 매칭은 2배 점수
          matchedKeywords.push(contextKeyword + '(정확)');
          console.log(`  ✅ 정확 매칭: "${contextKeyword}" (${meaning.meaning})`);
        }
        // 2. 어간 매칭 (한국어 활용 고려)
        else {
          const stemVariations = this.generateStemVariations(contextKeyword);
          for (const variation of stemVariations) {
            if (text.includes(variation)) {
              score += meaning.weight * 1.5; // 어간 매칭은 1.5배 점수
              matchedKeywords.push(variation + '(어간)');
              console.log(`  ✅ 어간 매칭: "${variation}" ← "${contextKeyword}" (${meaning.meaning})`);
              break;
            }
          }
        }
        
        // 3. 부분 매칭 (포함 관계)
        const partialMatches = text.match(new RegExp(contextKeyword.slice(0, -1) + '.{0,2}', 'g'));
        if (partialMatches && !matchedKeywords.some(m => m.includes(contextKeyword))) {
          score += meaning.weight * 0.8; // 부분 매칭은 0.8배 점수
          matchedKeywords.push(partialMatches[0] + '(부분)');
          console.log(`  ✅ 부분 매칭: "${partialMatches[0]}" ← "${contextKeyword}" (${meaning.meaning})`);
        }
      }

      // 키워드 근접성 점수 (같은 문장 내 거리 고려)
      const sentences = text.split(/[.!?。]/);
      const targetSentence = sentences.find(sentence => sentence.includes(keyword));
      
      if (targetSentence) {
        for (const contextKeyword of meaning.contextKeywords) {
          const stemVariations = this.generateStemVariations(contextKeyword);
          const allVariations = [contextKeyword, ...stemVariations];
          
          for (const variation of allVariations) {
            if (targetSentence.includes(variation)) {
              score += 0.5; // 같은 문장 내에 있으면 추가 점수
              console.log(`  🎯 근접성 보너스: "${variation}" (같은 문장)`);
              break;
            }
          }
        }
      }

      // 동시 출현 보너스 (다른 동음이의어와의 관계)
      const relatedKeywords = {
        '눈': ['밤', '별', '하늘'],
        '밤': ['눈', '별', '달', '하늘'],
        '별': ['밤', '눈', '하늘', '달'],
        '배': ['바다', '강', '물']
      };
      
      if (relatedKeywords[keyword]) {
        for (const related of relatedKeywords[keyword]) {
          if (text.includes(related) && meaning.category === '자연' || meaning.category === '날씨' || meaning.category === '시간') {
            score += 0.3;
            console.log(`  🌟 관련성 보너스: "${related}" → ${meaning.category}`);
          }
        }
      }

      // 신뢰도 계산 개선 (더 관대한 기준)
      let confidence = Math.min(score / 1.5, 1.0); // 1.5로 나누어서 더 쉽게 80% 도달
      
      // 추가 신뢰도 조정
      if (matchedKeywords.length >= 2) confidence += 0.1; // 여러 매칭시 보너스
      if (matchedKeywords.some(m => m.includes('정확'))) confidence += 0.1; // 정확한 매칭 보너스
      
      confidence = Math.min(confidence, 1.0);
      
      console.log(`  📊 "${meaning.meaning}": 점수 ${score.toFixed(1)}, 신뢰도 ${Math.round(confidence * 100)}%`);

      return {
        meaning: meaning,
        score: score,
        matchedKeywords: matchedKeywords,
        confidence: confidence
      };
    });

    // 가장 높은 점수의 의미 반환
    scores.sort((a, b) => b.score - a.score);
    
    const result = {
      bestMatch: scores[0],
      allScores: scores,
      confidence: scores[0].confidence,
      autoResolved: scores[0].confidence >= 0.75 // 75%로 임계값 낮춤
    };
    
    console.log(`🎯 최종 결정: "${result.bestMatch.meaning.meaning}" (신뢰도 ${Math.round(result.confidence * 100)}%)`);
    console.log(`🤖 자동 해결: ${result.autoResolved ? 'YES' : 'NO'}`);
    
    return result;
  }

  // 한국어 어간 변화 생성
  static generateStemVariations(keyword) {
    const variations = [];
    
    // 기본 어간 추출 규칙
    if (keyword.endsWith('다')) {
      const stem = keyword.slice(0, -1);
      variations.push(
        stem + '고', // 아프다 → 아프고
        stem + '지', // 아프다 → 아프지  
        stem + '면', // 아프다 → 아프면
        stem + '어', // 아프다 → 아파 (불규칙)
        stem + '아', // 아프다 → 아파
        stem,        // 아프다 → 아프
      );
    }
    
    // 동사/형용사 활용
    if (keyword.includes('하다')) {
      const stem = keyword.replace('하다', '');
      variations.push(
        stem + '하고',
        stem + '하지',
        stem + '하면',
        stem + '해',
        stem + '한'
      );
    }
    
    // 특별한 경우들
    const specialCases = {
      '보다': ['봐', '보고', '보지', '보면', '본'],
      '오다': ['와', '오고', '오지', '오면', '온'],
      '가다': ['가고', '가지', '가면', '간'],
      '타다': ['타고', '타지', '타면', '탄'],
      '내리다': ['내려', '내리고', '내리지', '내린'],
      '쌓이다': ['쌓여', '쌓이고', '쌓이지', '쌓인'],
      '빛나다': ['빛나고', '빛나지', '빛난']
    };
    
    if (specialCases[keyword]) {
      variations.push(...specialCases[keyword]);
    }
    
    return [...new Set(variations)]; // 중복 제거
  }

  // 텍스트에서 의미있는 단어 추출 (조사 제거)
  static extractWords(text) {
    console.log('📝 단어 추출 시작:', text);
    
    // 기본 단어 추출
    const cleanText = text.replace(/[^\w가-힣\s]/g, ' ');
    const rawWords = cleanText.split(/\s+/).filter(word => 
      word.length >= 1 && /[가-힣]/.test(word)
    );
    
    console.log('  🔤 원본 단어들:', rawWords);
    
    // 조사 제거 (간단한 한국어 조사 목록)
    const particles = [
      '이', '가', '을', '를', '은', '는', '의', '에', '에서', '로', '으로',
      '와', '과', '랑', '이랑', '께서', '에게', '한테', '께', '보다', '처럼',
      '만큼', '까지', '마저', '조차', '부터', '이나', '나', '도', '만',
      '야', '아', '여', '어', '이여', '이어'
    ];
    
    const cleanedWords = rawWords.map(word => {
      let cleaned = word;
      
      // 조사 제거 (길이가 긴 조사부터 먼저 확인)
      const sortedParticles = particles.sort((a, b) => b.length - a.length);
      
      for (const particle of sortedParticles) {
        if (cleaned.endsWith(particle) && cleaned.length > particle.length) {
          const withoutParticle = cleaned.slice(0, cleaned.length - particle.length);
          if (withoutParticle.length >= 1) {
            console.log(`    🔧 조사 제거: "${cleaned}" → "${withoutParticle}" (제거: "${particle}")`);
            cleaned = withoutParticle;
            break;
          }
        }
      }
      
      return cleaned;
    }).filter(word => word.length >= 1);
    
    // 중복 제거하면서 순서 유지
    const uniqueWords = [...new Set(cleanedWords)];
    
    console.log('  ✅ 최종 단어들:', uniqueWords);
    return uniqueWords;
  }

  // 모든 동음이의어를 종합적으로 처리
  static async processAllHomonyms(text, userChoices = {}) {
    try {
      console.log('🚀 종합 동음이의어 처리 시작');
      console.log('👤 사용자 선택:', userChoices);
      
      const detectedHomonyms = await this.detectAllHomonyms(text);
      const resolutions = [];
      const pendingChoices = [];

      for (const homonym of detectedHomonyms) {
        const userChoice = userChoices[homonym.keyword];
        
        if (userChoice) {
          // 사용자가 선택한 의미 사용
          const selectedMeaning = homonym.meanings.find(m => m.id === userChoice);
          if (selectedMeaning) {
            console.log(`👤 사용자 선택 적용: "${homonym.keyword}" → "${selectedMeaning.meaning}"`);
            resolutions.push({
              keyword: homonym.keyword,
              selectedMeaning: selectedMeaning,
              method: 'user_choice',
              confidence: 1.0
            });
          }
        } else if (homonym.contextAnalysis.autoResolved) {
          // 자동으로 해결 가능한 경우
          console.log(`🤖 자동 해결: "${homonym.keyword}" → "${homonym.contextAnalysis.bestMatch.meaning.meaning}"`);
          resolutions.push({
            keyword: homonym.keyword,
            selectedMeaning: homonym.contextAnalysis.bestMatch.meaning,
            method: 'auto_resolved',
            confidence: homonym.contextAnalysis.confidence,
            matchedKeywords: homonym.contextAnalysis.bestMatch.matchedKeywords
          });
        } else {
          // 사용자 선택이 필요한 경우
          console.log(`❓ 사용자 선택 필요: "${homonym.keyword}"`);
          pendingChoices.push({
            keyword: homonym.keyword,
            meanings: homonym.meanings,
            contextAnalysis: homonym.contextAnalysis
          });
        }
      }

      const result = {
        resolutions: resolutions,
        pendingChoices: pendingChoices,
        allHomonyms: detectedHomonyms,
        isComplete: pendingChoices.length === 0
      };
      
      console.log('✅ 종합 처리 완료:');
      console.log(`  - 총 감지: ${detectedHomonyms.length}개`);
      console.log(`  - 자동 해결: ${resolutions.filter(r => r.method === 'auto_resolved').length}개`);
      console.log(`  - 사용자 선택: ${resolutions.filter(r => r.method === 'user_choice').length}개`);
      console.log(`  - 대기 중: ${pendingChoices.length}개`);
      
      return result;
    } catch (error) {
      console.error('❌ 동음이의어 처리 오류:', error);
      return {
        resolutions: [],
        pendingChoices: [],
        allHomonyms: [],
        isComplete: true
      };
    }
  }

  // 해결된 동음이의어 정보를 기반으로 키워드 매핑
  static applyHomonymResolutions(keywords, resolutions) {
    console.log('🔧 동음이의어 해결 결과 적용');
    
    const resolvedKeywords = [...keywords];

    for (const resolution of resolutions) {
      // 해당 키워드를 찾아서 올바른 의미로 대체
      const keywordIndex = resolvedKeywords.findIndex(k => k.keyword === resolution.keyword);
      
      if (keywordIndex !== -1) {
        console.log(`  🔄 키워드 업데이트: "${resolution.keyword}" → [${resolution.selectedMeaning.numbers.join(', ')}]`);
        
        resolvedKeywords[keywordIndex] = {
          ...resolvedKeywords[keywordIndex],
          numbers: resolution.selectedMeaning.numbers,
          category: resolution.selectedMeaning.category,
          meaning: resolution.selectedMeaning.meaning,
          homonymResolution: {
            method: resolution.method,
            confidence: resolution.confidence,
            matchedKeywords: resolution.matchedKeywords || []
          }
        };
      }
    }

    return resolvedKeywords;
  }

  // 동음이의어 데이터베이스 확장 (관리자용)
  static async addHomonym(keyword, meaning, category, numbers, contextKeywords) {
    // 실제 구현에서는 데이터베이스에 저장
    console.log(`📝 새 동음이의어 추가: ${keyword} - ${meaning}`);
  }

  // 문맥 키워드 학습 (사용자 피드백 기반)
  static async learnFromFeedback(keyword, meaningId, context, wasCorrect) {
    if (wasCorrect) {
      // 올바른 선택이었다면 문맥 키워드의 가중치 증가
      const contextWords = this.extractWords(context);
      console.log(`📈 학습: ${keyword} (${meaningId})에 대한 문맥 강화:`, contextWords);
    } else {
      // 잘못된 선택이었다면 가중치 감소
      console.log(`📉 학습: ${keyword} (${meaningId})에 대한 문맥 약화`);
    }
  }
}

module.exports = AdvancedHomonymProcessor;