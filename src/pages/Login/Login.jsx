import React, { useState } from 'react';
import { Alert, Box, Button, Paper, Snackbar, TextField, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { auth_api } from '../../api/auth_api';
import { loginSuccess } from '../../store/authSlice';

/**
 * Hash password string to SHA256 hex as required by backend security policy.
 */
async function hashPassword(password) {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError('Vui lòng nhập username và password');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // 1. Client-side Hashing
      const passwordHash = await hashPassword(password);
      
      // 2. Transmit to backend
      const data = await auth_api.login_api({ 
        username: username.trim(), 
        password: passwordHash 
      });
      
      const token = data.access_token || data.token;
      if (!token) {
        setError('Đăng nhập thất bại');
        return;
      }
      
      // 3. Store token and user metadata (Role, Full Name)
      dispatch(loginSuccess({ 
        token, 
        user: data.user 
      }));
      
      const redirectPath = location.state?.from?.pathname || '/dashboard';
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Sai thông tin đăng nhập');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2, background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' }}>
      <Paper sx={{ width: '100%', maxWidth: 420, p: 4, borderRadius: 4, backdropFilter: 'blur(10px)', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: 24 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-1px', color: 'white' }}>5cent computer</Typography>
        <Typography variant="body1" sx={{ mb: 4, color: 'rgba(255, 255, 255, 0.6)' }}>Quản lý hệ thống máy tính & Khách hàng.</Typography>
        
        <form onSubmit={handleSubmit}>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 1, display: 'block' }}>Tên đăng nhập</Typography>
          <TextField fullWidth placeholder="admin" value={username} onChange={(e) => setUsername(e.target.value)} sx={{ mb: 3, '& .MuiOutlinedInput-root': { color: 'white' } }} />
          
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 1, display: 'block' }}>Mật khẩu</Typography>
          <TextField fullWidth placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 4, '& .MuiOutlinedInput-root': { color: 'white' } }} />
          
          <Button type="submit" variant="contained" size="large" fullWidth disabled={isSubmitting} sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, textTransform: 'none', fontSize: '1rem' }}>
            {isSubmitting ? 'Đang xác thực...' : 'Đăng nhập hệ thống'}
          </Button>
        </form>
      </Paper>
      
      <Snackbar open={Boolean(error)} autoHideDuration={3500} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="error" variant="filled" onClose={() => setError('')}>{error}</Alert>
      </Snackbar>
    </Box>
  );
}
