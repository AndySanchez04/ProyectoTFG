import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5105/api/auth/login', { email, password });
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
            setError('Credenciales incorrectas');
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
                {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
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
        </div>
    );
}
