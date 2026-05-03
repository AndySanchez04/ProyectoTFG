import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

/**
 * Componente de inicio de sesión.
 * Maneja la autenticación del usuario, el almacenamiento del token JWT y la redirección según el rol.
 */
export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5105';

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const normalizedEmail = email.trim().toLowerCase();
            const response = await axios.post(`${API_URL}/api/auth/login`, { email: normalizedEmail, password });
            // Guardar el token JWT para el interceptor global
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
            
            const userRole = response.data.usuario.rol;
            localStorage.setItem('rol', userRole);

            if (userRole === 'jefe') {
                navigate('/admin');
            } else if (userRole === 'cocinero') {
                navigate('/cocina');
            } else if (userRole === 'camarero') {
                navigate('/camarero');
            } else if (userRole === 'cliente') {
                navigate('/inicio');
            } else {
                navigate('/');
            }
        } catch (err) {
            const errorMsg = err.response?.data || 'Credenciales incorrectas';
            setError(typeof errorMsg === 'string' ? errorMsg : 'Error al iniciar sesión');
        }
    };

    return (
        <div className="min-h-screen bg-transparent text-white relative">
            {/* Logo en esquina superior izquierda */}
            <div className="absolute top-6 left-8">
                <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition">
                    <img src="/images/logo.jpg" alt="Logo" className="h-20 w-20 object-cover rounded-full shadow-xl" />
                    <span className="text-2xl font-extrabold tracking-tight text-mostaza hidden sm:inline-block">Mild & Limon</span>
                </Link>
            </div>

            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-fondo-tarjeta p-8 rounded-2xl shadow-lg border border-fondo-borde w-full max-w-md">
                    <h1 className="text-4xl font-extrabold text-center mb-10 tracking-tight text-white">Iniciar Sesión</h1>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Email</label>
                        <input
                            type="email"
                            className="mt-1 block w-full px-4 py-3 bg-fondo border border-fondo-borde text-white rounded-xl outline-none focus:ring-2 focus:ring-mostaza focus:border-mostaza transition"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Contraseña</label>
                        <input
                            type="password"
                            className="mt-1 block w-full px-4 py-3 bg-fondo border border-fondo-borde text-white rounded-xl outline-none focus:ring-2 focus:ring-mostaza focus:border-mostaza transition"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-mostaza text-black py-3 my-2 rounded-xl hover:bg-mostaza-hover transition-colors duration-200 font-semibold text-lg"
                    >
                        Iniciar Sesión
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-gray-400">
                    ¿No tienes cuenta? <Link to="/registro" className="text-mostaza font-semibold hover:underline">Regístrate aquí</Link>
                </p>
            </div>
            </div>

            {/* Error Pop-up Modal */}
            {error && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-fondo-tarjeta border-2 border-red-500/30 rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                        <div className="w-20 h-20 rounded-full bg-red-950/40 flex items-center justify-center mx-auto mb-5 border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h3>
                        <p className="text-gray-300 mb-8">{error}</p>
                        <button 
                            onClick={() => setError('')} 
                            className="w-full py-3.5 bg-fondo border border-fondo-borde text-white font-bold rounded-xl hover:bg-red-500/20 hover:border-red-500 hover:text-white transition-all shadow-lg"
                        >
                            Intentar de nuevo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
