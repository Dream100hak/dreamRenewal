const express = require('express');
const cors = require('cors');
const { testConnection } = require('./src/config/database');
const dreamRoutes = require('./src/routes/dreamRoutes');
const advancedRoutes = require('./src/routes/advancedRoutes');
const homonymRoutes = require('./src/routes/homonymRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// API 라우터 연결
app.use('/api', dreamRoutes);
app.use('/api/advanced', advancedRoutes);
app.use('/api/homonym', homonymRoutes);

// 기본 라우트
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
      advancedSearch: '/api/advanced/search?keyword=강아지가',
      textAnalysis: '/api/advanced/analyze',
      homonym: '/api/homonym',                                    // 이 줄 추가
      homonymAnalyze: '/api/homonym/analyze?keyword=눈&context=눈이 아프다',  // 이 줄 추가
      homonymList: '/api/homonym/list'                           // 이 줄 추가
    },
    timestamp: new Date().toISOString()
  });
});

// 헬스 체크 라우트
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    res.json({
      status: 'healthy',
      database: dbStatus ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// 데이터베이스 테스트 라우트
app.get('/test-db', async (req, res) => {
  try {
    const isConnected = await testConnection();
    res.json({
      database_connection: isConnected,
      message: isConnected ? '데이터베이스 연결 성공' : '데이터베이스 연결 실패'
    });
  } catch (error) {
    res.status(500).json({
      error: '데이터베이스 테스트 중 오류 발생',
      details: error.message
    });
  }
});

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
      console.log(`   - 헬스체크: http://localhost:${PORT}/health`);
      console.log(`   - DB테스트: http://localhost:${PORT}/test-db`);
    });

  } catch (error) {
    console.error('❌ 서버 시작 실패:', error.message);
    process.exit(1);
  }
}

// 서버 시작
startServer();

module.exports = app;