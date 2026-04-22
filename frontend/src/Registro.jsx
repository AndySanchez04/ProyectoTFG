import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Registro() {
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    const [password, setPassword] = useState('');
    const [errorTelefono, setErrorTelefono] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

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
            await axios.post('http://localhost:5105/api/auth/registro', { nombre, email, telefono, password });
            navigate('/');
        } catch (err) {
            setError('Error al registrar usuario');
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
                {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
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
        </div>
    );
}
