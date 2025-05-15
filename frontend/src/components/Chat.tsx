import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Stack, Alert } from '@mui/material';

interface Message {
  role: 'user' | 'agent';
  text: string;
}

interface ChatProps {
  token: string;
}

const Chat: React.FC<ChatProps> = ({ token }) => {
  const [customerId, setCustomerId] = useState('');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!customerId || !question) return;
    setMessages((msgs) => [...msgs, { role: 'user', text: question }]);
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ customer_id: customerId, question }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setMessages((msgs) => [...msgs, { role: 'agent', text: data.answer }]);
    } catch (e) {
      setMessages((msgs) => [...msgs, { role: 'agent', text: 'Error: Could not get answer.' }]);
      setError('Failed to get answer from server.');
    }
    setLoading(false);
    setQuestion('');
  };

  return (
    <Box sx={{ 
      height: 'calc(100vh - 140px)', 
      display: 'flex', 
      flexDirection: 'column',
      width: '100%',
      position: 'relative'
    }}>
      <Stack spacing={2} mb={2} direction="row">
        <TextField 
          label="Customer ID" 
          value={customerId} 
          onChange={e => setCustomerId(e.target.value)} 
          size="small"
          sx={{
            maxWidth: '200px',
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              '& fieldset': {
                borderColor: '#C9D6DF'
              },
              '&:hover fieldset': {
                borderColor: '#788189'
              },
              '&.Mui-focused fieldset': {
                borderColor: '#52616B'
              }
            },
            '& .MuiInputLabel-root': {
              color: '#52616B',
              fontFamily: 'Nunito, sans-serif',
              fontSize: '1rem',
              '&.Mui-focused': {
                color: '#1E2022'
              }
            },
            '& .MuiOutlinedInput-input': {
              color: '#1E2022',
              fontFamily: 'Nunito, sans-serif',
              fontSize: '1rem'
            }
          }}
        />
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper 
        variant="outlined" 
        sx={{ 
          flexGrow: 1,
          mb: 2, 
          p: 3,
          overflowY: 'auto',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          width: '100%'
        }}
      >
        {messages.length === 0 && (
          <Typography 
            color="text.secondary"
            sx={{ 
              textAlign: 'center',
              fontFamily: 'Nunito, sans-serif',
              fontSize: '1.1rem',
              color: '#6B7280'  // Matching the placeholder color
            }}
          >
            Start a conversation by asking a question.
          </Typography>
        )}
        {messages.map((msg, i) => (
          <Box 
            key={i} 
            sx={{ 
              mb: 2,
              p: 2,
              backgroundColor: msg.role === 'user' ? '#f0f7ff' : '#ffffff',
              borderRadius: '8px',
              maxWidth: '80%',
              ml: msg.role === 'user' ? 'auto' : 0,
              border: '1px solid',
              borderColor: msg.role === 'user' ? '#e3f2fd' : '#f0f2f5',
            }}
          >
            <Typography 
              variant="subtitle2" 
              sx={{
                color: msg.role === 'user' ? '#1976d2' : '#333333',
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 600,
                mb: 1
              }}
            >
              {msg.role === 'user' ? 'You' : 'AI Nanba'}
            </Typography>
            <Typography sx={{ 
              color: '#1e1e1e',
              fontFamily: 'Nunito, sans-serif',
              lineHeight: 1.6
            }}>
              {msg.text}
            </Typography>
          </Box>
        ))}
      </Paper>
      <Box 
        sx={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 0',
          backgroundColor: '#F0F5F9',
          borderTop: '1px solid #e5e5e5',
          width: '100%'
        }}
      >
        <Stack 
          direction="row" 
          spacing={2}
          sx={{
            backgroundColor: '#ffffff',
            p: '8px 16px',
            borderRadius: '12px',
            border: '1px solid #e5e5e5',
            width: '100%',
            maxWidth: '100%',
            margin: '0 auto',
            alignItems: 'flex-end'
          }}
        >
          <TextField
            placeholder="Ask Anything"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            fullWidth
            multiline
            maxRows={4}
            disabled={loading}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#ffffff',
                '& fieldset': {
                  borderColor: 'transparent'
                },
                '&:hover fieldset': {
                  borderColor: 'transparent'
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'transparent'
                }
              },
              '& .MuiOutlinedInput-input': {
                color: '#1E2022',
                lineHeight: '1.5',
                minHeight: '24px',
                fontFamily: 'Nunito, sans-serif',
                fontSize: '1.1rem',
                '&::placeholder': {
                  color: '#6B7280',
                  opacity: 1,
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '1.1rem'
                }
              }
            }}
          />
          <Button 
            variant="contained" 
            onClick={handleSend} 
            disabled={loading || !question || !customerId}
            sx={{
              backgroundColor: '#1E2022',
              color: '#F0F5F9',
              minWidth: '40px',
              width: '40px',
              height: '40px',
              padding: 0,
              borderRadius: '8px',
              flexShrink: 0,
              marginBottom: '5px',
              '&:hover': {
                backgroundColor: '#34373b'
              },
              '&.Mui-disabled': {
                backgroundColor: '#C9D6DF',
                color: '#788189',
                marginBottom: '5px',
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default Chat;