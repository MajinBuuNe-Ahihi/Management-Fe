export default class BaseApi {
  constructor(axiosInstance) {
    this.axios = axiosInstance;
  }

  async get_api(url, params = {}) {
    try {
      const response = await this.axios.get(url, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async post_api(url, data = {}, config = {}) {
    try {
      const response = await this.axios.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async put_api(url, data = {}, config = {}) {
    try {
      const response = await this.axios.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async delete_api(url, config = {}) {
    try {
      const response = await this.axios.delete(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async patch_api(url, data = {}, config = {}) {
    try {
      const response = await this.axios.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}
