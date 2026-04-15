import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Chip, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, FormControl, InputLabel, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import axiosClient from '../../api/axiosClient';

const ROLE_LABELS = {
  0: { label: 'Superadmin', color: 'error' },
  1: { label: 'Management', color: 'warning' },
  2: { label: 'Staff', color: 'info' }
};

export default function StaffManagement() {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ username: '', password: '', full_name: '', role: 2 });
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await axiosClient.get('/users/');
      const data = response.data?.users || [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch users', err);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpen = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({ username: user.username, password: '', full_name: user.full_name, role: user.role });
    } else {
      setEditingUser(null);
      setFormData({ username: '', password: '', full_name: '', role: 2 });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      setError('');
      // In a real app, we'd hash the password here if it's a new password
      const payload = { ...formData };
      if (editingUser) payload.id = editingUser.id;
      
      await axiosClient.post('/users/', payload);
      setOpen(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lưu người dùng');
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
      try {
        await axiosClient.delete(`/users/${userId}`);
        fetchUsers();
      } catch (err) {
        console.error('Delete failed', err);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Quản lý nhân viên</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Thêm nhân viên
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Username</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Họ và tên</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Chức vụ</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{user.username}</TableCell>
                <TableCell>{user.full_name}</TableCell>
                <TableCell>
                  <Chip 
                    label={ROLE_LABELS[user.role]?.label} 
                    color={ROLE_LABELS[user.role]?.color} 
                    size="small" 
                    sx={{ fontWeight: 700 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpen(user)}><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => handleDelete(user.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{editingUser ? 'Sửa nhân viên' : 'Thêm nhân viên mới'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField 
            fullWidth label="Username" sx={{ mt: 2 }} 
            value={formData.username} 
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            disabled={!!editingUser}
          />
          <TextField 
            fullWidth label="Mật khẩu" type="password" sx={{ mt: 2 }} 
            value={formData.password} 
            placeholder={editingUser ? "Để trống nếu không đổi" : ""}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
          <TextField 
            fullWidth label="Họ và tên" sx={{ mt: 2 }} 
            value={formData.full_name} 
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Chức vụ</InputLabel>
            <Select
              value={formData.role}
              label="Chức vụ"
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <MenuItem value={0}>Superadmin</MenuItem>
              <MenuItem value={1}>Management</MenuItem>
              <MenuItem value={2}>Staff</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSave}>Lưu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
