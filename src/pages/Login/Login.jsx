import React, { useState } from 'react';
import { Alert, Box, Button, Paper, Snackbar, TextField, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { setAuthToken } from '../../utils/auth';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    // Authenticate admin user and store JWT.
    event.preventDefault();
    if (!username.trim() || !password) {
      setError('Vui lòng nhập username và password');
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await axiosClient.post('/auth/login', { username: username.trim(), password });
      const token = response.data?.access_token || '';
      if (!token) {
        setError('Đăng nhập thất bại');
        return;
      }
      setAuthToken(token);
      const redirectPath = location.state?.from?.pathname || '/dashboard';
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Sai thông tin đăng nhập');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
      <Paper sx={{ width: '100%', maxWidth: 420, p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Admin Login</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Chỉ tài khoản quản trị mới được truy cập hệ thống.</Typography>
        <form onSubmit={handleSubmit}>
          <TextField fullWidth label="Username" value={username} onChange={(e) => setUsername(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2 }} />
          <Button type="submit" variant="contained" fullWidth disabled={isSubmitting}>
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </form>
      </Paper>
      <Snackbar open={Boolean(error)} autoHideDuration={3500} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="error" variant="filled" onClose={() => setError('')}>{error}</Alert>
      </Snackbar>
    </Box>
  );
}
