// src/pages/DreamAnalysis.js
import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Psychology,
  AutoAwesome,
  TrendingUp,
  PlayArrow,
  CheckCircle,
  QuestionMark,
  Warning
} from '@mui/icons-material';
import { analyzeDream, getHomonymList } from '../services/api';
import HomonymSelector from '../components/HomonymSelector';
import AnalysisProgress from '../components/AnalysisProgress';
import MobileOptimized from '../components/MobileOptimized';

const StyledContainer = styled(Container)`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 0;
  
  @media (max-width: 768px) {
    padding: 10px 0;
  }
`;

const MainCard = styled(Paper)`
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.1);
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(10px);
  
  @media (max-width: 768px) {
    padding: 20px;
    margin: 10px;
    border-radius: 15px;
  }
`;

const LottoNumber = styled(motion.div)`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(45deg, #ff6b6b, #feca57);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 18px;
  margin: 5px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
`;

const KeywordChip = styled(Chip)`
  margin: 4px;
  background: linear-gradient(45deg, #4ecdc4, #44a08d);
  color: white;
  font-weight: bold;
  
  &:hover {
    transform: scale(1.05);
    transition: transform 0.2s;
  }
`;

const ConfidenceBar = styled(Box)`
  margin: 20px 0;
  padding: 15px;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 10px;
  border-left: 4px solid #4caf50;
`;

