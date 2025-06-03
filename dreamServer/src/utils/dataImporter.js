// src/utils/dataImporter.js
const { pool } = require('../config/database');
const { parseDreamDictionary } = require('./dreamParser');
const path = require('path');

// 꿈사전 데이터 삽입 함수
async function importDreamData() {
  const connection = await pool.getConnection();
  
  try {
    console.log('📊 꿈사전 데이터 삽입 시작...');
    
    // 파일 경로 설정
    const dataFilePath = path.join(__dirname, '../../data/dream_dictionary.txt');
    console.log('📁 데이터 파일 경로:', dataFilePath);
    
    // 파일 파싱
    const parsedData = parseDreamDictionary(dataFilePath);
    console.log(`📈 파싱된 키워드 수: ${parsedData.length}개`);
    
    let insertedKeywords = 0;
    let insertedNumbers = 0;
    
    // 트랜잭션 시작
    await connection.beginTransaction();
    
    for (const item of parsedData) {
      try {
        // 키워드 삽입
        const [keywordResult] = await connection.execute(
          `INSERT IGNORE INTO dream_keywords (keyword, importance) VALUES (?, ?)`,
          [item.keyword, item.importance]
        );
        
        let keywordId;
        if (keywordResult.insertId > 0) {
          keywordId = keywordResult.insertId;
          insertedKeywords++;
        } else {
          // 이미 존재하는 키워드의 ID 찾기
          const [existingRows] = await connection.execute(
            'SELECT id FROM dream_keywords WHERE keyword = ?',
            [item.keyword]
          );
          keywordId = existingRows[0]?.id;
        }
        
        if (!keywordId) continue;
        
        // 번호 매핑 삽입
        for (const numberInfo of item.numbers) {
          await connection.execute(
            `INSERT IGNORE INTO keyword_numbers (keyword_id, number, is_end_digit) VALUES (?, ?, ?)`,
            [keywordId, numberInfo.number, numberInfo.isEndDigit]
          );
          insertedNumbers++;
        }
        
        // 진행 상황 출력 (100개마다)
        if (insertedKeywords % 100 === 0) {
          console.log(`📝 진행중... ${insertedKeywords}개 키워드 처리됨`);
        }
        
      } catch (error) {
        console.warn(`⚠️ 키워드 "${item.keyword}" 삽입 오류:`, error.message);
      }
    }
    
    // 트랜잭션 커밋
    await connection.commit();
    
    console.log('🎉 데이터 삽입 완료!');
    console.log(`✅ 삽입된 키워드: ${insertedKeywords}개`);
    console.log(`✅ 삽입된 번호 매핑: ${insertedNumbers}개`);
    
    // 결과 확인
    const [stats] = await connection.execute(`
      SELECT 
        (SELECT COUNT(*) FROM dream_keywords) as total_keywords,
        (SELECT COUNT(*) FROM keyword_numbers) as total_numbers
    `);
    
    console.log('📊 데이터베이스 현황:');
    console.log(`   - 총 키워드: ${stats[0].total_keywords}개`);
    console.log(`   - 총 번호 매핑: ${stats[0].total_numbers}개`);
    
  } catch (error) {
    // 트랜잭션 롤백
    await connection.rollback();
    console.error('❌ 데이터 삽입 오류:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// 샘플 데이터 확인 함수
async function showSampleData() {
  const connection = await pool.getConnection();
  
  try {
    console.log('📋 샘플 데이터 확인...');
    
    const [keywords] = await connection.execute(`
      SELECT k.keyword, k.importance, 
             GROUP_CONCAT(kn.number ORDER BY kn.number) as numbers
      FROM dream_keywords k
      LEFT JOIN keyword_numbers kn ON k.id = kn.keyword_id
      GROUP BY k.id, k.keyword, k.importance
      ORDER BY k.importance DESC, k.keyword
      LIMIT 10
    `);
    
    console.log('🔝 상위 10개 키워드:');
    keywords.forEach((item, index) => {
      const stars = '★'.repeat(item.importance);
      console.log(`${index + 1}. ${item.keyword}${stars} [${item.numbers || '번호없음'}]`);
    });
    
  } catch (error) {
    console.error('❌ 샘플 데이터 조회 오류:', error);
  } finally {
    connection.release();
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  importDreamData()
    .then(() => showSampleData())
    .then(() => {
      console.log('✨ 모든 작업 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = {
  importDreamData,
  showSampleData
};