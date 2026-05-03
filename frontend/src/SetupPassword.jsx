import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

/**
 * Componente para la configuración inicial de contraseña.
 * Utilizado por el personal del restaurante al recibir una invitación por correo.
 */
export default function SetupPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ nombre: '', password: '', confirmPassword: '' });
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5105';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setStatus({ loading: false, error: 'Enlace inválido. No se ha proporcionado un token.', success: '' });
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setStatus({ loading: false, error: 'Las contraseñas no coinciden.', success: '' });
      return;
    }

    if (formData.password.length < 6) {
      setStatus({ loading: false, error: 'La contraseña debe tener al menos 6 caracteres.', success: '' });
      return;
    }

    setStatus({ loading: true, error: '', success: '' });

    try {
      await axios.post(`${API_URL}/api/auth/setup-password`, {
        token: token,
        nombre: formData.nombre,
        password: formData.password
      });

      setStatus({ loading: false, error: '', success: '¡Cuenta configurada correctamente! Redirigiendo al inicio de sesión...' });
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      console.error(error);
      setStatus({ 
        loading: false, 
        error: error.response?.data || 'Error al configurar la cuenta. El enlace puede haber expirado.', 
        success: '' 
      });
    }
  };

  return (
    <div className="min-h-screen bg-fondo flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans text-white">
      {/* Elementos decorativos */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-mostaza/5 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-mostaza/5 blur-3xl"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <img src="/images/logo.jpg" alt="Mild & Limon" className="h-20 w-20 object-cover rounded-full shadow-[0_0_20px_rgba(234,179,8,0.3)] border-2 border-mostaza/20" />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-white tracking-tight uppercase">
          Configura tu cuenta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Bienvenido al equipo de Mild & Limon
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-fondo-tarjeta py-8 px-4 shadow-2xl shadow-black sm:rounded-2xl sm:px-10 border border-fondo-borde">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {status.error && (
              <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-red-200 font-medium">{status.error}</span>
              </div>
            )}

            {status.success && (
              <div className="bg-green-950/30 border border-green-900/50 rounded-xl p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-green-200 font-medium">{status.success}</span>
              </div>
            )}

            {!token && !status.error && (
              <div className="bg-mostaza/10 border border-mostaza/30 rounded-xl p-4 flex items-start gap-3">
                 <svg className="w-5 h-5 text-mostaza mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-mostaza font-medium">No se ha encontrado el token de invitación en la URL.</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Nombre Completo
              </label>
              <div className="mt-1">
                <input
                  required
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="appearance-none block w-full px-4 py-3 border border-fondo-borde rounded-xl shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-mostaza focus:border-mostaza sm:text-sm bg-fondo text-white transition-all"
                  disabled={status.loading || status.success !== '' || !token}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Nueva Contraseña
              </label>
              <div className="mt-1">
                <input
                  required
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="appearance-none block w-full px-4 py-3 border border-fondo-borde rounded-xl shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-mostaza focus:border-mostaza sm:text-sm bg-fondo text-white transition-all"
                  disabled={status.loading || status.success !== '' || !token}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Confirmar Contraseña
              </label>
              <div className="mt-1">
                <input
                  required
                  type="password"
                  placeholder="Repite la contraseña"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="appearance-none block w-full px-4 py-3 border border-fondo-borde rounded-xl shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-mostaza focus:border-mostaza sm:text-sm bg-fondo text-white transition-all"
                  disabled={status.loading || status.success !== '' || !token}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={status.loading || status.success !== '' || !token}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-black bg-mostaza hover:bg-mostaza-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mostaza focus:ring-offset-fondo transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status.loading ? 'Configurando...' : 'Activar Cuenta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
