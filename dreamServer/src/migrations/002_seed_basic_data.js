// src/migrations/002_seed_basic_data.js
const { pool } = require('../config/database');

async function up() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🌱 DreamServer 기초 데이터 삽입 중...');
    
    // 1. 키워드 카테고리 기본 데이터
    const categories = [
      ['인체', '사람의 몸과 관련된 단어 (눈, 손, 발 등)'],
      ['날씨', '기상 현상과 관련된 단어 (비, 눈, 바람 등)'],
      ['동물', '동물과 관련된 단어 (강아지, 고양이, 새 등)'],
      ['식물', '식물과 관련된 단어 (나무, 꽃, 열매 등)'],
      ['사물', '일반적인 사물과 관련된 단어 (집, 차, 책 등)'],
      ['장소', '특정 장소와 관련된 단어 (학교, 병원, 바다 등)'],
      ['음식', '음식과 관련된 단어 (밥, 과일, 고기 등)'],
      ['행동', '행위나 동작과 관련된 단어 (걷다, 뛰다, 보다 등)'],
      ['감정', '감정과 관련된 단어 (기쁨, 슬픔, 화남 등)'],
      ['기타', '기타 분류되지 않는 단어들']
    ];
    
    for (const [name, description] of categories) {
      await connection.execute(
        'INSERT IGNORE INTO keyword_categories (category_name, description) VALUES (?, ?)',
        [name, description]
      );
    }
    console.log(`✅ ${categories.length}개 카테고리 삽입 완료`);

    // 2. 한국어 조사 기본 데이터
    const particles = [
      // 주격 조사
      '가', '이', '께서',
      // 목적격 조사  
      '을', '를',
      // 관형격 조사
      '의',
      // 부사격 조사
      '에', '에서', '에게', '한테', '께', '로', '으로', '와', '과', '랑', '이랑',
      // 호격 조사
      '아', '야', '여', '이여',
      // 보조사
      '는', '은', '도', '만', '까지', '부터', '조차', '마저', '이나', '나',
      // 비교/양태 조사
      '보다', '처럼', '같이', '만큼', '대로', '따라',
      // 기타
      '의해', '에의해', '로서', '으로서', '로써', '으로써'
    ];
    
    for (const particle of particles) {
      await connection.execute(
        'INSERT IGNORE INTO korean_particles (particle) VALUES (?)',
        [particle]
      );
    }
    console.log(`✅ ${particles.length}개 한국어 조사 삽입 완료`);

    // 3. 테스트용 기본 키워드 몇 개 삽입
    const testKeywords = [
      {
        keyword: '눈',
        category: '인체',
        meaning: '사람의 시각 기관',
        importance: 1,
        numbers: [0, 1], // 0끝수, 1
        contexts: [
          { word: '아프다', weight: 2.0 },
          { word: '깜빡', weight: 1.5 },
          { word: '보다', weight: 1.2 },
          { word: '시력', weight: 2.0 },
          { word: '안경', weight: 1.8 }
        ]
      },
      {
        keyword: '눈',
        category: '날씨', 
        meaning: '하늘에서 내리는 하얀 결정체',
        importance: 1,
        numbers: [37],
        contexts: [
          { word: '온다', weight: 2.0 },
          { word: '내리다', weight: 2.0 },
          { word: '쌓이다', weight: 1.8 },
          { word: '하얗다', weight: 1.5 },
          { word: '겨울', weight: 1.7 }
        ]
      },
      {
        keyword: '강아지',
        category: '동물',
        meaning: '개의 새끼나 작은 개',
        importance: 2, // ★★
        numbers: [3, 28],
        contexts: [
          { word: '짖다', weight: 2.0 },
          { word: '꼬리', weight: 1.5 },
          { word: '귀엽다', weight: 1.8 },
          { word: '산책', weight: 1.6 }
        ]
      }
    ];

    for (const item of testKeywords) {
      // 카테고리 ID 찾기
      const [categoryRows] = await connection.execute(
        'SELECT id FROM keyword_categories WHERE category_name = ?',
        [item.category]
      );
      
      if (categoryRows.length === 0) continue;
      const categoryId = categoryRows[0].id;

      // 키워드 삽입
      const [keywordResult] = await connection.execute(
        `INSERT IGNORE INTO dream_keywords 
         (keyword, category_id, semantic_meaning, importance) 
         VALUES (?, ?, ?, ?)`,
        [item.keyword, categoryId, item.meaning, item.importance]
      );

      let keywordId;
      if (keywordResult.insertId > 0) {
        keywordId = keywordResult.insertId;
      } else {
        // 이미 존재하는 경우 ID 조회
        const [existingRows] = await connection.execute(
          'SELECT id FROM dream_keywords WHERE keyword = ? AND category_id = ?',
          [item.keyword, categoryId]
        );
        keywordId = existingRows[0]?.id;
      }

      if (!keywordId) continue;

      // 번호 매핑 삽입
      for (const number of item.numbers) {
        // 끝수 처리 (0, 10, 20, 30, 40은 0끝수로 처리)
        if (number === 0) {
          // 0끝수: 10, 20, 30, 40
          for (const endDigitNumber of [10, 20, 30, 40]) {
            await connection.execute(
              'INSERT IGNORE INTO keyword_numbers (keyword_id, number, is_end_digit) VALUES (?, ?, ?)',
              [keywordId, endDigitNumber, true]
            );
          }
        } else {
          await connection.execute(
            'INSERT IGNORE INTO keyword_numbers (keyword_id, number, is_end_digit) VALUES (?, ?, ?)',
            [keywordId, number, false]
          );
        }
      }

      // 문맥 키워드 삽입
      for (const context of item.contexts) {
        await connection.execute(
          'INSERT IGNORE INTO context_keywords (keyword_id, context_word, weight) VALUES (?, ?, ?)',
          [keywordId, context.word, context.weight]
        );
      }
    }
    
    console.log(`✅ ${testKeywords.length}개 테스트 키워드 삽입 완료`);

    // 4. 데이터 삽입 결과 확인
    const [stats] = await connection.execute(`
      SELECT 
        (SELECT COUNT(*) FROM keyword_categories) as categories,
        (SELECT COUNT(*) FROM korean_particles) as particles,
        (SELECT COUNT(*) FROM dream_keywords) as keywords,
        (SELECT COUNT(*) FROM keyword_numbers) as numbers,
        (SELECT COUNT(*) FROM context_keywords) as contexts
    `);
    
    console.log('📊 데이터 삽입 결과:');
    console.log(`   - 카테고리: ${stats[0].categories}개`);
    console.log(`   - 조사: ${stats[0].particles}개`);
    console.log(`   - 키워드: ${stats[0].keywords}개`);
    console.log(`   - 번호 매핑: ${stats[0].numbers}개`);
    console.log(`   - 문맥 키워드: ${stats[0].contexts}개`);

  } catch (error) {
    console.error('❌ 기초 데이터 삽입 오류:', error);
    throw error;
  } finally {
    connection.release();
  }
}

async function down() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🗑️ 기초 데이터 삭제 중...');
    
    await connection.execute('DELETE FROM context_keywords');
    await connection.execute('DELETE FROM keyword_numbers');
    await connection.execute('DELETE FROM dream_keywords');
    await connection.execute('DELETE FROM korean_particles');
    await connection.execute('DELETE FROM keyword_categories');
    
    console.log('✅ 기초 데이터 삭제 완료');
    
  } catch (error) {
    console.error('❌ 기초 데이터 삭제 오류:', error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { up, down };