import React, { useState } from 'react';
import { Box, Grid, TextField, Typography, Divider, Paper } from '@mui/material';

export default function InvoiceApprovalForm({ payload, onChange }) {
  const [formData, setFormData] = useState(payload);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    onChange(updated);
  };

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    // Strip 'customer.' prefix
    const fieldName = name.split('.')[1];
    const updated = {
      ...formData,
      customer: {
        ...formData.customer,
        [fieldName]: value
      }
    };
    setFormData(updated);
    onChange(updated);
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
        Thông tin khách hàng
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item size= { {xs:12 ,sm:6}}>
          <TextField 
            fullWidth label="Tên khách hàng" name="customer.name" 
            value={formData.customer?.name || ''} onChange={handleCustomerChange} size="small"
          />
        </Grid>
        <Grid item size= { {xs:12 ,sm:6}}>
          <TextField 
            fullWidth label="Số điện thoại" name="customer.phone" 
            value={formData.customer?.phone || ''} onChange={handleCustomerChange} size="small"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField 
            fullWidth label="Địa chỉ" name="customer.address" 
            value={formData.customer?.address || ''} onChange={handleCustomerChange} size="small"
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
        Chi tiết nghiệp vụ (Hóa đơn)
      </Typography>
      <Grid container spacing={2}>
        <Grid item size= { {xs:12 ,sm:6}}>
          <TextField 
            fullWidth label="Giá bán (VNĐ)" name="sale_price" type="number"
            value={formData.sale_price || ''} onChange={handleChange} size="small"
          />
        </Grid>
        <Grid item size= { {xs:12 ,sm:6}}>
          <TextField 
            fullWidth label="Giá nhập (VNĐ)" name="cost_price" type="number"
            value={formData.cost_price || ''} onChange={handleChange} size="small"
            required
            helperText="Admin cần xác nhận giá nhập máy"
            error={!formData.cost_price}
          />
        </Grid>
        <Grid item size= { {xs:12 ,sm:6}}>
          <TextField 
            fullWidth label="Chi phí phát sinh (VNĐ)" name="expenses" type="number"
            value={formData.expenses || ''} onChange={handleChange} size="small"
          />
        </Grid>
        <Grid item size= { {xs:12 ,sm:6}}>
          <TextField 
            fullWidth label="Bảo hành (tháng)" name="warranty_months" type="number"
            value={formData.warranty_months || ''} onChange={handleChange} size="small"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField 
            fullWidth label="Lý do chi phí" name="expenses_reason" multiline rows={2}
            value={formData.expenses_reason || ''} onChange={handleChange} size="small"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField 
            fullWidth label="Nguồn khách" name="source" 
            value={formData.source || ''} onChange={handleChange} size="small"
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mt: 3, bgcolor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Lợi nhuận ước tính: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
            (formData.sale_price || 0) - (formData.cost_price || 0) - (formData.expenses || 0)
          )}
        </Typography>
      </Paper>
    </Box>
  );
}
