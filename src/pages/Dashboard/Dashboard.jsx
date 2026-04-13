import React, { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import axiosClient from '../../api/axiosClient';

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
      const res = await axiosClient.get('/dashboard/stats');
      setStats(res.data);
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
        Dashboard Overview
      </Typography>
      
      <Grid container spacing={{ xs: 1.5, sm: 3 }} sx={{ mb: { xs: 2, sm: 4 } }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Laptops" value={stats?.totalLaptops} color="#7e57c2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Sold" value={stats?.totalSold} color="#00e676" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Deposited" value={stats?.totalDeposited} color="#ff9800" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Inventory Value" value={`$${stats?.totalInventoryValue?.toLocaleString() || 0}`} color="#2196f3" />
        </Grid>
      </Grid>

      <Paper sx={{ p: { xs: 2, sm: 4 }, height: { xs: 300, sm: 400 } }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>Inventory Distribution</Typography>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="#a0a0b0" />
            <YAxis stroke="#a0a0b0" />
            <Tooltip contentStyle={{ backgroundColor: '#1a1a24', border: 'none', borderRadius: 8 }} />
            <Bar dataKey="value" fill="#7e57c2" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}
