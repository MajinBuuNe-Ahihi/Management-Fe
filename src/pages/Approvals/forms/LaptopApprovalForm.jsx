import React, { useState } from 'react';
import { Box, Grid, TextField, Typography, Divider } from '@mui/material';

export default function LaptopApprovalForm({ payload, onChange }) {
  const [formData, setFormData] = useState(payload);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    onChange(updated);
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
        Thông tin kỹ thuật (Laptop)
      </Typography>
      <Grid container spacing={2}>
        <Grid item size= { {xs:12 ,sm:6}}>
          <TextField fullWidth label="Tên máy" name="product_name" value={formData.product_name || ''} onChange={handleChange} size="small" />
        </Grid>
        <Grid item size= { {xs:12 ,sm:6}}>
          <TextField fullWidth label="Serial" name="serial" value={formData.serial || ''} onChange={handleChange} size="small" />
        </Grid>
        <Grid item size= { {xs:12 ,sm:4}}>
          <TextField fullWidth label="Hãng" name="brand" value={formData.brand || ''} onChange={handleChange} size="small" />
        </Grid>
        <Grid item size= { {xs:12 ,sm:4}}>
          <TextField fullWidth label="Dòng máy" name="line" value={formData.line || ''} onChange={handleChange} size="small" />
        </Grid>
        <Grid item size= { {xs:12 ,sm:4}}>
          <TextField fullWidth label="Tình trạng" name="condition" value={formData.condition || ''} onChange={handleChange} size="small" />
        </Grid>
        
        <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

        <Grid item size= { {xs:12 ,sm:4}}>
          <TextField fullWidth label="CPU" name="cpu" value={formData.cpu || ''} onChange={handleChange} size="small" />
        </Grid>
        <Grid item size= { {xs:12 ,sm:4}}>
          <TextField fullWidth label="RAM" name="ram" value={formData.ram || ''} onChange={handleChange} size="small" />
        </Grid>
        <Grid item size= { {xs:12 ,sm:4}}>
          <TextField fullWidth label="SSD" name="ssd" value={formData.ssd || ''} onChange={handleChange} size="small" />
        </Grid>
        <Grid item size= { {xs:12 ,sm:4}}>
          <TextField fullWidth label="Màn hình" name="display" value={formData.display || ''} onChange={handleChange} size="small" />
        </Grid>
        <Grid item size= { {xs:12 ,sm:4}}>
          <TextField fullWidth label="Pin" name="battery" value={formData.battery || ''} onChange={handleChange} size="small" />
        </Grid>
        <Grid item size= { {xs:12 ,sm:4}}>
          <TextField fullWidth label="Cân nặng" name="weight" value={formData.weight || ''} onChange={handleChange} size="small" />
        </Grid>

        <Grid item size= { {xs:12 ,sm:6}}>
          <TextField fullWidth label="Giá bán hiển thị" name="price" value={formData.price || ''} onChange={handleChange} size="small" />
        </Grid>
        <Grid item size= { {xs:12 ,sm:6}}>
          <TextField fullWidth label="Bảo hành" name="warranty" value={formData.warranty || ''} onChange={handleChange} size="small" />
        </Grid>
      </Grid>
    </Box>
  );
}
