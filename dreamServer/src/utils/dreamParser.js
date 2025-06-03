// src/utils/dreamParser.js
const fs = require('fs');
const path = require('path');

// 꿈사전 데이터 파싱 함수
function parseDreamDictionary(filePath) {
  try {
    console.log('📖 꿈사전 파일 읽는 중:', filePath);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const parsedData = [];
    let currentCategory = '';
    
    for (let line of lines) {
      line = line.trim();
      
      // 빈 줄 건너뛰기
      if (!line) continue;
      
      // 카테고리 행 체크 (예: (가), (각) 등)
      const categoryMatch = line.match(/^\((.+)\)$/);
      if (categoryMatch) {
        currentCategory = categoryMatch[1];
        console.log(`📂 카테고리 발견: ${currentCategory}`);
        continue;
      }
      
      // 키워드 라인 파싱
      const keywords = line.split(',');
      
      for (let keyword of keywords) {
        keyword = keyword.trim();
        if (!keyword) continue;
        
        const parsed = parseKeyword(keyword);
        if (parsed) {
          parsed.category = currentCategory;
          parsedData.push(parsed);
        }
      }
    }
    
    console.log(`✅ 총 ${parsedData.length}개 키워드 파싱 완료`);
    return parsedData;
    
  } catch (error) {
    console.error('❌ 파일 읽기 오류:', error.message);
    throw error;
  }
}

// 개별 키워드 파싱 함수
function parseKeyword(keywordStr) {
  try {
    // 별표 개수 체크
    const starMatches = keywordStr.match(/★+/g);
    const importance = starMatches ? starMatches[0].length : 0;
    
    // 별표 제거
    let cleanKeyword = keywordStr.replace(/★+/g, '').trim();
    
    // 번호 추출 [5][33][39] 형태
    const numberMatches = cleanKeyword.match(/\[([^\]]+)\]/g);
    const numbers = [];
    
    if (numberMatches) {
      for (let match of numberMatches) {
        const numberStr = match.replace(/[\[\]]/g, '');
        
        // "끝수" 처리
        if (numberStr.includes('끝수')) {
          const digit = numberStr.replace('끝수', '');
          // 0끝수 = 10,20,30,40, 1끝수 = 1,11,21,31,41 등
          for (let i = parseInt(digit); i <= 45; i += 10) {
            if (i > 0 && i <= 45) {
              numbers.push({ number: i, isEndDigit: true });
            }
          }
        } else {
          const num = parseInt(numberStr);
          if (num >= 1 && num <= 45) {
            numbers.push({ number: num, isEndDigit: false });
          }
        }
      }
      
      // 번호 부분 제거
      cleanKeyword = cleanKeyword.replace(/\[([^\]]+)\]/g, '').trim();
    }
    
    // 최종 키워드명
    const finalKeyword = cleanKeyword;
    
    if (finalKeyword && numbers.length > 0) {
      return {
        keyword: finalKeyword,
        numbers: numbers,
        importance: importance
      };
    }
    
    return null;
    
  } catch (error) {
    console.warn('⚠️ 키워드 파싱 오류:', keywordStr, error.message);
    return null;
  }
}

// 테스트 함수
function testParser() {
  const testData = [
    '가게[5][33][39]★★★★',
    '가락지[0끝수][9]',
    '가로등[19]★',
    '단순텍스트'
  ];
  
  console.log('🧪 파서 테스트 시작...');
  
  for (let test of testData) {
    const result = parseKeyword(test);
    console.log(`입력: "${test}"`);
    console.log('결과:', result);
    console.log('---');
  }
}

module.exports = {
  parseDreamDictionary,
  parseKeyword,
  testParser
};