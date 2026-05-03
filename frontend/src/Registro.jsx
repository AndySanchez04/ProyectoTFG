import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

/**
 * Componente de registro de nuevos clientes.
 * Valida los datos del formulario, incluyendo el formato de teléfono español, y crea la cuenta del usuario.
 */
export default function Registro() {
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    const [password, setPassword] = useState('');
    const [errorTelefono, setErrorTelefono] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5105';

    const handleTelefonoChange = (e) => {
        const val = e.target.value.replace(/[^\d+]/g, '');
        setTelefono(val);
        const regex = /^(\+34|0034|34)?[6789]\d{8}$/;
        if (val && !regex.test(val)) {
            setErrorTelefono('Formato inválido. Ej: 600123456 o +34600123456');
        } else {
            setErrorTelefono('');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (errorTelefono) return;
        try {
            const normalizedEmail = email.trim().toLowerCase();
            await axios.post(`${API_URL}/api/auth/registro`, { nombre, email: normalizedEmail, telefono, password });
            navigate('/');
        } catch (err) {
            const errorMsg = err.response?.data || 'Error al registrar usuario';
            setError(typeof errorMsg === 'string' ? errorMsg : 'Error al registrar usuario');
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
                    <h1 className="text-3xl font-extrabold text-center mb-8 tracking-tight text-white">Crear Cuenta</h1>
                <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Nombre Completo</label>
                        <input
                            type="text"
                            className="mt-1 block w-full px-4 py-3 bg-fondo border border-fondo-borde text-white rounded-xl outline-none focus:ring-2 focus:ring-mostaza focus:border-mostaza transition"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            required
                        />
                    </div>
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
                        <label className="block text-sm font-medium text-gray-300">Teléfono</label>
                        <input
                            type="tel"
                            className={`mt-1 block w-full px-4 py-3 bg-fondo border text-white rounded-xl outline-none focus:ring-2 focus:ring-mostaza focus:border-mostaza transition ${errorTelefono ? 'border-red-500' : 'border-fondo-borde'}`}
                            value={telefono}
                            onChange={handleTelefonoChange}
                            pattern="^(\+34|0034|34)?[6789]\d{8}$"
                            title="El teléfono debe ser un número válido español de 9 dígitos (ej. 600123456) con o sin prefijo +34"
                            required
                        />
                        {errorTelefono && <p className="text-red-500 text-xs mt-1">{errorTelefono}</p>}
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
                        Registrarse
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-gray-400">
                    ¿Ya tienes cuenta? <Link to="/" className="text-mostaza font-semibold hover:underline">Inicia Sesión</Link>
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
                        <h3 className="text-2xl font-bold text-white mb-2">Error de Registro</h3>
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
