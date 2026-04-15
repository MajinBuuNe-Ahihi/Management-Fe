import axiosClient from './axiosClient';
import BaseApi from './base_api';

class DashboardApi extends BaseApi {
  async get_stats_api() {
    return this.get_api('/dashboard/stats');
  }
}

export const dashboard_api = new DashboardApi(axiosClient);
