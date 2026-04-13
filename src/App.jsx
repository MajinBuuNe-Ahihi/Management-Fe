import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/Layout/AdminLayout';
import RequireAuth from './components/Auth/RequireAuth';
import Dashboard from './pages/Dashboard/Dashboard';
import LaptopList from './pages/LaptopList/LaptopList';
import LaptopForm from './pages/LaptopForm/LaptopFormNew';
import ShareLaptop from './pages/ShareLaptop/ShareLaptop';
import Login from './pages/Login/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/share/:serial" element={<ShareLaptop />} />
        <Route
          path="*"
          element={(
            <RequireAuth>
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/laptops" element={<LaptopList />} />
                  <Route path="/laptops/new" element={<LaptopForm />} />
                  <Route path="/laptops/edit/:serial" element={<LaptopForm />} />
                </Routes>
              </AdminLayout>
            </RequireAuth>
          )}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
