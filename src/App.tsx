import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientDirectory from './pages/ClientDirectory';
import Inventory from './pages/Inventory';
import NewOrder from './pages/NewOrder';
import ServiceOrders from './pages/ServiceOrders';
import { AuthProvider } from './lib/AuthContext';
import { WorkshopProvider } from './lib/WorkshopContext';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <WorkshopProvider>
          <BrowserRouter>
            <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clients" element={<ClientDirectory />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/new-order" element={<NewOrder />} />
              <Route path="/services" element={<ServiceOrders />} />
              <Route path="/orders" element={<ServiceOrders />} />
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </WorkshopProvider>
    </AuthProvider>
  </ErrorBoundary>
);
}
