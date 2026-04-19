import React, { useEffect, useState } from 'react';
import { 
  Box, Button, Card, CardContent, Divider, FormControl, 
  InputLabel, MenuItem, Select, TextField, Typography, 
  Paper, IconButton, CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { post_api, category_api } from '../../api/content_api';
import { upload_api } from '../../api/upload_api';
import { useNotification } from '../../context/NotificationContext';

export default function PostForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useNotification();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    title: '', slug: '', excerpt: '', content: '', 
    image_url: '', category_id: '', tags: [], status: 'published'
  });
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cats = await category_api.get_all_api('post');
        setCategories(cats);

        if (isEditMode) {
          setIsLoading(true);
          const posts = await post_api.get_list_api();
          const post = posts.items.find(p => p.id === id);
          if (post) setFormData(post);
        }
      } catch (err) {
        notify('Không tải được dữ liệu', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, isEditMode, notify]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleEditorChange = (content) => setFormData({ ...formData, content });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const uploadData = new FormData();
      uploadData.append('file', file);
      const res = await upload_api.upload_images_api(uploadData);
      const url = Array.isArray(res) ? res[0].url : res.url;
      setFormData({ ...formData, image_url: url });
      notify('Tải ảnh lên thành công', 'success');
    } catch (err) {
      notify('Tải ảnh thất bại', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const generateSlug = (title) => {
    return (title || formData.title)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleBlurTitle = () => {
    if (!formData.slug) {
        setFormData({ ...formData, slug: generateSlug() });
    }
  };

  const handleAIGenerate = async () => {
    if (!formData.title) {
        notify('Vui lòng nhập tiêu đề trước', 'warning');
        return;
    }
    try {
        setIsAILoading(true);
        const res = await post_api.generate_api(formData.title);
        setFormData({
            ...formData,
            content: res.content,
            excerpt: res.excerpt,
            slug: res.slug || generateSlug(formData.title)
        });
        notify('AI đã tạo bài viết thành công!', 'success');
    } catch (err) {
        notify('AI thất bại: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
        setIsAILoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await post_api.save_api(formData);
      notify('Lưu bài viết thành công', 'success');
      navigate('/posts');
    } catch (err) {
      notify('Lưu bài viết thất bại', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image', 'code-block'],
      ['clean'],
    ],
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={() => navigate('/posts')}><ArrowBackIcon /></IconButton>
        <Typography variant="h4" fontWeight={700}>
          {isEditMode ? 'Sửa bài viết' : 'Viết bài mới'}
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
      ) : (
        <form onSubmit={handleSubmit}>
          <Paper sx={{ p: 4, mb: 2, display: 'flex', flexDirection: 'column' }}>
            <Grid container>
              <Grid item size={12}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField 
                    fullWidth label="Tiêu đề bài viết" name="title" 
                    value={formData.title} onChange={handleChange} 
                    required onBlur={handleBlurTitle}
                  />
                  <Button 
                    variant="contained" color="secondary" 
                    onClick={handleAIGenerate} disabled={isAILoading}
                    startIcon={isAILoading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
                    sx={{ minWidth: 160 }}
                  >
                    {isAILoading ? 'AI đang viết...' : 'AI Viết Bài'}
                  </Button>
                </Box>
              </Grid>
              <Grid item size={{xs: 12, md: 6}}>
                <TextField fullWidth label="Slug (URL)" name="slug" value={formData.slug} onChange={handleChange} required />
              </Grid>
              <Grid item size={{xs: 12, md: 6}}>
                <FormControl fullWidth>
                  <InputLabel>Danh mục</InputLabel>
                  <Select name="category_id" value={formData.category_id} label="Danh mục" onChange={handleChange}>
                    {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item size={{xs: 12, md: 6}}>
                <TextField 
                  fullWidth label="Tóm tắt (Excerpt)" name="excerpt" 
                  value={formData.excerpt} onChange={handleChange} 
                  multiline rows={2}
                />
              </Grid>
              <Grid item size={12}>
                <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} disabled={isUploading}>
                    {isUploading ? 'Đang tải...' : 'Tải ảnh bìa'}
                    <input hidden type="file" accept="image/*" onChange={handleImageUpload} />
                  </Button>
                  {formData.image_url && <Typography variant="caption" color="success.main">Đã có ảnh bìa</Typography>}
                </Box>
                {formData.image_url && (
                  <Box sx={{ width: '100%', height: 200, borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
                    <img src={formData.image_url} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                )}
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 4, mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Nội dung bài viết</Typography>
            <Box sx={{ height: 400, mb: 10 }}>
              <ReactQuill 
                theme="snow" 
                value={formData.content} 
                onChange={handleEditorChange} 
                modules={quillModules}
                style={{ height: '350px' }}
              />
            </Box>
          </Paper>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={() => navigate('/posts')}>Hủy</Button>
            <Button variant="contained" type="submit" disabled={isLoading}>Lưu bài viết</Button>
          </Box>
        </form>
      )}
    </Box>
  );
}

// Minimal Grid wrapper for simplicity if @mui/material/Unstable_Grid2 is not used
function Grid({ children, container, item, xs, md, spacing }) {
  return (
    <Box sx={{ 
      display: container ? 'flex' : 'block', 
      flexWrap: container ? 'wrap' : 'nowrap',
      width: item ? (md ? `${(md/12)*100}%` : (xs ? `${(xs/12)*100}%` : '100%')) : '100%',
      gap: container ? (spacing ? spacing * 8 : 0) : 0,
      p: item ? 1 : 0
    }}>
      {children}
    </Box>
  );
}
