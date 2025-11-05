import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button
} from '@mui/material';
import { MenuBook } from '@mui/icons-material';

function DictionaryPage() {
  const [consonants, setConsonants] = useState([]);
  const [selectedConsonant, setSelectedConsonant] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadConsonants = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/dictionary/consonants');
        const data = await response.json();

        if (data.success) {
          setConsonants(data.consonants);
        } else {
          setError('초성 목록을 불러오는데 실패했습니다.');
        }
      } catch (err) {
        setError('서버 연결에 실패했습니다.');
      }
    };

    loadConsonants();
  }, []);

  const loadKeywordsByConsonant = async (consonant) => {
    setLoading(true);
    setError('');
    setSelectedConsonant(consonant);

    try {
      const response = await fetch(`http://localhost:3000/api/dictionary/consonant/${consonant}`);
      const data = await response.json();

      if (data.success) {
        setKeywords(data.keywords);
      } else {
        setError('키워드를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('키워드를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4, mb: 4, textAlign: 'center', borderRadius: '20px' }}>
        <MenuBook sx={{ fontSize: 60, color: '#667eea', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom>
          📖 꿈사전 찾기
        </Typography>
        <Typography variant="h6" color="textSecondary">
          초성을 선택하여 꿈 키워드를 찾아보세요
        </Typography>
      </Paper>

      {error && (
        <Paper sx={{ p: 2, mb: 3, backgroundColor: '#ffebee', borderRadius: '10px' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      <Paper sx={{ p: 3, mb: 4, borderRadius: '15px' }}>
        <Typography variant="h5" gutterBottom>
          🔤 초성 선택
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {consonants.map((item) => (
            <Button
              key={item.consonant}
              variant={selectedConsonant === item.consonant ? 'contained' : 'outlined'}
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

      {loading && (
        <Box textAlign="center" my={4}>
          <Typography variant="body2" color="textSecondary">
            키워드를 불러오는 중... ⏳
          </Typography>
        </Box>
      )}

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
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                  {keyword.keyword}
                </Typography>
                <Box color="#ffd700" fontSize="16px">
                  {keyword.stars}
                </Box>
              </Box>

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

export default DictionaryPage;
