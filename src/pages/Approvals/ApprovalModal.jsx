import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, TextField, Typography, useMediaQuery, useTheme,
  IconButton, Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axiosClient from '../../api/axiosClient';
import InvoiceApprovalForm from './forms/InvoiceApprovalForm';
import LaptopApprovalForm from './forms/LaptopApprovalForm';
import CustomerApprovalForm from './forms/CustomerApprovalForm';
import { useNotification } from '../../context/NotificationContext';

export default function ApprovalModal({ open, onClose, request, onRefresh }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { notify } = useNotification();

  const [updatedPayload, setUpdatedPayload] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (request && request.payload) {
      setUpdatedPayload(request.payload);
    }
    setRejectReason('');
  }, [request]);

  const handleApprove = async () => {
    if (!request) return;
    try {
      setLoading(true);
      await axiosClient.post(`/approvals/${request.id}/approve`, { payload: updatedPayload });
      notify("Đã phê duyệt yêu cầu thành công!", "success");
      onRefresh();
      onClose();
    } catch (err) {
      notify(err.response?.data?.message || "Lỗi khi phê duyệt", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!request) return;
    try {
      setLoading(true);
      await axiosClient.post(`/approvals/${request.id}/reject`, { reason: rejectReason });
      notify("Đã từ chối yêu cầu.", "info");
      onRefresh();
      onClose();
    } catch (err) {
      notify("Có lỗi xảy ra", "error");
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    if (!request || !updatedPayload) return null;

    switch (request.module) {
      case 'invoices':
        return <InvoiceApprovalForm payload={updatedPayload} onChange={setUpdatedPayload} />;
      case 'laptops':
        return <LaptopApprovalForm payload={updatedPayload} onChange={setUpdatedPayload} />;
      case 'customers':
      case 'customer_care':
        return <CustomerApprovalForm payload={updatedPayload} onChange={setUpdatedPayload} />;
      default:
        return (
          <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.7 }}>Dữ liệu yêu cầu phê duyệt:</Typography>
            <Grid container spacing={2}>
              {Object.entries(updatedPayload).map(([key, value]) => (
                <Grid item xs={12} sm={6} key={key}>
                  <TextField
                    fullWidth
                    label={key.toUpperCase()}
                    value={typeof value === 'object' ? JSON.stringify(value) : (value || '')}
                    onChange={(e) => setUpdatedPayload({ ...updatedPayload, [key]: e.target.value })}
                    size="small"
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: fullScreen ? 0 : 3 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Chi tiết yêu cầu phê duyệt</Typography>
          <Typography variant="caption" color="text.secondary">
            Mô-đun: {request?.module.toUpperCase()} | Hành động: {request?.action_type} | Người gửi: {request?.requester_name || '...'}
          </Typography>
        </Box>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {renderForm()}

        <Box sx={{ mt: 4 }}>
          <TextField
            fullWidth label="Lý do từ chối (nếu có)"
            variant="outlined" multiline rows={2}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={onClose} disabled={loading} variant="outlined" sx={{ minWidth: 100 }}>Bỏ qua</Button>
        <Button
          onClick={handleReject}
          color="error"
          variant="outlined"
          disabled={loading}
          sx={{ minWidth: 100 }}
        >
          Từ chối
        </Button>
        <Button
          onClick={handleApprove}
          color="success"
          variant="contained"
          disabled={loading || (request?.module === 'invoices' && !updatedPayload?.cost_price)}
          sx={{ minWidth: 150, fontWeight: 700 }}
        >
          {loading ? 'Đang xử lý...' : 'Duyệt & Thực thi'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
