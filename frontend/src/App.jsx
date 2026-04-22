import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './Login';
import Registro from './Registro';
import Reservas from './Reservas';
import Inicio from './Inicio';
import Cartas from './Cartas';
import MisDatos from './MisDatos';
import DashboardWaiter from './DashboardWaiter';
import DashboardAdmin from './components/DashboardAdmin';
import PanelCocina from './PanelCocina';
import SetupPassword from './SetupPassword';

// Interceptor global
axios.interceptors.request.use(
  (config) => {
    config.withCredentials = true; // Para enviar la cookie HttpOnly
    const token = localStorage.getItem('token'); // Mantener por compatibilidad con código antiguo si lo hay
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function App() {
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5105';
        const res = await axios.get(`${API_URL}/api/auth/me`);
        localStorage.setItem('usuario', JSON.stringify(res.data));
        localStorage.setItem('rol', res.data.rol);
      } catch (e) {
        localStorage.removeItem('usuario');
        localStorage.removeItem('rol');
        localStorage.removeItem('token'); // Por si acaso
      } finally {
        setLoadingSession(false);
      }
    };
    fetchSession();
  }, []);

  if (loadingSession) {
    return (
      <div className="h-screen bg-fondo text-mostaza flex justify-center items-center flex-col gap-4">
        <div className="w-12 h-12 border-4 border-mostaza/20 border-t-mostaza rounded-full animate-spin"></div>
        <span className="font-bold">Restaurando sesión...</span>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/setup-password" element={<SetupPassword />} />
        <Route path="/cartas" element={<Cartas />} />
        <Route path="/reservas" element={
          <ProtectedRoute allowedRoles={['cliente', 'jefe']}>
            <Reservas />
          </ProtectedRoute>
        } />
        <Route path="/inicio" element={
          <ProtectedRoute allowedRoles={['cliente', 'jefe']}>
            <Inicio />
          </ProtectedRoute>
        } />
        <Route path="/mis-datos" element={
          <ProtectedRoute allowedRoles={['cliente', 'jefe', 'camarero', 'cocinero']}>
            <MisDatos />
          </ProtectedRoute>
        } />
        <Route path="/camarero" element={
          <ProtectedRoute allowedRoles={['camarero', 'jefe']}>
            <DashboardWaiter />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['jefe']}>
            <DashboardAdmin />
          </ProtectedRoute>
        } />
        <Route path="/cocina" element={
          <ProtectedRoute allowedRoles={['cocinero', 'jefe']}>
            <PanelCocina />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

function ProtectedRoute({ children, allowedRoles }) {
  const usuario = localStorage.getItem('usuario');
  const role = localStorage.getItem('rol');

  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default App;
