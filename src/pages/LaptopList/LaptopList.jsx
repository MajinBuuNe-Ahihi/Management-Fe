import React, { useState, useEffect } from 'react';
import { Alert, Box, Typography, Paper, TextField, Button, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Chip, Card, CardContent, Menu, MenuItem, ListItemIcon, ListItemText, Snackbar, useMediaQuery, useTheme } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, IosShare as ShareIcon, Remove as RemoveIcon, MoreVert as MoreVertIcon, ToggleOn as ToggleOnIcon, Sell as SellIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { laptop_api } from '../../api/laptop_api';
import { copyToClipboard } from '../../utils/clipboard';

export default function LaptopList() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [laptops, setLaptops] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [toast, setToast] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLaptops();
    // eslint-disable-next-line
  }, [page, rowsPerPage, search]);

  const fetchLaptops = async () => {
    try {
      const data = await laptop_api.get_list_api({ page: page + 1, limit: rowsPerPage, search });
      setLaptops(data.laptops || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetStatus = async (row, status) => {
    try {
      await laptop_api.update_api(row.id, { status });
      setLaptops((prev) => prev.map((item) => (item.id === row.id ? { ...item, status } : item)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdjustQuantity = async (row, delta) => {
    const currentQuantity = Number(row.quantity) > 0 ? Number(row.quantity) : 1;
    const nextQuantity = Math.max(1, currentQuantity + delta);
    if (nextQuantity === currentQuantity) return;
    try {
      await laptop_api.update_api(row.id, {
        quantity: nextQuantity,
      });
      setLaptops((prev) => prev.map((item) => (item.id === row.id ? { ...item, quantity: nextQuantity } : item)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this laptop?')) {
      try {
        await laptop_api.delete_api_request(`/laptops/${id}`);
        fetchLaptops();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openActionMenu = (event, row) => {
    setActionAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const closeActionMenu = () => {
    setActionAnchorEl(null);
    setSelectedRow(null);
  };

  const getImageUrls = (input) =>
    String(input || '')
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);

  const getPrimaryImage = (row) => {
    if (Array.isArray(row.image_assets) && row.image_assets.length > 0) {
      return row.image_assets[0]?.url || '';
    }
    const urls = getImageUrls(row.listImage);
    return urls[0] || '';
  };

  const getStatusChip = (row) => {
    const status = Number(row.status ?? 0);
    if (status === 2) return <Chip label="Sold" color="success" size="small" />;
    if (status === 1) return <Chip label="Deposited" color="warning" size="small" />;
    return <Chip label="Available" size="small" variant="outlined" />;
  };

  const handleShare = async (row) => {
    // Generate and copy share URL to clipboard.
    const serial = encodeURIComponent(row?.serial || '');
    if (!serial) return;
    const shareUrl = `${window.location.origin}/share/${serial}`;
    try {
      const success = await copyToClipboard(shareUrl);
      if (success) {
        setToast('Đã copy link chia sẻ');
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
      } else {
        setToast('Không thể copy link chia sẻ');
      }
    } catch (err) {
      setToast('Không thể copy link chia sẻ');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1.5, sm: 0 }, mb: { xs: 2, sm: 4 } }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>Inventory</Typography>
        <Button 
          variant="contained" 
          fullWidth={isMobile}
          startIcon={<AddIcon />}
          onClick={() => navigate('/laptops/new')}
        >
          Add Laptop
        </Button>
      </Box>

      <Paper sx={{ mb: { xs: 2, sm: 4 }, p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by serial, product, brand, CPU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Paper>

      {isMobile ? (
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          {laptops.map((row) => (
            <Card key={row.id}>
              <CardContent sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  {getPrimaryImage(row) ? (
                    <img src={getPrimaryImage(row)} alt="laptop" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }} />
                  ) : <Box sx={{ width: 56, height: 56, bgcolor: 'background.default', borderRadius: 1 }} />}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.product_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.serial}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">{row.brand} {row.line ? `- ${row.line}` : ''}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">{row.condition || '-'}</Typography>
                  </Box>
                </Box>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>{`${row.cpu || ''} | ${row.ram || ''} | ${row.ssd || ''}`}</Typography>
                <Typography variant="caption" display="block">{`${row.location || '-'} | ${row.warranty || '-'}`}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {row.createdDate ? new Date(row.createdDate).toLocaleDateString() : '-'}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>{row.price}</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                  {getStatusChip(row)}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => handleAdjustQuantity(row, -1)}><RemoveIcon fontSize="small" /></IconButton>
                    <Typography variant="caption" sx={{ minWidth: 18, textAlign: 'center' }}>{Number(row.quantity) > 0 ? row.quantity : 1}</Typography>
                    <IconButton size="small" onClick={() => handleAdjustQuantity(row, 1)}><AddIcon fontSize="small" /></IconButton>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <IconButton color="primary" onClick={(e) => openActionMenu(e, row)}><MoreVertIcon /></IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
          {laptops.length === 0 && (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2">No laptops found</Typography>
            </Paper>
          )}
          <Paper>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={total}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </Paper>
        </Box>
      ) : (
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Serial</TableCell>
              <TableCell>Product Name</TableCell>
              <TableCell>Brand / Line</TableCell>
              <TableCell>CPU</TableCell>
              <TableCell>RAM</TableCell>
              <TableCell>SSD</TableCell>
              <TableCell>Display</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Warranty</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {laptops.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  {getPrimaryImage(row) ? (
                    <img src={getPrimaryImage(row)} alt="laptop" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} />
                  ) : <Box sx={{ width: 50, height: 50, bgcolor: 'background.default', borderRadius: 1 }} />}
                </TableCell>
                <TableCell>{row.serial}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.product_name || '-'}</Typography>
                </TableCell>
                <TableCell>{`${row.brand || '-'}${row.line ? ` / ${row.line}` : ''}`}</TableCell>
                <TableCell>{row.cpu || '-'}</TableCell>
                <TableCell>{row.ram || '-'}</TableCell>
                <TableCell>{row.ssd || '-'}</TableCell>
                <TableCell>{row.display || '-'}</TableCell>
                <TableCell>{row.price || '-'}</TableCell>
                <TableCell>{row.warranty || '-'}</TableCell>
                <TableCell>{row.location || '-'}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => handleAdjustQuantity(row, -1)}><RemoveIcon fontSize="small" /></IconButton>
                    <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center' }}>{Number(row.quantity) > 0 ? row.quantity : 1}</Typography>
                    <IconButton size="small" onClick={() => handleAdjustQuantity(row, 1)}><AddIcon fontSize="small" /></IconButton>
                  </Box>
                </TableCell>
                <TableCell>
                  {getStatusChip(row)}
                </TableCell>
                <TableCell>{row.createdDate ? new Date(row.createdDate).toLocaleDateString() : '-'}</TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={(e) => openActionMenu(e, row)}>
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {laptops.length === 0 && (
              <TableRow>
                <TableCell colSpan={15} align="center" sx={{ py: 4 }}>No laptops found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>
      )}

      <Menu
        anchorEl={actionAnchorEl}
        open={Boolean(actionAnchorEl)}
        onClose={closeActionMenu}
      >
        <MenuItem
          onClick={() => {
            if (selectedRow) handleShare(selectedRow);
            closeActionMenu();
          }}
        >
          <ListItemIcon><ShareIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedRow) handleSetStatus(selectedRow, Number(selectedRow.status) === 2 ? 0 : 2);
            closeActionMenu();
          }}
        >
          <ListItemIcon><SellIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{Number(selectedRow?.status) === 2 ? 'Mark as available' : 'Mark as sold'}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedRow) handleSetStatus(selectedRow, Number(selectedRow.status) === 1 ? 0 : 1);
            closeActionMenu();
          }}
        >
          <ListItemIcon><ToggleOnIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{Number(selectedRow?.status) === 1 ? 'Mark as available' : 'Mark deposited'}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
                        if (selectedRow?.serial) navigate(`/laptops/edit/${encodeURIComponent(selectedRow.serial)}`);
            closeActionMenu();
          }}
        >
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedRow) handleDelete(selectedRow.id);
            closeActionMenu();
          }}
        >
          <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
      <Snackbar open={Boolean(toast)} autoHideDuration={2500} onClose={() => setToast('')} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="info" variant="filled" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </Box>
  );
}
