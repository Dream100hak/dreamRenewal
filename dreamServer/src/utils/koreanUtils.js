// src/utils/koreanUtils.js
const Hangul = require('hangul-js');

// 한국어 조사 목록 (길이 순으로 정렬 - 긴 것부터 먼저 처리)
const KOREAN_PARTICLES = [
  // 3글자 조사
  '에서는', '에게는', '한테는', '로써는', '으로써는',
  
  // 2글자 조사
  '에서', '에게', '한테', '로써', '으로써', '보다', '처럼', '같이', '만큼', 
  '까지', '부터', '마저', '조차', '이나', '이든', '든지', '라도', '이라도',
  
  // 1글자 조사
  '가', '이', '을', '를', '은', '는', '의', '에', '로', '으로', '와', '과', 
  '랑', '이랑', '도', '만', '나', '아', '야', '여', '이여', '께서', '께'
];

// 조사 제거 함수
function removeParticles(text) {
  if (!text || typeof text !== 'string') {
    return { cleanText: text, removedParticles: [] };
  }
  
  let cleanText = text.trim();
  const removedParticles = [];
  
  // 긴 조사부터 순서대로 체크
  for (const particle of KOREAN_PARTICLES) {
    if (cleanText.endsWith(particle) && cleanText.length > particle.length) {
      const beforeRemoval = cleanText;
      cleanText = cleanText.slice(0, -particle.length);
      removedParticles.push(particle);
      
      console.log(`🔧 조사 제거: "${beforeRemoval}" → "${cleanText}" (제거된 조사: "${particle}")`);
      
      // 하나의 조사만 제거 (가장 긴 조사 우선)
      break;
    }
  }
  
  return {
    cleanText: cleanText.trim(),
    removedParticles: removedParticles
  };
}

// 한글 자모 분리 함수
function disassembleHangul(text) {
  if (!text) return '';
  
  // hangul-js를 사용하여 자모 분리
  const disassembled = Hangul.disassemble(text);
  return disassembled.join('');
}

// 한글 자모 기반 유사도 계산
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const jamo1 = disassembleHangul(str1.toLowerCase());
  const jamo2 = disassembleHangul(str2.toLowerCase());
  
  // 레벤슈타인 거리 계산
  const maxLength = Math.max(jamo1.length, jamo2.length);
  if (maxLength === 0) return 100;
  
  const distance = levenshteinDistance(jamo1, jamo2);
  const similarity = Math.round(((maxLength - distance) / maxLength) * 100);
  
  return similarity;
}

// 레벤슈타인 거리 계산 함수
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// 키워드 정규화 함수 (조사 제거 + 공백 정리)
function normalizeKeyword(text) {
  if (!text) return '';
  
  // 1. 조사 제거
  const { cleanText } = removeParticles(text);
  
  // 2. 여러 공백을 하나로
  const normalized = cleanText.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

// 퍼지 매칭을 위한 키워드 후보 생성
function generateKeywordCandidates(text) {
  const candidates = new Set();
  
  // 원본
  candidates.add(text);
  
  // 조사 제거된 버전
  const { cleanText } = removeParticles(text);
  candidates.add(cleanText);
  
  // 공백 제거 버전
  candidates.add(text.replace(/\s/g, ''));
  candidates.add(cleanText.replace(/\s/g, ''));
  
  return Array.from(candidates).filter(c => c.length > 0);
}

// 테스트 함수
function testKoreanUtils() {
  console.log('🧪 한글 처리 유틸리티 테스트 시작...\n');
  
  const testCases = [
    '강아지가',
    '강아지를',
    '집에서',
    '물이',
    '나무와',
    '하늘처럼',
    '사람들과함께',
    '강아찌', // 오타 테스트
    '강아지'   // 원본
  ];
  
  for (const testCase of testCases) {
    console.log(`입력: "${testCase}"`);
    
    const { cleanText, removedParticles } = removeParticles(testCase);
    console.log(`  조사 제거: "${cleanText}" (제거된 조사: [${removedParticles.join(', ')}])`);
    
    const normalized = normalizeKeyword(testCase);
    console.log(`  정규화: "${normalized}"`);
    
    const jamo = disassembleHangul(testCase);
    console.log(`  자모 분리: "${jamo}"`);
    
    const similarity = calculateSimilarity(testCase, '강아지');
    console.log(`  "강아지"와 유사도: ${similarity}%`);
    
    console.log('---');
  }
}

module.exports = {
  removeParticles,
  disassembleHangul,
  calculateSimilarity,
  normalizeKeyword,
  generateKeywordCandidates,
  testKoreanUtils,
  KOREAN_PARTICLES
};