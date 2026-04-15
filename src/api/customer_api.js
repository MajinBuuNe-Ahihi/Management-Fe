import axiosClient from './axiosClient';
import BaseApi from './base_api';

class CustomerApi extends BaseApi {
  async get_list_api(params) {
    return this.get_api('/customer-care', params);
  }

  async create_api(data) {
    return this.post_api('/customer-care', data);
  }

  async update_api(id, data) {
    return this.put_api(`/customer-care/${id}`, data);
  }
}

export const customer_api = new CustomerApi(axiosClient);
