import React from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { NotificationProvider } from './context/NotificationContext';

function App() {
  return (
    <NotificationProvider>
      <RouterProvider router={router} />
    </NotificationProvider>
  );
}

export default App;
