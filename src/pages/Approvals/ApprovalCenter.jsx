import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Chip, 
  Button, Collapse, Card, Grid, TextField, Alert,
  Divider
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import axiosClient from '../../api/axiosClient';

function Row({ request, onAction }) {
  const [open, setOpen] = useState(false);
  const [costPrice, setCostPrice] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isInvoice = request.module === 'invoices';
  const data = request.payload || {};

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      // If it's an invoice, we might need to attach the cost price provided by the Admin
      const updatedPayload = isInvoice ? { ...data, cost_price: costPrice || data.cost_price } : null;
      
      await axiosClient.post(`/approvals/${request.id}/approve`, { payload: updatedPayload });
      onAction();
    } catch (err) {
      alert('Lỗi khi phê duyệt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsSubmitting(true);
      await axiosClient.post(`/approvals/${request.id}/reject`, { reason: rejectReason });
      onAction();
    } catch (err) {
      alert('Lỗi khi từ chối');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontWeight: 600 }}>{request.module.toUpperCase()}</TableCell>
        <TableCell>
          <Chip label={request.action_type} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
        </TableCell>
        <TableCell>{new Date(request.created_at).toLocaleString('vi-VN')}</TableCell>
        <TableCell>
           <Chip label="Đang chờ" color="warning" size="small" />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Typography variant="h6" gutterBottom component="div" sx={{ fontSize: '1rem', fontWeight: 800 }}>
                Chi tiết yêu cầu
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                  <Card sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                     <pre style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', overflow: 'auto' }}>
                        {JSON.stringify(data, null, 2)}
                     </pre>
                  </Card>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {isInvoice && (
                      <TextField 
                        label="Giá nhập máy (VNĐ)" 
                        fullWidth 
                        size="small"
                        type="number"
                        placeholder="Yêu cầu nhập giá gốc trước khi duyệt"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                        variant="filled"
                        sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}
                      />
                    )}
                    <TextField 
                      label="Lý do từ chối (nếu có)" 
                      fullWidth 
                      size="small"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      variant="filled"
                    />
                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                      <Button 
                        variant="contained" 
                        color="success" 
                        fullWidth 
                        startIcon={<CheckCircleIcon />}
                        disabled={isSubmitting || (isInvoice && !costPrice)}
                        onClick={handleApprove}
                      >
                        Phê duyệt
                      </Button>
                      <Button 
                        variant="outlined" 
                        color="error" 
                        fullWidth 
                        startIcon={<CancelIcon />}
                        disabled={isSubmitting}
                        onClick={handleReject}
                      >
                        Từ chối
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function ApprovalCenter() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/approvals/?status=0');
      // Safety check: ensure requests is always an array
      const data = response.data?.request_details || [];
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch approvals', err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Trung tâm phê duyệt</Typography>
        <Typography variant="body2" color="text.secondary">Xem xét và xác nhận các yêu cầu từ nhân viên.</Typography>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell sx={{ fontWeight: 700 }}>Danh mục</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Hành động</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Thời gian</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((request) => (
              <Row key={request.id} request={request} onAction={fetchRequests} />
            ))}
            {requests.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                   <Typography color="text.secondary">Không có yêu cầu nào đang chờ xử lý.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
