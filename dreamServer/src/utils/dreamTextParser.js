// src/utils/dreamTextParser.js
const { removeParticles, normalizeKeyword } = require('./koreanUtils');

// 의미없는 단어들 (불용어 사전)
const STOP_WORDS = [
  // 시간 관련
  '어제', '오늘', '내일', '그제', '모레', '언제', '지금', '나중', '먼저', '다음',
  '아침', '점심', '저녁', '새벽', '오전', '오후', '밤중', '한밤중',
  
  // 꿈 관련 (꿈 자체는 제외하고 꿈과 관련된 표현들)
  '꿈에서', '꿈속에서', '꿈이었', '꿈같은', '꿈을', '꿈의',
  
  // 일반적인 불용어
  '그리고', '그런데', '하지만', '그래서', '또한', '또', '그냥', '조금', '많이', '정말', '진짜',
  '아주', '매우', '너무', '좀', '약간', '살짝', '완전', '정말로', '진짜로',
  '이것', '그것', '저것', '이거', '그거', '저거', '이런', '그런', '저런',
  '여기', '거기', '저기', '어디', '무엇', '누구', '언제', '어떻게', '왜',
  '있다', '없다', '이다', '아니다', '같다', '다르다', '되다', '하다', '가다', '오다',
  '있었', '없었', '이었', '아니었', '같았', '달랐', '되었', '했다', '갔다', '왔다',
  '있어', '없어', '이야', '아니야', '같아', '달라', '되어', '해서', '가서', '와서',
  
  // 인칭 대명사
  '나는', '내가', '나를', '나에게', '나의', '우리', '우리가', '우리를', '우리의',
  '너는', '네가', '너를', '너에게', '너의', '당신', '당신이', '당신을', '당신의',
  '그는', '그가', '그를', '그에게', '그의', '그녀', '그녀가', '그녀를', '그녀의',
  
  // 기타
  '것이', '것을', '것에', '것과', '거야', '거였', '거에요', '습니다', '했습니다',
  '이요', '에요', '네요', '데요', '예요', '이에요', '이었어요', '였어요'
];

// 꿈 관련 중요 키워드 (가중치 부여)
const DREAM_IMPORTANT_WORDS = [
  '사람', '사람들', '아이', '아기', '어른', '노인', '남자', '여자',
  '가족', '엄마', '아빠', '형', '누나', '동생', '할머니', '할아버지',
  '친구', '연인', '애인', '남편', '아내', '선생님', '의사', '경찰',
  
  '강아지', '고양이', '새', '물고기', '호랑이', '사자', '코끼리', '말', '소',
  '돼지', '닭', '오리', '거북이', '뱀', '곰', '여우', '늑대', '토끼',
  
  '집', '학교', '병원', '회사', '가게', '길', '바다', '산', '강', '하늘',
  '건물', '방', '화장실', '부엌', '침실', '거실', '정원', '마당',
  
  '자동차', '버스', '지하철', '비행기', '배', '자전거', '오토바이',
  '컴퓨터', '핸드폰', '텔레비전', '냉장고', '세탁기',
  
  '밥', '물', '과일', '고기', '생선', '빵', '우유', '커피', '술',
  '사과', '바나나', '포도', '딸기', '수박', '배',
  
  '돈', '금', '보석', '선물', '편지', '책', '사진', '그림',
  '꽃', '나무', '풀', '잎', '열매', '씨앗',
  
  '불', '물', '바람', '땅', '돌', '모래', '얼음', '눈', '비', '구름',
  
  '웃다', '울다', '놀다', '자다', '먹다', '마시다', '보다', '듣다',
  '걷다', '뛰다', '날다', '헤엄치다', '춤추다', '노래하다',
  '말하다', '이야기하다', '전화하다', '만나다', '헤어지다',
  '사랑하다', '미워하다', '무서워하다', '기뻐하다', '슬퍼하다',
  '화나다', '놀라다', '당황하다', '실망하다'
];

// 꿈 문장 파싱 메인 함수
function parseDreamText(text) {
  console.log(`🔍 꿈 문장 파싱 시작: "${text}"`);
  
  // 1. 텍스트 전처리
  const preprocessed = preprocessText(text);
  console.log(`📝 전처리 결과: "${preprocessed}"`);
  
  // 2. 문장 분리
  const sentences = splitSentences(preprocessed);
  console.log(`📄 문장 분리: ${sentences.length}개 문장`);
  
  // 3. 각 문장에서 키워드 추출
  const allKeywords = [];
  const contextMap = new Map(); // 키워드별 문맥 저장
  
  sentences.forEach((sentence, index) => {
    console.log(`📍 문장 ${index + 1} 분석: "${sentence}"`);
    
    const keywords = extractKeywordsFromSentence(sentence);
    
    keywords.forEach(keyword => {
      allKeywords.push(keyword);
      
      // 문맥 정보 저장 (동음이의어 처리용)
      if (!contextMap.has(keyword.word)) {
        contextMap.set(keyword.word, []);
      }
      contextMap.get(keyword.word).push({
        sentence: sentence,
        context: extractContext(sentence, keyword.word),
        sentenceIndex: index
      });
    });
  });
  
  // 4. 키워드 중복 제거 및 중요도 계산
  const uniqueKeywords = consolidateKeywords(allKeywords);
  
  // 5. 중요도순 정렬
  uniqueKeywords.sort((a, b) => b.importance - a.importance);
  
  console.log(`✅ 파싱 완료: ${uniqueKeywords.length}개 고유 키워드 추출`);
  
  return {
    originalText: text,
    preprocessedText: preprocessed,
    sentences: sentences,
    keywords: uniqueKeywords,
    contextMap: Object.fromEntries(contextMap),
    summary: {
      totalSentences: sentences.length,
      totalKeywords: allKeywords.length,
      uniqueKeywords: uniqueKeywords.length,
      importantKeywords: uniqueKeywords.filter(k => k.importance >= 3).length
    }
  };
}