function DreamAnalysis() {
  const [dreamText, setDreamText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // 동음이의어 관련 상태
  const [homonymModal, setHomonymModal] = useState(false);
  const [currentHomonyms, setCurrentHomonyms] = useState([]);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [pendingAnalysis, setPendingAnalysis] = useState(null);
  
  // 분석 과정 시각화 상태
  const [showProgress, setShowProgress] = useState(false);
  const [currentStep, setCurrentStep] = useState('parsing');
  const [stepData, setStepData] = useState({});

  // 분석 단계 업데이트 함수
  const updateAnalysisStep = (step, data = {}) => {
    setCurrentStep(step);
    setStepData(prev => ({
      ...prev,
      [step]: data
    }));
  };

  // 분석 과정 시뮬레이션
  const simulateAnalysisSteps = async (text) => {
    // 1단계: 텍스트 파싱
    updateAnalysisStep('parsing', {
      keywordCount: 0,
      keywords: []
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 파싱 결과 시뮬레이션
    const words = text.split(/\s+/).filter(word => word.length > 1);
    const mockKeywords = words.slice(0, 5).map(word => word.replace(/[^가-힣]/g, ''));
    
    updateAnalysisStep('parsing', {
      keywordCount: mockKeywords.length,
      keywords: mockKeywords
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    // 2단계: 동음이의어 처리
    const commonHomonyms = ['눈', '배', '밤', '별', '손', '발'];
    const foundHomonyms = commonHomonyms.filter(word => text.includes(word));
    
    updateAnalysisStep('homonym', {
      homonymCount: foundHomonyms.length,
      homonyms: foundHomonyms.map(word => ({
        keyword: word,
        meaningCount: 2
      }))
    });
    await new Promise(resolve => setTimeout(resolve, 800));

    // 3단계: 의미 분석
    updateAnalysisStep('analysis', {
      confidence: 0
    });
    
    // 신뢰도 점진적 증가
    for (let i = 0; i <= 85; i += 5) {
      updateAnalysisStep('analysis', { confidence: i });
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    await new Promise(resolve => setTimeout(resolve, 500));

    // 4단계: 번호 추천
    const mockNumbers = [3, 28, 1, 5, 20, 37];
    updateAnalysisStep('recommendation', {
      numberCount: mockNumbers.length,
      numbers: mockNumbers
    });
    await new Promise(resolve => setTimeout(resolve, 800));

    // 5단계: 완료
    updateAnalysisStep('completion', {});
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  // 동음이의어 감지 및 처리 (새로운 API 사용)
  const detectHomonyms = async (text) => {
    try {
      // 새로운 백엔드 API는 자동으로 모든 동음이의어를 감지하고 처리함
      // 이 함수는 호환성을 위해 유지하지만 실제로는 analyzeDream에서 처리됨
      console.log('🔍 동음이의어 감지 (새 API 사용)');
      return [];
    } catch (error) {
      console.error('동음이의어 감지 실패:', error);
      return [];
    }
  };

  const handleAnalyze = async () => {
    if (!dreamText.trim()) {
      setError('꿈 내용을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setShowProgress(true);
    setStepData({});

    try {
      // 분석 과정 시각화 시작
      await simulateAnalysisSteps(dreamText);

      // 고급 꿈 분석 실행 (새로운 API)
      const analysisResult = await analyzeDream(dreamText);
      
      console.log('📊 분석 결과:', analysisResult);
      
      // 동음이의어 선택이 필요한 경우
      if (analysisResult.status === 'needs_homonym_choice') {
        setShowProgress(false);
        
        // 다중 동음이의어 처리
        const pendingChoices = analysisResult.homonymChoices || [];
        
        if (pendingChoices.length > 0) {
          // 첫 번째 동음이의어부터 처리
          const firstChoice = pendingChoices[0];
          setCurrentKeyword(firstChoice.keyword);
          setCurrentHomonyms(firstChoice.meanings);
          setPendingAnalysis({ 
            text: dreamText, 
            remainingChoices: pendingChoices.slice(1),
            allChoices: pendingChoices,
            partialAnalysis: analysisResult.partialAnalysis
          });
          setHomonymModal(true);
        }
        
        setLoading(false);
        return;
      }
      
      // 분석 완료된 경우
      if (analysisResult.status === 'completed') {
        setResult(analysisResult);
        
        // 자동 해결된 동음이의어 정보 표시
        if (analysisResult.analysis?.homonymProcessing?.resolutions) {
          const autoResolutions = analysisResult.analysis.homonymProcessing.resolutions.filter(
            r => r.method === 'auto_resolved'
          );
          
          if (autoResolutions.length > 0) {
            // 자동 해결 정보를 결과에 추가
            if (!analysisResult.analysis.homonymResolutions) {
              analysisResult.analysis.homonymResolutions = [];
            }
            
            autoResolutions.forEach(resolution => {
              analysisResult.analysis.homonymResolutions.push({
                keyword: resolution.keyword,
                selectedMeaning: resolution.selectedMeaning.meaning,
                category: resolution.selectedMeaning.category,
                method: 'auto_resolved',
                confidence: Math.round(resolution.confidence * 100),
                matchedKeywords: resolution.matchedKeywords || []
              });
            });
            
            setResult({...analysisResult});
          }
        }
        
        // 분석 완료 후 진행 과정 숨기기
        setTimeout(() => setShowProgress(false), 2000);
      }
      
    } catch (err) {
      setError(err.message);
      setShowProgress(false);
    } finally {
      setLoading(false);
    }
  };

  // 동음이의어 선택 완료 후 처리 (다중 선택 지원)
  const handleHomonymSelect = async (selectedMeaning) => {
    setHomonymModal(false);
    
    try {
      // 현재 선택을 저장
      const currentChoice = {
        [currentKeyword]: selectedMeaning.id
      };
      
      // 남은 동음이의어가 있는지 확인
      if (pendingAnalysis.remainingChoices && pendingAnalysis.remainingChoices.length > 0) {
        // 다음 동음이의어 선택 요청
        const nextChoice = pendingAnalysis.remainingChoices[0];
        setCurrentKeyword(nextChoice.keyword);
        setCurrentHomonyms(nextChoice.meanings);
        
        // 이미 선택한 것들과 현재 선택을 합쳐서 저장
        const allChoices = {
          ...(pendingAnalysis.accumulatedChoices || {}),
          ...currentChoice
        };
        
        setPendingAnalysis({
          ...pendingAnalysis,
          remainingChoices: pendingAnalysis.remainingChoices.slice(1),
          accumulatedChoices: allChoices
        });
        
        setHomonymModal(true);
        return;
      }
      
      // 모든 동음이의어 선택이 완료된 경우
      setShowProgress(true);
      
      // 동음이의어 선택 후 분석 과정 재시작
      await simulateAnalysisSteps(pendingAnalysis.text);
      
      // 모든 선택을 합쳐서 최종 분석 요청
      const allHomonymChoices = {
        ...(pendingAnalysis.accumulatedChoices || {}),
        ...currentChoice
      };
      
      console.log('🔤 최종 동음이의어 선택:', allHomonymChoices);
      
      // 선택된 의미로 최종 분석 진행
      const analysisResult = await analyzeDream(pendingAnalysis.text, {
        homonymChoices: allHomonymChoices
      });
      
      if (analysisResult.status === 'completed') {
        setResult(analysisResult);
        
        // 사용자 선택 정보를 결과에 추가
        if (analysisResult.analysis?.homonymProcessing?.resolutions) {
          const userResolutions = analysisResult.analysis.homonymProcessing.resolutions.filter(
            r => r.method === 'user_choice'
          );
          const autoResolutions = analysisResult.analysis.homonymProcessing.resolutions.filter(
            r => r.method === 'auto_resolved'
          );
          
          if (!analysisResult.analysis.homonymResolutions) {
            analysisResult.analysis.homonymResolutions = [];
          }
          
          // 사용자 선택 추가
          userResolutions.forEach(resolution => {
            analysisResult.analysis.homonymResolutions.push({
              keyword: resolution.keyword,
              selectedMeaning: resolution.selectedMeaning.meaning,
              category: resolution.selectedMeaning.category,
              method: 'user_choice',
              confidence: 100
            });
          });
          
          // 자동 해결 추가
          autoResolutions.forEach(resolution => {
            analysisResult.analysis.homonymResolutions.push({
              keyword: resolution.keyword,
              selectedMeaning: resolution.selectedMeaning.meaning,
              category: resolution.selectedMeaning.category,
              method: 'auto_resolved',
              confidence: Math.round(resolution.confidence * 100),
              matchedKeywords: resolution.matchedKeywords || []
            });
          });
          
          setResult({...analysisResult});
        }
        
        // 분석 완료 후 진행 과정 숨기기
        setTimeout(() => setShowProgress(false), 2000);
      }
      
    } catch (err) {
      setError('분석 중 오류가 발생했습니다: ' + err.message);
      setShowProgress(false);
    }
    
    // 상태 초기화
    setCurrentKeyword('');
    setCurrentHomonyms([]);
    setPendingAnalysis(null);
  };

  // 동음이의어 선택 취소
  const handleHomonymCancel = () => {
    setHomonymModal(false);
    setCurrentKeyword('');
    setCurrentHomonyms([]);
    setPendingAnalysis(null);
    setShowProgress(false);
  };

  // 공유 기능
  const handleShare = () => {
    if (result) {
      const shareText = `꿈해몽 분석 결과: ${result.analysis?.keywords?.map(k => k.keyword).join(', ')} → 추천번호: ${result.analysis?.recommendation?.numbers?.slice(0,6).map(n => n.number).join(', ')}`;
      
      // 간단한 공유 데이터 저장 (실제로는 서버에 저장)
      localStorage.setItem('lastAnalysis', JSON.stringify({
        text: dreamText,
        result: result,
        timestamp: new Date().toISOString()
      }));
    }
  };

  // 저장 기능
  const handleSave = () => {
    if (result) {
      const savedAnalyses = JSON.parse(localStorage.getItem('savedAnalyses') || '[]');
      const newAnalysis = {
        id: Date.now(),
        text: dreamText,
        result: result,
        timestamp: new Date().toISOString()
      };
      
      savedAnalyses.unshift(newAnalysis);
      // 최대 10개까지만 저장
      if (savedAnalyses.length > 10) {
        savedAnalyses.pop();
      }
      
      localStorage.setItem('savedAnalyses', JSON.stringify(savedAnalyses));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleAnalyze();
    }
  };

  return (
    <StyledContainer maxWidth="lg">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <MainCard elevation={0}>
          {/* 헤더 */}
          <Box textAlign="center" mb={4}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <Psychology sx={{ fontSize: 60, color: '#667eea', mb: 2 }} />
            </motion.div>
            <Typography variant="h3" component="h1" gutterBottom>
              꿈해몽 분석기
            </Typography>
            <Typography variant="h6" color="textSecondary">
              꿈의 내용을 입력하면 로또번호를 추천해드립니다
            </Typography>
          </Box>

          {/* 입력 영역 */}
          <Box mb={4}>
            <TextField
              fullWidth
              multiline
              rows={6}
              variant="outlined"
              label="꿈의 내용을 자세히 입력해주세요"
              placeholder="예: 어제 꿈에서 강아지가 집에서 뛰어놀고, 눈이 펑펑 내렸어요..."
              value={dreamText}
              onChange={(e) => setDreamText(e.target.value)}
              onKeyPress={handleKeyPress}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '15px',
                  fontSize: '16px'
                }
              }}
            />
            <Box mt={2} textAlign="center">
              <Button
                variant="contained"
                size="large"
                onClick={handleAnalyze}
                disabled={loading || !dreamText.trim()}
                startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesome />}
                sx={{
                  borderRadius: '25px',
                  padding: '12px 40px',
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  fontSize: '16px',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #5a6fd8, #6a4190)',
                  }
                }}
              >
                {loading ? '분석 중...' : '꿈 분석하기'}
              </Button>
            </Box>
            <Typography variant="caption" display="block" textAlign="center" mt={1} color="textSecondary">
              Ctrl + Enter로도 분석할 수 있습니다
            </Typography>
          </Box>

          {/* 에러 메시지 */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Alert severity="error" sx={{ mb: 3, borderRadius: '10px' }}>
                  {error}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 분석 과정 시각화 */}
          <AnalysisProgress
            isVisible={showProgress}
            currentStep={currentStep}
            stepData={stepData}
            onComplete={() => setShowProgress(false)}
          />

          {/* 분석 결과 */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card sx={{ mb: 3, borderRadius: '15px', overflow: 'hidden' }}>
                  <CardContent sx={{ padding: '30px !important' }}>
                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircle sx={{ color: 'green', mr: 1 }} />
                      분석 완료!
                    </Typography>

                    {/* 신뢰도 표시 */}
                    {result.analysis?.confidence && (
                      <ConfidenceBar>
                        <Typography variant="subtitle1" gutterBottom>
                          분석 신뢰도: {result.analysis.confidence}%
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={result.analysis.confidence} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: 'rgba(76, 175, 80, 0.2)',
                            '& .MuiLinearProgress-bar': {
                              background: 'linear-gradient(45deg, #4caf50, #8bc34a)'
                            }
                          }}
                        />
                      </ConfidenceBar>
                    )}

                    {/* 동음이의어 해결 정보 */}
                    {result.analysis?.homonymResolutions && result.analysis.homonymResolutions.length > 0 && (
                      <Box mb={3}>
                        <Typography variant="h6" gutterBottom>
                          🔤 동음이의어 해결
                        </Typography>
                        <Box>
                          {result.analysis.homonymResolutions.map((resolution, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              style={{ display: 'inline-block' }}
                            >
                              <Chip
                                icon={<CheckCircle />}
                                label={`${resolution.keyword} → ${resolution.selectedMeaning} (${resolution.category})`}
                                variant="outlined"
                                sx={{ 
                                  margin: '4px',
                                  borderColor: '#4caf50',
                                  color: '#4caf50',
                                  '& .MuiChip-icon': { color: '#4caf50' }
                                }}
                              />
                            </motion.div>
                          ))}
                        </Box>
                      </Box>
                    )}
                    {result.analysis?.keywords && result.analysis.keywords.length > 0 && (
                      <Box mb={3}>
                        <Typography variant="h6" gutterBottom>
                          🔑 추출된 키워드
                        </Typography>
                        <Box>
                          {result.analysis.keywords.map((keyword, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              style={{ display: 'inline-block' }}
                            >
                              <KeywordChip
                                label={`${keyword.keyword} (★${keyword.importance})`}
                                variant="filled"
                              />
                            </motion.div>
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* 추천 번호 */}
                    {result.analysis?.recommendation?.numbers && (
                      <Box mb={3}>
                        <Typography variant="h6" gutterBottom>
                          🎯 추천 로또번호
                        </Typography>
                        <Box display="flex" flexWrap="wrap" justifyContent="center" mt={2}>
                          {result.analysis.recommendation.numbers.slice(0, 6).map((item, index) => (
                            <LottoNumber
                              key={index}
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ delay: index * 0.2, type: "spring" }}
                              whileHover={{ scale: 1.1 }}
                            >
                              {item.number}
                            </LottoNumber>
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* 분석 제안 */}
                    {result.suggestion && (
                      <Alert severity="info" sx={{ borderRadius: '10px' }}>
                        <Typography variant="body1">
                          💡 {result.suggestion}
                        </Typography>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </MainCard>
      </motion.div>

      {/* 동음이의어 선택 모달 */}
      <HomonymSelector
        open={homonymModal}
        homonyms={currentHomonyms}
        keyword={currentKeyword}
        currentContext={dreamText}
        onSelect={handleHomonymSelect}
        onClose={handleHomonymCancel}
      />
    </StyledContainer>
  );
}

export default DreamAnalysis;