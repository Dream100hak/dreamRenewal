// src/components/MobileOptimized.js
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Box, 
  Fab, 
  Snackbar, 
  Alert,
  useMediaQuery,
  useTheme,
  Backdrop,
  CircularProgress,
  Typography
} from '@mui/material';
import {
  KeyboardArrowUp,
  Share,
  Favorite,
  GetApp
} from '@mui/icons-material';

const MobileContainer = styled.div`
  position: relative;
  min-height: 100vh;
  
  @media (max-width: 768px) {
    padding: 10px;
    
    /* 모바일에서 키보드가 올라올 때 뷰포트 조정 */
    .keyboard-open & {
      height: 100vh;
      overflow: hidden;
    }
  }
`;

const ScrollToTopButton = styled(Fab)`
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 1000;
  
  @media (max-width: 768px) {
    bottom: 70px;
    right: 15px;
    width: 48px;
    height: 48px;
  }
`;

const ActionButtonGroup = styled(Box)`
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 999;
  
  @media (max-width: 768px) {
    bottom: 15px;
    right: 15px;
    gap: 8px;
  }
`;

const ActionButton = styled(Fab)`
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  
  @media (max-width: 768px) {
    width: 48px;
    height: 48px;
  }
`;

const LoadingOverlay = styled(Backdrop)`
  z-index: 9999;
  color: #fff;
  background: rgba(102, 126, 234, 0.8);
  backdrop-filter: blur(5px);
`;

const LoadingContent = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const PWAInstallPrompt = styled(Box)`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  padding: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 1000;
  transform: translateY(100%);
  transition: transform 0.3s ease;
  
  &.show {
    transform: translateY(0);
  }
`;

function MobileOptimized({ children, loading = false, onShare, onSave }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // 스크롤 위치 감지
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // PWA 설치 프롬프트 감지
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPWAPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // 키보드 표시/숨김 감지 (모바일)
  useEffect(() => {
    if (!isMobile) return;

    const handleResize = () => {
      const isKeyboardOpen = window.innerHeight < window.screen.height * 0.75;
      document.body.classList.toggle('keyboard-open', isKeyboardOpen);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleShare = async () => {
    if (navigator.share && isMobile) {
      try {
        await navigator.share({
          title: '꿈해몽 분석 결과',
          text: '내 꿈을 분석해서 로또번호를 받았어요!',
          url: window.location.href
        });
      } catch (error) {
        console.log('공유 취소됨');
      }
    } else {
      // 웹 공유 API가 없는 경우 클립보드에 복사
      try {
        await navigator.clipboard.writeText(window.location.href);
        showNotification('링크가 클립보드에 복사되었습니다!', 'success');
      } catch (error) {
        showNotification('공유에 실패했습니다.', 'error');
      }
    }
    
    if (onShare) onShare();
  };

  const handleSave = () => {
    // 로컬 스토리지에 분석 결과 저장 (실제 구현)
    showNotification('분석 결과가 저장되었습니다!', 'success');
    if (onSave) onSave();
  };

  const handlePWAInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        showNotification('앱이 설치되었습니다!', 'success');
      }
      
      setDeferredPrompt(null);
      setShowPWAPrompt(false);
    }
  };

  const showNotification = (message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const closeNotification = () => {
    setNotification({ open: false, message: '', severity: 'info' });
  };

  return (
    <MobileContainer>
      {children}

      {/* 로딩 오버레이 */}
      <LoadingOverlay open={loading}>
        <LoadingContent>
          <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
            꿈을 분석하고 있습니다...
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            잠시만 기다려주세요
          </Typography>
        </LoadingContent>
      </LoadingOverlay>

      {/* 스크롤 투 탑 버튼 */}
      {showScrollTop && (
        <ScrollToTopButton
          color="primary"
          aria-label="scroll to top"
          onClick={scrollToTop}
          size={isMobile ? "medium" : "large"}
        >
          <KeyboardArrowUp />
        </ScrollToTopButton>
      )}

      {/* 액션 버튼 그룹 */}
      <ActionButtonGroup>
        <ActionButton
          color="secondary"
          aria-label="share"
          onClick={handleShare}
          size={isMobile ? "medium" : "large"}
        >
          <Share />
        </ActionButton>
        
        <ActionButton
          sx={{ 
            background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
            '&:hover': { background: 'linear-gradient(45deg, #ff5252, #ffc107)' }
          }}
          aria-label="save"
          onClick={handleSave}
          size={isMobile ? "medium" : "large"}
        >
          <Favorite />
        </ActionButton>
      </ActionButtonGroup>

      {/* PWA 설치 프롬프트 */}
      <PWAInstallPrompt className={showPWAPrompt ? 'show' : ''}>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            📱 앱으로 설치하기
          </Typography>
          <Typography variant="caption">
            홈화면에 추가해서 더 편리하게 이용하세요
          </Typography>
        </Box>
        <Box>
          <ActionButton
            size="small"
            sx={{ 
              mr: 1,
              background: 'rgba(255,255,255,0.2)',
              '&:hover': { background: 'rgba(255,255,255,0.3)' }
            }}
            onClick={() => setShowPWAPrompt(false)}
          >
            ✕
          </ActionButton>
          <ActionButton
            size="small"
            sx={{ 
              background: 'rgba(255,255,255,0.9)',
              color: '#667eea',
              '&:hover': { background: 'white' }
            }}
            onClick={handlePWAInstall}
          >
            <GetApp />
          </ActionButton>
        </Box>
      </PWAInstallPrompt>

      {/* 알림 스낵바 */}
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={closeNotification} 
          severity={notification.severity}
          sx={{ 
            borderRadius: '10px',
            '& .MuiAlert-icon': { fontSize: '20px' }
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </MobileContainer>
  );
}

export default MobileOptimized;