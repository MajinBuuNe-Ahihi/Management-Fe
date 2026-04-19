import React, { useState, useEffect } from 'react';
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, AppBar, Toolbar, Typography, IconButton, Button, useTheme, Badge, Avatar, Divider, Tooltip } from '@mui/material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ArticleIcon from '@mui/icons-material/Article';
// import CategoryIcon from '@mui/icons-material/Category';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import NotificationBell from '../Notifications/NotificationBell';
import { getSocket, initSocket } from '../../utils/socket';
import { useNotification } from '../../context/NotificationContext';

const drawerWidth = 260;

const menuItems = [
  { text: 'Bảng điều khiển', icon: <DashboardIcon />, path: '/dashboard', roles: [0, 1] },
  { text: 'Kho máy', icon: <LaptopMacIcon />, path: '/laptops', roles: [0, 1, 2] },
  { text: 'Khách hàng', icon: <PersonIcon />, path: '/customers', roles: [0, 1, 2] },
  { text: 'Hóa đơn', icon: <ReceiptLongIcon />, path: '/invoices', roles: [0, 1] },
  { text: 'Duyệt yêu cầu', icon: <AssignmentTurnedInIcon />, path: '/approvals', roles: [0, 1] },
  { text: 'Tin tức', icon: <ArticleIcon />, path: '/posts', roles: [0, 1] },
// { text: 'Danh mục', icon: <CategoryIcon />, path: '/categories', roles: [0, 1] },
  { text: 'Yêu cầu tư vấn', icon: <QuestionAnswerIcon />, path: '/inquiries', roles: [0, 1, 2] },
  { text: 'Nhân viên', icon: <PeopleIcon />, path: '/staff', roles: [0] }
];

const ROLE_LABELS = {
  0: 'Superadmin',
  1: 'Management',
  2: 'Staff'
};

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const theme = useTheme();
  
  // Get user info from Redux
  const user = useSelector((state) => state.auth.user);
  const userRole = user?.role ?? 2;
  const { notify } = useNotification();
  
  useEffect(() => {
    const socket = initSocket();
    if (socket) {
      socket.on('data_change', (data) => {
        console.log('Data change detected:', data);
        // Dispatch custom event for child components to refresh
        window.dispatchEvent(new CustomEvent('data-refresh', { detail: data }));
        
        // Optional: show a small notification if it's not a generic update
        if (data.action === 'save' || data.action === 'delete' || data.action === 'approve') {
          notify(`Dữ liệu ${data.module} vừa được cập nhật`, 'info');
        }
      });
    }
    
    return () => {
      const s = getSocket();
      if (s) s.off('data_change');
    };
  }, [notify]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(userRole));

  const drawer = (
    <Box sx={{ height: '100%', bgcolor: 'background.paper', pt: 2, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 3, mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ 
          width: 36, height: 36, borderRadius: 1, 
          bgcolor: theme.palette.primary.main, 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 20px ${theme.palette.primary.main}44`
        }}>
          <LaptopMacIcon sx={{ color: '#fff', fontSize: 24 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>
          5cent computer
        </Typography>
      </Box>

      {/* User Info Segment */}
      <Box sx={{ mx: 2, mb: 3, p: 2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Avatar sx={{ bgcolor: theme.palette.primary.dark, width: 40, height: 40, fontWeight: 700 }}>
            {user?.username?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>
              {user?.full_name || user?.username}
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 700, textTransform: 'uppercase', fontSize: '10px' }}>
              {ROLE_LABELS[userRole]}
            </Typography>
          </Box>
        </Box>
      </Box>

      <List sx={{ flexGrow: 1 }}>
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <ListItemButton
              key={item.text} 
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{
                mx: 2,
                mb: 0.5,
                borderRadius: 2,
                bgcolor: isActive ? 'rgba(30, 58, 138, 0.2)' : 'transparent',
                color: isActive ? theme.palette.primary.main : 'text.secondary',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.main
                  }
                }
              }}
            >
              <ListItemIcon sx={{ 
                color: isActive ? theme.palette.primary.main : 'text.secondary',
                minWidth: 40 
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.9rem'
                }} 
              />
            </ListItemButton>
          )
        })}
      </List>

      <Box sx={{ p: 2 }}>
        <Button 
          variant="outlined" 
          fullWidth 
          startIcon={<LogoutIcon />} 
          onClick={handleLogout}
          sx={{ 
            borderRadius: 2, 
            borderColor: 'rgba(255,255,255,0.1)', 
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'none',
            '&:hover': {
              borderColor: 'error.main',
              color: 'error.main',
              bgcolor: 'rgba(211, 47, 47, 0.05)'
            }
          }}
        >
          Đăng xuất
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          width: { sm: `calc(100% - ${drawerWidth}px)` }, 
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'rgba(10, 25, 41, 0.8)',
          backdropFilter: 'blur(10px)',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: (theme) => theme.zIndex.drawer + 1
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <NotificationBell />
        </Toolbar>
      </AppBar>
      
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', borderRight: 'none', backgroundImage: 'none' } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', borderRight: '1px solid rgba(255, 255, 255, 0.05)', backgroundImage: 'none' } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 1.5, sm: 3 }, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: { xs: 7, sm: 8 } }}>
        <Outlet />
      </Box>
    </Box>
  );
}
