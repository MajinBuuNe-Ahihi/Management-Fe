import axiosClient from './axiosClient';
import BaseApi from './base_api';

class NotificationApi extends BaseApi {
  async get_list_api(params) {
    return this.get_api('/notifications', params);
  }

  async mark_as_read_api(id) {
    return this.post_api(`/notifications/${id}/mark-read`);
  }
}

export const notification_api = new NotificationApi(axiosClient);
