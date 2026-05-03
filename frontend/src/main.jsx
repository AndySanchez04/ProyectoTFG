import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios';

// Configuración global de Axios para Cookies HttpOnly
axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5105';

// Cabecera obligatoria para saltarse el HTML de advertencia de Ngrok en cuentas gratuitas
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';

// Interceptor global de respuestas para atrapar errores 401 (Sesión expirada)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Limpiar datos locales y redirigir al login
      localStorage.removeItem('usuario');
      localStorage.removeItem('rol');
      localStorage.removeItem('token');
      // Solo redirigir si no estamos ya en el login
      if (window.location.pathname !== '/' && window.location.pathname !== '/registro') {
          window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Punto de entrada principal de la aplicación React.
// Se utiliza StrictMode para ayudar a identificar problemas potenciales durante el desarrollo.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
