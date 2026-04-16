import React, { useState } from 'react';
import { Alert, Box, Button, Paper, Snackbar, TextField, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { auth_api } from '../../api/auth_api';
import { loginSuccess } from '../../store/authSlice';

/**
 * Hash password string to SHA256 hex as required by backend security policy.
 */
/**
 * Hash password string to SHA256 hex.
 * Fallback to manual implementation if crypto.subtle is unavailable (non-HTTPS).
 */
async function hashPassword(password) {
  if (crypto.subtle) {
    const msgUint8 = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Manual fallback for non-secure contexts (HTTP over IP)
  const utf8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle?.digest('SHA-256', utf8) || await Promise.resolve(null);
  
  // If still no crypto, we need a simple JS implementation or inform the user
  // For now, let's use a common JS SHA256 snippet or use a library.
  // Since we can't easily add a library now, I will provide a minimal JS SHA256
  return sha256_manual(password);
}

function sha256_manual(ascii) {
    function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    };
    
    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var lengthProperty = 'length';
    var i, j; // Used as a counter across the whole file
    var result = '';
    var words = [];
    var asciiBitLength = ascii[lengthProperty] * 8;
    
    var hash = sha256_manual.h = sha256_manual.h || [];
    var k = sha256_manual.k = sha256_manual.k || [];
    var primeCounter = k[lengthProperty];

    var isPrime = function (n) {
        for (var factor = 2; factor * factor <= n; factor++) {
            if (n % factor === 0) return false;
        }
        return true;
    };

    if (!primeCounter) {
        var n = 2;
        while (primeCounter < 64) {
            if (isPrime(n)) {
                k[primeCounter] = (mathPow(n, 1 / 3) * maxWord) | 0;
                hash[primeCounter] = (mathPow(n, 1 / 2) * maxWord) | 0;
                primeCounter++;
            }
            n++;
        }
    }
    
    ascii += '\x80';
    while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
        j = ascii.charCodeAt(i);
        if (j >> 8) return; 
        words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
    words[words[lengthProperty]] = (asciiBitLength | 0);
    
    for (j = 0; j < words[lengthProperty]; ) {
        var w = words.slice(j, j += 16);
        var oldHash = hash;
        hash = hash.slice(0, 8);
        
        for (i = 0; i < 64; i++) {
            var i2 = i + j;
            var w15 = w[i - 15], w2 = w[i - 2];
            var a = hash[0], e = hash[4];
            var temp1 = hash[7]
                + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
                + ((e & hash[5]) ^ (~e & hash[6]))
                + k[i]
                + (w[i] = (i < 16) ? w[i] : (
                        w[i - 16]
                        + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
                        + w[i - 7]
                        + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
                    ) | 0
                );
            var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
                + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
            
            hash = [(temp1 + temp2) | 0].concat(hash);
            hash[4] = (hash[4] + temp1) | 0;
        }
        
        for (i = 0; i < 8; i++) {
            hash[i] = (hash[i] + oldHash[i]) | 0;
        }
    }
    
    for (i = 0; i < 8; i++) {
        for (j = 3; j + 1; j--) {
            var b = (hash[i] >> (j * 8)) & 255;
            result += (b < 16 ? 0 : '') + b.toString(16);
        }
    }
    return result;
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
