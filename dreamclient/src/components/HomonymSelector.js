// src/components/HomonymSelector.js
import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Divider
} from '@mui/material';
import {
  Close,
  QuestionMark,
  CheckCircle,
  Visibility,
  AcUnit,
  DirectionsBoat,
  Restaurant,
  NightlightRound,
  WbSunny,
  Face
} from '@mui/icons-material';

const StyledDialog = styled(Dialog)`
  .MuiDialog-paper {
    border-radius: 20px;
    max-width: 600px;
    width: 100%;
    overflow: visible;
  }
`;

const HomonymCard = styled(motion(Card))`
  margin: 10px 0;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
  }
  
  &.selected {
    border-color: #667eea;
    background: linear-gradient(45deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  }
`;

const CategoryChip = styled(Chip)`
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  font-weight: bold;
`;

const ExampleBox = styled(Box)`
  background: rgba(102, 126, 234, 0.1);
  border-radius: 10px;
  padding: 10px;
  margin-top: 10px;
  border-left: 4px solid #667eea;
`;

const NumberChip = styled(Chip)`
  background: linear-gradient(45deg, #ff6b6b, #feca57);
  color: white;
  font-weight: bold;
  margin: 2px;
`;

// 카테고리별 아이콘 매핑
const getCategoryIcon = (category) => {
  const iconMap = {
    '인체': <Face />,
    '날씨': <AcUnit />,
    '탈것': <DirectionsBoat />,
    '음식': <Restaurant />,
    '시간': <NightlightRound />,
    '자연': <WbSunny />
  };
  return iconMap[category] || <QuestionMark />;
};

// 예시 문장 생성
const getExampleSentences = (keyword, meaning) => {
  const examples = {
    '눈_사람의 시각 기관': ['눈이 아파요', '눈을 깜빡였어요', '눈으로 보다'],
    '눈_하얀 결정체': ['눈이 내려요', '눈이 쌓였어요', '눈사람을 만들다'],
    '배_사람의 복부': ['배가 고파요', '배가 아파요', '배를 만지다'],
    '배_물에 뜨는 탈것': ['배를 타고', '배가 출항하다', '낚시배'],
    '밤_어두운 시간': ['밤에 잠을', '밤이 되다', '밤하늘의 별'],
    '밤_견과류': ['밤을 줍다', '군밤을 먹다', '밤나무']
  };
  
  const key = `${keyword}_${meaning}`;
  return examples[key] || [`${keyword}을/를 사용한 예시`];
};

function HomonymSelector({ 
  open, 
  homonyms, 
  keyword, 
  onSelect, 
  onClose,
  currentContext = ''
}) {
  const [selectedMeaning, setSelectedMeaning] = useState(null);

  const handleSelect = () => {
    if (selectedMeaning) {
      onSelect(selectedMeaning);
      setSelectedMeaning(null);
    }
  };

  const handleClose = () => {
    setSelectedMeaning(null);
    onClose();
  };

  if (!homonyms || homonyms.length === 0) return null;

  return (
    <StyledDialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center">
          <QuestionMark sx={{ color: '#667eea', mr: 1, fontSize: 28 }} />
          <Box>
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
              단어의 의미를 선택해주세요
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              "<strong>{keyword}</strong>"는 여러 의미를 가진 단어입니다
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: 'gray' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        {/* 현재 문맥 표시 */}
        {currentContext && (
          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              📝 현재 문맥:
            </Typography>
            <ExampleBox>
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                "{currentContext}"
              </Typography>
            </ExampleBox>
          </Box>
        )}

        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
          🔤 가능한 의미들:
        </Typography>

        <AnimatePresence>
          {homonyms.map((homonym, index) => (
            <HomonymCard
              key={homonym.id}
              className={selectedMeaning?.id === homonym.id ? 'selected' : ''}
              onClick={() => setSelectedMeaning(homonym)}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center">
                    <Box sx={{ color: '#667eea', mr: 1 }}>
                      {getCategoryIcon(homonym.category)}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {homonym.meaning}
                      </Typography>
                      <CategoryChip 
                        label={homonym.category} 
                        size="small" 
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>
                  {selectedMeaning?.id === homonym.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring" }}
                    >
                      <CheckCircle sx={{ color: 'green', fontSize: 30 }} />
                    </motion.div>
                  )}
                </Box>

                {/* 예시 문장 */}
                <Box mb={2}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    💭 예시 문장:
                  </Typography>
                  <Box>
                    {getExampleSentences(keyword, homonym.meaning).map((example, idx) => (
                      <Typography 
                        key={idx}
                        variant="body2" 
                        sx={{ 
                          color: '#555', 
                          fontStyle: 'italic',
                          display: 'inline-block',
                          mr: 2
                        }}
                      >
                        "{ example }"
                      </Typography>
                    ))}
                  </Box>
                </Box>

                {/* 로또 번호 */}
                {homonym.numbers && homonym.numbers.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      🎯 연결된 로또번호:
                    </Typography>
                    <Box>
                      {homonym.numbers.map((number, idx) => (
                        <NumberChip
                          key={idx}
                          label={number}
                          size="small"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </HomonymCard>
          ))}
        </AnimatePresence>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={handleClose}
          variant="outlined"
          sx={{ borderRadius: '20px', mr: 1 }}
        >
          취소
        </Button>
        <Button
          onClick={handleSelect}
          disabled={!selectedMeaning}
          variant="contained"
          sx={{
            borderRadius: '20px',
            background: selectedMeaning 
              ? 'linear-gradient(45deg, #667eea, #764ba2)' 
              : undefined
          }}
        >
          선택 완료
        </Button>
      </DialogActions>
    </StyledDialog>
  );
}

export default HomonymSelector;