import {
  Search as SearchIcon
} from '@mui/icons-material';
import {
  Box,
  Chip,
  InputAdornment,
  Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axiosClient from '../../api/axiosClient';
export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const user = useSelector((state) => state.auth.user);
  const userRole = user?.role; // 0: Super, 1: Manager

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get(`/invoices/?search=${search}`);
      // Safety check: ensure invoices is always an array
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

  // Currency Formatter
  const formatVND = (value) => {
    if (!value) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Quản lý Hóa đơn & Tài chính</Typography>
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
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Ngày</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Thông tin máy</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Giá bán</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Phí phát sinh</TableCell>
              {/* Show Cost Price and Profit only for Superadmin (0) */}
              {userRole === 0 && (
                <>
                  <TableCell sx={{ fontWeight: 700 }}>Giá nhập</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Lợi nhuận</TableCell>
                </>
              )}
              <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
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
                    label="Hoàn tất"
                    color="success"
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                </TableCell>
              </TableRow>
            ))}
            {invoices.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                  Không tìm thấy dữ liệu hóa đơn nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
