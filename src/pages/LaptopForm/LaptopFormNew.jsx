import React, { useEffect, useState } from 'react';
import { 
  Alert, Box, Button, CircularProgress, Divider, FormControl, IconButton, 
  InputLabel, MenuItem, Paper, Select, Snackbar, TextField, Typography, 
  useMediaQuery, useTheme 
} from '@mui/material';
import Grid from '@mui/material/Grid';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useNavigate, useParams } from 'react-router-dom';
import { laptop_api } from '../../api/laptop_api';
import { upload_api } from '../../api/upload_api';
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
  const [successMsg, setSuccessMsg] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingImages, setPendingImages] = useState([]);

  const mapOptions = formData.location && !GOOGLE_MAP_OPTIONS.some((item) => item.value === formData.location)
    ? [{ value: formData.location, label: `Custom - ${formData.location}` }, ...GOOGLE_MAP_OPTIONS]
    : GOOGLE_MAP_OPTIONS;

  useEffect(() => {
    if (!isEditMode || !serial) return;
    const fetchLaptopBySerial = async () => {
      setIsLoading(true);
      try {
        const decodedSerial = decodeURIComponent(serial);
        const data = await laptop_api.get_by_serial_api(decodedSerial);
        setFormData({
          ...data,
          quantity: Number(data?.quantity) > 0 ? Number(data.quantity) : 1,
          status: Number.isInteger(Number(data?.status)) ? Number(data.status) : 0,
          createdDate: data?.createdDate ? data.createdDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
          seo_keywords: Array.isArray(data?.seo_keywords) ? data.seo_keywords : []
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

  const handleRemoveUploadedImage = async (publicId) => {
    try {
      await upload_api.delete_image_api(publicId);
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

  const handleRemovePendingImage = (targetId) => {
    setPendingImages((prev) => {
      const target = prev.find((item) => item.id === targetId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== targetId);
    });
  };

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
      const data = await laptop_api.extract_info_api(rawInformation);
      setFormData((prev) => ({ ...prev, ...data, source: 'AI' }));
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
      setIsLoading(true);
      let updatedImageAssets = [...normalizedAssets];
      if (pendingImages.length > 0) {
        const uploadPayload = new FormData();
        pendingImages.forEach((item) => uploadPayload.append('file', item.file));
        const uploadRes = await upload_api.upload_images_api(uploadPayload);
        const newAssets = Array.isArray(uploadRes) ? uploadRes : [uploadRes];
        updatedImageAssets = [...updatedImageAssets, ...newAssets];
      }
      const finalPayload = {
        ...payload,
        image_assets: updatedImageAssets,
        listImage: Array.from(new Set([
          ...getImageUrls(formData.listImage),
          ...updatedImageAssets.map(a => a.url)
        ])).join('\n')
      };
      
      let response;
      if (isEditMode) {
        const decodedSerial = decodeURIComponent(serial);
        response = await laptop_api.update_by_serial_api(decodedSerial, finalPayload);
      } else {
        response = await laptop_api.create_api(finalPayload);
      }
      
      // Handle Approval Required (Status 202)
      if (response?.status === 202 || (response?.message && response.message.includes('phê duyệt'))) {
        setSuccessMsg(response.message || 'Yêu cầu của bạn đang chờ cấp trên phê duyệt.');
        setTimeout(() => navigate('/laptops'), 3000);
      } else {
        navigate('/laptops');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lưu thông tin thất bại');
    } finally {
      setIsLoading(false);
    }
  };

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
        <Grid container spacing={2} alignItems="stretch">
          <Grid item size = {12} md={9} sx={{ display: 'flex' }}>
            <TextField fullWidth multiline minRows={4} value={rawInformation} onChange={(e) => setRawInformation(e.target.value)} placeholder="Nhập dữ liệu bài đăng laptop..." />
          </Grid>
          <Grid item size = {2} md={3} sx={{ display: 'flex' }}>
            <Button fullWidth variant="contained" color="secondary" onClick={handleAnalyze} disabled={isAnalyzing} startIcon={<AutoFixHighIcon />} sx={{ height: '100%', minHeight: '56px' }}>
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
              <Grid container spacing={2.5} alignItems="stretch">
                <Grid item size = {6}><TextField fullWidth label="Hãng" name="brand" value={formData.brand || ''} onChange={handleChange} variant="outlined" /></Grid>
                <Grid item size = {6}><TextField fullWidth label="Serial Number" name="serial" value={formData.serial || ''} onChange={handleChange} required disabled={isEditMode} variant="outlined" /></Grid>
                <Grid item size = {6}><TextField fullWidth type="date" label="Ngày nhập" name="createdDate" value={formData.createdDate || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} variant="outlined" /></Grid>
                <Grid item size = {6}><TextField fullWidth label="Tên máy" name="product_name" value={formData.product_name || ''} onChange={handleChange} required variant="outlined" /></Grid>
                <Grid item size = {6}><TextField fullWidth label="Dòng máy" name="line" value={formData.line || ''} onChange={handleChange} variant="outlined" /></Grid>
                <Grid item size = {6}><TextField fullWidth label="Tình trạng" name="condition" value={formData.condition || ''} onChange={handleChange} variant="outlined" /></Grid>
                <Grid item size = {6}><TextField fullWidth label="CPU" name="cpu" value={formData.cpu || ''} onChange={handleChange} variant="outlined" /></Grid>
                <Grid item size = {6}><TextField fullWidth label="RAM" name="ram" value={formData.ram || ''} onChange={handleChange} variant="outlined" /></Grid>
                <Grid item size = {6}><TextField fullWidth label="SSD" name="ssd" value={formData.ssd || ''} onChange={handleChange} variant="outlined" /></Grid>
                <Grid item size = {6}><TextField fullWidth label="Display" name="display" value={formData.display || ''} onChange={handleChange} variant="outlined" /></Grid>
                <Grid item size = {6}><TextField fullWidth label="Battery" name="battery" value={formData.battery || ''} onChange={handleChange} variant="outlined" /></Grid>
                <Grid item size = {6}><TextField fullWidth label="Weight" name="weight" value={formData.weight || ''} onChange={handleChange} variant="outlined" /></Grid>
                <Grid item size = {6}><TextField fullWidth type="number" label="Số lượng sản phẩm" name="quantity" value={formData.quantity ?? 1} onChange={handleChange} inputProps={{ min: 1 }} variant="outlined" /></Grid>
                <Grid item size = {6}><TextField fullWidth label="Giá tiền" name="price" value={formData.price || ''} onChange={handleChange} variant="outlined" /></Grid>
                <Grid item size = {6}><TextField fullWidth label="Bảo hành" name="warranty" value={formData.warranty || ''} onChange={handleChange} variant="outlined" /></Grid>
                <Grid item size = {6}>
                  <FormControl fullWidth>
                    <InputLabel>Vị trí</InputLabel>
                    <Select name="location" value={formData.location || ''} label="Vị trí" onChange={handleChange}>
                      {mapOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item size = {6}>
                  <FormControl fullWidth>
                    <InputLabel>Trạng thái</InputLabel>
                    <Select value={getStatusValue()} label="Trạng thái" onChange={handleStatusChange}>
                      <MenuItem value={0}>Chưa bán</MenuItem>
                      <MenuItem value={1}>Đã cọc</MenuItem>
                      <MenuItem value={2}>Đã bán</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item size = {6}>
                  <Button fullWidth variant="outlined" component="label" sx={{ height: '56px' }}>
                    Upload ảnh
                    <input hidden type="file" accept="image/*" multiple onChange={handleUploadImages} />
                  </Button>
                </Grid>
                <Grid item size = {12}>
                  <Box sx={{ position: 'relative' }}>
                    <IconButton size="small" onClick={() => handleCopy(formData.raw_text_summary)} sx={{ position: 'absolute', top: 6, right: 6, zIndex: 2, bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', '&:hover': { bgcolor: 'rgba(30, 58, 138, 0.85)' } }}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                    <TextField fullWidth label="Tóm tắt nội dung gốc" name="raw_text_summary" value={formData.raw_text_summary || ''} onChange={handleChange} multiline minRows={2} />
                  </Box>
                </Grid>
                <Grid item size = {12}>
                  <Box sx={{ position: 'relative' }}>
                    <IconButton size="small" onClick={() => handleCopy(Array.isArray(formData.seo_keywords) ? formData.seo_keywords.join(', ') : formData.seo_keywords)} sx={{ position: 'absolute', top: 6, right: 6, zIndex: 2, bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', '&:hover': { bgcolor: 'rgba(30, 58, 138, 0.85)' } }}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                    <TextField fullWidth label="SEO keywords (dấu phẩy)" value={Array.isArray(formData.seo_keywords) ? formData.seo_keywords.join(', ') : formData.seo_keywords || ''} onChange={(e) => setFormData((prev) => ({ ...prev, seo_keywords: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) }))} />
                  </Box>
                </Grid>
                <Grid item size = {12}>
                  <Box sx={{ position: 'relative' }}>
                    <IconButton size="small" onClick={() => handleCopy(formData.facebook_post)} sx={{ position: 'absolute', top: 6, right: 6, zIndex: 2, bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', '&:hover': { bgcolor: 'rgba(30, 58, 138, 0.85)' } }}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                    <TextField fullWidth label="Facebook post" name="facebook_post" value={formData.facebook_post || ''} onChange={handleChange} multiline minRows={4} />
                  </Box>
                </Grid>
                <Grid item size = {12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
                  <Button fullWidth={isMobile} variant="outlined" onClick={() => navigate('/laptops')} sx={{ minWidth: 120 }}>Hủy bỏ</Button>
                  <Button fullWidth={isMobile} type="submit" variant="contained" color="primary" sx={{ minWidth: 120 }}>Lưu thông tin</Button>
                </Grid>
              </Grid>
            </form>
          </>
        )}
      </Paper>
      
      {/* Messages */}
      <Snackbar open={Boolean(error)} autoHideDuration={4000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setError('')} severity="error" variant="filled">{error}</Alert>
      </Snackbar>
      
      <Snackbar open={Boolean(successMsg)} autoHideDuration={4000} onClose={() => setSuccessMsg('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setSuccessMsg('')} severity="info" variant="filled" sx={{ bgcolor: 'secondary.main' }}>
          {successMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
