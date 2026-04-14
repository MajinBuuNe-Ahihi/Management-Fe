import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Divider, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Snackbar, TextField, Typography } from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { copyToClipboard } from '../../utils/clipboard';

export default function LaptopForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    serial: '',
    brand: '',
    line: '',
    product_name: '',
    condition: '',
    cpu: '',
    ram: '',
    ssd: '',
    display: '',
    battery: '',
    weight: '',
    price: '',
    warranty: '',
    location: '',
    raw_text_summary: '',
    seo_keywords: [],
    facebook_post: '',
    listImage: '',
    createdDate: new Date().toISOString().slice(0, 10),
    source: 'AI',
    isDeposit: false,
    isSell: false
  });
  const [rawInformation, setRawInformation] = useState('');
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load laptop detail for edit mode.
  useEffect(() => {
    if (!isEditMode) return;
    const fetchLaptop = async () => {
      try {
        const res = await axiosClient.get(`/laptops/${id}`);
        setFormData({
          ...res.data,
          createdDate: res.data?.createdDate ? res.data.createdDate.slice(0, 10) : '',
          seo_keywords: Array.isArray(res.data?.seo_keywords) ? res.data.seo_keywords : []
        });
      } catch (err) {
        setError('Failed to fetch laptop details');
      }
    };
    fetchLaptop();
  }, [id, isEditMode]);

  // Merge field value into form state.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Convert status dropdown to internal flags.
  const handleStatusChange = (e) => {
    const status = e.target.value;
    if (status === 'sold') return setFormData((prev) => ({ ...prev, isDeposit: false, isSell: true }));
    if (status === 'deposited') return setFormData((prev) => ({ ...prev, isDeposit: true, isSell: false }));
    return setFormData((prev) => ({ ...prev, isDeposit: false, isSell: false }));
  };

  // Resolve UI status from booleans.
  const getStatusValue = () => (formData.isSell ? 'sold' : formData.isDeposit ? 'deposited' : 'available');

  // Parse listImage into gallery URLs.
  const getImageUrls = (input) => (input || '').split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);

  // Call backend extraction endpoint and fill form with LLM output.
  const handleAnalyze = async () => {
    if (!rawInformation.trim()) {
      setError('Vui long nhap noi dung can phan tich.');
      return;
    }
    try {
      setIsAnalyzing(true);
      setError('');
      const res = await axiosClient.post('/laptops/extract-info', { text: rawInformation });
      setFormData((prev) => ({ ...prev, ...res.data, source: 'AI' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Khong the phan tich thong tin.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save laptop info to backend.
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      seo_keywords: Array.isArray(formData.seo_keywords)
        ? formData.seo_keywords
        : String(formData.seo_keywords || '').split(',').map((item) => item.trim()).filter(Boolean)
    };
    try {
      if (isEditMode) await axiosClient.put(`/laptops/${id}`, payload);
      else await axiosClient.post('/laptops', payload);
      navigate('/laptops');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save laptop');
    }
  };

  // Copy any text field value to clipboard.
  const handleCopy = async (value) => {
    try {
      const success = await copyToClipboard(String(value || ''));
      if (!success) setError('Copy thất bại.');
    } catch (err) {
      setError('Copy thất bại.');
    }
  };

  // Add uploaded images to listImage as local preview URLs.
  const handleUploadImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const uploadedUrls = files.map((file) => URL.createObjectURL(file));
    const currentUrls = getImageUrls(formData.listImage);
    const nextUrls = [...currentUrls, ...uploadedUrls];
    setFormData((prev) => ({ ...prev, listImage: nextUrls.join('\n') }));
    e.target.value = '';
  };

  // Remove one image URL from gallery/listImage.
  const handleRemoveImage = (targetUrl) => {
    const nextUrls = getImageUrls(formData.listImage).filter((url) => url !== targetUrl);
    setFormData((prev) => ({ ...prev, listImage: nextUrls.join('\n') }));
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
        {isEditMode ? 'Edit Laptop' : 'Add New Laptop'}
      </Typography>

      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Thong tin may</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={9}>
            <TextField fullWidth multiline minRows={6} value={rawInformation} onChange={(e) => setRawInformation(e.target.value)} placeholder="Nhap text bai dang laptop..." />
          </Grid>
          <Grid item xs={12} md={3} sx={{ display: 'flex' }}>
            <Button fullWidth variant="contained" color="secondary" onClick={handleAnalyze} disabled={isAnalyzing} startIcon={<AutoFixHighIcon />}>
              {isAnalyzing ? 'Đang phân tích...' : 'Phân tích'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>Chi tiet may</Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Hãng" name="brand" value={formData.brand || ''} onChange={handleChange} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Serial Number" name="serial" value={formData.serial || ''} onChange={handleChange} required disabled={isEditMode} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth type="date" label="Ngày nhập" name="createdDate" value={formData.createdDate || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Tên máy" name="product_name" value={formData.product_name || ''} onChange={handleChange} required /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Dòng máy" name="line" value={formData.line || ''} onChange={handleChange} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Tình trạng" name="condition" value={formData.condition || ''} onChange={handleChange} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="CPU" name="cpu" value={formData.cpu || ''} onChange={handleChange} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="RAM" name="ram" value={formData.ram || ''} onChange={handleChange} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="SSD" name="ssd" value={formData.ssd || ''} onChange={handleChange} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Display" name="display" value={formData.display || ''} onChange={handleChange} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Battery" name="battery" value={formData.battery || ''} onChange={handleChange} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Weight" name="weight" value={formData.weight || ''} onChange={handleChange} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Giá tiền" name="price" value={formData.price || ''} onChange={handleChange} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Bảo hành" name="warranty" value={formData.warranty || ''} onChange={handleChange} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Vị trí" name="location" value={formData.location || ''} onChange={handleChange} /></Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button variant="outlined" component="label">
                  Upload ảnh
                  <input hidden type="file" accept="image/*" multiple onChange={handleUploadImages} />
                </Button>
                <TextField
                  fullWidth
                  label="Danh sách ảnh (mỗi dòng 1 URL)"
                  name="listImage"
                  value={formData.listImage || ''}
                  onChange={handleChange}
                  multiline
                  minRows={2}
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField fullWidth label="Tóm tắt nội dung gốc" name="raw_text_summary" value={formData.raw_text_summary || ''} onChange={handleChange} multiline minRows={2} />
                <Button variant="outlined" onClick={() => handleCopy(formData.raw_text_summary)}>Copy</Button>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label="SEO keywords (dấu phẩy)"
                  value={Array.isArray(formData.seo_keywords) ? formData.seo_keywords.join(', ') : formData.seo_keywords || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, seo_keywords: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) }))}
                />
                <Button variant="outlined" onClick={() => handleCopy(Array.isArray(formData.seo_keywords) ? formData.seo_keywords.join(', ') : formData.seo_keywords)}>Copy</Button>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField fullWidth label="Facebook post" name="facebook_post" value={formData.facebook_post || ''} onChange={handleChange} multiline minRows={4} />
                <Button variant="outlined" onClick={() => handleCopy(formData.facebook_post)}>Copy</Button>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select value={getStatusValue()} label="Trạng thái" onChange={handleStatusChange}>
                  <MenuItem value="available">Chưa bán</MenuItem>
                  <MenuItem value="deposited">Đã cọc</MenuItem>
                  <MenuItem value="sold">Đã bán</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {getImageUrls(formData.listImage).length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Gallery</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {getImageUrls(formData.listImage).map((url) => (
                    <Box key={url} sx={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 2, p: 1 }}>
                      <Box component="img" src={url} alt="Laptop" sx={{ width: 150, height: 110, objectFit: 'cover', borderRadius: 1, display: 'block', mb: 1 }} />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" variant="outlined" component="a" href={url} download target="_blank" rel="noopener noreferrer">Download</Button>
                        <Button size="small" color="error" variant="outlined" onClick={() => handleRemoveImage(url)}>Xóa</Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Grid>
            )}

            <Grid item xs={12}><Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.12)' }} /></Grid>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" onClick={() => navigate('/laptops')}>Huy bo</Button>
              <Button type="submit" variant="contained" color="primary">Luu thong tin</Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Snackbar open={Boolean(error)} autoHideDuration={4000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setError('')} severity="error" variant="filled">{error}</Alert>
      </Snackbar>
    </Box>
  );
}

