const express = require('express');
const cors = require('cors');
const { testConnection } = require('./src/config/database');

// 기존 라우터들
const dreamRoutes = require('./src/routes/dreamRoutes');
const advancedRoutes = require('./src/routes/advancedRoutes');
const homonymRoutes = require('./src/routes/homonymRoutes');
const analysisRoutes = require('./src/routes/analysisRoutes');

// 🔥 이 줄 추가! (정확한 경로 확인)
console.log('🔍 사전 라우터 로드 시도...');
const dictionaryRoutes = require('./src/routes/dictionaryRoutes');
console.log('✅ 사전 라우터 로드 성공!');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 기존 라우터 연결
app.use('/api', dreamRoutes);
app.use('/api/advanced', advancedRoutes);
app.use('/api/homonym', homonymRoutes);
app.use('/api/analysis', analysisRoutes);

// 🔥 사전 라우터 연결 (로그 추가)
console.log('🔗 사전 라우터 연결 중...');
app.use('/api/dictionary', dictionaryRoutes);
console.log('✅ 사전 라우터 연결 완료!');

// 기본 라우트 (기존 것)
app.get('/', (req, res) => {
  res.json({
    message: '🔮 DreamServer API - DreamRenewal',
    server: 'dreamServer',
    project: 'DreamRenewal',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      api: '/api',
      search: '/api/search?keyword=키워드',
      reverse: '/api/number/7',
      stats: '/api/stats',
      advanced: '/api/advanced',
      homonym: '/api/homonym',
      analysis: '/api/analysis',
      dictionary: '/api/dictionary',  // 🔥 이것도 추가
      dictionaryTest: '/api/dictionary/test'
    },
    timestamp: new Date().toISOString()
  });
});

// 나머지 코드는 그대로...

// 서버 시작
async function startServer() {
  try {
    console.log('🔍 데이터베이스 연결 테스트 중...');
    const isDbConnected = await testConnection();

    if (!isDbConnected) {
      console.error('❌ 데이터베이스 연결 실패 - 서버를 시작할 수 없습니다');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log('🚀 DreamServer 시작됨');
      console.log(`📡 서버 주소: http://localhost:${PORT}`);
      console.log(`💾 데이터베이스: ${process.env.DB_NAME}`);
      console.log('-----------------------------------');
      console.log('💡 테스트 URL:');
      console.log(`   - 기본: http://localhost:${PORT}/`);
      console.log(`   - 사전: http://localhost:${PORT}/api/dictionary/`);
      console.log(`   - 테스트: http://localhost:${PORT}/api/dictionary/test`);
    });

  } catch (error) {
    console.error('❌ 서버 시작 실패:', error.message);
    process.exit(1);
  }
}

startServer();