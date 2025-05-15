import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Stack, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';

interface LoginProps {
  onLogin: (token: string) => void;
}

const StyledTextField = styled(TextField)({
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
    fontSize: '1rem',
    padding: '14px 16px'
  }
});

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();
      onLogin(data.access_token);
    } catch (e) {
      setError('Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F0F5F9',
        p: 3,
        fontFamily: 'Nunito, sans-serif',
      }}
    >
      <Paper
        sx={{
          display: 'flex',
          maxWidth: 800,
          width: '100%',
          overflow: 'hidden',
          borderRadius: 3,
          bgcolor: '#FFFFFF',
          border: '1px solid #C9D6DF',
          boxShadow: '0 4px 6px -1px rgba(30, 32, 34, 0.1)',
        }}
      >
        {/* Left side with information */}
        <Box
          sx={{
            flex: 1,
            p: 6,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
            background: 'linear-gradient(135deg, #1E2022 0%, #34373b 50%, #52616B 100%)',
            color: '#FFFFFF',
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 3,
              }}
            >
              {/* <Box
                component="img"
                src="/assets/images/ai-nanba-logo.png"
                sx={{ 
                  width: 'auto',
                  height: '40px'
                }}
                alt="AI Nanba Logo"
              /> */}
              <Typography
                variant="h3"
                sx={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  fontFamily: 'Nunito, sans-serif',
                  textAlign: 'center',
                }}
              >
                AI Nanba
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: '1rem',
                mb: 4,
                fontFamily: 'Nunito, sans-serif',
                color: '#F0F5F9',
              }}
            >
              Your intelligent AI chatbot companion. Experience smarter conversations with context-aware assistance at every interaction.
            </Typography>
            <Typography
              component="div"
              sx={{
                fontFamily: 'Nunito, sans-serif',
                color: '#e1e4e6',
                '& > div': {
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  '&:before': {
                    content: '"•"',
                    mr: 2,
                    color: '#C9D6DF',
                  }
                }
              }}
            >
              <div>Natural language understanding</div>
              <div>Context-aware responses</div>
              <div>Multi-turn conversations</div>
              <div>Real-time assistance</div>
            </Typography>
          </Box>
        </Box>

        {/* Right side with login form */}
        <Box sx={{ flex: 1, p: 6, bgcolor: '#FFFFFF' }}>
          <Typography 
            variant="h5"
            sx={{ 
              color: '#1E2022',
              fontWeight: 600,
              mb: 4,
              textAlign: 'center',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            Sign in to your account
          </Typography>

          <Stack spacing={3}>
            {error && (
              <Alert 
                severity="error"
                sx={{
                  bgcolor: 'rgba(30, 32, 34, 0.1)',
                  color: '#1E2022',
                  '& .MuiAlert-icon': {
                    color: '#1E2022',
                  },
                  borderRadius: 2,
                }}
              >
                {error}
              </Alert>
            )}
            
            <StyledTextField
              label="Email address"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              fullWidth
              sx={{
                '& .MuiAlert-message': {
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '1rem'
                }
              }}
            />
            
            <StyledTextField
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              fullWidth
              sx={{
                '& .MuiAlert-message': {
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '1rem'
                }
              }}
            />

            <Button
              variant="contained"
              onClick={handleLogin}
              disabled={loading || !username || !password}
              sx={{
                backgroundColor: '#1E2022',
                color: '#F0F5F9',
                py: 1.5,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                fontFamily: 'Nunito, sans-serif',
                borderRadius: '8px',
                width: '100%',
                '&:hover': {
                  backgroundColor: '#34373b'
                },
                '&.Mui-disabled': {
                  backgroundColor: '#C9D6DF',
                  color: '#788189'
                }
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;