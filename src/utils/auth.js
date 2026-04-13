const TOKEN_KEY = 'inventory_admin_token';

export function getAuthToken() {
  // Read persisted admin token.
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setAuthToken(token) {
  // Persist admin token after successful login.
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  // Remove persisted token during logout.
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated() {
  // Check current authentication state.
  return Boolean(getAuthToken());
}
