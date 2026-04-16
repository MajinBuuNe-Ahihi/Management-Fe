import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Chip, 
  CircularProgress, Tooltip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axiosClient from '../../api/axiosClient';
import ApprovalModal from './ApprovalModal';
import { useNotification } from '../../context/NotificationContext';
import { initSocket, disconnectSocket } from '../../utils/socket';

export default function ApprovalCenter() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { notify } = useNotification();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/approvals/?status=0');
      const data = response.data?.request_details || [];
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch approvals', err);
      notify("Không thể tải danh sách yêu cầu", "error");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    const socket = initSocket();
    if (socket) {
      socket.on('notification', (notif) => {
        // If it's a new approval request, refresh the list
        if (notif.data?.type === 'approval_required' || notif.title?.includes('phê duyệt')) {
          fetchRequests();
        }
      });
    }

    return () => {
      disconnectSocket();
    };
  }, []);

  const handleOpenDetail = (request) => {
    setSelectedRequest(request);
    setModalOpen(true);
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Trung tâm phê duyệt</Typography>
          <Typography variant="body2" color="text.secondary">Xem xét, chỉnh sửa và xác nhận các yêu cầu từ nhân viên.</Typography>
        </Box>
        {loading && <CircularProgress size={24} />}
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Danh mục</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Hành động</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Người gửi</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Thời gian</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleOpenDetail(request)}>
                <TableCell sx={{ fontWeight: 600 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                      {request.module.toUpperCase()}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {request.payload?.name || request.payload?.customer_name || request.payload?.product_name || "N/A"}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={request.action_type === 'add' ? 'Thêm mới' : 'Chỉnh sửa'} 
                    size="small" 
                    color={request.action_type === 'add' ? 'success' : 'info'} 
                    variant="outlined" 
                    sx={{ fontWeight: 700 }} 
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{request.requester_name || 'Hệ thống'}</Typography>
                  <Typography variant="caption" color="text.secondary">ID: ...{request.requester_id?.slice(-6)}</Typography>
                </TableCell>
                <TableCell>{new Date(request.created_at).toLocaleString('vi-VN')}</TableCell>
                <TableCell>
                   <Chip label="Đang chờ" color="warning" size="small" />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Xem chi tiết & Phê duyệt">
                    <IconButton color="primary" onClick={(e) => { e.stopPropagation(); handleOpenDetail(request); }}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {requests.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                   <Typography color="text.secondary">Không có yêu cầu nào đang chờ xử lý.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ApprovalModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        request={selectedRequest} 
        onRefresh={fetchRequests}
      />
    </Box>
  );
}
