// src/App.js (간단한 테스트 버전)
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Psychology, MenuBook } from '@mui/icons-material';
import DreamAnalysis from './pages/DreamAnalysis';
import DictionaryPage from './pages/DictionaryPage';

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
            <Route path="/" element={<DreamAnalysis />} />
            <Route path="/dictionary" element={<DictionaryPage />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;