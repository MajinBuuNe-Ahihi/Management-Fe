import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Autocomplete, CircularProgress, Typography, Divider, Box, IconButton
} from '@mui/material';
import Grid from '@mui/material/Grid';
import CloseIcon from '@mui/icons-material/Close';
import { laptop_api } from '../../api/laptop_api';
import { customer_api } from '../../api/customer_api';
import { useNotification } from '../../context/NotificationContext';

export default function CustomerFormModal({ open, onClose, onSuccess, initialData }) {
  const { notify } = useNotification();
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    customer_email: '',
    customer_note: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        customer_name: initialData.customer_name || initialData.name || '',
        customer_phone: initialData.customer_phone || initialData.phone || '',
        customer_address: initialData.customer_address || initialData.address || '',
        customer_email: initialData.customer_email || initialData.email || '',
        customer_note: initialData.customer_note || initialData.note || ''
      });
    } else {
      setFormData({
        customer_name: '',
        customer_phone: '',
        customer_address: '',
        customer_email: '',
        customer_note: ''
      });
    }
  }, [initialData, open]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      name: formData.customer_name,
      phone: formData.customer_phone,
      address: formData.customer_address,
      email: formData.customer_email,
      note: formData.customer_note
    };

    try {
      let response;
      if (initialData?.id) {
        response = await customer_api.update_api(initialData.id, payload);
      } else {
        response = await customer_api.create_api(payload);
      }

      if (response?.status === 222 || response?.status === 202 || (response?.message && response.message.includes('phê duyệt'))) {
        notify(response.message || 'Yêu cầu đang chờ phê duyệt.', 'info');
      } else {
        notify('Đã lưu thông tin khách hàng thành công', 'success');
      }

      onSuccess();
    } catch (err) {
      console.error(err);
      notify(err.response?.data?.message || 'Lỗi khi lưu thông tin', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.25rem' }}>
            {initialData ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Họ tên khách hàng"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                required
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Số điện thoại"
                name="customer_phone"
                value={formData.customer_phone}
                onChange={handleChange}
                required
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Địa chỉ"
                name="customer_address"
                value={formData.customer_address}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="customer_email"
                value={formData.customer_email}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Ghi chú"
                name="customer_note"
                value={formData.customer_note}
                onChange={handleChange}
                multiline
                rows={2}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={onClose} variant="outlined" color="inherit" sx={{ px: 4, borderRadius: 2 }}>
            Hủy bỏ
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={isSubmitting} sx={{ px: 4, borderRadius: 2, fontWeight: 700 }}>
            {isSubmitting ? 'Đang lưu...' : 'Lưu thông tin'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
