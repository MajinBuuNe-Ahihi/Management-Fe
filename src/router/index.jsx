import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from '../components/Layout/AdminLayout';
import RequireAuth from '../components/Auth/RequireAuth';
import RoleGuard from '../components/Auth/RoleGuard';

// Pages
import Dashboard from '../pages/Dashboard/Dashboard';
import LaptopList from '../pages/LaptopList/LaptopList';
import LaptopForm from '../pages/LaptopForm/LaptopFormNew';
import ShareLaptop from '../pages/ShareLaptop/ShareLaptop';
import Login from '../pages/Login/Login';
import CustomerList from '../pages/CustomerCare/CustomerList';

// New Pages (Implementations coming next)
import StaffManagement from '../pages/Staff/StaffManagement';
import InvoiceList from '../pages/Invoices/InvoiceList';
import ApprovalCenter from '../pages/Approvals/ApprovalCenter';
import PostList from '../pages/Content/PostList';
import PostForm from '../pages/Content/PostForm';
// import CategoryList from '../pages/Content/CategoryList';
import InquiryList from '../pages/Inquiries/InquiryList';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/share/:serial',
    element: <ShareLaptop />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AdminLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <RoleGuard allowedRoles={[0, 1]}>
            <Dashboard />
          </RoleGuard>
        ),
      },
      {
        path: 'laptops',
        children: [
          {
            index: true,
            element: <LaptopList />,
          },
          {
            path: 'new',
            element: <LaptopForm />,
          },
          {
            path: 'edit/:serial',
            element: <LaptopForm />,
          },
        ],
      },
      {
        path: 'customers',
        element: <CustomerList />,
      },
      {
        path: 'invoices',
        element: (
          <RoleGuard allowedRoles={[0, 1]}>
            <InvoiceList />
          </RoleGuard>
        ),
      },
      {
        path: 'approvals',
        element: (
          <RoleGuard allowedRoles={[0, 1]}>
            <ApprovalCenter />
          </RoleGuard>
        ),
      },
      {
        path: 'staff',
        element: (
          <RoleGuard allowedRoles={[0]}>
            <StaffManagement />
          </RoleGuard>
        ),
      },
      {
        path: 'posts',
        children: [
          { index: true, element: <PostList /> },
          { path: 'new', element: <PostForm /> },
          { path: 'edit/:id', element: <PostForm /> },
        ]
      },
      // {
      //   path: 'categories',
      //   element: <CategoryList />,
      // },
      {
        path: 'inquiries',
        element: <InquiryList />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);

export default router;
