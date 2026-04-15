import { createSlice } from '@reduxjs/toolkit';
import { getAuthToken, setAuthToken, clearAuthToken } from '../utils/auth';

const initialState = {
  token: getAuthToken(),
  isAuthenticated: !!getAuthToken(),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      state.isAuthenticated = true;
      setAuthToken(token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    logout: (state) => {
      state.token = '';
      state.user = null;
      state.isAuthenticated = false;
      clearAuthToken();
      localStorage.removeItem('user');
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
