// src/components/AnalysisProgress.js
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  LinearProgress,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import {
  TextFields,
  Psychology,
  QuestionMark,
  AutoAwesome,
  CheckCircle,
  TrendingUp
} from '@mui/icons-material';

const ProgressContainer = styled(motion.div)`
  margin: 20px 0;
`;

const StepCard = styled(motion(Card))`
  margin: 10px 0;
  border-left: 4px solid #667eea;
  background: linear-gradient(45deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
`;

const ProgressBar = styled(LinearProgress)`
  height: 8px;
  border-radius: 4px;
  background-color: rgba(102, 126, 234, 0.2);
  
  & .MuiLinearProgress-bar {
    background: linear-gradient(45deg, #667eea, #764ba2);
    border-radius: 4px;
  }
`;

const StatusChip = styled(Chip)`
  &.processing {
    background: linear-gradient(45deg, #ff9800, #f57c00);
    color: white;
  }
  
  &.completed {
    background: linear-gradient(45deg, #4caf50, #388e3c);
    color: white;
  }
  
  &.pending {
    background: #e0e0e0;
    color: #757575;
  }
`;

const steps = [
  {
    id: 'parsing',
    label: '텍스트 파싱',
    description: '꿈 문장을 분석하여 키워드를 추출합니다',
    icon: <TextFields />
  },
  {
    id: 'homonym',
    label: '동음이의어 처리',
    description: '여러 의미를 가진 단어들을 식별합니다',
    icon: <QuestionMark />
  },
  {
    id: 'analysis',
    label: '의미 분석',
    description: '키워드의 중요도와 의미를 분석합니다',
    icon: <Psychology />
  },
  {
    id: 'recommendation',
    label: '번호 추천',
    description: '분석 결과를 바탕으로 로또번호를 추천합니다',
    icon: <AutoAwesome />
  },
  {
    id: 'completion',
    label: '분석 완료',
    description: '모든 분석이 완료되었습니다',
    icon: <CheckCircle />
  }
];

function AnalysisProgress({ 
  isVisible, 
  currentStep, 
  stepData = {},
  onComplete 
}) {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const stepIndex = steps.findIndex(step => step.id === currentStep);
    if (stepIndex !== -1) {
      setCurrentStepIndex(stepIndex);
      setProgress(((stepIndex + 1) / steps.length) * 100);
    }

    // 마지막 단계에서 완료 콜백 호출
    if (currentStep === 'completion' && onComplete) {
      setTimeout(onComplete, 2000);
    }
  }, [currentStep, isVisible, onComplete]);

  const getStepStatus = (stepIndex) => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'processing';
    return 'pending';
  };

  const getStepDetails = (stepId) => {
    const details = stepData[stepId];
    if (!details) return null;

    switch (stepId) {
      case 'parsing':
        return (
          <Box mt={1}>
            <Typography variant="body2" color="textSecondary">
              추출된 키워드: {details.keywordCount}개
            </Typography>
            {details.keywords && (
              <Box mt={1}>
                {details.keywords.slice(0, 5).map((keyword, index) => (
                  <Chip
                    key={index}
                    label={keyword}
                    size="small"
                    sx={{ margin: '2px', backgroundColor: '#e3f2fd' }}
                  />
                ))}
              </Box>
            )}
          </Box>
        );
      
      case 'homonym':
        return (
          <Box mt={1}>
            <Typography variant="body2" color="textSecondary">
              감지된 동음이의어: {details.homonymCount}개
            </Typography>
            {details.homonyms && (
              <Box mt={1}>
                {details.homonyms.map((homonym, index) => (
                  <Chip
                    key={index}
                    label={`${homonym.keyword} (${homonym.meaningCount}개 의미)`}
                    size="small"
                    sx={{ margin: '2px', backgroundColor: '#fff3e0' }}
                  />
                ))}
              </Box>
            )}
          </Box>
        );
      
      case 'analysis':
        return (
          <Box mt={1}>
            <Typography variant="body2" color="textSecondary">
              신뢰도: {details.confidence}%
            </Typography>
            <ProgressBar 
              variant="determinate" 
              value={details.confidence || 0} 
              sx={{ mt: 1 }}
            />
          </Box>
        );
      
      case 'recommendation':
        return (
          <Box mt={1}>
            <Typography variant="body2" color="textSecondary">
              추천 번호: {details.numberCount}개
            </Typography>
            {details.numbers && (
              <Box mt={1}>
                {details.numbers.map((number, index) => (
                  <Chip
                    key={index}
                    label={number}
                    size="small"
                    sx={{ 
                      margin: '2px', 
                      background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <ProgressContainer
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.5 }}
        >
          <StepCard>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUp sx={{ color: '#667eea', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  분석 진행 상황
                </Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  전체 진행률: {Math.round(progress)}%
                </Typography>
                <ProgressBar variant="determinate" value={progress} />
              </Box>

              <Stepper orientation="vertical" sx={{ mt: 2 }}>
                {steps.map((step, index) => {
                  const status = getStepStatus(index);
                  return (
                    <Step key={step.id} active={true}>
                      <StepLabel
                        icon={
                          <motion.div
                            animate={{
                              scale: status === 'processing' ? [1, 1.1, 1] : 1,
                              rotate: status === 'processing' ? [0, 5, -5, 0] : 0
                            }}
                            transition={{
                              duration: 2,
                              repeat: status === 'processing' ? Infinity : 0
                            }}
                          >
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: status === 'completed' 
                                  ? 'linear-gradient(45deg, #4caf50, #388e3c)'
                                  : status === 'processing'
                                  ? 'linear-gradient(45deg, #ff9800, #f57c00)'
                                  : '#e0e0e0',
                                color: status !== 'pending' ? 'white' : '#757575'
                              }}
                            >
                              {step.icon}
                            </Box>
                          </motion.div>
                        }
                      >
                        <Box display="flex" alignItems="center">
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mr: 1 }}>
                            {step.label}
                          </Typography>
                          <StatusChip 
                            className={status}
                            label={
                              status === 'completed' ? '완료' :
                              status === 'processing' ? '진행중' : '대기중'
                            }
                            size="small"
                          />
                        </Box>
                      </StepLabel>
                      <StepContent>
                        <Typography variant="body2" color="textSecondary">
                          {step.description}
                        </Typography>
                        {getStepDetails(step.id)}
                      </StepContent>
                    </Step>
                  );
                })}
              </Stepper>
            </CardContent>
          </StepCard>
        </ProgressContainer>
      )}
    </AnimatePresence>
  );
}

export default AnalysisProgress;