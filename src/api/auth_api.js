import axiosClient from './axiosClient';
import BaseApi from './base_api';

class AuthApi extends BaseApi {
  async login_api(credentials) {
    return this.post_api('/auth/login', credentials);
  }
}

export const auth_api = new AuthApi(axiosClient);
