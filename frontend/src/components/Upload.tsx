import React, { useState } from 'react';
import { Box, TextField, Button, Typography, LinearProgress, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';

interface UploadProps {
  token: string;
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
    '&.Mui-focused': {
      color: '#1E2022'
    }
  },
  '& .MuiOutlinedInput-input': {
    color: '#1E2022'
  }
});

const Upload: React.FC<UploadProps> = ({ token }) => {
  const [customerId, setCustomerId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    if (!customerId || !file) return;
    setLoading(true);
    setStatus('');
    setError('');
    const formData = new FormData();
    formData.append('customer_id', customerId);
    formData.append('file', file);
    try {
      const res = await fetch('/ingest?customer_id=' + encodeURIComponent(customerId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setStatus(data.status || 'Upload complete.');
    } catch (e) {
      setStatus('');
      setError('Error: Could not upload file.');
    }
    setLoading(false);
    setFile(null);
  };

  return (
    <Box sx={{ 
      height: '100%',
      backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      p: 3,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }}>
      <Typography 
        variant="h6" 
        sx={{ 
          color: '#1E2022',
          fontWeight: 600,
          fontFamily: 'Nunito, sans-serif',
          fontSize: '1.1rem'
        }}
      >
        Upload Documents
      </Typography>

      <StyledTextField
        label="Customer ID"
        value={customerId}
        onChange={e => setCustomerId(e.target.value)}
        size="small"
        fullWidth
        sx={{
          '& .MuiOutlinedInput-input': {
            fontFamily: 'Nunito, sans-serif',
            fontSize: '1rem'
          },
          '& .MuiInputLabel-root': {
            fontFamily: 'Nunito, sans-serif',
            fontSize: '1rem'
          }
        }}
      />

      <Box sx={{ 
        display: 'flex',
        gap: 2,
        flexWrap: 'wrap'
      }}>
        <Button
          variant="outlined"
          component="label"
          sx={{
            borderColor: '#1E2022',
            color: '#1E2022',
            fontFamily: 'Nunito, sans-serif',
            fontSize: '1rem',
            textTransform: 'none',
            '&:hover': {
              borderColor: '#34373b',
              backgroundColor: '#F0F5F9'
            }
          }}
        >
          Select File
          <input type="file" hidden onChange={e => setFile(e.target.files?.[0] || null)} />
        </Button>

        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={loading || !file || !customerId}
          sx={{
            backgroundColor: '#1E2022',
            color: '#F0F5F9',
            fontFamily: 'Nunito, sans-serif',
            fontSize: '1rem',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#34373b'
            },
            '&.Mui-disabled': {
              backgroundColor: '#C9D6DF',
              color: '#788189'
            }
          }}
        >
          Upload
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ borderRadius: 1 }} />}
      
      {file && (
        <Typography sx={{ 
          color: '#52616B',
          fontFamily: 'Nunito, sans-serif',
          fontSize: '1.1rem'
        }}>
          Selected: {file.name}
        </Typography>
      )}

      {status && (
        <Alert 
          severity="success"
          sx={{
            backgroundColor: 'rgba(82, 97, 107, 0.1)',
            color: '#52616B',
            '& .MuiAlert-icon': {
              color: '#52616B'
            },
            '& .MuiAlert-message': {
              fontFamily: 'Nunito, sans-serif',
              fontSize: '1.1rem'
            }
          }}
        >
          {status}
        </Alert>
      )}

      {error && (
        <Alert 
          severity="error"
          sx={{
            backgroundColor: 'rgba(30, 32, 34, 0.1)',
            color: '#1E2022',
            '& .MuiAlert-icon': {
              color: '#1E2022'
            },
            '& .MuiAlert-message': {
              fontFamily: 'Nunito, sans-serif',
              fontSize: '1.1rem'
            }
          }}
        >
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default Upload;