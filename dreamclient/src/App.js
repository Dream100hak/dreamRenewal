// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, GlobalStyles } from '@mui/material';
import DreamAnalysis from './pages/DreamAnalysis';

// Material-UI 테마 설정
const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
      light: '#9bb5ff',
      dark: '#3f4fcd',
    },
    secondary: {
      main: '#764ba2',
      light: '#a777d0',
      dark: '#4a2575',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h3: {
      fontWeight: 700,
      color: '#2c3e50',
    },
    h5: {
      fontWeight: 600,
      color: '#34495e',
    },
    h6: {
      fontWeight: 600,
      color: '#34495e',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 25,
          fontWeight: 600,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 15,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 15,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        },
      },
    },
  },
});

// 글로벌 스타일
const globalStyles = (
  <GlobalStyles
    styles={{
      '*': {
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
      },
      body: {
        fontFamily: theme.typography.fontFamily,
        backgroundColor: '#f5f7fa',
        overflow: 'auto',
      },
      '&::-webkit-scrollbar': {
        width: '8px',
      },
      '&::-webkit-scrollbar-track': {
        background: '#f1f1f1',
        borderRadius: '10px',
      },
      '&::-webkit-scrollbar-thumb': {
        background: 'linear-gradient(45deg, #667eea, #764ba2)',
        borderRadius: '10px',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: 'linear-gradient(45deg, #5a6fd8, #6a4190)',
      },
    }}
  />
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {globalStyles}
      <Router>
        <div className="App">
          <Routes>
            {/* 메인 페이지 */}
            <Route path="/" element={<DreamAnalysis />} />
            
            {/* 추후 추가할 페이지들 */}
            {/* <Route path="/history" element={<AnalysisHistory />} /> */}
            {/* <Route path="/settings" element={<Settings />} /> */}
            {/* <Route path="/about" element={<About />} /> */}
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;