import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Perfil() {
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    const [mensaje, setMensaje] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPerfil = async () => {
            try {
                const usuario = localStorage.getItem('usuario');
                if (!usuario) return navigate('/');
                const response = await axios.get('http://localhost:5105/api/usuarios/perfil');
                setNombre(response.data.nombre);
                setEmail(response.data.email);
                setTelefono(response.data.telefono || '');
            } catch (error) {
                console.error("Error cargando perfil", error);
                if (error.response?.status === 401) {
                    localStorage.removeItem('usuario');
                    localStorage.removeItem('rol');
                    navigate('/');
                }
            }
        };
        fetchPerfil();
    }, [navigate]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.put('http://localhost:5105/api/usuarios/perfil',
                { nombre, telefono }
            );
            setMensaje('¡Datos actualizados correctamente!');
            setTimeout(() => setMensaje(''), 3000);
        } catch (error) {
            setMensaje('Error al actualizar.');
        }
    };

    const logout = async () => {
        try {
            await axios.post('http://localhost:5105/api/auth/logout');
        } catch(e) {}
        localStorage.removeItem('usuario');
        localStorage.removeItem('rol');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-fondo text-white flex flex-col font-sans">
            <header className="bg-fondo border-b border-fondo-borde py-4 px-8 flex justify-between items-center z-10 sticky top-0">
                <div className="flex items-center gap-6">
                    <Link to="/reservas" className="flex items-center gap-3">
                        <img src="/images/logo.jpg" alt="Logo" className="h-16 w-16 object-cover rounded-full shadow-lg" />
                        <h1 className="text-2xl font-extrabold tracking-tight text-mostaza hidden sm:inline-block">Mild & Limon</h1>
                    </Link>
                    <Link to="/reservas" className="text-sm font-semibold text-gray-400 hover:text-mostaza transition">Tus Reservas</Link>
                </div>
                <button onClick={logout} className="text-sm font-bold text-mostaza hover:bg-mostaza/10 px-4 py-2 border border-mostaza rounded-lg transition">Cerrar Sesión</button>
            </header>

            <main className="flex-1 max-w-md w-full mx-auto p-4 md:p-8 pt-6">
                <div className="bg-fondo-tarjeta p-8 rounded-2xl shadow-lg border border-fondo-borde w-full">
                    <h2 className="text-3xl font-extrabold text-center mb-8 tracking-tight text-white">Mis Datos</h2>
                    {mensaje && <p className="text-green-500 text-sm mb-4 text-center font-bold bg-green-950/30 border border-green-900/50 p-3 rounded-lg">{mensaje}</p>}
                    <form onSubmit={handleUpdate} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Nombre Completo</label>
                            <input
                                type="text"
                                className="mt-1 block w-full px-4 py-3 bg-fondo border border-fondo-borde text-white rounded-xl outline-none focus:ring-2 focus:ring-mostaza transition"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Email (Sólo lectura)</label>
                            <input
                                type="email"
                                className="mt-1 block w-full px-4 py-3 bg-fondo/50 border border-fondo-borde rounded-xl text-gray-500 cursor-not-allowed outline-none"
                                value={email}
                                disabled
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Teléfono</label>
                            <input
                                type="tel"
                                className="mt-1 block w-full px-4 py-3 bg-fondo border border-fondo-borde text-white rounded-xl outline-none focus:ring-2 focus:ring-mostaza transition"
                                value={telefono}
                                onChange={(e) => setTelefono(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-mostaza text-black py-4 my-2 rounded-xl hover:bg-mostaza-hover transition-colors duration-200 font-semibold text-lg hover:-translate-y-1 transform shadow-lg"
                        >
                            Guardar Cambios
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
