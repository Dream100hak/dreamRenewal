// debug.js - Windows 환경 디버그 도우미
const { testConnection, pool } = require('./src/config/database');

async function debugEnvironment() {
  console.log('🔍 DreamServer 환경 디버그 정보');
  console.log('================================');
  
  // 1. Node.js 환경 정보
  console.log('📌 Node.js 정보:');
  console.log(`   Node.js 버전: ${process.version}`);
  console.log(`   플랫폼: ${process.platform}`);
  console.log(`   아키텍처: ${process.arch}`);
  console.log(`   작업 디렉토리: ${process.cwd()}`);
  console.log('');

  // 2. 환경 변수 확인
  console.log('📌 환경 변수:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || '설정되지 않음'}`);
  console.log(`   PORT: ${process.env.PORT || '설정되지 않음'}`);
  console.log(`   DB_HOST: ${process.env.DB_HOST || '설정되지 않음'}`);
  console.log(`   DB_USER: ${process.env.DB_USER || '설정되지 않음'}`);
  console.log(`   DB_NAME: ${process.env.DB_NAME || '설정되지 않음'}`);
  console.log(`   DB_PORT: ${process.env.DB_PORT || '설정되지 않음'}`);
  console.log('');

  // 3. 필수 파일 존재 확인
  const fs = require('fs');
  const path = require('path');
  
  console.log('📌 필수 파일 확인:');
  const requiredFiles = [
    '.env',
    'package.json',
    'src/config/database.js',
    'src/app.js'
  ];
  
  for (const file of requiredFiles) {
    const exists = fs.existsSync(path.join(process.cwd(), file));
    console.log(`   ${file}: ${exists ? '✅ 존재함' : '❌ 없음'}`);
  }
  console.log('');

  // 4. 데이터베이스 연결 테스트
  console.log('📌 데이터베이스 연결 테스트:');
  try {
    const isConnected = await testConnection();
    console.log(`   연결 상태: ${isConnected ? '✅ 성공' : '❌ 실패'}`);
    
    if (isConnected) {
      const connection = await pool.getConnection();
      
      // MySQL 버전 확인
      const [versionResult] = await connection.execute('SELECT VERSION() as version');
      console.log(`   MySQL 버전: ${versionResult[0].version}`);
      
      // 현재 데이터베이스 확인
      const [dbResult] = await connection.execute('SELECT DATABASE() as db_name');
      console.log(`   현재 DB: ${dbResult[0].db_name || '선택되지 않음'}`);
      
      // 테이블 목록 확인
      const [tables] = await connection.execute('SHOW TABLES');
      console.log(`   테이블 수: ${tables.length}개`);
      if (tables.length > 0) {
        console.log('   테이블 목록:');
        tables.forEach(table => {
          const tableName = Object.values(table)[0];
          console.log(`     - ${tableName}`);
        });
      }
      
      connection.release();
    }
  } catch (error) {
    console.log(`   연결 오류: ${error.message}`);
  }
  console.log('');

  // 5. 네트워크 상태 확인
  console.log('📌 네트워크 정보:');
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  
  Object.keys(networkInterfaces).forEach(interfaceName => {
    const interfaces = networkInterfaces[interfaceName];
    interfaces.forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`   ${interfaceName}: ${iface.address}`);
      }
    });
  });
  
  // 6. 포트 사용 가능 여부 확인
  const net = require('net');
  const checkPort = (port) => {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(port, () => {
        server.close(() => resolve(true));
      });
      server.on('error', () => resolve(false));
    });
  };
  
  const port = process.env.PORT || 3000;
  const isPortAvailable = await checkPort(port);
  console.log(`   포트 ${port}: ${isPortAvailable ? '✅ 사용 가능' : '❌ 사용 중'}`);
  
  console.log('');
  console.log('🎯 권장 사항:');
  
  if (!process.env.NODE_ENV) {
    console.log('   - .env 파일에 NODE_ENV=development 추가');
  }
  
  if (!isPortAvailable) {
    console.log(`   - 포트 ${port}이 사용 중입니다. 다른 포트를 사용하거나 프로세스를 종료하세요.`);
    console.log(`   - netstat -ano | findstr :${port} 명령으로 프로세스 확인`);
  }
  
  console.log('   - npm run dev 명령으로 개발 서버를 시작하세요.');
  console.log('   - http://localhost:' + port + ' 에서 서버 상태를 확인하세요.');
  
  await pool.end();
}

// 스크립트 직접 실행 시
if (require.main === module) {
  debugEnvironment().catch(console.error);
}

module.exports = { debugEnvironment };