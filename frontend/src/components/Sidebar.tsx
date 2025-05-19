import React, { useState } from 'react';
import { Box, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { 
  Chat as ChatIcon,
  Upload as UploadIcon,
  Inventory as InventoryIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';

interface SidebarProps {
  onNavigate: (route: string) => void;
  currentRoute: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, currentRoute }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const menuItems = [
    { route: 'chat', label: 'Chat', icon: <ChatIcon /> },
    { route: 'upload', label: 'Upload', icon: <UploadIcon /> },
    { route: 'settings', label: 'Products', icon: <InventoryIcon /> }
  ];

  return (
    <Box
      sx={{
        width: isExpanded ? '240px' : '64px',
        transition: 'width 0.3s ease',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #C9D6DF',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      <List sx={{ p: 1 }}>
        {menuItems.map(({ route, label, icon }) => (
          <Tooltip 
            key={route} 
            title={!isExpanded ? label : ''} 
            placement="right"
          >
            <ListItemButton
              selected={currentRoute === route}
              onClick={() => onNavigate(route)}
              sx={{
                borderRadius: '8px',
                mb: 1,
                '&.Mui-selected': {
                  backgroundColor: '#1E2022',
                  color: '#FFFFFF',
                  '&:hover': {
                    backgroundColor: '#34373b',
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#FFFFFF',
                  }
                },
                '&:hover': {
                  backgroundColor: '#F0F5F9',
                }
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: isExpanded ? 40 : 24,
                color: currentRoute === route ? '#FFFFFF' : '#1E2022'
              }}>
                {icon}
              </ListItemIcon>
              {isExpanded && (
                <ListItemText 
                  primary={label}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontFamily: 'Nunito, sans-serif',
                      fontWeight: 500
                    }
                  }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        ))}
      </List>
      <IconButton
        onClick={() => setIsExpanded(!isExpanded)}
        sx={{
          position: 'absolute',
          right: '-12px',
          top: '20px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #C9D6DF',
          width: '24px',
          height: '24px',
          zIndex: 1,
          '&:hover': {
            backgroundColor: '#F0F5F9',
          }
        }}
      >
        {isExpanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
      </IconButton>
    </Box>
  );
};

export default Sidebar;