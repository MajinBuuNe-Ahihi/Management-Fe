import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Divider, FormControl, Grid, IconButton, InputLabel, MenuItem, Paper, Select, Snackbar, TextField, Typography, useMediaQuery, useTheme } from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { copyToClipboard } from '../../utils/clipboard';
import { GOOGLE_MAP_OPTIONS } from '../../config/googleMaps';

export default function LaptopFormNew() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { serial } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(serial);
  const [formData, setFormData] = useState({ serial: '', brand: '', line: '', product_name: '', condition: '', cpu: '', ram: '', ssd: '', display: '', battery: '', weight: '', quantity: 1, price: '', warranty: '', location: '', raw_text_summary: '', seo_keywords: [], facebook_post: '', listImage: '', image_assets: [], createdDate: new Date().toISOString().slice(0, 10), source: 'AI', status: 0 });
  const [rawInformation, setRawInformation] = useState('');
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingImages, setPendingImages] = useState([]);
  const mapOptions = formData.location && !GOOGLE_MAP_OPTIONS.some((item) => item.value === formData.location)
    ? [{ value: formData.location, label: `Custom - ${formData.location}` }, ...GOOGLE_MAP_OPTIONS]
    : GOOGLE_MAP_OPTIONS;

  useEffect(() => {
    // Load detail in edit mode by serial and close form on failure.
    if (!isEditMode || !serial) return;
    const fetchLaptopBySerial = async () => {
      setIsLoading(true);
      try {
        const decodedSerial = decodeURIComponent(serial);
        const res = await axiosClient.get(`/laptops/by-serial/${encodeURIComponent(decodedSerial)}`);
        setFormData({
          ...res.data,
          quantity: Number(res.data?.quantity) > 0 ? Number(res.data.quantity) : 1,
          status: Number.isInteger(Number(res.data?.status)) ? Number(res.data.status) : 0,
          createdDate: res.data?.createdDate ? res.data.createdDate.slice(0, 10) : '',
          seo_keywords: Array.isArray(res.data?.seo_keywords) ? res.data.seo_keywords : []
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Không tải được dữ liệu sản phẩm');
        window.setTimeout(() => navigate('/laptops'), 1200);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLaptopBySerial();
  }, [isEditMode, serial, navigate]);

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const getStatusValue = () => Number(formData.status ?? 0);
  const handleStatusChange = (e) => setFormData((prev) => ({ ...prev, status: Number(e.target.value) }));
  const getImageUrls = (input) => (input || '').split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);

  // Select images before save and preview locally (max 5).
  const handleUploadImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const currentCount = pendingImages.length + (Array.isArray(formData.image_assets) ? formData.image_assets.length : 0);
    if (currentCount >= 5) {
      setError('Tối đa 5 ảnh cho mỗi laptop');
      e.target.value = '';
      return;
    }
    const availableSlots = 5 - currentCount;
    const acceptedFiles = files.slice(0, availableSlots);
    const nextPending = acceptedFiles.map((file) => ({
      id: `${Date.now()}-${file.name}-${file.size}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPendingImages((prev) => [...prev, ...nextPending]);
    e.target.value = '';
  };

  // Remove already-uploaded cloudinary image by public_id and sync form state.
  const handleRemoveUploadedImage = async (publicId) => {
    try {
      await axiosClient.delete('/uploads', { data: { public_id: publicId } });
      setFormData((prev) => {
        const prevAssets = Array.isArray(prev.image_assets) ? prev.image_assets : [];
        const nextAssets = prevAssets.filter((asset) => asset.public_id !== publicId);
        const manualUrls = getImageUrls(prev.listImage).filter(
          (url) => !prevAssets.some((asset) => asset.url === url)
        );
        return {
          ...prev,
          image_assets: nextAssets,
          listImage: [...manualUrls, ...nextAssets.map((asset) => asset.url)].join('\n')
        };
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Xóa ảnh thất bại');
    }
  };

  // Remove not-yet-uploaded image from local queue.
  const handleRemovePendingImage = (targetId) => {
    setPendingImages((prev) => {
      const target = prev.find((item) => item.id === targetId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== targetId);
    });
  };

  // Remove URL-based image from listImage field.
  const handleRemoveUrlImage = async (targetUrl) => {
    const existingAssets = Array.isArray(formData.image_assets) ? formData.image_assets : [];
    const matchedAsset = existingAssets.find((asset) => asset.url === targetUrl);
    if (matchedAsset?.public_id) {
      await handleRemoveUploadedImage(matchedAsset.public_id);
      return;
    }
    const nextUrls = getImageUrls(formData.listImage).filter((url) => url !== targetUrl);
    setFormData((prev) => ({ ...prev, listImage: nextUrls.join('\n') }));
  };

  const handleAnalyze = async () => {
    if (!rawInformation.trim()) return setError('Vui lòng nhập nội dung cần phân tích.');
    try {
      setIsAnalyzing(true);
      const res = await axiosClient.post('/laptops/extract-info', { text: rawInformation });
      setFormData((prev) => ({ ...prev, ...res.data, source: 'AI' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể phân tích thông tin.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedAssets = (Array.isArray(formData.image_assets) ? formData.image_assets : []).filter((asset) =>
      getImageUrls(formData.listImage).includes(asset.url)
    );
    const payload = {
      ...formData,
      quantity: Number(formData.quantity) > 0 ? Number(formData.quantity) : 1,
      status: Number(formData.status ?? 0),
      image_assets: normalizedAssets,
      seo_keywords: Array.isArray(formData.seo_keywords) ? formData.seo_keywords : String(formData.seo_keywords || '').split(',').map((item) => item.trim()).filter(Boolean)
    };
    try {
      let savedLaptopId = formData.id;
      let savedSerial = formData.serial;
      if (isEditMode) {
        const decodedSerial = decodeURIComponent(serial);
        await axiosClient.put(`/laptops/by-serial/${encodeURIComponent(decodedSerial)}`, payload);
      } else {
        const createRes = await axiosClient.post('/laptops', payload);
        savedLaptopId = createRes.data?.id;
        savedSerial = createRes.data?.serial || savedSerial;
      }

      if (pendingImages.length > 0 && savedLaptopId) {
        const uploadPayload = new FormData();
        pendingImages.forEach((item) => uploadPayload.append('files', item.file));
        uploadPayload.append('serial', savedSerial || '');
        await axiosClient.post(`/laptops/${savedLaptopId}/images/background-upload`, uploadPayload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      navigate('/laptops');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save laptop');
    }
  };

  // Copy selected content to clipboard.
  const handleCopy = async (value) => {
    try {
      const success = await copyToClipboard(String(value || ''));
      if (!success) setError('Copy thất bại');
    } catch (err) {
      setError('Copy thất bại');
    }
  };

  useEffect(() => () => {
    pendingImages.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  }, [pendingImages]);

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 1, sm: 0 }, pb: { xs: 10, sm: 0 } }}>
      <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 700, mb: { xs: 2, sm: 4 } }}>
        {isEditMode ? 'Edit Laptop' : 'Add New Laptop'}
      </Typography>
      <Paper sx={{ p: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 4 } }}>
        <Typography variant="h6" gutterBottom>Thông tin máy</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={9} style={{ flex: 1 }}><TextField fullWidth multiline minRows={6} value={rawInformation} onChange={(e) => setRawInformation(e.target.value)} placeholder="Nhập dữ liệu bài đăng laptop..." /></Grid>
          <Grid item xs={12} md={3} style={{ display: 'flex' }}>
            <Button style={{height: '48px'}} fullWidth size={isMobile ? 'large' : 'medium'} variant="contained" color="secondary" onClick={handleAnalyze} disabled={isAnalyzing} startIcon={<AutoFixHighIcon />}>
              {isAnalyzing ? 'Đang phân tích...' : 'Phân tích'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      <Paper sx={{ p: { xs: 2, sm: 4 } }}>
        {isLoading ? (
          <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            <CircularProgress size={28} />
            <Typography variant="body2" color="text.secondary">Đang tải dữ liệu sản phẩm...</Typography>
          </Box>
        ) : (
          <>
        <Typography variant="h6" gutterBottom>Chi tiết máy</Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={{ xs: 1.5, sm: 2.5 }}>
            <Grid item size={6}><TextField fullWidth label="Hãng" name="brand" value={formData.brand || ''} onChange={handleChange} /></Grid>
            <Grid item size={6}><TextField fullWidth label="Serial Number" name="serial" value={formData.serial || ''} onChange={handleChange} required disabled={isEditMode} /></Grid>
            <Grid item size={6}><TextField fullWidth type="date" label="Ngày nhập" name="createdDate" value={formData.createdDate || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item size={6}><TextField fullWidth label="Tên máy" name="product_name" value={formData.product_name || ''} onChange={handleChange} required /></Grid>
            <Grid item size={6}><TextField fullWidth label="Dòng máy" name="line" value={formData.line || ''} onChange={handleChange} /></Grid>
            <Grid item size={6}><TextField fullWidth label="Tình trạng" name="condition" value={formData.condition || ''} onChange={handleChange} /></Grid>
            <Grid item size={6}><TextField fullWidth label="CPU" name="cpu" value={formData.cpu || ''} onChange={handleChange} /></Grid>
            <Grid item size={6}><TextField fullWidth label="RAM" name="ram" value={formData.ram || ''} onChange={handleChange} /></Grid>
            <Grid item size={6}><TextField fullWidth label="SSD" name="ssd" value={formData.ssd || ''} onChange={handleChange} /></Grid>
            <Grid item size={6}><TextField fullWidth label="Display" name="display" value={formData.display || ''} onChange={handleChange} /></Grid>
            <Grid item size={6}><TextField fullWidth label="Battery" name="battery" value={formData.battery || ''} onChange={handleChange} /></Grid>
            <Grid item size={6}><TextField fullWidth label="Weight" name="weight" value={formData.weight || ''} onChange={handleChange} /></Grid>
            <Grid item size={6}><TextField fullWidth type="number" label="Số lượng sản phẩm" name="quantity" value={formData.quantity ?? 1} onChange={handleChange} inputProps={{ min: 1 }} /></Grid>
            <Grid item size={6}><TextField fullWidth label="Giá tiền" name="price" value={formData.price || ''} onChange={handleChange} /></Grid>
            <Grid item size={6}><TextField fullWidth label="Bảo hành" name="warranty" value={formData.warranty || ''} onChange={handleChange} /></Grid>
            <Grid item size={6}>
              <FormControl fullWidth>
                <InputLabel>Vị trí</InputLabel>
                <Select name="location" value={formData.location || ''} label="Vị trí" onChange={handleChange}>
                  {mapOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item size={6}><FormControl fullWidth><InputLabel>Trạng thái</InputLabel><Select value={getStatusValue()} label="Trạng thái" onChange={handleStatusChange}><MenuItem value={0}>Chưa bán</MenuItem><MenuItem value={1}>Đã cọc</MenuItem><MenuItem value={2}>Đã bán</MenuItem></Select></FormControl></Grid>
            <Grid item size={6}>
              <Button style={{height: '48px'}}  fullWidth={isMobile} variant="outlined" component="label">
                Upload ảnh
                <input hidden type="file" accept="image/*" multiple onChange={handleUploadImages} />
              </Button>
            </Grid>
            {(getImageUrls(formData.listImage).length > 0 || pendingImages.length > 0) && (
              <Grid item size={12}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Bộ sưu tập ảnh</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {getImageUrls(formData.listImage)
                    .filter((url) => !(Array.isArray(formData.image_assets) ? formData.image_assets : []).some((asset) => asset.url === url))
                    .map((url) => (
                    <Box key={url} sx={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 2, p: 1, width: { xs: '30', sm: '40' },height: {xs: '30', sm: '40' } }}>
                      <Box component="img" src={url} alt="Laptop" sx={{ width: { xs: '100%' }, objectFit: 'cover', borderRadius: 1, display: 'block'}} />
                      <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                        <Button fullWidth={isMobile} size="small" variant="outlined" component="a" href={url} download target="_blank" rel="noopener noreferrer">Download</Button>
                        <Button fullWidth={isMobile} size="small" color="error" variant="outlined" onClick={() => handleRemoveUrlImage(url)}>Xóa</Button>
                      </Box>
                    </Box>
                  ))}
                  {(Array.isArray(formData.image_assets) ? formData.image_assets : []).map((image) => (
                    <Box key={image.public_id || image.url} sx={{ position: 'relative', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 2, p: 1, width: { xs: '30', sm: '40' },height: { xs: '30', sm: '40' } }}>
                      <Box component="img" src={image.url} alt={image.public_id || 'Uploaded image'} sx={{ width: { xs: '100%', sm: 60 }, height: { xs: 60, sm: 60 }, objectFit: 'cover', borderRadius: 1, display: 'block' }} />
                      <IconButton size="small" onClick={() => handleRemoveUploadedImage(image.public_id)} sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', '&:hover': { bgcolor: 'rgba(211,47,47,0.85)' } }}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  {pendingImages.map((image) => (
                    <Box key={image.id} sx={{ position: 'relative', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 2, p: 1, width: { xs: '30', sm: '40' }, height: { xs: '30', sm: '40' } }}>
                      <Box component="img" src={image.previewUrl} alt={image.file.name} sx={{ width: { xs: '100%', sm: 60 }, height: { xs: 60, sm: 60 }, objectFit: 'cover', borderRadius: 1, display: 'block' }} />
                      <IconButton size="small" onClick={() => handleRemovePendingImage(image.id)} sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', '&:hover': { bgcolor: 'rgba(211,47,47,0.85)' } }}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Grid>
            )}
            <Grid item size={12}>
              <Box sx={{ position: 'relative' }}>
                <IconButton
                  size="small"
                  onClick={() => handleCopy(formData.raw_text_summary)}
                  sx={{ position: 'absolute', top: 6, right: 6, zIndex: 2, bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', '&:hover': { bgcolor: 'rgba(126,87,194,0.85)' } }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
                <TextField fullWidth label="Tóm tắt nội dung gốc" name="raw_text_summary" value={formData.raw_text_summary || ''} onChange={handleChange} multiline minRows={2} />
              </Box>
            </Grid>
            <Grid item size={12}>
              <Box sx={{ position: 'relative' }}>
                <IconButton
                  size="small"
                  onClick={() => handleCopy(Array.isArray(formData.seo_keywords) ? formData.seo_keywords.join(', ') : formData.seo_keywords)}
                  sx={{ position: 'absolute', top: 6, right: 6, zIndex: 2, bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', '&:hover': { bgcolor: 'rgba(126,87,194,0.85)' } }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
                <TextField fullWidth label="SEO keywords (dấu phẩy)" value={Array.isArray(formData.seo_keywords) ? formData.seo_keywords.join(', ') : formData.seo_keywords || ''} onChange={(e) => setFormData((prev) => ({ ...prev, seo_keywords: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) }))} />
              </Box>
            </Grid>
            <Grid item size={12}>
              <Box sx={{ position: 'relative' }}>
                <IconButton
                  size="small"
                  onClick={() => handleCopy(formData.facebook_post)}
                  sx={{ position: 'absolute', top: 6, right: 6, zIndex: 2, bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', '&:hover': { bgcolor: 'rgba(126,87,194,0.85)' } }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
                <TextField fullWidth label="Facebook post" name="facebook_post" value={formData.facebook_post || ''} onChange={handleChange} multiline minRows={4} />
              </Box>
            </Grid>
            <Grid item xs={12}><Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.12)' }} /></Grid>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, flexDirection: { xs: 'column-reverse', sm: 'row' }, position: { xs: 'fixed', sm: 'static' }, left: 0, right: 0, bottom: 0, p: { xs: 1.5, sm: 0 }, bgcolor: { xs: 'background.paper', sm: 'transparent' }, borderTop: { xs: '1px solid rgba(255,255,255,0.12)', sm: 'none' }, zIndex: { xs: 1200, sm: 'auto' } }}>
              <Button style={{height: '48px'}} fullWidth={isMobile} variant="outlined" onClick={() => navigate('/laptops')}>Hủy bỏ</Button>
              <Button style={{height: '48px'}} fullWidth={isMobile} type="submit" variant="contained" color="primary">Lưu thông tin</Button>
            </Grid>
          </Grid>
        </form>
          </>
        )}
      </Paper>
      <Snackbar open={Boolean(error)} autoHideDuration={4000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}><Alert onClose={() => setError('')} severity="error" variant="filled">{error}</Alert></Snackbar>
    </Box>
  );
}
