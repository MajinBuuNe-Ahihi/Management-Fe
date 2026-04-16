import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Autocomplete, CircularProgress, Typography, Divider, Box, IconButton,
  FormControlLabel, Switch, MenuItem, Select, InputLabel, FormControl
} from '@mui/material';
import Grid from '@mui/material/Grid';
import CloseIcon from '@mui/icons-material/Close';
import { laptop_api } from '../../api/laptop_api';
import { customer_api } from '../../api/customer_api';
import { invoice_api } from '../../api/invoice_api';
import { useNotification } from '../../context/NotificationContext';
import useDebounce from '../../hooks/useDebounce';

export default function InvoiceFormModal({ open, onClose, onSuccess, initialData }) {
  const { notify } = useNotification();
  const [formData, setFormData] = useState({
    id: null,
    customer_id: null,
    customer: {
      name: '',
      phone: '',
      address: ''
    },
    laptop_id: null,
    laptop_serial: '',
    machine_name: '',
    sale_price: 0,
    cost_price: 0,
    expenses: 0,
    warranty_months: 3,
    status: 0, // 0: Draft/Unpaid, 1: Paid, etc.
  });

  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const debouncedCustomerSearch = useDebounce(customerSearch, 500);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);

  const [laptopOptions, setLaptopOptions] = useState([]);
  const [laptopSearch, setLaptopSearch] = useState('');
  const debouncedLaptopSearch = useDebounce(laptopSearch, 500);
  const [isSearchingLaptops, setIsSearchingLaptops] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        customer: initialData.customer || { name: '', phone: '', address: '' }
      });
      if (!initialData.customer_id) setIsNewCustomer(true);
    } else {
      setFormData({
        id: null,
        customer_id: null,
        customer: { name: '', phone: '', address: '' },
        laptop_id: null,
        laptop_serial: '',
        machine_name: '',
        sale_price: 0,
        cost_price: 0,
        expenses: 0,
        warranty_months: 3,
        status: 0,
      });
      setIsNewCustomer(false);
    }
  }, [initialData, open]);

  // Debounced Search for Customers
  useEffect(() => {
    const handleSearchCustomers = async (query) => {
      if (!query || query.length < 2) {
        setCustomerOptions([]);
        return;
      }
      setIsSearchingCustomers(true);
      try {
        const data = await customer_api.get_list_api({ search: query, limit: 10 });
        setCustomerOptions(data.items || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingCustomers(false);
      }
    };
    if (debouncedCustomerSearch) {
      handleSearchCustomers(debouncedCustomerSearch);
    }
  }, [debouncedCustomerSearch]);

  // Debounced Search for Laptops
  useEffect(() => {
    const handleSearchLaptops = async (query) => {
      if (!query || query.length < 2) {
        setLaptopOptions([]);
        return;
      }
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
    if (debouncedLaptopSearch) {
      handleSearchLaptops(debouncedLaptopSearch);
    }
  }, [debouncedLaptopSearch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('customer.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        customer: { ...prev.customer, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCustomerSelect = (event, customer) => {
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_id: customer.id,
        customer: {
          name: customer.name || customer.customer_name,
          phone: customer.phone || customer.customer_phone,
          address: customer.address || customer.customer_address
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        customer_id: null,
        customer: { name: '', phone: '', address: '' }
      }));
    }
  };

  const handleLaptopSelect = (event, laptop) => {
    if (laptop) {
      setFormData(prev => ({
        ...prev,
        laptop_id: laptop.id,
        laptop_serial: laptop.serial,
        machine_name: laptop.product_name,
        cost_price: laptop.price_value || 0,
        sale_price: laptop.price_value || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        laptop_id: null,
        laptop_serial: '',
        machine_name: '',
        cost_price: 0,
        sale_price: 0
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        sale_price: Number(formData.sale_price),
        cost_price: Number(formData.cost_price),
        expenses: Number(formData.expenses),
        warranty_months: Number(formData.warranty_months),
        status: Number(formData.status)
      };

      if (isNewCustomer) {
        payload.customer_id = null; // Ensure backend treats it as new if selected
      }

      let res;
      if (formData.id) {
        res = await invoice_api.update_api(formData.id, payload);
      } else {
        res = await invoice_api.create_api(payload);
      }

      if (res?.status === 202 || (res?.message && res.message.includes('phê duyệt'))) {
        notify(res.message || 'Yêu cầu của bạn đang chờ phê duyệt', 'info');
      } else {
        notify('Đã lưu hóa đơn thành công', 'success');
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      notify(err.response?.data?.message || 'Lỗi khi lưu hóa đơn', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {formData.id ? 'Sửa Hóa đơn' : 'Tạo Hóa đơn Mới'}
          </Typography>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          <Grid container spacing={3}>
            {/* Customer Section */}
            <Grid item size={{ xs: 12}}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>Thông tin khách hàng</Typography>
              </Box>
            </Grid>
            <Grid item size={{ xs: 12 }}>
              <FormControlLabel
                  control={<Switch checked={isNewCustomer} onChange={(e) => {
                    setIsNewCustomer(e.target.checked);
                    if (e.target.checked) setFormData(prev => ({ ...prev, customer_id: null }));
                  }} />}
                  label="Khách hàng mới"
                />
            </Grid>
            {!isNewCustomer ? (
              <Grid item size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  fullWidth
                  options={customerOptions}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    const name = option.name || option.customer_name || '';
                    const phone = option.phone || option.customer_phone || '';
                    return name ? `${name} - ${phone}` : '';
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  value={formData.customer_id ? { 
                    id: formData.customer_id, 
                    name: formData.customer.name, 
                    phone: formData.customer.phone 
                  } : null}
                  loading={isSearchingCustomers}
                  inputValue={customerSearch}
                  onInputChange={(e, v) => setCustomerSearch(v)}
                  onChange={handleCustomerSelect}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Tìm khách hàng (Tên hoặc SĐT)" 
                      variant="outlined" 
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <React.Fragment>
                            {isSearchingCustomers ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </React.Fragment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
            ) : (
              <>
                <Grid item size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Tên khách hàng" name="customer.name" value={formData.customer.name} onChange={handleChange} required />
                </Grid>
                <Grid item size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Số điện thoại" name="customer.phone" value={formData.customer.phone} onChange={handleChange} required />
                </Grid>
                <Grid item size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Địa chỉ" name="customer.address" value={formData.customer.address} onChange={handleChange} multiline rows={2} />
                </Grid>
              </>
            )}

            {/* Laptop Section */}
            <Grid item size={{ xs: 12 }} sx={{ mt: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>Thông tin máy</Typography>
            </Grid>
            <Grid item size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                fullWidth
                options={laptopOptions}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return option.serial ? `${option.serial} - ${option.product_name}` : '';
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={formData.laptop_id ? {
                  id: formData.laptop_id,
                  serial: formData.laptop_serial,
                  product_name: formData.machine_name
                } : null}
                loading={isSearchingLaptops}
                inputValue={laptopSearch}
                onInputChange={(e, v) => setLaptopSearch(v)}
                onChange={handleLaptopSelect}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Chọn máy từ kho (Serial hoặc Tên)" 
                    variant="outlined" 
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <React.Fragment>
                          {isSearchingLaptops ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </React.Fragment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Tên máy hiển thị" name="machine_name" value={formData.machine_name} onChange={handleChange} required />
            </Grid>
            <Grid item size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Serial" name="laptop_serial" value={formData.laptop_serial} onChange={handleChange} required />
            </Grid>

            {/* Financials */}
            <Grid item size={{ xs: 12 }} sx={{ mt: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>Tài chính & Bảo hành</Typography>
            </Grid>
            <Grid item size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth type="number" label="Bảo hành (tháng)" name="warranty_months" value={formData.warranty_months} onChange={handleChange} />
            </Grid>
            <Grid item size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth type="number" label="Giá bán (VND)" name="sale_price" value={formData.sale_price} onChange={handleChange} required />
            </Grid>
            <Grid item size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth type="number" label="Giá nhập (VND)" name="cost_price" value={formData.cost_price} onChange={handleChange} required />
            </Grid>
            <Grid item size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth type="number" label="Chi phí (VND)" name="expenses" value={formData.expenses} onChange={handleChange}  />
            </Grid>
            {/* lý do chi phí phát sinh */}
            <Grid item size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth  label="Lý do chi phí" name="expenses_reason" value={formData.expenses_reason} onChange={handleChange} />
            </Grid>
            <Grid item size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select name="status" value={formData.status} label="Trạng thái" onChange={handleChange}>
                  <MenuItem value={0}>Chưa hoàn tất</MenuItem>
                  <MenuItem value={1}>Đã thanh toán</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} variant="outlined">Hủy</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : 'Lưu Hóa đơn'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
