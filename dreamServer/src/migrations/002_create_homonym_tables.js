// src/migrations/002_create_homonym_tables.js
const { pool } = require('../config/database');

async function createHomonymTables() {
  const connection = await pool.getConnection();

  try {
    console.log('📊 동음이의어 처리 테이블 생성 중...');

    // 1. 키워드 카테고리 테이블 (의미 구분용)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS keyword_categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        category_name VARCHAR(50) NOT NULL COMMENT '카테고리명 (인체, 날씨, 동물 등)',
        description TEXT COMMENT '카테고리 설명',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_category_name (category_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ keyword_categories 테이블 생성 완료');

    // 2. dream_keywords 테이블에 카테고리 및 의미 컬럼 추가
    try {
      // 컬럼 존재 여부 확인
      const [columns] = await connection.execute(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'dream_keywords'
  `, [process.env.DB_NAME]);

      const existingColumns = columns.map(col => col.COLUMN_NAME);

      // category_id 컬럼 추가
      if (!existingColumns.includes('category_id')) {
        await connection.execute(`
      ALTER TABLE dream_keywords 
      ADD COLUMN category_id INT DEFAULT NULL COMMENT '카테고리 ID'
    `);
        console.log('  - category_id 컬럼 추가됨');
      } else {
        console.log('  - category_id 컬럼 이미 존재함');
      }

      // semantic_meaning 컬럼 추가
      if (!existingColumns.includes('semantic_meaning')) {
        await connection.execute(`
      ALTER TABLE dream_keywords 
      ADD COLUMN semantic_meaning VARCHAR(200) DEFAULT NULL COMMENT '의미 설명'
    `);
        console.log('  - semantic_meaning 컬럼 추가됨');
      } else {
        console.log('  - semantic_meaning 컬럼 이미 존재함');
      }

      // 외래키 추가
      try {
        await connection.execute(`
      ALTER TABLE dream_keywords 
      ADD FOREIGN KEY fk_category (category_id) REFERENCES keyword_categories(id)
    `);
        console.log('  - 외래키 추가됨');
      } catch (fkError) {
        if (fkError.code === 'ER_DUP_KEYNAME') {
          console.log('  - 외래키 이미 존재함');
        } else {
          console.warn('  - 외래키 추가 실패:', fkError.message);
        }
      }
    } catch (error) {
      console.warn('  - 테이블 확장 중 일부 오류:', error.message);
    }
    console.log('✅ dream_keywords 테이블 확장 완료');

    // 3. 문맥 키워드 테이블
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS context_keywords (
        id INT PRIMARY KEY AUTO_INCREMENT,
        keyword_id INT NOT NULL COMMENT 'dream_keywords 테이블 참조',
        context_word VARCHAR(100) NOT NULL COMMENT '문맥을 결정하는 단어',
        weight FLOAT DEFAULT 1.0 COMMENT '가중치 (학습을 통해 조정)',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (keyword_id) REFERENCES dream_keywords(id) ON DELETE CASCADE,
        UNIQUE KEY uk_keyword_context (keyword_id, context_word),
        INDEX idx_context_word (context_word)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ context_keywords 테이블 생성 완료');

    // 4. 동음이의어 선택 로그 테이블
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS homonym_selection_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        search_text TEXT NOT NULL COMMENT '원본 검색 텍스트',
        ambiguous_word VARCHAR(100) NOT NULL COMMENT '동음이의어 단어',
        selected_meaning_id INT NOT NULL COMMENT '사용자가 선택한 의미의 ID',
        context_words JSON COMMENT '함께 나온 단어들 (학습용)',
        was_auto_resolved BOOLEAN DEFAULT FALSE COMMENT '자동으로 해결되었는지',
        confidence_score FLOAT COMMENT '자동 판단 신뢰도',
        user_ip VARCHAR(45) COMMENT '사용자 IP',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (selected_meaning_id) REFERENCES dream_keywords(id),
        INDEX idx_ambiguous_word (ambiguous_word),
        INDEX idx_selected_meaning (selected_meaning_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ homonym_selection_logs 테이블 생성 완료');

    // 5. 동음이의어 사용 통계 테이블
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS homonym_usage_stats (
        id INT PRIMARY KEY AUTO_INCREMENT,
        keyword_id INT NOT NULL COMMENT 'dream_keywords 테이블 참조',
        usage_count INT DEFAULT 0 COMMENT '사용 횟수',
        context_pattern JSON COMMENT '자주 함께 나오는 단어 패턴',
        last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (keyword_id) REFERENCES dream_keywords(id) ON DELETE CASCADE,
        INDEX idx_keyword_usage (keyword_id, usage_count DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ homonym_usage_stats 테이블 생성 완료');

    console.log('🎉 동음이의어 처리 테이블 생성 완료!');

  } catch (error) {
    console.error('❌ 동음이의어 테이블 생성 오류:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  createHomonymTables().then(() => {
    console.log('동음이의어 마이그레이션 완료');
    process.exit(0);
  }).catch(error => {
    console.error('동음이의어 마이그레이션 실패:', error);
    process.exit(1);
  });
}

module.exports = { createHomonymTables };