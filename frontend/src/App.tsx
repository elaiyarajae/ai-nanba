import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Box, Container, IconButton } from '@mui/material';
import { Logout as LogoutIcon, ChevronLeft, ChevronRight } from '@mui/icons-material';
import Chat from './components/Chat.tsx';
import Upload from './components/Upload.tsx';
import Login from './components/Login.tsx';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('jwt_token'));
  const [isUploadVisible, setIsUploadVisible] = useState(true);

  const handleLogin = (jwt: string) => {
    setToken(jwt);
    localStorage.setItem('jwt_token', jwt);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('jwt_token');
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh', 
      backgroundColor: '#F0F5F9'
    }}>
      <AppBar position="static" sx={{ 
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #C9D6DF',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
      }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 700,
            fontFamily: 'Nunito, sans-serif',
            color: '#1E2022'
          }}>
            AI Nanba
          </Typography>
          <IconButton 
            color="inherit" 
            onClick={handleLogout} 
            aria-label="logout"
            sx={{ color: '#1E2022' }}
          >
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box sx={{ 
        display: 'flex', 
        flexGrow: 1, 
        position: 'relative',
        '@media (max-width: 900px)': {
          flexDirection: 'column'
        }
      }}>
        {/* Fixed Sidebar */}
        <Box sx={{ 
          width: '320px',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #C9D6DF',
          height: 'calc(100vh - 64px)', // Subtract AppBar height
          overflow: 'auto',
          '@media (max-width: 900px)': {
            width: '100%',
            height: 'auto',
            borderRight: 'none',
            borderBottom: '1px solid #C9D6DF'
          }
        }}>
          <Upload token={token} />
        </Box>

        {/* Main Chat Area */}
        <Box sx={{ 
          flex: 1,
          minWidth: 0,
          p: 3,
          backgroundColor: '#F0F5F9'
        }}>
          <Chat token={token} />
        </Box>
      </Box>
    </Box>
  );
}

export default App;