// src/config/database.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// 환경 변수 로드
dotenv.config();

console.log('🔮 DreamServer 데이터베이스 연결 모듈 로드됨');

// 데이터베이스 연결 풀 생성 (간소화된 설정)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'dream100hak_user',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'dream100hak',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// 데이터베이스 연결 테스트 함수
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 데이터베이스 연결 성공');
    
    // 간단한 쿼리 테스트
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('📊 데이터베이스 쿼리 테스트:', rows[0]);
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error.message);
    return false;
  }
}

// 연결 풀 종료 함수
async function closePool() {
  try {
    await pool.end();
    console.log('🔌 데이터베이스 연결 풀 종료');
  } catch (error) {
    console.error('❌ 연결 풀 종료 오류:', error.message);
  }
}

module.exports = {
  pool,
  testConnection,
  closePool
};