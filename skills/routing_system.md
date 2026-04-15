# Routing System (React Router 6)

The application uses the **Data Router API** introduced in React Router 6.4+.

## Configuration (`src/router/index.jsx`)
The router is defined using `createBrowserRouter`, which enables the use of loaders, actions, and nested routing layouts.

### Main Structure:
- **Public Routes**:
  - `/login`: The Login page.
- **Admin (Protected) Routes**:
  - Rooted at `/`, wrapped in `AdminLayout` and `RequireAuth`.
  - `/dist/dashboard`: The main analytics dashboard.
  - `/laptops`: Laptop inventory list.
  - `/laptops/add`: Form for new laptop creation.
  - `/laptops/edit/:serial`: Form for editing existing laptops.
  - `/customer-care`: Management of sales and customer records.

## RequireAuth Wrapper
Located at `src/components/Auth/RequireAuth.jsx`, this component checks the Redux `isAuthenticated` state. If not authenticated, it redirects the user to `/login` while preserving the previous location in the `state` prop for post-login redirecting.

## AdminLayout
Located at `src/components/Layout/AdminLayout.jsx`, this component provides:
- The Sidebar navigation.
- The Header with logout functionality.
- An `<Outlet />` area where the child routes are rendered.
