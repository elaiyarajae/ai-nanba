import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton } from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
import Chat from './components/Chat.tsx';
import Upload from './components/Upload.tsx';
import Login from './components/Login.tsx';
import Sidebar from './components/Sidebar.tsx';
import Products from './components/Products.tsx';  // Rename import but keep file name for now

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('jwt_token'));
  const [currentRoute, setCurrentRoute] = useState('chat');
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (token) {
      const parseJwt = (token: string) => {
        try {
          return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
          return null;
        }
      };
      const formatToCamelCase = (name: string) => {
        return name
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join('');
      };
      const tokenData = parseJwt(token);
      if (tokenData && tokenData.identity) {
        setUsername(formatToCamelCase(tokenData.identity));
      }
    }
  }, [token]);

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ 
              fontFamily: 'Nunito, sans-serif',
              color: '#1E2022',
              fontWeight: 600
            }}>
              {username || 'User'}
            </Typography>
            <IconButton 
              onClick={handleLogout}
              sx={{ 
                color: '#1E2022',
                '&:hover': {
                  backgroundColor: 'rgba(30, 32, 34, 0.04)'
                }
              }}
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Box sx={{ 
        display: 'flex', 
        flexGrow: 1, 
        position: 'relative'
      }}>
        <Sidebar 
          onNavigate={setCurrentRoute}
          currentRoute={currentRoute}
        />
        <Box sx={{ 
          flex: 1,
          minWidth: 0,
          p: 3,
          backgroundColor: '#F0F5F9'
        }}>
          {currentRoute === 'chat' && <Chat token={token} />}
          {currentRoute === 'upload' && <Upload token={token} />}
          {currentRoute === 'settings' && <Products token={token} />}
        </Box>
      </Box>
    </Box>
  );
}

export default App;