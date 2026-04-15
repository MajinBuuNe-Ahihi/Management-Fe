# Frontend Architecture - 5cent Computer

This document outlines the frontend technologies and patterns used to build the Management-Tool dashboard.

## Technology Stack
- **Framework**: React 18+
- **Build Tool**: Vite
- **UI Component Library**: Material UI (MUI) v6
- **Routing**: React Router 6 (Data Router)
- **State Management**: Redux Toolkit (RTK)
- **API Client**: Axios

## Architectural Patterns

### 1. Centralized Routing
All routes are defined in `src/router/index.jsx` using `createBrowserRouter`. This allows for a clean overview of the application's structure and facilitates the use of:
- **Layouts**: `AdminLayout.jsx` provides the consistent shell for the internal dashboard.
- **Protected Routes**: `RequireAuth.jsx` wraps private routes to check for Redux-based authentication state.

### 2. State Management (Redux)
Used for cross-component state that needs persistence, such as Authentication.
- Store location: `src/store/index.js`
- Slices: `src/store/authSlice.js` (Manages tokens and login status).

### 3. API Communication Layer
The application uses a structured, class-based API layer for all server communication.
- **Base API (`base_api.js`)**: A wrapper around Axios that provides standardized REST methods (`get_api`, `post_api`, etc.) and consistent error handling.
- **Service Slices**: Entity-specific classes that inherit from `BaseApi` and use snake_case method naming with the `_api` suffix:
    - `auth_api.js`: Authentication logic.
    - `laptop_api.js`: Inventory management.
    - `customer_api.js`: Sales and warranty tracking.
    - `upload_api.js`: File and image management.
    - `dashboard_api.js`: Statistical data.
- **Axios Client**: The underlying instance (`axiosClient.js`) handles base URLs, timeouts, and JWT injection via interceptors.

### 4. Form Patterns
Forms (like `LaptopFormNew` and `CustomerFormModal`) follow a consistent pattern:
- **Local State**: Managed with `useState`.
- **Validation**: Handled both in UI (MUI `required`, `type="number"`) and in the submission handler.
- **Multi-part Flow**: Laptop images are uploaded synchronously to the Upload API before saving the final Laptop record.
