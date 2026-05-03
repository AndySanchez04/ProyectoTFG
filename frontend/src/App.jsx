import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './Login';
import Registro from './Registro';
import Inicio from './Inicio';
import Cartas from './Cartas';
import MisDatos from './MisDatos';
import SetupPassword from './SetupPassword';

const DashboardAdmin = React.lazy(() => import('./components/DashboardAdmin'));
const DashboardWaiter = React.lazy(() => import('./DashboardWaiter'));
const PanelCocina = React.lazy(() => import('./PanelCocina'));
const Reservas = React.lazy(() => import('./Reservas'));

/**
 * Componente principal de la aplicación.
 * Define la estructura de rutas y gestiona la persistencia de la sesión del usuario.
 */
function App() {
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    // Intenta restaurar la sesión del usuario al cargar la aplicación.
    // Llama al endpoint /me para validar la cookie JWT.
    const fetchSession = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5105';
        const res = await axios.get(`${API_URL}/api/auth/me`);
        localStorage.setItem('usuario', JSON.stringify(res.data));
        localStorage.setItem('rol', res.data.rol);
      } catch (e) {
        // Si falla (token expirado o no existe), limpia el almacenamiento local.
        localStorage.removeItem('usuario');
        localStorage.removeItem('rol');
        localStorage.removeItem('token'); 
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
      <React.Suspense fallback={<div className="text-white text-center mt-10">Cargando módulo...</div>}>
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
      </React.Suspense>
    </Router>
  );
}

/**
 * Componente para proteger rutas privadas basándose en la sesión y roles.
 * Si el usuario no está logueado o no tiene el rol adecuado, redirige al Login.
 */
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
