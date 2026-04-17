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

// Interceptor global: inyecta el token JWT en TODAS las peticiones automáticamente
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
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
