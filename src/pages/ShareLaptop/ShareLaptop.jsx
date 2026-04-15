import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, Dialog, DialogContent, IconButton, Link, Paper, Snackbar, Stack, Typography } from '@mui/material';
import { Add as AddIcon, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, Remove as RemoveIcon, ZoomIn as ZoomInIcon } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { laptop_api } from '../../api/laptop_api';
import { getGoogleMapByValue, getGoogleMapEmbedUrl } from '../../config/googleMaps';

function getImageUrls(input) {
  // Parse raw image list into an array of URLs.
  return String(input || '')
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getStatusLabel(status) {
  // Map numeric status to user-facing label.
  if (Number(status) === 2) return 'Đã bán';
  if (Number(status) === 1) return 'Đã cọc';
  return 'Còn hàng';
}

function getStatusColor(status) {
  // Map numeric status to MUI chip color.
  if (Number(status) === 2) return 'success';
  if (Number(status) === 1) return 'warning';
  return 'default';
}

const SHARE_CACHE_TTL_MS = 2 * 60 * 1000;
const sharePageCache = new Map();

export default function ShareLaptop() {
  const { serial } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [laptop, setLaptop] = useState(null);
  const [marketLinks, setMarketLinks] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [adminContact, setAdminContact] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [isMapVisible, setIsMapVisible] = useState(false);

  const applySharePayload = useCallback((payload) => {
    // Apply API payload to page state in one place.
    setLaptop(payload?.laptop || null);
    setMarketLinks(Array.isArray(payload?.market_links) ? payload.market_links : []);
    setRelatedProducts(Array.isArray(payload?.related_products) ? payload.related_products.slice(0, 3) : []);
    setAdminContact(payload?.admin_contact || null);
  }, []);

  useEffect(() => {
    // Load share payload from backend by serial.
    if (!serial) {
      setError('Thiếu serial để chia sẻ');
      setIsLoading(false);
      return;
    }
    const serialKey = encodeURIComponent(decodeURIComponent(serial));
    const now = Date.now();
    const cached = sharePageCache.get(serialKey);
    if (cached && now - cached.timestamp < SHARE_CACHE_TTL_MS) {
      applySharePayload(cached.payload);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const fetchShareData = async () => {
      setIsLoading(true);
      try {
        const data = await laptop_api.get_share_info_api(serialKey);
        if (!isMounted) return;
        applySharePayload(data);
        sharePageCache.set(serialKey, { timestamp: Date.now(), payload: data });
      } catch (err) {
        if (!isMounted) return;
        setError(err.response?.data?.message || 'Không tải được trang chia sẻ');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchShareData();
    return () => {
      isMounted = false;
    };
  }, [serial, applySharePayload]);

  const images = useMemo(() => {
    // Build share page gallery from image assets and fallback URLs.
    if (!laptop) return [];
    if (Array.isArray(laptop.image_assets) && laptop.image_assets.length > 0) {
      return laptop.image_assets.map((item) => item.url).filter(Boolean);
    }
    return getImageUrls(laptop.listImage);
  }, [laptop]);

  const activeImage = images[activeImageIndex] || '';
  const selectedMap = getGoogleMapByValue(laptop?.location);
  const selectedMapEmbedUrl = getGoogleMapEmbedUrl(selectedMap);
  const relatedProductsWithImage = useMemo(() => {
    // Pre-compute primary image for related products once per payload.
    return relatedProducts.map((item) => ({
      ...item,
      primaryImage: Array.isArray(item?.image_assets) && item.image_assets.length > 0
        ? (item.image_assets[0]?.url || '')
        : (getImageUrls(item?.listImage || '')[0] || ''),
    }));
  }, [relatedProducts]);

  useEffect(() => {
    // Keep active image index valid when gallery size changes.
    if (activeImageIndex >= images.length) {
      setActiveImageIndex(0);
    }
  }, [images.length, activeImageIndex]);

  const handlePrevImage = useCallback(() => {
    // Navigate to previous image in carousel.
    if (images.length <= 1) return;
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleNextImage = useCallback(() => {
    // Navigate to next image in carousel.
    if (images.length <= 1) return;
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handleZoomIn = useCallback(() => {
    // Increase zoom scale for preview dialog.
    setZoomScale((prev) => Math.min(prev + 0.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    // Decrease zoom scale for preview dialog.
    setZoomScale((prev) => Math.max(prev - 0.2, 1));
  }, []);

  const handleOpenZoom = useCallback(() => {
    // Open fullscreen preview dialog.
    if (!activeImage) return;
    setZoomScale(1);
    setIsZoomOpen(true);
  }, [activeImage]);

  const handleCloseZoom = useCallback(() => {
    // Close fullscreen preview dialog.
    setIsZoomOpen(false);
  }, []);

  return (
    <Box sx={{ maxWidth: 980, mx: 'auto', px: { xs: 1.5, sm: 2 }, py: { xs: 2, sm: 4 } }}>
      {isLoading ? (
        <Box sx={{ py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={30} />
          <Typography variant="body2" color="text.secondary">Đang tải thông tin máy...</Typography>
        </Box>
      ) : (
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          {!laptop ? (
            <Typography variant="body1">Không tìm thấy sản phẩm.</Typography>
          ) : (
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{laptop.product_name || 'Laptop'}</Typography>
                  <Typography variant="body2" color="text.secondary">Serial: {laptop.serial || '-'}</Typography>
                </Box>
                <Chip label={getStatusLabel(laptop.status)} color={getStatusColor(laptop.status)} />
              </Box>

              <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', bgcolor: 'background.default', minHeight: { xs: 220, sm: 360 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {activeImage ? (
                  <img src={activeImage} alt={laptop.product_name || 'Laptop'} style={{ width: '100%', maxHeight: 420, objectFit: 'contain', cursor: 'zoom-in' }} loading="eager" decoding="async" onClick={handleOpenZoom} />
                ) : (
                  <Typography variant="body2" color="text.secondary">Chưa có ảnh sản phẩm</Typography>
                )}
                {images.length > 1 && (
                  <>
                    <IconButton onClick={handlePrevImage} sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.4)', color: '#fff' }}>
                      <ChevronLeftIcon />
                    </IconButton>
                    <IconButton onClick={handleNextImage} sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.4)', color: '#fff' }}>
                      <ChevronRightIcon />
                    </IconButton>
                  </>
                )}
                {activeImage && (
                  <IconButton onClick={handleOpenZoom} sx={{ position: 'absolute', right: 8, bottom: 8, bgcolor: 'rgba(0,0,0,0.45)', color: '#fff' }}>
                    <ZoomInIcon />
                  </IconButton>
                )}
              </Box>

              <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
                {images.map((imageUrl, index) => (
                  <Box key={`${imageUrl}-${index}`} onClick={() => setActiveImageIndex(index)} sx={{ border: index === activeImageIndex ? '2px solid #1e3a8a' : '1px solid rgba(255,255,255,0.15)', borderRadius: 1, overflow: 'hidden', cursor: 'pointer', minWidth: 72, width: 72, height: 72 }}>
                    <img src={imageUrl} alt={`thumb-${index}`} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                ))}
              </Stack>

              <Typography variant="h6">{laptop.price || 'Liên hệ'}</Typography>
              <Typography variant="body2">{laptop.raw_text_summary || 'Chưa có mô tả.'}</Typography>
              <Typography variant="body2"><strong>Cấu hình:</strong> {`${laptop.cpu || '-'} | ${laptop.ram || '-'} | ${laptop.ssd || '-'} | ${laptop.display || '-'}`}</Typography>
              <Typography variant="body2"><strong>Pin:</strong> {laptop.battery || '-'} | <strong>Bảo hành:</strong> {laptop.warranty || '-'}</Typography>
              <Typography variant="body2">
                <strong>Khu vực:</strong> {selectedMap?.label || laptop.location || '-'}
              </Typography>
              {selectedMap?.mapUrl ? (
                <Typography variant="body2">
                  <strong>Bản đồ:</strong>{' '}
                  <Link href={selectedMap.mapUrl} target="_blank" rel="noopener noreferrer" underline="hover">
                    Xem trên Google Maps
                  </Link>
                </Typography>
              ) : null}
              {selectedMapEmbedUrl ? (
                <Box>
                  {!isMapVisible ? (
                    <Button variant="outlined" size="small" onClick={() => setIsMapVisible(true)}>Hiển thị bản đồ</Button>
                  ) : (
                    <Box sx={{ borderRadius: 1.5, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
                      <Box
                        component="iframe"
                        title={`map-${selectedMap.value}`}
                        src={selectedMapEmbedUrl}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        sx={{ width: '100%', height: { xs: 220, sm: 300 }, border: 0, display: 'block' }}
                      />
                    </Box>
                  )}
                </Box>
              ) : null}
              <Box sx={{ p: 1.5, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.75 }}>Liên hệ</Typography>
                <Typography variant="body2"><strong>Người phụ trách:</strong> {adminContact?.name || 'Admin'}</Typography>
                {adminContact?.phone ? (
                  <Typography variant="body2">
                    <strong>Điện thoại:</strong> <Link href={`tel:${adminContact.phone}`} underline="hover">{adminContact.phone}</Link>
                  </Typography>
                ) : null}
                {adminContact?.email ? (
                  <Typography variant="body2">
                    <strong>Email:</strong> <Link href={`mailto:${adminContact.email}`} underline="hover">{adminContact.email}</Link>
                  </Typography>
                ) : null}
                {adminContact?.zalo ? (
                  <Typography variant="body2">
                    <strong>Zalo:</strong> <Link href={adminContact.zalo} target="_blank" rel="noopener noreferrer" underline="hover">{adminContact.zalo}</Link>
                  </Typography>
                ) : null}
                {adminContact?.facebook ? (
                  <Typography variant="body2">
                    <strong>Facebook:</strong> <Link href={adminContact.facebook} target="_blank" rel="noopener noreferrer" underline="hover">{adminContact.facebook}</Link>
                  </Typography>
                ) : null}
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Sản phẩm liên quan</Typography>
                {relatedProducts.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">Chưa có sản phẩm liên quan phù hợp.</Typography>
                ) : (
                  <Stack spacing={1.25}>
                    {relatedProductsWithImage.map((item) => (
                      <Box
                        key={item.serial}
                        onClick={() => { window.location.href = `/share/${encodeURIComponent(item.serial)}`; }}
                        sx={{
                          p: 1.25,
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: 1.5,
                          display: 'flex',
                          gap: 1.25,
                          cursor: 'pointer',
                          '&:hover': { borderColor: 'rgba(30, 58, 138, 0.7)', bgcolor: 'rgba(30, 58, 138, 0.06)' }
                        }}
                      >
                        <Box sx={{ width: 72, height: 72, borderRadius: 1, overflow: 'hidden', bgcolor: 'background.default', flexShrink: 0 }}>
                          {item.primaryImage ? (
                            <img src={item.primaryImage} alt={item.product_name || 'related'} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : null}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.product_name || '-'}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">{`${item.brand || '-'} ${item.line ? `- ${item.line}` : ''}`}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">{`${item.cpu || '-'} | ${item.ram || '-'} | ${item.ssd || '-'}`}</Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>{item.price || 'Liên hệ'}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Tham khảo giá thị trường</Typography>
                {marketLinks.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">Chưa có dữ liệu tham khảo giá.</Typography>
                ) : (
                  <Stack spacing={1}>
                    {marketLinks.map((item) => (
                      <Box key={item.url} sx={{ p: 1.25, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Nguồn: {item.domain || 'unknown'}
                        </Typography>
                        <Link href={item.url} target="_blank" rel="noopener noreferrer" underline="hover">{item.title}</Link>
                        <Typography variant="caption" color="text.secondary" display="block">{item.snippet}</Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          Giá tham khảo: {item.reference_price_text || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          So sánh: {item.compare_label || 'Chưa đủ dữ liệu để so sánh'}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>

              
            </Stack>
          )}
        </Paper>
      )}

      <Dialog open={isZoomOpen} onClose={handleCloseZoom} fullWidth maxWidth="lg">
        <DialogContent sx={{ bgcolor: '#111', p: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 1 }}>
            <Button variant="outlined" color="inherit" size="small" startIcon={<RemoveIcon />} onClick={handleZoomOut}>Thu nhỏ</Button>
            <Button variant="outlined" color="inherit" size="small" startIcon={<AddIcon />} onClick={handleZoomIn}>Phóng to</Button>
          </Box>
          <Box sx={{ height: { xs: 380, sm: 620 }, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {activeImage && <img src={activeImage} alt="zoom-preview" style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center', transition: 'transform .15s ease', maxWidth: '90%', maxHeight: '90%' }} />}
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar open={Boolean(error)} autoHideDuration={4000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="error" variant="filled" onClose={() => setError('')}>{error}</Alert>
      </Snackbar>
    </Box>
  );
}
