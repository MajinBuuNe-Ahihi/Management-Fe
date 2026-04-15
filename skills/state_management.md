# State Management with Redux Toolkit

## Store Configuration
The Redux store is located at `src/store/index.js`. It aggregates all slices and provides them to the entire app via the `Provider` in `main.jsx`.

## Auth Slice (`authSlice.js`)
Manages the user's authentication state.

### State Structure:
- `token`: The JWT string (persisted in `localStorage`).
- `user`: Information about current logged in user (optional).
- `isAuthenticated`: Boolean flag derived from the presence of a token.

### Actions:
- `loginSuccess(token)`: Sets the token in state and `localStorage`.
- `logout()`: Clears the token from state and `localStorage`.

## Usage Pattern
- Use `useSelector` to check authentication status in components (e.g., `AdminLayout`, `RequireAuth`).
- Use `useDispatch` to trigger logout or update state after API calls.
