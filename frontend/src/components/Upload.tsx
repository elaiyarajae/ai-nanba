import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Alert, 
  Select, 
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  CircularProgress,
  TextField
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Product } from './Products';

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

interface ProcessingStatus {
  step: string;
  status: string;
  progress: number;
  estimatedTime?: string;
  details?: {
    chunks?: number;
    currentChunk?: number;
    totalChunks?: number;
  };
}

const Upload: React.FC<UploadProps> = ({ token }) => {
  const [products, setProducts] = useState<Product[]>([]);
  
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

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [productId, setProductId] = useState('');
  
  const [activeStep, setActiveStep] = useState(0);
  const [processingStep, setProcessingStep] = useState(-1);
  const [processingStatus, setProcessingStatus] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const steps = [
    {
      label: 'Select Product',
      description: 'Choose a product to upload documents for'
    },
    {
      label: 'Choose File',
      description: 'Select the document you want to process'
    },
    {
      label: 'Processing',
      description: 'Document analysis and indexing'
    },
    {
      label: 'Complete',
      description: 'Document successfully processed'
    }
  ];

  const processingSteps = [
    {
      label: 'Text Extraction',
      description: 'Reading and extracting content from document',
    },
    {
      label: 'Text Analysis',
      description: 'Breaking down content into meaningful chunks',
    },
    {
      label: 'AI Processing',
      description: 'Generating AI-readable format',
    },
    {
      label: 'Indexing',
      description: 'Making content searchable',
    }
  ];

  const handleNext = () => {
    if (activeStep === 0 && !productId) return;
    if (activeStep === 1 && !file) return;
    if (activeStep === 2) return;
    setActiveStep((prev) => prev + 1);
  };

  const handleUpload = async () => {
    setActiveStep(2);
    setProcessingStep(0);
    setLoading(true);
    setStatus('');
    setError('');
    setCompletedSteps([]);
  
    const formData = new FormData();
    formData.append('file', file!);
    formData.append('product_id', productId);
  
    try {
      const res = await fetch('/ingest?product_id=' + encodeURIComponent(productId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
  
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'API error');
      }

      // For non-streaming response, complete all steps
      if (!res.body) {
        for (let i = 0; i < processingSteps.length; i++) {
          setProcessingStep(i);
          setProcessingStatus(`${processingSteps[i].label} completed`);
          setCompletedSteps(prev => [...prev, i]);
          // Simulate some processing time
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        setActiveStep(3);
        setStatus('Document successfully processed and ready for use');
        return;
      }
      
      // Handle streaming response
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
  
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // Ensure we move to completion step when done
          setActiveStep(3);
          setStatus('Document successfully processed and ready for use');
          break;
        }
  
        try {
          const chunk = decoder.decode(value);
          const status: ProcessingStatus = JSON.parse(chunk);
  
          switch (status.step) {
            case 'text_extraction':
              setProcessingStep(0);
              setProcessingStatus(`Extracting text (${status.progress}%)`);
              if (status.progress === 100) {
                setCompletedSteps(prev => Array.from(new Set([...prev, 0])));
              }
              break;
            case 'text_chunking':
              setProcessingStep(1);
              setProcessingStatus(
                `Processing chunks ${status.details?.currentChunk || 0}/${status.details?.totalChunks || 0}`
              );
              if (status.progress === 100) {
                setCompletedSteps(prev => Array.from(new Set([...prev, 1])));
              }
              break;
            case 'embedding':
              setProcessingStep(2);
              setProcessingStatus(`Generating AI format (${status.progress}%)`);
              if (status.progress === 100) {
                setCompletedSteps(prev => Array.from(new Set([...prev, 2])));
              }
              break;
            case 'vector_storage':
              setProcessingStep(3);
              setProcessingStatus(`Finalizing (${status.progress}%)`);
              if (status.progress === 100) {
                setCompletedSteps(prev => Array.from(new Set([...prev, 3])));
                setActiveStep(3); // Move to completion step
              }
              break;
            case 'error':
              setError(status.status);
              break;
          }
  
          if (status.estimatedTime) {
            setEstimatedTime(status.estimatedTime);
          }
        } catch (parseError) {
          console.error('Error parsing stream:', parseError);
          setError('Error: Invalid response format');
          break;
        }
      }
    } catch (e) {
      setError(`Error: ${e instanceof Error ? e.message : 'Could not process file'}`);
    } finally {
      setLoading(false);
    }
};

  // Add handleBack function
  const handleBack = () => {
    if (loading) return;
    setActiveStep((prev) => prev - 1);
    if (activeStep === 2) {
      setProcessingStep(-1);
      setProcessingStatus('');
      setEstimatedTime('');
      setCompletedSteps([]);
    }
  };

  // Add handleReset function
  const handleReset = () => {
    setActiveStep(0);
    setProcessingStep(-1);
    setFile(null);
    setStatus('');
    setError('');
    setCompletedSteps([]);
    setProcessingStatus('');
    setEstimatedTime('');
    setProductId('');
  };

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label} completed={completedSteps.includes(index)}>
            <StepLabel>
              <Typography sx={{ 
                fontFamily: 'Nunito, sans-serif', 
                fontWeight: 600,
                color: '#1E2022'
              }}>
                {step.label}
              </Typography>
            </StepLabel>
            <StepContent>
              <Typography sx={{ 
                color: '#52616B',
                fontFamily: 'Nunito, sans-serif'
              }}>
                {step.description}
              </Typography>

              {index === 0 && (
                <Box sx={{ mt: 2 }}>
                  <Select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    displayEmpty
                    fullWidth
                    sx={{
                      backgroundColor: '#FFFFFF',
                      fontFamily: 'Nunito, sans-serif',
                      '& .MuiSelect-select': {
                        fontFamily: 'Nunito, sans-serif'
                      }
                    }}
                  >
                    <MenuItem value="" disabled>Select a Product</MenuItem>
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
                </Box>
              )}
              {index === 1 && (
                <Box sx={{ mt: 2 }}>
                  <input
                    accept=".pdf,.txt,.docx"
                    style={{ display: 'none' }}
                    id="raised-button-file"
                    type="file"
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0];
                      if (selectedFile) {
                        setFile(selectedFile);
                      }
                    }}
                  />
                  <label htmlFor="raised-button-file">
                    <Button
                      variant="contained"
                      component="span"
                      sx={{
                        backgroundColor: '#1E2022',
                        '&:hover': {
                          backgroundColor: '#34373b'
                        },
                        fontFamily: 'Nunito, sans-serif',
                        textTransform: 'none'
                      }}
                    >
                      Choose File
                    </Button>
                  </label>
                  {file && (
                    <Typography sx={{ mt: 2, fontFamily: 'Nunito, sans-serif' }}>
                      Selected file: {file.name}
                    </Typography>
                  )}
                </Box>
              )}
              {index === 2 && (
                <Box sx={{ mt: 2 }}>
                  {processingSteps.map((step, stepIndex) => (
                    <Box
                      key={step.label}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        mb: 2,
                        opacity: processingStep >= stepIndex || completedSteps.includes(stepIndex) ? 1 : 0.5
                      }}
                    >
                      {processingStep === stepIndex && loading ? (
                        <CircularProgress size={20} sx={{ mr: 2, color: '#1E2022' }} />
                      ) : (
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            backgroundColor: completedSteps.includes(stepIndex) ? '#1E2022' : '#C9D6DF',
                            mr: 2,
                            mt: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            fontSize: '12px'
                          }}
                        >
                          {completedSteps.includes(stepIndex) && '✓'}
                        </Box>
                      )}
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ 
                          fontWeight: 600,
                          fontFamily: 'Nunito, sans-serif',
                          color: '#1E2022'
                        }}>
                          {step.label}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: '#52616B',
                          fontFamily: 'Nunito, sans-serif'
                        }}>
                          {step.description}
                        </Typography>
                        {(processingStep === stepIndex || completedSteps.includes(stepIndex)) && (
                          <>
                            {estimatedTime && processingStep === stepIndex && (
                              <Typography variant="caption" sx={{ 
                                color: '#788189',
                                fontFamily: 'Nunito, sans-serif',
                                display: 'block',
                                mt: 0.5
                              }}>
                                Estimated time: {estimatedTime}
                              </Typography>
                            )}
                            <Typography variant="body2" sx={{ 
                              color: '#1E2022',
                              fontFamily: 'Nunito, sans-serif',
                              fontWeight: 500,
                              mt: 1
                            }}>
                              {completedSteps.includes(stepIndex) ? 'Completed' : processingStatus}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}

              {index === 3 && (
                <Box sx={{ mt: 2 }}>
                  <Alert 
                    severity="success"
                    sx={{ 
                      mb: 2,
                      fontFamily: 'Nunito, sans-serif',
                      '& .MuiAlert-message': {
                        fontFamily: 'Nunito, sans-serif'
                      }
                    }}
                  >
                    {status || 'Document processing completed successfully!'}
                  </Alert>
                  <Button
                    onClick={handleReset}
                    variant="contained"
                    sx={{
                      backgroundColor: '#1E2022',
                      color: '#F0F5F9',
                      fontFamily: 'Nunito, sans-serif',
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: '#34373b'
                      }
                    }}
                  >
                    Process Another Document
                  </Button>
                </Box>
              )}

              <Box sx={{ mb: 2, mt: 2 }}>
                {index < 3 && (
                  <>
                    <Button
                      variant="contained"
                      onClick={index === 2 ? handleUpload : handleNext}
                      disabled={
                        (index === 0 && !productId) ||
                        (index === 1 && !file) ||
                        loading
                      }
                      sx={{
                        mr: 1,
                        backgroundColor: '#1E2022',
                        color: '#F0F5F9',
                        fontFamily: 'Nunito, sans-serif',
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
                      {index === 2 ? 'Start Processing' : 'Continue'}
                    </Button>
                    {index > 0 && (
                      <Button
                        onClick={handleBack}
                        disabled={loading}
                        sx={{
                          color: '#52616B',
                          fontFamily: 'Nunito, sans-serif',
                          textTransform: 'none',
                          '&:hover': {
                            backgroundColor: '#F0F5F9'
                          }
                        }}
                      >
                        Back
                      </Button>
                    )}
                  </>
                )}
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mt: 2,
            fontFamily: 'Nunito, sans-serif'
          }}
        >
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default Upload;
