import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Stack, 
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Drawer,
  Modal
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, Delete as DeleteIcon } from '@mui/icons-material';

export interface Product {
  id: string;
  name: string;
  description: string;
}

interface ProductsProps {
  token: string;
}

const Products: React.FC<ProductsProps> = ({ token }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProducts = async () => {
    try {
      const response = await fetch('/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch products');
      }
      
      const data = await response.json();
      setProducts(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    }
};

const handleCreateProduct = async () => {
    try {
      const response = await fetch('/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: productName,
          description: productDescription
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create product');
      }

      const data = await response.json();
      setProducts(prev => [...prev, data.product]);
      setSuccess('Product created successfully');
      setProductName('');
      setProductDescription('');
      setIsDrawerOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    }
};

  useEffect(() => {
    fetchProducts();
  }, [token]);

  const handleDeleteProduct = async (productId: string) => {
    try {
      const response = await fetch(`/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete product');
      }

      setProducts(prev => prev.filter(product => product.id !== productId));
      setSuccess('Product deleted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}
      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 2 }}
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      )}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3 
      }}>
        <Typography variant="h5" sx={{ 
          color: '#1E2022',
          fontFamily: 'Nunito, sans-serif',
          fontWeight: 600
        }}>
          Products
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsDrawerOpen(true)}
          sx={{
            backgroundColor: '#1E2022',
            '&:hover': {
              backgroundColor: '#34373b'
            },
            fontFamily: 'Nunito, sans-serif',
            textTransform: 'none'
          }}
        >
          Add Product
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ 
        borderRadius: 2,
        boxShadow: 'none',
        border: '1px solid #C9D6DF'
      }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#F0F5F9' }}>
              <TableCell sx={{ 
                fontWeight: 600, 
                color: '#1E2022',
                fontFamily: 'Nunito, sans-serif'
              }}>Name</TableCell>
              <TableCell sx={{ 
                fontWeight: 600, 
                color: '#1E2022',
                fontFamily: 'Nunito, sans-serif'
              }}>Description</TableCell>
              <TableCell sx={{ 
                fontWeight: 600, 
                color: '#1E2022',
                fontFamily: 'Nunito, sans-serif',
                width: '100px'
              }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell sx={{ fontFamily: 'Nunito, sans-serif' }}>{product.name}</TableCell>
                <TableCell sx={{ fontFamily: 'Nunito, sans-serif' }}>{product.description}</TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleDeleteProduct(product.id)}
                    sx={{
                      color: '#ef4444',
                      '&:hover': {
                        backgroundColor: 'rgba(239, 68, 68, 0.04)'
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: '400px',
            p: 3,
            boxSizing: 'border-box'
          }
        }}
      >
        <Box sx={{ width: '100%' }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3,
          }}>
            <Typography variant="h6" sx={{ 
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 600
            }}>
              Add New Product
            </Typography>
            <IconButton onClick={() => setIsDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Stack spacing={3}>
            <TextField
              label="Product Name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              fullWidth
              sx={{
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 600,
                '& .MuiOutlinedInput-root': {
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: 600,
                  '& fieldset': {
                    borderColor: '#C9D6DF'
                  }
                }
              }}
            />
            
            <TextField
              label="Product Description"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              multiline
              rows={4}
              fullWidth
              sx={{
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 600,
                '& .MuiOutlinedInput-root': {
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: 600,
                  '& fieldset': {
                    borderColor: '#C9D6DF'
                  }
                }
              }}
            />

            <Button
              variant="contained"
              onClick={handleCreateProduct}
              disabled={!productName}
              sx={{
                backgroundColor: '#1E2022',
                '&:hover': {
                  backgroundColor: '#34373b'
                },
                fontFamily: 'Nunito, sans-serif',
                textTransform: 'none'
              }}
            >
              Create Product
            </Button>
          </Stack>

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
        </Box>
      </Drawer>
    </Box>
  );
};

export default Products;