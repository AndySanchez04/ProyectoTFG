import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from './Header';

export default function MisDatos() {
    const [activeTab, setActiveTab] = useState('perfil');

    // Estado Perfil
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    const [errorTelefono, setErrorTelefono] = useState('');
    const [fotoPerfil, setFotoPerfil] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [subiendo, setSubiendo] = useState(false);
    const fileInputRef = useRef(null);

    // Estado Reservas
    const [reservas, setReservas] = useState([]);
    const [loadingReservas, setLoadingReservas] = useState(false);

    // Modal de Cancelación
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [reservaToCancel, setReservaToCancel] = useState(null);

    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5105';

    useEffect(() => {
        fetchPerfil();
        if (activeTab === 'reservas') {
            fetchReservas();
        }
    }, [activeTab]);

    const fetchPerfil = async () => {
        try {
            const usuario = localStorage.getItem('usuario');
            if (!usuario) return navigate('/');
            const response = await axios.get(`${API_URL}/api/usuarios/perfil`);
            setNombre(response.data.nombre || '');
            setEmail(response.data.email || '');
            setTelefono(response.data.telefono || '');
            setFotoPerfil(response.data.fotoPerfil || '');
        } catch (error) {
            console.error("Error cargando perfil", error);
            if (error.response?.status === 401) {
                localStorage.removeItem('usuario');
                localStorage.removeItem('rol');
                navigate('/');
            }
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setSubiendo(true);
            const response = await axios.post(`${API_URL}/api/usuarios/upload-foto`, formData);
            setFotoPerfil(response.data.url);
            setMensaje('¡Imagen subida correctamente!');
            setTimeout(() => setMensaje(''), 3000);
        } catch (error) {
            console.error("Error subiendo imagen", error);
            alert("Error al subir la imagen. Asegúrate de que sea un archivo de imagen válido (.jpg, .png, .gif).");
        } finally {
            setSubiendo(false);
        }
    };

    const fetchReservas = async () => {
        try {
            setLoadingReservas(true);
            const response = await axios.get(`${API_URL}/api/reservas/mis-reservas`);
            setReservas(response.data);
        } catch (error) {
            console.error("Error cargando reservas:", error);
        } finally {
            setLoadingReservas(false);
        }
    };

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

    const handleUpdatePerfil = async (e) => {
        e.preventDefault();
        if (errorTelefono) return;
        try {
            await axios.put(`${API_URL}/api/usuarios/perfil`,
                { nombre, telefono, fotoPerfil }
            );
            setMensaje('¡Datos actualizados correctamente!');
            setTimeout(() => setMensaje(''), 3000);

            // Recargar para que refresque el Header si es necesario
            window.location.reload();
        } catch (error) {
            setMensaje('Error al actualizar.');
            setTimeout(() => setMensaje(''), 3000);
        }
    };

    const handleCancelarReserva = (id) => {
        setReservaToCancel(id);
        setShowCancelModal(true);
    };

    const confirmCancelarReserva = async () => {
        try {
            await axios.delete(`${API_URL}/api/reservas/${reservaToCancel}`);
            setReservas(reservas.filter(r => r.id !== reservaToCancel));
            setShowCancelModal(false);
            setReservaToCancel(null);
        } catch (error) {
            console.error("Error al cancelar reserva:", error);
            alert("Error al cancelar la reserva. " + (error.response?.data || ''));
        }
    };

    const handleModificarReserva = (id) => {
        navigate('/reservas', { state: { modificarReservaId: id } });
    };

    return (
        <div className="min-h-screen bg-fondo flex flex-col font-sans">
            <Header />

            <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 pt-6">

                {/* Botón Cerrar (X) Mis Datos */}
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => navigate('/reservas')}
                        className="flex items-center gap-2 text-mostaza group transition-colors"
                        title="Volver a Reservas"
                    >
                        <span className="font-bold text-sm uppercase tracking-wider group-hover:text-mostaza-hover transition-colors">Cerrar</span>
                        <div className="bg-mostaza/10 border border-mostaza/50 p-2 rounded-full group-hover:bg-mostaza group-hover:text-black group-hover:border-mostaza transition-all shadow-sm">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    </button>
                </div>

                {/* Custom Tabs */}
                <div className="flex border-b border-fondo-borde mb-8 bg-fondo-tarjeta p-2 rounded-2xl shadow-sm">
                    <button
                        onClick={() => setActiveTab('perfil')}
                        className={`flex-1 py-3 text-center font-bold text-lg rounded-xl transition-all ${activeTab === 'perfil' ? 'bg-mostaza text-black shadow-md' : 'text-gray-400 hover:bg-fondo hover:text-gray-300'}`}
                    >
                        Mis Datos
                    </button>
                    <button
                        onClick={() => setActiveTab('reservas')}
                        className={`flex-1 py-3 text-center font-bold text-lg rounded-xl transition-all ${activeTab === 'reservas' ? 'bg-mostaza text-black shadow-md' : 'text-gray-400 hover:bg-fondo hover:text-gray-300'}`}
                    >
                        Mis Reservas
                    </button>
                </div>

                {activeTab === 'perfil' && (
                    <section className="bg-fondo-tarjeta p-8 rounded-3xl shadow-lg border border-fondo-borde animate-fade-in-up">
                        <h2 className="text-3xl font-extrabold mb-8 tracking-tight text-white">Mi Perfil</h2>

                        {mensaje && (
                            <div className="mb-6 bg-green-950/30 text-green-500 p-4 rounded-xl font-bold text-center border border-green-900/50">
                                {mensaje}
                            </div>
                        )}

                        <form onSubmit={handleUpdatePerfil} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Nombre Completo</label>
                                    <input
                                        type="text"
                                        className="block w-full px-5 py-4 bg-fondo border border-fondo-borde text-white rounded-2xl outline-none focus:ring-2 focus:ring-mostaza focus:bg-fondo transition"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Teléfono</label>
                                    <input
                                        type="tel"
                                        className={`block w-full px-5 py-4 bg-fondo border text-white rounded-2xl outline-none focus:ring-2 focus:ring-mostaza focus:bg-fondo transition ${errorTelefono ? 'border-red-500' : 'border-fondo-borde'}`}
                                        value={telefono}
                                        onChange={handleTelefonoChange}
                                        pattern="^(\+34|0034|34)?[6789]\d{8}$"
                                        title="El teléfono debe ser un número válido español de 9 dígitos (ej. 600123456) con o sin prefijo +34"
                                        required
                                    />
                                    {errorTelefono && <p className="text-red-500 text-xs mt-1">{errorTelefono}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Email (Sólo lectura)</label>
                                <input
                                    type="email"
                                    className="block w-full px-5 py-4 bg-fondo/50 border border-fondo-borde rounded-2xl text-gray-500 cursor-not-allowed outline-none font-medium"
                                    value={email}
                                    disabled
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">URL de Foto de Perfil</label>
                                <div className="flex gap-4 items-center">
                                    <div className="flex-1 relative">
                                        <input
                                            type="url"
                                            placeholder="https://ejemplo.com/foto.jpg"
                                            className="block w-full px-5 py-4 bg-fondo border border-fondo-borde text-white rounded-2xl outline-none focus:ring-2 focus:ring-mostaza focus:bg-fondo transition pr-14"
                                            value={fotoPerfil}
                                            onChange={(e) => setFotoPerfil(e.target.value)}
                                        />
                                        
                                        {/* Input de archivo oculto */}
                                        <input 
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            accept="image/*"
                                        />

                                        {/* Botón de búsqueda de archivos */}
                                        <button 
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={subiendo}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-mostaza hover:bg-mostaza/10 rounded-xl transition-all"
                                            title="Subir imagen desde el equipo"
                                        >
                                            {subiendo ? (
                                                <div className="w-5 h-5 border-2 border-mostaza border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    {fotoPerfil && (
                                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-fondo-borde shrink-0 shadow-sm bg-fondo-tarjeta">
                                            <img 
                                                src={fotoPerfil} 
                                                alt="Preview" 
                                                className="w-full h-full object-cover" 
                                                onError={(e) => {
                                                    e.target.src = 'https://via.placeholder.com/150?text=Error';
                                                }} 
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-mostaza text-black py-5 rounded-2xl hover:bg-mostaza-hover transition-all font-bold text-lg shadow-xl hover:-translate-y-1 active:scale-95"
                            >
                                Guardar Cambios
                            </button>
                        </form>
                    </section>
                )}

                {activeTab === 'reservas' && (
                    <section className="animate-fade-in-up">
                        {loadingReservas ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 font-bold text-xl animate-pulse">Cargando reservas...</p>
                            </div>
                        ) : reservas.length === 0 ? (
                            <div className="bg-fondo-tarjeta p-12 rounded-3xl shadow-sm border-2 border-dashed border-fondo-borde text-center">
                                <h3 className="text-2xl font-bold text-white mb-2">No tienes reservas</h3>
                                <p className="text-gray-400 mb-6">Aún no has realizado ninguna reserva en nuestro restaurante.</p>
                                <button
                                    onClick={() => navigate('/reservas')}
                                    className="bg-mostaza text-black px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-mostaza-hover transition-all hover:-translate-y-1"
                                >
                                    Reservar una Mesa
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                {reservas.map((r) => {
                                    const fechaObj = new Date(r.fechaReserva);

                                    // Determinar estilos base según EsActiva
                                    const isActiva = r.esActiva;
                                    const opacityClass = isActiva ? 'opacity-100' : 'opacity-60 grayscale-[50%]';
                                    const borderClass = isActiva ? 'border-mostaza shadow-md hover:shadow-lg hover:shadow-mostaza/10' : 'border-fondo-borde shadow-sm';
                                    const bgClass = isActiva ? 'bg-fondo-tarjeta' : 'bg-fondo';

                                    return (
                                        <div key={r.id} className={`${bgClass} p-6 md:p-8 rounded-3xl border ${borderClass} flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all ${opacityClass} relative overflow-hidden`}>

                                            {/* Ribbon / Badge flotante para activas */}
                                            {isActiva && (
                                                <div className="absolute top-0 right-0 bg-mostaza text-black text-xs font-bold px-4 py-1 rounded-bl-xl shadow-sm">
                                                    🟢 Próxima
                                                </div>
                                            )}
                                            {!isActiva && (
                                                <div className="absolute top-0 right-0 bg-fondo-borde text-gray-400 text-xs font-bold px-4 py-1 rounded-bl-xl shadow-sm border-b border-l border-fondo-borde">
                                                    ⚪ Completada / Expirada
                                                </div>
                                            )}

                                            <div className="flex gap-6 items-center mt-2 md:mt-0">
                                                <div className={`p-4 border rounded-2xl text-center min-w-[80px] ${isActiva ? 'bg-mostaza/10 border-mostaza/30' : 'bg-fondo/80 border-fondo-borde'}`}>
                                                    <p className={`text-sm font-bold uppercase ${isActiva ? 'text-mostaza' : 'text-gray-500'}`}>
                                                        {fechaObj.toLocaleString('es-ES', { month: 'short' })}
                                                    </p>
                                                    <p className={`text-3xl font-black ${isActiva ? 'text-white' : 'text-gray-500'}`}>
                                                        {fechaObj.getDate()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className={`text-xl font-bold ${isActiva ? 'text-white' : 'text-gray-400'}`}>
                                                            {r.horaInicio.substring(0, 5)} - {r.mesa?.zona}
                                                        </h3>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${r.estado === 'Confirmada' ? 'bg-green-950/40 text-green-500 border border-green-900' : 'bg-yellow-950/40 text-yellow-500 border border-yellow-900'
                                                            }`}>
                                                            {r.estado}
                                                        </span>
                                                    </div>
                                                    <p className={`font-medium ${isActiva ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        Mesa #{r.mesa?.numeroMesa} • {r.numPersonas} Personas
                                                    </p>
                                                </div>
                                            </div>

                                            {isActiva ? (
                                                <div className="flex gap-3 w-full md:w-auto">
                                                    <button
                                                        onClick={() => handleModificarReserva(r.id)}
                                                        className="flex-1 md:flex-none border border-fondo-borde text-gray-300 hover:text-white bg-fondo hover:bg-fondo-borde px-6 py-3 rounded-xl font-bold transition-all shadow-sm"
                                                    >
                                                        Modificar
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancelarReserva(r.id)}
                                                        className="flex-1 md:flex-none border border-mostaza/50 text-mostaza bg-mostaza/10 hover:bg-mostaza hover:text-black hover:border-mostaza px-6 py-3 rounded-xl font-bold transition-all shadow-sm"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="w-full md:w-auto flex justify-end">
                                                    <span className="text-sm font-bold text-gray-600 italic">Solo lectura</span>
                                                </div>
                                            )}

                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}

            </main>

            {/* Modal de Cancelación */}
            {showCancelModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => {
                        setShowCancelModal(false);
                        setReservaToCancel(null);
                    }}></div>
                    <div className="relative bg-fondo-tarjeta border border-fondo-borde p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-300">
                        <button 
                            onClick={() => {
                                setShowCancelModal(false);
                                setReservaToCancel(null);
                            }}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="w-16 h-16 bg-mostaza/20 border-2 border-mostaza rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-mostaza" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2">Cancelar Reserva</h3>
                        <p className="text-gray-400 mb-6 font-medium">¿Estás seguro de que deseas cancelar esta reserva? Esta acción no se puede deshacer.</p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setReservaToCancel(null);
                                }}
                                className="flex-1 bg-transparent border-2 border-fondo-borde text-white py-4 rounded-xl font-bold hover:bg-fondo-borde transition-all"
                            >
                                No, volver
                            </button>
                            <button 
                                onClick={confirmCancelarReserva}
                                className="flex-1 bg-mostaza text-black py-4 rounded-xl font-bold hover:shadow-lg hover:bg-mostaza/80 transition-all active:scale-95"
                            >
                                Sí, cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
