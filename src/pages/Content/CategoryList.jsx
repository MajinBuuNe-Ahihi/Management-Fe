import React, { useEffect, useState } from 'react';
import { 
  Box, Button, Card, CardContent, Dialog, DialogActions, 
  DialogContent, DialogTitle, Divider, IconButton, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  TextField, Typography, Chip, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { category_api } from '../../api/content_api';
import { useNotification } from '../../context/NotificationContext';

export default function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'laptop', description: '' });
  const { notify } = useNotification();

  const fetchCats = async () => {
    try {
      const data = await category_api.get_all_api();
      setCategories(data);
    } catch (err) {
      notify('Không tải được danh mục', 'error');
    }
  };

  useEffect(() => { fetchCats(); }, []);

  const handleOpen = (cat = null) => {
    if (cat) {
      setEditingCat(cat);
      setForm({ name: cat.name, type: cat.type, description: cat.description || '' });
    } else {
      setEditingCat(null);
      setForm({ name: '', type: 'laptop', description: '' });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...form, id: editingCat?.id };
      await category_api.save_api(payload);
      notify('Đã lưu danh mục thành công', 'success');
      setOpen(false);
      fetchCats();
    } catch (err) {
      notify('Lưu thất bại', 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>Quản lý Danh mục</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Thêm danh mục
        </Button>
      </Box>

      <TableContainer component={Card}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tên danh mục</TableCell>
              <TableCell>Loại</TableCell>
              <TableCell>Mô tả</TableCell>
              <TableCell align="right">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell sx={{ fontWeight: 600 }}>{cat.name}</TableCell>
                <TableCell>
                  <Chip 
                    label={cat.type === 'laptop' ? 'Sản phẩm' : 'Bài viết'} 
                    color={cat.type === 'laptop' ? 'primary' : 'secondary'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell>{cat.description}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpen(cat)} color="primary">
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editingCat ? 'Sửa danh mục' : 'Thêm danh mục mới'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField 
            label="Tên danh mục" 
            fullWidth 
            value={form.name} 
            onChange={(e) => setForm({ ...form, name: e.target.value })} 
          />
          <FormControl fullWidth>
            <InputLabel>Loại danh mục</InputLabel>
            <Select 
              value={form.type} 
              label="Loại danh mục"
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <MenuItem value="laptop">Sản phẩm (Laptop)</MenuItem>
              <MenuItem value="post">Bài viết (Blog)</MenuItem>
            </Select>
          </FormControl>
          <TextField 
            label="Mô tả" 
            fullWidth 
            multiline 
            rows={3}
            value={form.description} 
            onChange={(e) => setForm({ ...form, description: e.target.value })} 
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSave}>Lưu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
