import React, { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { dashboard_api } from '../../api/dashboard_api';

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await dashboard_api.get_stats_api();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
  }

  const chartData = [
    { name: 'Total', value: stats?.totalLaptops || 0 },
    { name: 'Sold', value: stats?.totalSold || 0 },
    { name: 'Deposited', value: stats?.totalDeposited || 0 },
  ];

  const StatCard = ({ title, value, color }) => (
    <Paper sx={{ p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', height: { xs: 110, sm: 140 }, justifyContent: 'center', borderTop: `4px solid ${color}` }}>
      <Typography color="text.secondary" variant="subtitle1" gutterBottom>{title}</Typography>
      <Typography variant={isMobile ? 'h4' : 'h3'} sx={{ fontWeight: 700, color: '#fff' }}>{value}</Typography>
    </Paper>
  );

  return (
    <Box>
      <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom sx={{ mb: { xs: 2, sm: 4 }, fontWeight: 700 }}>
        Tổng quan hệ thống
      </Typography>
      
      <Grid container spacing={{ xs: 1.5, sm: 3 }} sx={{ mb: { xs: 2, sm: 4 } }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard title="Tổng số máy" value={stats?.totalLaptops} color="#1e3a8a" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard title="Đã bán" value={stats?.totalSold} color="#3b82f6" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard title="Đã đặt cọc" value={stats?.totalDeposited} color="#60a5fa" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard title="Giá trị kho" value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats?.totalInventoryValue || 0)} color="#94a3b8" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard title="Tổng lợi nhuận" value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats?.totalProfit || 0)} color="#10b981" />
        </Grid>
      </Grid>

      <Paper sx={{ p: { xs: 2, sm: 4 }, height: { xs: 300, sm: 400 } }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>Phân bổ kho hàng</Typography>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="#a0a0b0" />
            <YAxis stroke="#a0a0b0" />
            <Tooltip contentStyle={{ backgroundColor: '#101d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
            <Bar dataKey="value" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}
