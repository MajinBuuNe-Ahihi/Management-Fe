import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axiosClient from '../../api/axiosClient';
import InvoiceFormModal from './InvoiceFormModal';

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const user = useSelector((state) => state.auth.user);
  const userRole = user?.role; // 0: Super, 1: Manager

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get(`/invoices/?search=${search}`);
      const data = response.data?.invoices || [];
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch invoices', err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);
  
  useEffect(() => {
    // Listen for real-time sync events
    const handleRefresh = (e) => {
      if (!e.detail || e.detail.module === 'invoices') {
        console.log('Real-time sync: Refreshing invoices');
        fetchInvoices();
      }
    };
    
    window.addEventListener('data-refresh', handleRefresh);
    return () => window.removeEventListener('data-refresh', handleRefresh);
  }, []);

  const handleOpenAdd = () => {
    setSelectedInvoice(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inv) => {
    setSelectedInvoice(inv);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    fetchInvoices();
  };

  // Currency Formatter
  const formatVND = (value) => {
    if (!value) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Quản lý Hóa đơn & Tài chính</Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Tìm theo tên máy hoặc serial..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
            Thêm Hóa đơn
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Ngày</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Thông tin máy</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Giá bán</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Phí phát sinh</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Lý do phát sinh chi phí</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Nguồn hàng</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Bảo hành</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Khách hàng</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Số điện thoại</TableCell>
              {userRole === 0 && (
                <>
                  <TableCell sx={{ fontWeight: 700 }}>Giá nhập</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Lợi nhuận</TableCell>
                </>
              )}
              <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Trạng thái bảo hành</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id} hover>
                <TableCell variant="caption">{new Date(inv.created_at).toLocaleDateString('vi-VN')}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{inv.machine_name}</Typography>
                  <Typography variant="caption" color="text.secondary">{inv.serial}</Typography>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{formatVND(inv.sale_price)}</TableCell>
                <TableCell color="error.main">{formatVND(inv.expenses)}</TableCell>
                <TableCell>{inv.issue_reason}</TableCell>
                <TableCell>{inv.source}</TableCell>
                <TableCell>{inv.warranty_months}</TableCell>
                <TableCell>{inv.customer_name}</TableCell>
                <TableCell>{inv.customer_phone}</TableCell>
                {userRole === 0 && (
                  <>
                    <TableCell>{formatVND(inv.cost_price)}</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: inv.profit >= 0 ? 'success.main' : 'error.main' }}>
                      {formatVND(inv.profit)}
                    </TableCell>
                  </>
                )}

                <TableCell>
                  <Chip
                    label={inv.status === 1 ? "Hoàn tất" : "Chưa hoàn tất"}
                    color={inv.status === 1 ? "success" : "warning"}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                </TableCell>
                <TableCell>
                  {/* Trạng thái bảo hành */}
                  {/* 1: Còn bảo hành, 2: Hết bảo hành */}
                   {/* được tính bằng createddate + tháng bảo hành  so sánh với ngày hiện tại */}
                  {new Date(inv.created_at).getTime() + inv.warranty_months * 30 * 24 * 60 * 60 * 1000 > new Date().getTime() ? (
                    <Chip
                      label="Còn bảo hành"
                      color="success"
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                  ) : (
                    <Chip
                      label="Hết bảo hành"
                      color="warning"
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                  )}  
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpenEdit(inv)} color="primary">
                    <EditIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {invoices.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={userRole === 0 ? 8 : 6} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                  Không tìm thấy dữ liệu hóa đơn nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <InvoiceFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        initialData={selectedInvoice}
      />
    </Box>
  );
}

