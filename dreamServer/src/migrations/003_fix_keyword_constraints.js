// src/migrations/003_fix_keyword_constraints.js
const { pool } = require('../config/database');

async function fixKeywordConstraints() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔧 키워드 테이블 제약조건 수정 중...');
    
    // 1. 기존 유니크 제약조건 제거
    try {
      await connection.execute('ALTER TABLE dream_keywords DROP INDEX uk_keyword');
      console.log('✅ 기존 uk_keyword 제약조건 제거됨');
    } catch (error) {
      if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⚠️ uk_keyword 제약조건이 이미 없음');
      } else {
        console.warn('⚠️ 제약조건 제거 중 오류:', error.message);
      }
    }
    
    // 2. 새로운 복합 유니크 제약조건 추가 (keyword + category_id)
    try {
      await connection.execute(`
        ALTER TABLE dream_keywords 
        ADD UNIQUE KEY uk_keyword_category (keyword, category_id)
      `);
      console.log('✅ 새로운 uk_keyword_category 제약조건 추가됨');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⚠️ uk_keyword_category 제약조건이 이미 존재함');
      } else {
        console.warn('⚠️ 새 제약조건 추가 중 오류:', error.message);
      }
    }
    
    // 3. 기존 데이터 확인
    const [existingData] = await connection.execute(`
      SELECT keyword, COUNT(*) as count 
      FROM dream_keywords 
      GROUP BY keyword 
      HAVING count > 1
    `);
    
    if (existingData.length > 0) {
      console.log('📊 기존 중복 키워드:');
      existingData.forEach(item => {
        console.log(`   - "${item.keyword}": ${item.count}개`);
      });
    } else {
      console.log('📊 중복 키워드 없음 - 동음이의어 삽입 준비 완료');
    }
    
    console.log('🎉 키워드 테이블 제약조건 수정 완료!');
    
  } catch (error) {
    console.error('❌ 제약조건 수정 오류:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  fixKeywordConstraints().then(() => {
    console.log('제약조건 수정 완료');
    process.exit(0);
  }).catch(error => {
    console.error('제약조건 수정 실패:', error);
    process.exit(1);
  });
}

module.exports = { fixKeywordConstraints };