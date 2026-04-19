import React, { useEffect, useState } from 'react';
import { 
  Box, Card, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Typography, Chip, IconButton, 
  Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { inquiry_api } from '../../api/content_api';
import { useNotification } from '../../context/NotificationContext';

export default function InquiryList() {
  const [inquiries, setInquiries] = useState([]);
  const { notify } = useNotification();

  const fetchInquiries = async () => {
    try {
      const data = await inquiry_api.get_list_api();
      setInquiries(data.items || []);
    } catch (err) {
      notify('Không tải được danh sách yêu cầu', 'error');
    }
  };

  useEffect(() => { fetchInquiries(); }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await inquiry_api.update_api(id, { status: newStatus });
      notify('Đã cập nhật trạng thái', 'success');
      fetchInquiries();
    } catch (err) {
      notify('Cập nhật thất bại', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'contacting': return 'info';
      case 'closed': return 'success';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'contacting': return 'Đang liên hệ';
      case 'closed': return 'Đã hoàn tất';
      default: return status;
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 4 }}>Yêu cầu tư vấn</Typography>

      <TableContainer component={Card}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Khách hàng</TableCell>
              <TableCell>Số điện thoại</TableCell>
              <TableCell>Sản phẩm quan tâm</TableCell>
              <TableCell>Ngày gửi</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="right">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inquiries.map((inq) => (
              <TableRow key={inq.id}>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight={700}>{inq.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{inq.email}</Typography>
                </TableCell>
                <TableCell>{inq.phone}</TableCell>
                <TableCell>{inq.laptop_name || 'Tư vấn chung'}</TableCell>
                <TableCell>{new Date(inq.created_at).toLocaleDateString('vi-VN')}</TableCell>
                <TableCell>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={inq.status}
                      onChange={(e) => handleStatusChange(inq.id, e.target.value)}
                      sx={{ 
                        borderRadius: 2,
                        '& .MuiSelect-select': { py: 0.5, fontSize: '0.8rem' }
                      }}
                    >
                      <MenuItem value="pending">Chờ xử lý</MenuItem>
                      <MenuItem value="contacting">Đang liên hệ</MenuItem>
                      <MenuItem value="closed">Đã hoàn tất</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => notify(inq.message || 'Không có tin nhắn', 'info')}>
                    <VisibilityIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
