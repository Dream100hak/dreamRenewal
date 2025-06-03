// src/utils/homonymDataSeeder.js
const { pool } = require('../config/database');

async function seedHomonymData() {
    const connection = await pool.getConnection();

    try {
        console.log('📊 동음이의어 샘플 데이터 삽입 중...');

        // 트랜잭션 시작
        await connection.beginTransaction();

        // 1. 카테고리 데이터 삽입
        console.log('📂 카테고리 데이터 삽입...');
        const categories = [
            ['인체', '사람의 몸과 관련된 단어 (눈, 손, 발 등)'],
            ['날씨', '기상 현상과 관련된 단어 (비, 눈, 바람 등)'],
            ['동물', '동물과 관련된 단어 (강아지, 고양이, 새 등)'],
            ['식물', '식물과 관련된 단어 (나무, 꽃, 열매 등)'],
            ['사물', '일반적인 사물과 관련된 단어 (집, 차, 책 등)'],
            ['장소', '특정 장소와 관련된 단어 (학교, 병원, 바다 등)'],
            ['음식', '음식과 관련된 단어 (밥, 과일, 고기 등)'],
            ['행동', '행위나 동작과 관련된 단어 (걷다, 뛰다, 보다 등)'],
            ['시간', '시간과 관련된 단어 (밤, 아침, 저녁 등)']  // 이 줄 추가
        ];

        for (const [name, description] of categories) {
            await connection.execute(
                'INSERT IGNORE INTO keyword_categories (category_name, description) VALUES (?, ?)',
                [name, description]
            );
        }
        console.log(`✅ ${categories.length}개 카테고리 삽입 완료`);

        // 2. 동음이의어 키워드 삽입
        console.log('🔤 동음이의어 키워드 삽입...');

        // 카테고리 ID 조회
        const [categoryRows] = await connection.execute('SELECT id, category_name FROM keyword_categories');
        const categoryMap = {};
        categoryRows.forEach(row => {
            categoryMap[row.category_name] = row.id;
        });

        // 동음이의어 데이터
        const homonymData = [
            {
                keyword: '눈',
                category: '인체',
                meaning: '사람의 시각 기관',
                numbers: [0, 1], // 0끝수, 1
                contexts: [
                    { word: '아프다', weight: 2.0 },
                    { word: '깜빡', weight: 1.5 },
                    { word: '보다', weight: 1.2 },
                    { word: '시력', weight: 2.0 },
                    { word: '안경', weight: 1.8 },
                    { word: '빨갛다', weight: 1.6 },
                    { word: '눈물', weight: 1.9 }
                ]
            },
            {
                keyword: '눈',
                category: '날씨',
                meaning: '하늘에서 내리는 하얀 결정체',
                numbers: [37],
                contexts: [
                    { word: '온다', weight: 2.0 },
                    { word: '내리다', weight: 2.0 },
                    { word: '쌓이다', weight: 1.8 },
                    { word: '하얗다', weight: 1.5 },
                    { word: '겨울', weight: 1.7 },
                    { word: '눈송이', weight: 1.9 },
                    { word: '펑펑', weight: 1.6 }
                ]
            },
            {
                keyword: '배',
                category: '인체',
                meaning: '사람의 복부',
                numbers: [20],
                contexts: [
                    { word: '아프다', weight: 2.0 },
                    { word: '고프다', weight: 1.8 },
                    { word: '배고픈', weight: 1.8 },
                    { word: '부르다', weight: 1.6 },
                    { word: '복통', weight: 2.0 }
                ]
            },
            {
                keyword: '배',
                category: '사물',
                meaning: '물 위를 다니는 탈것',
                numbers: [3],
                contexts: [
                    { word: '타다', weight: 2.0 },
                    { word: '바다', weight: 1.8 },
                    { word: '항구', weight: 1.6 },
                    { word: '선장', weight: 1.9 },
                    { word: '물', weight: 1.4 }
                ]
            },
            {
                keyword: '밤',
                category: '음식',
                meaning: '가을에 나는 견과류',
                numbers: [23],
                contexts: [
                    { word: '먹다', weight: 1.8 },
                    { word: '줍다', weight: 2.0 },
                    { word: '가을', weight: 1.6 },
                    { word: '달다', weight: 1.5 }
                ]
            },
            {
                keyword: '밤',
                category: '시간',
                meaning: '해가 진 후의 시간',
                numbers: [26],
                contexts: [
                    { word: '어둡다', weight: 1.8 },
                    { word: '늦다', weight: 1.6 },
                    { word: '잠', weight: 1.9 },
                    { word: '달', weight: 1.5 },
                    { word: '별', weight: 1.4 }
                ]
            }
        ];

        for (const item of homonymData) {
            // 키워드 삽입
            const [keywordResult] = await connection.execute(
                `INSERT INTO dream_keywords (keyword, category_id, semantic_meaning, importance) 
         VALUES (?, ?, ?, ?)`,
                [item.keyword, categoryMap[item.category], item.meaning, 1]
            );

            const keywordId = keywordResult.insertId;
            console.log(`  - "${item.keyword}" (${item.category}) 삽입됨 (ID: ${keywordId})`);

            // 번호 매핑 삽입
            for (const number of item.numbers) {
                if (number === 0) {
                    // 0끝수: 10, 20, 30, 40
                    for (const endDigitNumber of [10, 20, 30, 40]) {
                        await connection.execute(
                            'INSERT INTO keyword_numbers (keyword_id, number, is_end_digit) VALUES (?, ?, ?)',
                            [keywordId, endDigitNumber, true]
                        );
                    }
                } else {
                    await connection.execute(
                        'INSERT INTO keyword_numbers (keyword_id, number, is_end_digit) VALUES (?, ?, ?)',
                        [keywordId, number, false]
                    );
                }
            }

            // 문맥 키워드 삽입
            for (const context of item.contexts) {
                await connection.execute(
                    'INSERT INTO context_keywords (keyword_id, context_word, weight) VALUES (?, ?, ?)',
                    [keywordId, context.word, context.weight]
                );
            }
        }

        // 트랜잭션 커밋
        await connection.commit();

        // 결과 확인
        const [stats] = await connection.execute(`
      SELECT 
        (SELECT COUNT(*) FROM keyword_categories) as categories,
        (SELECT COUNT(*) FROM dream_keywords WHERE category_id IS NOT NULL) as categorized_keywords,
        (SELECT COUNT(*) FROM context_keywords) as context_keywords,
        (SELECT COUNT(DISTINCT keyword) FROM dream_keywords WHERE category_id IS NOT NULL) as unique_categorized_words
    `);

        console.log('📊 동음이의어 데이터 삽입 결과:');
        console.log(`   - 카테고리: ${stats[0].categories}개`);
        console.log(`   - 분류된 키워드: ${stats[0].categorized_keywords}개`);
        console.log(`   - 문맥 키워드: ${stats[0].context_keywords}개`);
        console.log(`   - 중복 단어: ${stats[0].unique_categorized_words}개`);

        // 동음이의어 확인
        const [homonyms] = await connection.execute(`
      SELECT keyword, COUNT(*) as meaning_count
      FROM dream_keywords 
      WHERE category_id IS NOT NULL
      GROUP BY keyword 
      HAVING meaning_count > 1
      ORDER BY meaning_count DESC
    `);

        console.log('🔤 동음이의어 목록:');
        homonyms.forEach(item => {
            console.log(`   - "${item.keyword}": ${item.meaning_count}개 의미`);
        });

        console.log('🎉 동음이의어 샘플 데이터 삽입 완료!');

    } catch (error) {
        await connection.rollback();
        console.error('❌ 동음이의어 데이터 삽입 오류:', error);
        throw error;
    } finally {
        connection.release();
    }
}

// 스크립트 직접 실행 시
if (require.main === module) {
    seedHomonymData().then(() => {
        console.log('동음이의어 데이터 시딩 완료');
        process.exit(0);
    }).catch(error => {
        console.error('동음이의어 데이터 시딩 실패:', error);
        process.exit(1);
    });
}

module.exports = { seedHomonymData };