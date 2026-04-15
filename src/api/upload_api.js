import axiosClient from './axiosClient';
import BaseApi from './base_api';

class UploadApi extends BaseApi {
  async upload_images_api(formData) {
    return this.post_api('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async delete_image_api(publicId) {
    return this.delete_api('/uploads', { data: { public_id: publicId } });
  }
}

export const upload_api = new UploadApi(axiosClient);
