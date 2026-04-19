import React, { useEffect, useState } from 'react';
import { 
  Box, Button, Card, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Typography, Chip, IconButton, Avatar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { post_api } from '../../api/content_api';
import { useNotification } from '../../context/NotificationContext';

export default function PostList() {
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();
  const { notify } = useNotification();

  const fetchPosts = async () => {
    try {
      const data = await post_api.get_list_api();
      setPosts(data.items || []);
    } catch (err) {
      notify('Không tải được danh sách bài viết', 'error');
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>Quản lý Bài viết</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('new')}>
          Viết bài mới
        </Button>
      </Box>

      <TableContainer component={Card}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ảnh</TableCell>
              <TableCell>Tiêu đề</TableCell>
              <TableCell>Danh mục</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Ngày đăng</TableCell>
              <TableCell align="right">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell>
                  <Avatar src={post.image_url} alt={post.title} variant="rounded" />
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{post.title}</TableCell>
                <TableCell>{post.category_name}</TableCell>
                <TableCell>
                  <Chip 
                    label={post.status === 'published' ? 'Đã đăng' : 'Nháp'} 
                    color={post.status === 'published' ? 'success' : 'default'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell>{new Date(post.created_at).toLocaleDateString('vi-VN')}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => navigate(`edit/${post.id}`)} color="primary">
                    <EditIcon />
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
