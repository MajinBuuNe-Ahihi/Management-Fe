import React, { useState, useEffect } from 'react';
import { 
  Badge, IconButton, Popover, List, ListItem, ListItemText, 
  Typography, Box, Divider, Button, ListItemButton 
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNavigate } from 'react-router-dom';
import { notification_api } from '../../api/notification_api';
import { initSocket, disconnectSocket } from '../../utils/socket';

export default function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const data = await notification_api.get_list_api({ limit: 20 });
      const items = data.notifications || [];
      setNotifications(items);
      setUnreadCount(items.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const socket = initSocket();
    if (socket) {
      socket.on('notification', (notif) => {
        // optimistically add to list
        setNotifications(prev => [
          { 
            id: Date.now(), 
            title: notif.title, 
            message: notif.message, 
            data: notif.data, 
            is_read: false, 
            created_at: new Date().toISOString() 
          }, 
          ...prev
        ]);
        setUnreadCount(c => c + 1);
      });
    }

    return () => {
      disconnectSocket();
    };
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notif) => {
    // Mark as read in UI
    if (!notif.is_read) {
      try {
        await notification_api.mark_as_read_api(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
        setUnreadCount(c => Math.max(0, c - 1));
      } catch (err) {
        console.error(err);
      }
    }

    // Navigation logic
    if (notif.data?.type === 'approval_required' || notif.title?.includes('phê duyệt')) {
      navigate('/approvals');
    }
    
    handleClose();
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton color="inherit" onClick={handleClick} sx={{ mr: 1, color: 'rgba(255,255,255,0.6)' }}>
        <Badge badgeContent={unreadCount} color="error" overlap="circular">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: { width: 320, maxHeight: 400, borderRadius: 2, mt: 1.5, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Thông báo</Typography>
          {unreadCount > 0 && (
            <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
              {unreadCount} mới
            </Typography>
          )}
        </Box>
        <Divider />
        <List sx={{ py: 0 }}>
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <ListItemButton 
                key={notif.id} 
                onClick={() => handleNotificationClick(notif)}
                sx={{ 
                  bgcolor: notif.is_read ? 'transparent' : 'rgba(30, 58, 138, 0.05)',
                  borderLeft: notif.is_read ? 'none' : '4px solid #1e3a8a',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                }}
              >
                <ListItemText
                  primary={notif.title}
                  secondary={
                    <React.Fragment>
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>
                        {new Date(notif.created_at).toLocaleString('vi-VN')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: notif.is_read ? 'text.secondary' : 'text.primary', fontWeight: notif.is_read ? 400 : 500 }}>
                        {notif.message}
                      </Typography>
                    </React.Fragment>
                  }
                />
              </ListItemButton>
            ))
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Không có thông báo nào</Typography>
            </Box>
          )}
        </List>
        <Divider />
        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Button size="small" onClick={() => navigate('/approvals')} sx={{ textTransform: 'none' }}>
            Xem tất cả yêu cầu
          </Button>
        </Box>
      </Popover>
    </>
  );
}
