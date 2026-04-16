import React, { useState } from 'react';
import { Box, Grid, TextField, Typography } from '@mui/material';

export default function CustomerApprovalForm({ payload, onChange }) {
  const [formData, setFormData] = useState(payload);

  // Robust helper to get value from either flat or nested structure
  const getValue = (key) => {
    if (formData.customer && formData.customer[key] !== undefined) return formData.customer[key];
    return formData[key] || '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updated;
    
    // If it was nested, keep it nested. If flat, keep it flat.
    if (formData.customer) {
      updated = {
        ...formData,
        customer: { ...formData.customer, [name]: value }
      };
    } else {
      updated = { ...formData, [name]: value };
    }
    
    setFormData(updated);
    onChange(updated);
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
        Thông tin khách hàng
      </Typography>
      <Grid container spacing={2}>
        <Grid item size={{ xs: 12, sm: 6 }} >
          <TextField fullWidth label="Họ tên" name="name" value={getValue('name')} onChange={handleChange} size="small" />
        </Grid>
        <Grid item size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label="Số điện thoại" name="phone" value={getValue('phone')} onChange={handleChange} size="small" />
        </Grid>
        <Grid item size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label="Địa chỉ" name="address" value={getValue('address')} onChange={handleChange} size="small" />
        </Grid>
        <Grid item size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label="Email" name="email" value={getValue('email')} onChange={handleChange} size="small" />
        </Grid>
        <Grid item size={{ xs: 12}}>
          <TextField fullWidth label="Ghi chú" name="note" multiline rows={3} value={getValue('note')} onChange={handleChange} size="small" />
        </Grid>
      </Grid>
    </Box>
  );
}
