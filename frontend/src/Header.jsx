import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Header() {
    const [user, setUser] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
    const menuRef = useRef(null);

    const fetchPerfil = async () => {
        try {
            const usuarioStr = localStorage.getItem('usuario');
            if (usuarioStr) {
                const response = await axios.get('http://localhost:5105/api/usuarios/perfil');
                setUser(response.data);
            }
        } catch (error) {
            console.error("Error cargando perfil en header", error);
        }
    };

    useEffect(() => {
        fetchPerfil();

        // Cierra el menú si se hace click fuera
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:5105/api/auth/logout');
        } catch(e) {}
        localStorage.removeItem('usuario');
        localStorage.removeItem('rol');
        navigate('/');
    };

    return (
        <>
        <header className="bg-fondo/60 backdrop-blur-md text-white py-4 px-8 flex justify-between items-center z-50 sticky top-0 border-b border-fondo-borde relative">
            <div className="flex items-center gap-6">
                <Link to="/reservas" className="flex items-center gap-3 hover:opacity-80 transition">
                    <img src="/images/logo.jpg" alt="Mild & Limon Logo" className="h-16 w-16 object-cover rounded-full shadow-lg" />
                    <span className="text-2xl font-extrabold tracking-tight text-mostaza hidden sm:inline-block">Mild & Limon</span>
                </Link>
            </div>

            {user && (
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-mostaza transition-all focus:outline-none focus:ring-2 focus:ring-mostaza"
                    >
                        {user.fotoPerfil ? (
                            <img src={user.fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-mostaza flex items-center justify-center text-black font-bold text-lg">
                                {user.nombre.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-fondo-tarjeta rounded-xl shadow-xl border border-fondo-borde py-2 z-50">
                            <Link to="/mis-datos" className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-fondo font-medium transition w-full text-left" onClick={() => setMenuOpen(false)}>Mis Datos</Link>
                            <button onClick={handleLogout} className="block px-4 py-2 text-sm text-mostaza hover:bg-mostaza/10 font-bold transition w-full text-left uppercase tracking-wider">Cerrar Sesión</button>
                        </div>
                    )}
                </div>
            )}
        </header>
        <TacoAvatar />
        </>
    );
}

function TacoAvatar() {
    const [mensajes, setMensajes] = useState([]);
    const [mensajeActual, setMensajeActual] = useState('');
    const [mostrarGlobo, setMostrarGlobo] = useState(false);

    useEffect(() => {
        axios.get('http://localhost:5105/api/tacomensajes')
            .then(res => setMensajes(res.data))
            .catch(err => console.error("Error cargando mensajes de Taco", err));
    }, []);

    const handleClick = () => {
        if (mensajes.length === 0) {
            setMensajeActual("¡Guau! Dile a mi jefe que añada frases en Configuración.");
        } else {
            const index = Math.floor(Math.random() * mensajes.length);
            setMensajeActual(mensajes[index].texto);
        }
        setMostrarGlobo(true);

        setTimeout(() => {
            setMostrarGlobo(false);
        }, 5000);
    };

    return (
        <div className="fixed bottom-4 right-12 sm:bottom-8 sm:right-20 z-[100] flex flex-col items-center">
            {mostrarGlobo && (
                <div className="absolute bottom-full mb-4 bg-white text-black font-bold text-sm px-4 py-3 rounded-2xl shadow-xl max-w-[200px] text-center animate-in fade-in zoom-in duration-300 w-max">
                    {mensajeActual}
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[10px] border-l-transparent border-r-transparent border-t-white"></div>
                </div>
            )}
            <img 
                src="/images/Taco.png" 
                alt="Taco Avatar" 
                className="w-32 h-32 sm:w-40 sm:h-40 object-contain cursor-pointer drop-shadow-2xl"
                onClick={handleClick}
                onError={(e) => e.target.style.display = 'none'}
            />
        </div>
    );
}
