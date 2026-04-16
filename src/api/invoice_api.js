import axiosClient from './axiosClient';
import BaseApi from './base_api';

class InvoiceApi extends BaseApi {
  async get_list_api(params) {
    return this.get_api('/invoices', params);
  }

  async create_api(data) {
    return this.post_api('/invoices', data);
  }

  async update_api(id, data) {
    return this.put_api(`/invoices/${id}`, data);
  }
}

export const invoice_api = new InvoiceApi(axiosClient);
