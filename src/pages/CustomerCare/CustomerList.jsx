import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Table, TableBody, TableCell,
  TableContainer, TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  useMediaQuery, useTheme
} from '@mui/material';
import { useEffect, useState } from 'react';
import { customer_api } from '../../api/customer_api';
import CustomerFormModal from './CustomerFormModal';

export default function CustomerList() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage, search]);

  const fetchData = async () => {
    try {
      const data = await customer_api.get_list_api({ page: page + 1, limit: rowsPerPage, search });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
      showToast('Không tải được dữ liệu', 'error');
    }
  };

  const showToast = (message, severity = 'info') => {
    setToast({ open: true, message, severity });
  };

  const handleOpenAdd = () => {
    setSelectedEntry(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (entry) => {
    setSelectedEntry(entry);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thông tin này?')) return;
    try {
      await customer_api.delete_api(`/customer-care/${id}`);
      showToast('Đã xóa thành công', 'success');
      fetchData();
    } catch (err) {
      showToast('Xóa thất bại', 'error');
    }
  };

  const checkWarranty = (saleDate, months) => {
    if (!saleDate || !months) return false;
    const expiry = new Date(saleDate);
    expiry.setMonth(expiry.getMonth() + Number(months));
    return expiry > new Date();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Chăm sóc khách hàng</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleOpenAdd}
          sx={{ px: 3, py: 1, borderRadius: 2 }}
        >
          Thêm thông tin
        </Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Tìm kiếm theo tên khách hàng, số điện thoại, serial..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Họ tên</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Số điện thoại</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Mã máy / Cấu hình</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Giá bán</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Lợi nhuận</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Ngày bán</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Bảo hành</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((row) => {
              const inWarranty = checkWarranty(row.sale_date, row.warranty_months);
              return (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.customer_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.customer_address}</Typography>
                  </TableCell>
                  <TableCell>{row.customer_phone}</TableCell>
                  <TableCell sx={{ maxWidth: 250 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.machine_name || row.laptop_serial}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.configuration}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatCurrency(row.sale_price)}</TableCell>
                  <TableCell sx={{ color: row.profit >= 0 ? 'success.main' : 'error.main', fontWeight: 600 }}>
                    {formatCurrency(row.profit)}
                  </TableCell>
                  <TableCell>{new Date(row.sale_date).toLocaleDateString('vi-VN')}</TableCell>
                  <TableCell>{row.warranty_months} tháng</TableCell>
                  <TableCell>
                    <Chip 
                      label={inWarranty ? "Còn bảo hành" : "Hết bảo hành"} 
                      color={inWarranty ? "success" : "default"} 
                      size="small" 
                      variant={inWarranty ? "filled" : "outlined"}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenEdit(row)} color="primary"><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(row.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">Chưa có thông tin khách hàng nào.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      <CustomerFormModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          fetchData();
          showToast('Lưu thông tin thành công', 'success');
        }}
        initialData={selectedEntry}
      />

      <Snackbar 
        open={toast.open} 
        autoHideDuration={3000} 
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={toast.severity} variant="filled">{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
