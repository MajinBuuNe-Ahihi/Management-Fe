import axiosClient from './axiosClient';
import BaseApi from './base_api';

class CustomerApi extends BaseApi {
  async get_list_api(params) {
    return this.get_api('/customers', params);
  }

  async create_api(data) {
    return this.post_api('/customers', data);
  }

  async update_api(id, data) {
    return this.put_api(`/customers/${id}`, data);
  }

  async delete_api(id) {
    return this.axios.delete(`/customers/${id}`);
  }
}

export const customer_api = new CustomerApi(axiosClient);
