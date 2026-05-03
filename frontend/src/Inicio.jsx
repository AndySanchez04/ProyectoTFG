import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';

/**
 * Componente de la página de inicio (Landing Page).
 * Presenta el restaurante, galería de imágenes, ubicación y sistema de reseñas públicas.
 */
export default function Inicio() {
    const navigate = useNavigate();
    const [resenas, setResenas] = useState([]);
    const [nuevaResena, setNuevaResena] = useState({ estrellas: 5, comentario: '' });
    const [enviando, setEnviando] = useState(false);
    const [usuario, setUsuario] = useState(null);
    const [modal, setModal] = useState({ open: false, title: '', message: '', type: 'success' });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5105';

    useEffect(() => {
        fetchResenas();
        const userStr = localStorage.getItem('usuario');
        if (userStr) setUsuario(JSON.parse(userStr));
    }, []);

    const fetchResenas = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/resenas`);
            setResenas(res.data);
        } catch (e) {
            console.error("Error cargando reseñas", e);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nuevaResena.comentario.trim()) return;
        
        setEnviando(true);
        try {
            const resenaToSend = {
                usuarioNombre: usuario ? `${usuario.nombre} ${usuario.apellidos || ''}`.trim() : "Cliente Invitado",
                usuarioEmail: usuario?.email || null,
                usuarioFoto: usuario?.fotoPerfil || null,
                estrellas: nuevaResena.estrellas,
                comentario: nuevaResena.comentario
            };
            await axios.post(`${API_URL}/api/resenas`, resenaToSend);
            setModal({ open: true, title: '¡Gracias!', message: 'Tu reseña ha sido publicada con éxito.', type: 'success' });
            setNuevaResena({ estrellas: 5, comentario: '' });
            fetchResenas();
        } catch (e) {
            console.error("Error enviando reseña", e);
            const errorMsg = e.response?.data?.errors 
                ? JSON.stringify(e.response.data.errors) 
                : (e.response?.data?.title || e.message);
            setModal({ open: true, title: 'Lo sentimos', message: 'Hubo un error al enviar tu reseña: ' + errorMsg, type: 'error' });
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent text-white flex flex-col font-sans relative z-10 overflow-auto">
            <Header />

            {/* Hero Section */}
            <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 pt-6 lg:pt-12 animate-fade-in-up">
                
                <section className="text-center mb-16 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-mostaza/20 blur-[100px] rounded-full pointer-events-none -z-10"></div>
                    
                    <img 
                        src="/images/logo.jpg" 
                        alt="Logo Mild & Limon" 
                        className="mx-auto w-32 h-32 md:w-40 md:h-40 object-cover rounded-full shadow-2xl border-4 border-fondo-borde mb-8 hover:scale-105 transition-transform duration-500"
                    />
                    
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
                        Bienvenidos a <span className="text-mostaza">Mild & Limon</span>
                    </h1>
                    
                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-400 font-medium leading-relaxed mb-10">
                        Descubre una experiencia culinaria única donde la tradición y la innovación se encuentran. 
                        Disfruta de nuestros espacios cuidadosamente diseñados para ofrecerte momentos inolvidables, 
                        desde nuestra zona de terraza hasta los vibrantes rincones de nuestro salón principal.
                    </p>

                    <button 
                        onClick={() => navigate('/reservas')}
                        className="bg-mostaza text-black px-12 py-5 rounded-2xl text-xl font-black shadow-lg shadow-mostaza/20 hover:shadow-mostaza/40 hover:-translate-y-2 hover:bg-mostaza-hover transition-all duration-300 active:scale-95"
                    >
                        Reservar Mesa Ahora
                    </button>
                </section>

                {/* Galería Masónica / Grid de Imágenes */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
                    <div className="lg:col-span-2 lg:row-span-2 rounded-3xl overflow-hidden relative group">
                        <img src="/images/FondoLocal.jpeg" alt="Fondo" className="w-full h-full object-cover aspect-video lg:aspect-square transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-mostaza font-bold text-lg tracking-wider uppercase">Ambiente Relajado</span>
                        </div>
                    </div>
                    <div className="rounded-3xl overflow-hidden relative group">
                        <img src="/images/BarraLocal.jpeg" alt="Barra" className="w-full h-full object-cover aspect-square transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-mostaza font-bold text-sm tracking-wider uppercase">Nuestra Barra</span>
                        </div>
                    </div>
                    <div className="rounded-3xl overflow-hidden relative group">
                        <img src="/images/FrontalLocal.jpeg" alt="Frontal" className="w-full h-full object-cover aspect-square transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-mostaza font-bold text-sm tracking-wider uppercase">Fachada</span>
                        </div>
                    </div>
                    <div className="lg:col-span-2 rounded-3xl overflow-hidden relative group">
                        <img src="/images/KatrinaLocal.jpg" alt="Katrina" className="w-full h-full object-cover lg:aspect-[2/1] aspect-video transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-mostaza font-bold text-lg tracking-wider uppercase">Arte y Cultura</span>
                        </div>
                    </div>
                </section>

                {/* Ubicación e Información de Contacto */}
                <section className="bg-fondo-tarjeta/60 backdrop-blur-md border border-fondo-borde rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden animate-fade-in-up mb-16">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-mostaza/5 rounded-full blur-[80px] -z-10"></div>
                    
                    <h2 className="text-3xl font-black mb-8 text-white uppercase tracking-tight">
                        ¿Dónde Encontrarnos?
                    </h2>

                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-12">
                        {/* Ubicación */}
                        <a 
                            href="https://maps.google.com/?q=Avenida+Juan+Carlos+1+13,+La+Garena+Plaza,+Alcalá+de+Henares" 
                            target="_blank" rel="noopener noreferrer"
                            className="group flex items-center gap-4 hover:bg-white/5 p-4 -ml-4 rounded-2xl transition-all"
                        >
                            <div className="bg-mostaza/10 p-3 rounded-full group-hover:bg-mostaza group-hover:text-black text-mostaza transition-all duration-300">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-white group-hover:text-mostaza transition-colors leading-tight">Avenida Juan Carlos I, 13</p>
                                <p className="text-gray-400 font-medium text-sm">La Garena Plaza, Alcalá de Henares</p>
                            </div>
                        </a>

                        {/* Bloque Horario */}
                        <div className="flex items-center gap-4 p-2">
                            <div className="bg-mostaza/10 p-3 rounded-full text-mostaza">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-mostaza uppercase tracking-widest leading-tight">Horario</p>
                                <p className="text-lg font-black text-white leading-tight">Lunes a Domingo</p>
                                <p className="text-gray-400 text-sm">13:00 a 00:00</p>
                            </div>
                        </div>

                        {/* Bloque Teléfono */}
                        <div className="flex items-center gap-4 p-2">
                            <div className="bg-mostaza/10 p-3 rounded-full text-mostaza">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-mostaza uppercase tracking-widest leading-tight">Reservas</p>
                                <p className="text-lg font-black text-white leading-tight">696 32 48 97</p>
                                <p className="text-gray-400 text-sm">Llamada directa</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                        <p className="text-gray-500 text-sm font-medium italic">Vive la experiencia Mild & Limon en el corazón de Alcalá.</p>
                        <button 
                            onClick={() => navigate('/reservas')}
                            className="bg-transparent border-2 border-mostaza text-mostaza px-10 py-4 rounded-xl text-lg font-bold hover:bg-mostaza hover:text-black transition-all duration-300"
                        >
                            Ver Disponibilidad
                        </button>
                    </div>
                </section>

                {/* Carta Digital QR Section */}
                <section className="mb-20 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                    <div className="bg-fondo-tarjeta/60 backdrop-blur-md border border-fondo-borde p-8 md:p-12 rounded-3xl shadow-2xl max-w-lg mx-auto flex flex-col items-center group hover:border-mostaza/5 transition-colors relative overflow-hidden text-center">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-mostaza/5 rounded-full blur-2xl -z-10 pointer-events-none"></div>
                        <h2 className="text-3xl font-black text-white mb-8 uppercase tracking-tighter">Nuestra Carta Digital</h2>
                        
                        <div className="bg-white p-4 rounded-2xl shadow-lg mb-6 group-hover:scale-105 transition-transform">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/cartas')}`} 
                                alt="QR Carta" 
                                className="w-48 h-48 object-contain"
                            />
                        </div>
                        
                        <h3 className="text-xl font-bold text-mostaza mb-2 uppercase tracking-wide">Escanea con tu móvil</h3>
                        <p className="text-gray-400 font-medium text-sm mb-8 px-4">Accede de forma rápida y sencilla a nuestra oferta gastronómica.</p>
                        
                        <button 
                            onClick={() => window.open('/cartas', '_blank')}
                            className="bg-transparent border-2 border-mostaza text-mostaza px-8 py-4 rounded-xl font-bold hover:bg-mostaza hover:text-black transition-all shadow-md active:scale-95 w-full md:w-auto uppercase tracking-widest text-xs"
                        >
                            Ver Online
                        </button>
                    </div>
                </section>

                {/* Sección de Reseñas - Centrada y debajo de las cartas */}
                <section className="mb-16 animate-fade-in-up max-w-4xl mx-auto" style={{ animationDelay: '500ms' }}>
                    <div className="flex items-center gap-4 mb-10">
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-mostaza/50"></div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-widest text-center">Experiencias Mild & Limon</h2>
                        <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-mostaza/50"></div>
                    </div>

                    <div className="flex flex-col items-center gap-12">
                        {/* Formulario de Reseña - Más ancho y centrado */}
                        <div className="bg-fondo-tarjeta/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl w-full max-w-2xl">
                            <h3 className="text-2xl font-bold text-white mb-8 text-center flex flex-col items-center gap-3">
                                <span className="text-mostaza text-4xl">⭐</span>
                                ¿Qué te ha parecido tu visita?
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="flex flex-col items-center gap-6">
                                    <div className="flex flex-col items-center">
                                        <p className="text-gray-400 text-sm font-bold mb-3 uppercase tracking-tighter">Tu Puntuación</p>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setNuevaResena({ ...nuevaResena, estrellas: star })}
                                                    className={`text-4xl transition-all hover:scale-125 active:scale-90 ${star <= nuevaResena.estrellas ? 'text-mostaza drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]' : 'text-white/10'}`}
                                                >
                                                    ★
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 bg-white/5 p-3 px-5 rounded-full border border-white/10">
                                        <div className="w-10 h-10 rounded-full bg-mostaza/20 flex items-center justify-center border border-mostaza/20 overflow-hidden">
                                            {usuario?.fotoPerfil ? (
                                                <img src={usuario.fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-mostaza font-black text-xl">{usuario?.nombre?.charAt(0) || "C"}</span>
                                            )}
                                        </div>
                                        <span className="text-white font-bold tracking-tight">
                                            {usuario ? `${usuario.nombre} ${usuario.apellidos || ''}` : "Cliente Invitado"}
                                        </span>
                                    </div>
                                </div>

                                <div className="relative group">
                                    <textarea
                                        value={nuevaResena.comentario}
                                        onChange={(e) => setNuevaResena({ ...nuevaResena, comentario: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-3xl p-6 text-white placeholder-gray-600 focus:outline-none focus:border-mostaza/50 transition-all min-h-[140px] resize-none text-center text-lg leading-relaxed italic"
                                        placeholder="Escribe aquí tu opinión..."
                                        required
                                    />
                                    <div className="absolute -bottom-2 -right-2 text-4xl opacity-10 select-none">”</div>
                                    <div className="absolute -top-2 -left-2 text-4xl opacity-10 select-none rotate-180">”</div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={enviando}
                                    className="w-full bg-mostaza text-black font-black py-5 rounded-2xl hover:bg-yellow-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-mostaza/20 disabled:opacity-50 text-lg"
                                >
                                    {enviando ? "ENVIANDO OPINIÓN..." : "PUBLICAR EN EL MURO"}
                                    {!enviando && <span>✨</span>}
                                </button>
                            </form>
                        </div>

                        {/* Listado de Reseñas - Diseño de Muro/Cards */}
                        <div className="w-full space-y-6">
                            {resenas.length === 0 ? (
                                <p className="text-center text-gray-600 italic py-10">Aún no hay opiniones. ¡Sé el primero!</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {resenas.map((r) => (
                                        <div key={r.id} className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-3xl p-6 flex flex-col justify-between hover:bg-white/10 transition-all group">
                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-2xl bg-mostaza/10 flex items-center justify-center border border-mostaza/10 overflow-hidden">
                                                            {r.usuarioFoto ? (
                                                                <img src={r.usuarioFoto} alt="User" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-mostaza font-bold text-xl">{(r.usuarioNombre || "C").charAt(0)}</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-white group-hover:text-mostaza transition-colors">{r.usuarioNombre}</h4>
                                                            <div className="flex text-mostaza text-xs">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <span key={i} className={i < r.estrellas ? "opacity-100" : "opacity-20"}>★</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{new Date(r.fecha).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-gray-300 leading-relaxed italic text-sm">"{r.comentario}"</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <div className="mt-16 pb-8 border-t border-fondo-borde pt-8 flex flex-col items-center justify-center gap-4">
                    <h4 className="text-mostaza font-bold text-xs uppercase tracking-widest mb-2">Síguenos en Redes Sociales</h4>
                    <div className="flex items-center gap-6 mb-2">
                        <a href="https://www.instagram.com/mildandlimon/" target="_blank" rel="noopener noreferrer" className="p-3 bg-fondo-tarjeta border border-fondo-borde rounded-xl text-gray-400 hover:text-white hover:border-mostaza hover:bg-mostaza/10 hover:scale-110 transition-all shadow-md" title="Instagram">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/></svg>
                        </a>
                        <a href="https://www.facebook.com/profile.php?id=61566450715612" target="_blank" rel="noopener noreferrer" className="p-3 bg-fondo-tarjeta border border-fondo-borde rounded-xl text-gray-400 hover:text-white hover:border-mostaza hover:bg-mostaza/10 hover:scale-110 transition-all shadow-md" title="Facebook">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
                        </a>
                        <a href="https://www.google.com/maps/search/?api=1&query=Mild+%26+Limon+Avenida+Juan+Carlos+I+13+Alcala+de+Henares" target="_blank" rel="noopener noreferrer" className="p-3 bg-fondo-tarjeta border border-fondo-borde rounded-xl text-gray-400 hover:text-white hover:border-mostaza hover:bg-mostaza/10 hover:scale-110 transition-all shadow-md" title="Google Maps">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                        </a>
                    </div>
                    
                    <span className="text-gray-600 font-medium text-xs text-center">
                        &copy; {new Date().getFullYear()} Mild & Limon. Todos los derechos reservados.
                    </span>
                </div>

            </main>

            {/* Modal de Feedback (Éxito/Error) */}
            {modal.open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setModal({ ...modal, open: false })}></div>
                    <div className="relative bg-fondo-tarjeta border border-fondo-borde p-8 rounded-[2.5rem] max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-300">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 ${modal.type === 'success' ? 'bg-mostaza/20 border-mostaza text-mostaza' : 'bg-red-500/20 border-red-500 text-red-500'}`}>
                            {modal.type === 'success' ? (
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </div>
                        <h3 className="text-3xl font-black text-white mb-2">{modal.title}</h3>
                        <p className="text-gray-400 mb-8 font-medium leading-relaxed">{modal.message}</p>
                        <button 
                            onClick={() => setModal({ ...modal, open: false })}
                            className={`w-full py-5 rounded-2xl text-lg font-black transition-all active:scale-95 shadow-xl ${modal.type === 'success' ? 'bg-mostaza text-black hover:bg-mostaza-hover shadow-mostaza/20' : 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20'}`}
                        >
                            ENTENDIDO
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
