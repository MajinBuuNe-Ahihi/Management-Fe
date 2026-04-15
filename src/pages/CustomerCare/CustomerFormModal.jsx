import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, 
  Autocomplete, CircularProgress, Typography, Divider, Box, IconButton
} from '@mui/material';
import Grid from '@mui/material/Grid';
import CloseIcon from '@mui/icons-material/Close';
import { laptop_api } from '../../api/laptop_api';
import { customer_api } from '../../api/customer_api';

export default function CustomerFormModal({ open, onClose, onSuccess, initialData }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    laptop_id: null,
    laptop_serial: '',
    machine_name: '',
    configuration: '',
    sale_price: '',
    cost_price: '',
    expenses: 0,
    issue_reason: '',
    sale_date: new Date().toISOString().split('T')[0],
    warranty_months: 3,
    source: ''
  });

  const [laptopOptions, setLaptopOptions] = useState([]);
  const [isSearchingLaptops, setIsSearchingLaptops] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        sale_date: initialData.sale_date ? initialData.sale_date.split('T')[0] : '',
        expenses: initialData.expenses || 0
      });
    } else {
      setFormData({
        customer_name: '',
        customer_phone: '',
        customer_address: '',
        laptop_id: null,
        laptop_serial: '',
        machine_name: '',
        configuration: '',
        sale_price: '',
        cost_price: '',
        expenses: 0,
        issue_reason: '',
        sale_date: new Date().toISOString().split('T')[0],
        warranty_months: 3,
        source: ''
      });
    }
  }, [initialData, open]);

  const handleSearchLaptops = async (query) => {
    if (!query || query.length < 2) return;
    setIsSearchingLaptops(true);
    try {
      const data = await laptop_api.get_list_api({ search: query, limit: 10 });
      setLaptopOptions(data.laptops || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingLaptops(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLaptopSelect = (event, laptop) => {
    if (laptop) {
      setFormData((prev) => ({
        ...prev,
        laptop_id: laptop.id,
        laptop_serial: laptop.serial,
        machine_name: laptop.product_name,
        configuration: `${laptop.cpu || ''} | ${laptop.ram || ''} | ${laptop.ssd || ''} | ${laptop.display || ''}`,
        cost_price: laptop.price_value || 0,
        sale_price: laptop.price_value || 0
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        laptop_id: null,
        laptop_serial: '',
        machine_name: '',
        configuration: '',
        cost_price: '',
        sale_price: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = {
      ...formData,
      laptop_id: formData.laptop_id ? Number(formData.laptop_id) : null,
      sale_price: Number(formData.sale_price || 0),
      cost_price: Number(formData.cost_price || 0),
      expenses: Number(formData.expenses || 0),
      warranty_months: Number(formData.warranty_months || 0)
    };

    try {
      let response;
      if (initialData?.id) {
        response = await customer_api.update_api(initialData.id, payload);
      } else {
        response = await customer_api.create_api(payload);
      }
      
      if (response?.status === 202 || (response?.message && response.message.includes('phê duyệt'))) {
        alert(response.message || 'Yêu cầu đang chờ phê duyệt.');
      }
      
      onSuccess();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Lỗi khi lưu thông tin');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.25rem' }}>
            {initialData ? 'Sửa thông tin bán hàng' : 'Thêm thông tin bán hàng mới'}
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          <Grid container spacing={3} alignItems="stretch">
            {/* --- Section: Customer Info --- */}
            <Grid size={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                Thông tin khách hàng
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField 
                fullWidth 
                label="Số điện thoại" 
                name="customer_phone" 
                value={formData.customer_phone} 
                onChange={handleChange} 
                variant="outlined"
              />
            </Grid>
            <Grid size={12}>
              <TextField 
                fullWidth 
                label="Địa chỉ" 
                name="customer_address" 
                value={formData.customer_address} 
                onChange={handleChange} 
                multiline 
                rows={2} 
                variant="outlined"
              />
            </Grid>

            {/* --- Section: Machine --- */}
            <Grid size={12} sx={{ mt: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                Thông tin máy
              </Typography>
            </Grid>
            <Grid size={12}>
              <Autocomplete
                fullWidth
                options={laptopOptions}
                getOptionLabel={(option) => `${option.serial} - ${option.product_name}`}
                loading={isSearchingLaptops}
                onInputChange={(e, value) => handleSearchLaptops(value)}
                onChange={handleLaptopSelect}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Tìm kiếm máy từ kho (Serial hoặc Tên)" 
                    variant="outlined"
                    placeholder="Gõ ít nhất 2 ký tự..."
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        endAdornment: (
                          <React.Fragment>
                            {isSearchingLaptops ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps?.endAdornment}
                          </React.Fragment>
                        ),
                      },
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box sx={{ py: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{option.serial} - {option.product_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.cpu} | {option.ram} | {option.ssd} | {option.price_text}
                      </Typography>
                    </Box>
                  </li>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Tên máy hiển thị" name="machine_name" value={formData.machine_name} onChange={handleChange} required variant="outlined" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Serial máy" name="laptop_serial" value={formData.laptop_serial} onChange={handleChange} variant="outlined" />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Cấu hình chi tiết" name="configuration" value={formData.configuration} onChange={handleChange} multiline rows={2} variant="outlined" />
            </Grid>

            {/* --- Section: Financials --- */}
            <Grid size={12} sx={{ mt: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                Tài chính & Bảo hành
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth type="number" label="Giá bán (VND)" name="sale_price" value={formData.sale_price} onChange={handleChange} required variant="outlined" />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth type="number" label="Giá gốc (VND)" name="cost_price" value={formData.cost_price} onChange={handleChange} required variant="outlined" />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth type="date" label="Ngày bán" name="sale_date" value={formData.sale_date} onChange={handleChange} InputLabelProps={{ shrink: true }} required variant="outlined" />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth type="number" label="Bảo hành (tháng)" name="warranty_months" value={formData.warranty_months} onChange={handleChange} required variant="outlined" />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth type="number" label="Chi phí phát sinh" name="expenses" value={formData.expenses} onChange={handleChange} variant="outlined" />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Nguồn hàng" name="source" value={formData.source} onChange={handleChange} variant="outlined" />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Lý do phát sinh chi phí (nếu có)" name="issue_reason" value={formData.issue_reason} onChange={handleChange} variant="outlined" />
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
