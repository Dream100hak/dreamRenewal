// src/App.js (간단한 테스트 버전)
import React, { useState, useEffect } from 'react';  // 🔥 useState, useEffect 추가!
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, AppBar, Toolbar, Typography, Button, Box, Container, Paper } from '@mui/material';
import { Psychology, MenuBook } from '@mui/icons-material';

// 🔥 임시 간단한 컴포넌트들
function TempDreamAnalysis() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '20px' }}>
        <Psychology sx={{ fontSize: 60, color: '#667eea', mb: 2 }} />
        <Typography variant="h3" gutterBottom>
          꿈해몽 분석기
        </Typography>
        <Typography variant="h6" color="textSecondary">
          임시 페이지입니다. 나중에 원래 페이지로 교체할 예정이에요.
        </Typography>
      </Paper>
    </Container>
  );
}


// 🔥 App.js에서 TempDictionaryPage 함수를 이것으로 교체하세요!

function TempDictionaryPage() {
  // 상태 관리
  const [consonants, setConsonants] = useState([]);
  const [selectedConsonant, setSelectedConsonant] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 컴포넌트가 처음 로드될 때 초성 목록 가져오기
  useEffect(() => {
    loadConsonants();
  }, []);

  // 초성 목록 가져오는 함수
  const loadConsonants = async () => {
    try {
      console.log('🔍 초성 목록 로딩 중...');
      const response = await fetch('http://localhost:3000/api/dictionary/consonants');
      const data = await response.json();
      
      if (data.success) {
        setConsonants(data.consonants);
        console.log('✅ 초성 목록 로드 완료:', data.consonants);
      } else {
        setError('초성 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('❌ 초성 로드 오류:', err);
      setError('서버 연결에 실패했습니다.');
    }
  };

  // 특정 초성의 키워드들 가져오는 함수
  const loadKeywordsByConsonant = async (consonant) => {
    setLoading(true);
    setError('');
    setSelectedConsonant(consonant);
    
    try {
      console.log(`🔍 "${consonant}" 초성 키워드 로딩 중...`);
      const response = await fetch(`http://localhost:3000/api/dictionary/consonant/${consonant}`);
      const data = await response.json();
      
      if (data.success) {
        setKeywords(data.keywords);
        console.log(`✅ "${consonant}" 키워드 ${data.keywords.length}개 로드 완료`);
      } else {
        setError('키워드를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('❌ 키워드 로드 오류:', err);
      setError('키워드를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 헤더 */}
      <Paper sx={{ p: 4, mb: 4, textAlign: 'center', borderRadius: '20px' }}>
        <MenuBook sx={{ fontSize: 60, color: '#667eea', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom>
          📖 꿈사전 찾기
        </Typography>
        <Typography variant="h6" color="textSecondary">
          초성을 선택하여 꿈 키워드를 찾아보세요
        </Typography>
      </Paper>

      {/* 에러 메시지 */}
      {error && (
        <Paper sx={{ p: 2, mb: 3, backgroundColor: '#ffebee', borderRadius: '10px' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {/* 초성 버튼들 */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: '15px' }}>
        <Typography variant="h5" gutterBottom>
          🔤 초성 선택
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {consonants.map((item) => (
            <Button
              key={item.consonant}
              variant={selectedConsonant === item.consonant ? "contained" : "outlined"}
              onClick={() => loadKeywordsByConsonant(item.consonant)}
              sx={{
                minWidth: '60px',
                height: '60px',
                fontSize: '18px',
                fontWeight: 'bold',
                borderRadius: '10px',
                background: selectedConsonant === item.consonant 
                  ? 'linear-gradient(45deg, #667eea, #764ba2)' 
                  : 'transparent'
              }}
            >
              <Box textAlign="center">
                <div>{item.consonant}</div>
                <div style={{ fontSize: '10px' }}>({item.count})</div>
              </Box>
            </Button>
          ))}
        </Box>
      </Paper>

      {/* 선택된 초성 정보 */}
      {selectedConsonant && (
        <Box textAlign="center" mb={3}>
          <Typography variant="h4" color="primary">
            "{selectedConsonant}" 으로 시작하는 키워드
          </Typography>
          <Typography variant="body1" color="textSecondary">
            총 {keywords.length}개의 키워드
          </Typography>
        </Box>
      )}

      {/* 로딩 표시 */}
      {loading && (
        <Box textAlign="center" my={4}>
          <Typography variant="body2" color="textSecondary">
            키워드를 불러오는 중... ⏳
          </Typography>
        </Box>
      )}

      {/* 키워드 카드들 */}
      {!loading && keywords.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 2 }}>
          {keywords.map((keyword) => (
            <Paper 
              key={keyword.id}
              sx={{ 
                p: 2,
                borderRadius: '15px',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  transition: 'transform 0.3s ease',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                }
              }}
            >
              {/* 키워드 이름과 별점 */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                  {keyword.keyword}
                </Typography>
                <Box color="#ffd700" fontSize="16px">
                  {keyword.stars}
                </Box>
              </Box>
              
              {/* 로또번호들 */}
              <Typography variant="body2" color="textSecondary" gutterBottom>
                로또번호:
              </Typography>
              <Box>
                {keyword.numbers.map((number, index) => (
                  <Box
                    key={index}
                    component="span"
                    sx={{
                      display: 'inline-block',
                      margin: '2px',
                      padding: '4px 8px',
                      background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
                      color: 'white',
                      fontWeight: 'bold',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                  >
                    {number}
                  </Box>
                ))}
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* 키워드 없음 */}
      {!loading && keywords.length === 0 && selectedConsonant && (
        <Box textAlign="center" my={4}>
          <Typography variant="h6" color="textSecondary">
            "{selectedConsonant}" 으로 시작하는 키워드가 없습니다.
          </Typography>
        </Box>
      )}
    </Container>
  );
}
// 간단한 테마
const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
  },
});

// 네비게이션 컴포넌트
function Navigation() {
  const navigate = useNavigate();
  
  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        background: 'linear-gradient(45deg, #667eea, #764ba2)',
      }}
    >
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          🔮 DreamRenewal
        </Typography>
        
        <Box>
          <Button
            color="inherit"
            startIcon={<Psychology />}
            onClick={() => navigate('/')}
            sx={{ mr: 1, borderRadius: '20px' }}
          >
            꿈 분석
          </Button>
          
          <Button
            color="inherit"
            startIcon={<MenuBook />}
            onClick={() => navigate('/dictionary')}
            sx={{ borderRadius: '20px' }}
          >
            꿈사전 찾기
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <Navigation />
          <Routes>
            <Route path="/" element={<TempDreamAnalysis />} />
            <Route path="/dictionary" element={<TempDictionaryPage />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;