// 텍스트 전처리
function preprocessText(text) {
  return text
    .replace(/[.,!?;:]/g, ' ') // 구두점을 공백으로
    .replace(/\s+/g, ' ')      // 여러 공백을 하나로
    .trim()                    // 앞뒤 공백 제거
    .toLowerCase();            // 소문자 변환 (영어 있을 경우)
}

// 문장 분리
function splitSentences(text) {
  // 한국어 문장 구분자로 분리
  return text
    .split(/[.!?。]/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

// 문장에서 키워드 추출
function extractKeywordsFromSentence(sentence) {
  const words = sentence.split(/\s+/).filter(word => word.length > 0);
  const keywords = [];
  
  for (const word of words) {
    // 조사 제거
    const { cleanText } = removeParticles(word);
    const normalized = normalizeKeyword(cleanText);
    
    // 불용어 검사
    if (isStopWord(normalized)) {
      continue;
    }
    
    // 너무 짧은 단어 제외
    if (normalized.length < 2) {
      continue;
    }
    
    // 중요도 계산
    const importance = calculateImportance(normalized, sentence);
    
    keywords.push({
      original: word,
      word: normalized,
      importance: importance,
      isImportant: importance >= 3,
      length: normalized.length
    });
  }
  
  return keywords;
}

// 불용어 검사
function isStopWord(word) {
  return STOP_WORDS.includes(word) || 
         STOP_WORDS.some(stopWord => word.includes(stopWord));
}

// 키워드 중요도 계산
function calculateImportance(word, sentence) {
  let importance = 1; // 기본 점수
  
  // 꿈 관련 중요 단어인지 확인
  if (DREAM_IMPORTANT_WORDS.includes(word)) {
    importance += 2;
  }
  
  // 길이에 따른 가중치 (긴 단어일수록 중요할 가능성)
  if (word.length >= 3) {
    importance += 1;
  }
  
  // 문장에서의 위치 (앞쪽에 있을수록 중요)
  const position = sentence.indexOf(word);
  const relativePosition = position / sentence.length;
  if (relativePosition <= 0.3) {
    importance += 1;
  }
  
  // 반복 출현 (같은 문장에서 여러 번 나오면 중요)
  const occurrences = (sentence.match(new RegExp(word, 'g')) || []).length;
  if (occurrences > 1) {
    importance += occurrences - 1;
  }
  
  return Math.min(importance, 5); // 최대 5점
}

// 키워드 중복 제거 및 통합
function consolidateKeywords(keywords) {
  const wordMap = new Map();
  
  keywords.forEach(keyword => {
    const word = keyword.word;
    
    if (wordMap.has(word)) {
      // 이미 존재하는 키워드면 중요도 합산
      const existing = wordMap.get(word);
      existing.importance = Math.min(existing.importance + keyword.importance, 5);
      existing.occurrences = (existing.occurrences || 1) + 1;
      existing.variants.push(keyword.original);
    } else {
      // 새로운 키워드
      wordMap.set(word, {
        word: word,
        importance: keyword.importance,
        isImportant: keyword.importance >= 3,
        occurrences: 1,
        variants: [keyword.original],
        length: keyword.length
      });
    }
  });
  
  return Array.from(wordMap.values());
}

// 문맥 추출 (동음이의어 처리용)
function extractContext(sentence, targetWord) {
  const words = sentence.split(/\s+/);
  const targetIndex = words.findIndex(word => 
    removeParticles(word).cleanText === targetWord
  );
  
  if (targetIndex === -1) return sentence;
  
  // 앞뒤 2단어씩 추출
  const start = Math.max(0, targetIndex - 2);
  const end = Math.min(words.length, targetIndex + 3);
  
  return words.slice(start, end).join(' ');
}

// 테스트 함수
function testDreamParser() {
  console.log('🧪 꿈 문장 파싱 엔진 테스트 시작...\n');
  
  const testCases = [
    '어제 꿈에서 강아지가 집에서 뛰어놀았어요',
    '눈이 펑펑 내리는 겨울밤에 친구와 함께 걸었다',
    '바다에서 큰 배를 타고 여행을 했는데 배가 고팠어요',
    '밤에 밤을 주워서 먹었는데 정말 달았습니다',
    '학교에서 선생님이 칠판에 글씨를 쓰고 있었어요'
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`\n=== 테스트 케이스 ${index + 1} ===`);
    const result = parseDreamText(testCase);
    
    console.log('📊 파싱 결과:');
    console.log(`   - 문장 수: ${result.summary.totalSentences}`);
    console.log(`   - 고유 키워드: ${result.summary.uniqueKeywords}`);
    console.log(`   - 중요 키워드: ${result.summary.importantKeywords}`);
    
    console.log('🔑 추출된 키워드:');
    result.keywords.slice(0, 5).forEach(keyword => {
      console.log(`   - "${keyword.word}" (중요도: ${keyword.importance}, 출현: ${keyword.occurrences}회)`);
    });
  });
}

module.exports = {
  parseDreamText,
  extractKeywordsFromSentence,
  calculateImportance,
  testDreamParser,
  STOP_WORDS,
  DREAM_IMPORTANT_WORDS
};