import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Typography, Paper, Stack, Alert, Select, MenuItem } from '@mui/material';
import { Product } from './Products'; 

interface Message {
  role: 'user' | 'agent';
  text: string;
}

interface ChatProps {
  token: string;
}

const Chat: React.FC<ChatProps> = ({ token }) => {
  const [productId, setProductId] = useState(''); 
  const [products, setProducts] = useState<Product[]>([]);
  const [username, setUsername] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/products', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setProducts(data.products);
      } catch (err) {
        console.error('Failed to fetch products');
      }
    };
    fetchProducts();
  }, [token]);

  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const scrollHeight = messagesContainerRef.current.scrollHeight;
      const height = messagesContainerRef.current.clientHeight;
      const maxScrollTop = scrollHeight - height;
      messagesContainerRef.current.scrollTo({
        top: maxScrollTop,
        behavior: 'smooth'
      });
    }
  };

  const scrollToNewMessage = () => {
    if (messagesContainerRef.current) {
      const lastMessage = messagesContainerRef.current.lastElementChild?.lastElementChild;
      if (lastMessage) {
        const containerTop = messagesContainerRef.current.getBoundingClientRect().top;
        const messageTop = lastMessage.getBoundingClientRect().top;
        const offset = messageTop - containerTop - 20; // 20px padding from top
        
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollTop + offset,
          behavior: 'smooth'
        });
      }
    }
  };

  useEffect(() => {
    // Small delay to ensure DOM is updated
    setTimeout(scrollToNewMessage, 100);
  }, [messages, loading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async () => {
    if (!productId || !question) return;
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
        body: JSON.stringify({ product_id: productId, question }),
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
      position: 'relative',
    }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box 
        ref={messagesContainerRef}
        sx={{ 
          flexGrow: 1,
          overflowY: 'auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          pb: '100px',
          scrollBehavior: 'smooth'
        }}
      >
        {messages.length === 0 && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 2,
            py: 8
          }}>
            <Typography 
              variant="h4"
              sx={{ 
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 700,
                color: '#1E2022'
              }}
            >
              AI Nanba
            </Typography>
            <Typography 
              color="text.secondary"
              sx={{ 
                textAlign: 'center',
                fontFamily: 'Nunito, sans-serif',
                fontSize: '1.1rem',
                color: '#6B7280'
              }}
            >
              Your intelligent AI assistant. Select a product and start asking questions.
            </Typography>
          </Box>
        )}
        <Box sx={{ maxWidth: '64rem', width: '100%', margin: '0 auto', px: 2 }}>
          {messages.map((msg, i) => (
            <Box 
              key={i} 
              sx={{ 
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                mb: 2,
                px: 2
              }}
            >
              <Box
                sx={{
                  maxWidth: '85%',
                  backgroundColor: msg.role === 'user' ? '#34373b' : '#ffffff',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  position: 'relative',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                }}
              >
                <Typography 
                  variant="subtitle2" 
                  sx={{
                    color: msg.role === 'user' ? '#ffffff' : '#1a73e8',
                    fontFamily: 'Nunito, sans-serif',
                    fontWeight: 600,
                    mb: 0.5
                  }}
                >
                  {msg.role === 'user' ? username : 'AI Nanba'}
                </Typography>
                <Typography sx={{ 
                  color: msg.role === 'user' ? '#ffffff' : '#202124',
                  fontFamily: 'Nunito, sans-serif',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.text}
                </Typography>
              </Box>
            </Box>
          ))}
          {loading && (
            <Box 
              sx={{ 
                display: 'flex',
                justifyContent: 'flex-start',
                mb: 2,
                px: 2
              }}
            >
              <Box
                sx={{
                  maxWidth: '85%',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  position: 'relative',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                }}
              >
                <Typography 
                  variant="subtitle2" 
                  sx={{
                    color: '#1a73e8',
                    fontFamily: 'Nunito, sans-serif',
                    fontWeight: 600,
                    mb: 0.5
                  }}
                >
                  AI Nanba
                </Typography>
                <Typography sx={{ 
                  color: '#202124',
                  fontFamily: 'Nunito, sans-serif',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  Thinking
                  <Box 
                    component="span" 
                    sx={{ 
                      display: 'inline-flex',
                      fontSize: '24px', 
                      lineHeight: '16px', 
                      marginTop: '-4px', 
                      '@keyframes dots': {
                        '0%, 20%': { content: '"."' },
                        '40%': { content: '".."' },
                        '60%, 100%': { content: '"..."' }
                      },
                      '&::after': {
                        content: '"."',
                        animation: 'dots 1.5s infinite'
                      }
                    }}
                  />
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
      <Box 
        sx={{
          position: 'relative',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '1rem',
          background: 'linear-gradient(180deg, rgba(240,242,245,0) 0%, #f0f2f5 50%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'left 0.3s ease',
          zIndex: 1000,
          '@media (min-width: 600px)': {
            left: 0
          }
        }}
      >
        <Box
          sx={{
            maxWidth: '64rem',
            width: '100%',
            position: 'relative'
          }}
        >
          <Stack 
            direction="row" 
            spacing={1}
            alignItems="center"
            sx={{
              backgroundColor: '#ffffff',
              p: '8px 12px',
              borderRadius: '24px',
              border: '1px solid #e5e5e5',
              width: '100%',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <Select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              displayEmpty
              size="small"
              sx={{
                minWidth: 150,
                '& .MuiOutlinedInput-notchedOutline': {
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '0.9rem',
                  border: 'none'
                },
                '& .MuiSelect-select': {
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '0.9rem',
                  py: 1,
                  pr: 3
                }
              }}
            >
              <MenuItem value="" sx={{ fontFamily: 'Nunito, sans-serif'}} disabled>Select Product</MenuItem>
              {products.map((product) => (
                <MenuItem 
                  key={product.id} 
                  value={product.id}
                  sx={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  {product.name}
                </MenuItem>
              ))}
            </Select>
            <TextField
              placeholder="Ask anything..."
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
                  backgroundColor: 'transparent',
                  '& fieldset': {
                    border: 'none'
                  }
                },
                '& .MuiOutlinedInput-input': {
                  color: '#202124',
                  lineHeight: '1.5',
                  minHeight: '24px',
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '1rem',
                  padding: '8px 0',
                  '&::placeholder': {
                    color: '#5f6368',
                    opacity: 1
                  }
                }
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button 
                variant="contained" 
                onClick={handleSend} 
                disabled={loading || !question || !productId}
                sx={{
                  minWidth: '40px',
                  width: '40px',
                  height: '40px',
                  padding: 0,
                  borderRadius: '50%',
                  backgroundColor: '#202124',
                  '&:hover': {
                    backgroundColor: '#3c4043'
                  },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
            </Box>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default Chat;