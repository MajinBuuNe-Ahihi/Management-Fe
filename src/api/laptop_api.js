import axiosClient from './axiosClient';
import BaseApi from './base_api';

class LaptopApi extends BaseApi {
  async get_list_api(params) {
    return this.get_api('/laptops', params);
  }

  async get_by_id_api(id) {
    return this.get_api(`/laptops/${id}`);
  }

  async get_by_serial_api(serial) {
    return this.get_api(`/laptops/by-serial/${encodeURIComponent(serial)}`);
  }

  async create_api(data) {
    return this.post_api('/laptops', data);
  }

  async update_api(id, data) {
    return this.put_api(`/laptops/${id}`, data);
  }

  async update_by_serial_api(serial, data) {
    return this.put_api(`/laptops/by-serial/${encodeURIComponent(serial)}`, data);
  }

  async delete_api(id) {
    return this.delete_api_request(`/laptops/${id}`);
  }

  // Custom name to avoid collision with base delete_api if needed,
  // but here we just call the base.
  async delete_api_request(url) {
      return super.delete_api(url);
  }

  async extract_info_api(text) {
    return this.post_api('/laptops/extract-info', { text });
  }

  async get_share_info_api(serial) {
    return this.get_api(`/laptops/share/${encodeURIComponent(serial)}`);
  }
}

export const laptop_api = new LaptopApi(axiosClient);
