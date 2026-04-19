import axiosClient from './axiosClient';

export const category_api = {
  get_all_api: (type) => axiosClient.get(`/categories${type ? `?type=${type}` : ''}`).then((res) => res.data),
  save_api: (data) => axiosClient.post('/categories', data).then((res) => res.data),
};

export const post_api = {
  get_list_api: (page = 1, limit = 20) => axiosClient.get(`/posts?page=${page}&limit=${limit}`).then((res) => res.data),
  save_api: (data) => axiosClient.post('/posts', data).then((res) => res.data),
  generate_api: (title) => axiosClient.post('/posts/generate', { title }).then((res) => res.data),
};

export const inquiry_api = {
  get_list_api: (page = 1, limit = 20) => axiosClient.get(`/inquiries?page=${page}&limit=${limit}`).then((res) => res.data),
  update_api: (id, data) => axiosClient.patch(`/inquiries/${id}`, data).then((res) => res.data),
};
