// src/migrations/001_create_tables.js
console.log('🔍 마이그레이션 스크립트 시작됨');

// 환경 변수 로드 확인
require('dotenv').config();
console.log('📝 환경 변수 로드됨');
console.log('   - DB_HOST:', process.env.DB_HOST);
console.log('   - DB_USER:', process.env.DB_USER);
console.log('   - DB_NAME:', process.env.DB_NAME);

const { pool } = require('../config/database');


async function createTables() {
  const connection = await pool.getConnection();
  
  try {
    console.log('📊 꿈사전 테이블 생성 중...');
    
    // 1. 키워드 카테고리 테이블
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS keyword_categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        category_name VARCHAR(50) NOT NULL COMMENT '카테고리명',
        description TEXT COMMENT '카테고리 설명',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_category_name (category_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ keyword_categories 테이블 생성 완료');

    // 2. 꿈 키워드 테이블
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS dream_keywords (
        id INT PRIMARY KEY AUTO_INCREMENT,
        keyword VARCHAR(100) NOT NULL COMMENT '꿈 키워드',
        importance INT DEFAULT 0 COMMENT '중요도 (별 개수)',
        is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_keyword (keyword),
        INDEX idx_keyword (keyword),
        INDEX idx_importance (importance DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ dream_keywords 테이블 생성 완료');

    // 3. 키워드별 번호 매핑 테이블
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS keyword_numbers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        keyword_id INT NOT NULL COMMENT 'dream_keywords 테이블 참조',
        number INT NOT NULL COMMENT '로또 번호 (1~45)',
        is_end_digit BOOLEAN DEFAULT FALSE COMMENT '끝수 여부',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (keyword_id) REFERENCES dream_keywords(id) ON DELETE CASCADE,
        UNIQUE KEY uk_keyword_number (keyword_id, number),
        INDEX idx_number (number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ keyword_numbers 테이블 생성 완료');

    console.log('🎉 모든 테이블 생성 완료!');
    
  } catch (error) {
    console.error('❌ 테이블 생성 오류:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  createTables().then(() => {
    console.log('마이그레이션 완료');
    process.exit(0);
  }).catch(error => {
    console.error('마이그레이션 실패:', error);
    process.exit(1);
  });
}

module.exports = { createTables };