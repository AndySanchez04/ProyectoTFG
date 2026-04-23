import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Reservas() {
    const [paso, setPaso] = useState(1);
    const [personas, setPersonas] = useState(2);
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [zona, setZona] = useState('');

    const [mesas, setMesas] = useState([]);
    const [reservaId, setReservaId] = useState(null);

    const [timeLeft, setTimeLeft] = useState(300); // 5 minutos
    const [userName, setUserName] = useState('');
    const [userPhone, setUserPhone] = useState('');
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    const modifyingReservaId = location.state?.modificarReservaId;
    const isModifying = !!modifyingReservaId;
    const [selectedMesaId, setSelectedMesaId] = useState(null);

    // Generar Horas según reglas de negocio
    const horas = [
        '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00',
        '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'
    ];
    const zonas = ['Salón', 'Terraza'];

    useEffect(() => {
        const fetchPerfil = async () => {
            try {
                const usuario = localStorage.getItem('usuario');
                if (usuario) {
                    const res = await axios.get('http://localhost:5105/api/usuarios/perfil');
                    setUserName(res.data.nombre);
                    setUserPhone(res.data.telefono || 'No especificado');
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchPerfil();
    }, []);

    useEffect(() => {
        let timer;
        if (paso === 6 && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (paso === 6 && timeLeft === 0) {
            alert('Tiempo expirado. La mesa ha sido liberada.');
            resetFlujo();
        }
        return () => clearInterval(timer);
    }, [paso, timeLeft]);

    const resetFlujo = async () => {
        // Si estamos retrocediendo desde el Paso 6 en una reserva nueva y hay un lock pendiente...
        if (paso === 6 && reservaId && !isModifying) {
            try {
                await axios.delete(`http://localhost:5105/api/reservas/liberar-lock/${reservaId}`);
            } catch (error) {
                console.error("Error liberando mesa lockeada:", error);
            }
        }

        setPaso(1);
        setFecha('');
        setHora('');
        setZona('');
        setMesas([]);
        setReservaId(null);
        setTimeLeft(300);
    };

    const handleBuscarMesas = async (selectedZona) => {
        setZona(selectedZona);
        try {
            const response = await axios.get(`http://localhost:5105/api/reservas/disponibles`, {
                params: { capacidad: personas, fecha: fecha, horaInicio: `${hora}:00`, zona: selectedZona }
            });
            setMesas(response.data);
            setPaso(5);
        } catch (error) {
            console.error(error);
            alert('Error al buscar mesas');
        }
    };

    const handleBloquearMesa = async (mesaId) => {
        try {
            if (isModifying) {
                setSelectedMesaId(mesaId);
                setPaso(6);
                setTimeLeft(300);
                return;
            }

            const response = await axios.post('http://localhost:5105/api/reservas/BloquearMesa',
                { mesaId, fecha, horaInicio: `${hora}:00`, numPersonas: parseInt(personas) }
            );
            setReservaId(response.data.reservaId);
            setPaso(6);
            setTimeLeft(300);
        } catch (error) {
            console.error('Error bloqueando mesa:', error);
            const status = error.response?.status;
            const msg = error.response?.data || 'Error desconocido al reservar la mesa.';
            
            if (status === 400) {
                // Mesa ocupada: volver a elegir otra mesa (paso 5)
                alert(msg);
                setPaso(5);
            } else if (status === 401) {
                alert('Sesión expirada. Vuelve a iniciar sesión.');
                navigate('/');
            } else {
                alert(`Error: ${msg}`);
            }
        }
    };

    const handleConfirmar = async () => {
        try {
            if (isModifying) {
                await axios.put(`http://localhost:5105/api/reservas/${modifyingReservaId}`,
                    { mesaId: selectedMesaId, fecha, horaInicio: `${hora}:00`, numPersonas: parseInt(personas) }
                );
                setPaso(7);
            } else {
                await axios.post(`http://localhost:5105/api/reservas/ConfirmarReserva/${reservaId}`,
                    {}
                );
                // En lugar de resetear, vamos al paso de éxito
                setPaso(7);
            }
        } catch (error) {
            console.error(error);
            alert(error.response?.data || 'Error al confirmar la reserva.');
        }
    };

    const loadImageToBase64 = (url) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = (e) => reject(e);
            img.src = url;
            setTimeout(() => reject(new Error('Timeout loading image')), 5000);
        });
    };

    const generatePDFContent = async () => {
        const doc = new jsPDF();
        const primaryColor = [234, 179, 8]; // Mostaza
        
        // Cargar Logo
        let logoBase64 = null;
        try {
            logoBase64 = await loadImageToBase64('/images/logo.jpg');
        } catch (e) {
            console.warn("Logo not found for PDF", e);
        }

        // Fondo Cabecera Premium
        doc.setFillColor(15, 15, 15);
        doc.rect(0, 0, 210, 50, 'F');
        
        // Línea decorativa
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 48, 210, 2, 'F');

        if (logoBase64) {
            doc.addImage(logoBase64, 'JPEG', 20, 10, 30, 30);
        }

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont(undefined, 'bold');
        doc.text('MILD & LIMON', 60, 25);
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('GASTRONOMÍA & EXPERIENCIAS', 60, 33);
        
        // Título del Documento
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('CONFIRMACIÓN DE RESERVA', 105, 70, { align: 'center' });
        
        // Cuerpo del Justificante
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.5);
        doc.line(20, 75, 190, 75);

        // Grid de Datos
        doc.setFontSize(12);
        const startY = 90;
        const col1 = 30;
        const col2 = 100;
        const rowH = 12;

        const drawRow = (label, value, y) => {
            doc.setFont(undefined, 'bold');
            doc.setTextColor(100, 100, 100);
            doc.text(label, col1, y);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(value, col2, y);
            doc.setDrawColor(245, 245, 245);
            doc.line(col1, y + 4, 180, y + 4);
        };

        drawRow('Código:', `#${reservaId || modifyingReservaId}`, startY);
        drawRow('Nombre:', userName, startY + rowH);
        drawRow('Teléfono:', userPhone, startY + rowH * 2);
        drawRow('Fecha:', fecha.split('-').reverse().join('/'), startY + rowH * 3);
        drawRow('Hora:', hora, startY + rowH * 4);
        drawRow('Ubicación:', zona, startY + rowH * 5);
        drawRow('Comensales:', `${personas} personas`, startY + rowH * 6);

        // Pie de página
        doc.setFillColor(245, 245, 245);
        doc.rect(20, 240, 170, 35, 'F');
        
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('INFORMACIÓN IMPORTANTE', 30, 250);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        doc.text('• Se ruega puntualidad. La mesa se mantendrá 15 min.', 30, 256);
        doc.text('• Para cancelaciones, por favor llame al 696 32 48 97.', 30, 261);
        doc.text('• Dirección: Avenida Juan Carlos I, 13, Alcalá de Henares.', 30, 266);
        
        doc.setTextColor(150, 150, 150);
        doc.text('Gracias por confiar en Mild & Limon', 105, 285, { align: 'center' });
        
        return doc;
    };

    const generatePDF = async () => {
        try {
            const doc = await generatePDFContent();
            doc.save(`Reserva_MildLimon_${reservaId || modifyingReservaId}.pdf`);
        } catch (error) {
            console.error('Error generando PDF:', error);
        }
    };

    const handleEnviarEmail = async () => {
        setIsSendingEmail(true);
        try {
            const doc = await generatePDFContent();
            const pdfBase64 = doc.output('datauristring');

            await axios.post('http://localhost:5105/api/reservas/enviar-justificante', {
                IdReserva: reservaId || modifyingReservaId,
                PdfBase64: pdfBase64
            });

            setShowSuccessModal(true);
        } catch (error) {
            console.error(error);
            alert('Error al enviar el email.');
        } finally {
            setIsSendingEmail(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="min-h-screen bg-transparent text-white flex flex-col font-sans relative z-10">
            <Header />

            <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-8 pt-6">
                {/* Barra de progreso visual */}
                <div className="flex justify-between mb-8 relative">
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-fondo-borde -z-10 -translate-y-1/2 rounded-full"></div>
                    <div className="absolute top-1/2 left-0 h-1 bg-mostaza -z-10 -translate-y-1/2 rounded-full transition-all duration-500" style={{ width: `${((paso - 1) / 6) * 100}%` }}></div>
                    {[1, 2, 3, 4, 5, 6, 7].map(p => (
                        <div key={p} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${paso >= p ? 'bg-mostaza text-black' : 'bg-fondo-tarjeta text-gray-500'}`}>
                            {p === 7 ? '✓' : p}
                        </div>
                    ))}
                </div>

                <section className="bg-fondo-tarjeta/60 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-fondo-borde transition-all shadow-2xl">

                    {paso === 1 && (
                        <div className="animate-fade-in-up">
                            <h2 className="text-2xl font-bold mb-6 text-white">¿Cuántas personas son?</h2>
                            <input
                                type="number"
                                min="1" max="20"
                                value={personas}
                                onChange={e => setPersonas(e.target.value)}
                                className="w-full bg-fondo-tarjeta/50 text-white text-center text-4xl p-6 border-2 border-fondo-borde rounded-2xl focus:border-mostaza focus:ring-0 outline-none transition-all mb-6 font-black"
                            />
                            <button
                                onClick={() => setPaso(2)}
                                className="w-full bg-mostaza text-black py-4 rounded-xl text-lg font-bold hover:bg-mostaza-hover transition-all active:scale-95"
                            >
                                Continuar
                            </button>
                        </div>
                    )}

                    {paso === 2 && (
                        <div className="animate-fade-in-up">
                            <h2 className="text-2xl font-bold mb-6 text-white">Elige el día</h2>
                            <input
                                type="date"
                                value={fecha}
                                onChange={e => setFecha(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full bg-fondo-tarjeta/50 text-white text-center text-2xl p-6 border-2 border-fondo-borde rounded-2xl focus:border-mostaza focus:ring-0 outline-none transition-all mb-6 font-bold"
                            />
                            <div className="flex gap-4">
                                <button onClick={() => setPaso(1)} className="flex-1 flex justify-center items-center gap-2 bg-fondo text-white border border-fondo-borde py-4 rounded-xl text-lg font-bold hover:bg-fondo-borde transition-all">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Atrás
                                </button>
                                <button
                                    onClick={() => setPaso(3)}
                                    disabled={!fecha}
                                    className={`flex-1 py-4 rounded-xl text-lg font-bold transition-all ${fecha ? 'bg-mostaza text-black hover:bg-mostaza-hover active:scale-95' : 'bg-fondo-borde text-gray-500 cursor-not-allowed'}`}
                                >
                                    Continuar
                                </button>
                            </div>
                        </div>
                    )}

                    {paso === 3 && (
                        <div className="animate-fade-in-up">
                            <h2 className="text-2xl font-bold mb-6 text-white">Selecciona la hora</h2>
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-8">
                                {horas.map(h => {
                                    const now = new Date();
                                    // Usamos la fecha local para la comparación
                                    const y = now.getFullYear();
                                    const m = (now.getMonth() + 1).toString().padStart(2, '0');
                                    const d = now.getDate().toString().padStart(2, '0');
                                    const todayStr = `${y}-${m}-${d}`;
                                    
                                    const isToday = fecha === todayStr;
                                    
                                    // Comparamos la hora del botón con la hora actual si es hoy
                                    // Usamos locale para comparar horas correctamente
                                    const currentTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
                                    const isPast = isToday && h <= currentTime;

                                    return (
                                        <button
                                            key={h}
                                            disabled={isPast}
                                            onClick={() => setHora(h)}
                                            className={`p-4 rounded-xl border-2 font-bold transition-all ${
                                                isPast ? 'opacity-20 cursor-not-allowed border-fondo-borde bg-transparent text-gray-600' :
                                                hora === h ? 'border-mostaza bg-mostaza text-black shadow-lg scale-105' : 
                                                'border-fondo-borde bg-fondo-tarjeta/50 text-gray-300 hover:border-mostaza'
                                            }`}
                                        >
                                            {h}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setPaso(2)} className="flex-1 flex justify-center items-center gap-2 bg-fondo text-white border border-fondo-borde py-4 rounded-xl text-lg font-bold hover:bg-fondo-borde transition-all">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Atrás
                                </button>
                                <button
                                    onClick={() => setPaso(4)}
                                    disabled={!hora}
                                    className={`flex-1 py-4 rounded-xl text-lg font-bold transition-all ${hora ? 'bg-mostaza text-black hover:bg-mostaza-hover active:scale-95' : 'bg-fondo-borde text-gray-500 cursor-not-allowed'}`}
                                >
                                    Continuar
                                </button>
                            </div>
                        </div>
                    )}

                    {paso === 4 && (
                        <div className="animate-fade-in-up">
                            <h2 className="text-2xl font-bold mb-6 text-white">Selecciona la zona</h2>
                            <div className="flex flex-col gap-4 mb-8">
                                {zonas.map(z => (
                                    <button
                                        key={z}
                                        onClick={() => handleBuscarMesas(z)}
                                        className="p-6 bg-fondo-tarjeta/40 rounded-2xl border-2 border-fondo-borde text-xl font-bold text-gray-300 hover:border-mostaza transition-all text-left flex justify-between items-center group"
                                    >
                                        {z}
                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-mostaza">➔</span>
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setPaso(3)} className="w-full flex justify-center items-center gap-2 bg-fondo text-white border border-fondo-borde py-4 rounded-xl text-lg font-bold hover:bg-fondo-borde transition-all">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Atrás
                            </button>
                        </div>
                    )}

                    {paso === 5 && (
                        <div className="animate-fade-in-up">
                            <h2 className="text-2xl font-bold mb-2 text-white">Mesas libres en {zona}</h2>
                            <p className="text-gray-400 mb-6">Para {personas} personas el {fecha} a las {hora}</p>

                            {mesas.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    {mesas.map(mesa => (
                                        <button
                                            key={mesa.id}
                                            onClick={() => handleBloquearMesa(mesa.id)}
                                            className="p-6 bg-fondo-tarjeta/40 rounded-2xl border-2 border-fondo-borde hover:border-mostaza hover:bg-fondo-tarjeta/60 transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer"
                                        >
                                            <span className="text-sm font-bold text-mostaza uppercase tracking-widest">{mesa.zona}</span>
                                            <span className="text-4xl font-black text-white group-hover:scale-110 transition-transform">#{mesa.numeroMesa}</span>
                                            <span className="text-sm font-medium text-gray-400">Capacidad: {mesa.capacidad} pax</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-8 bg-fondo rounded-2xl border-2 border-dashed border-fondo-borde mb-8">
                                    <p className="text-lg font-bold text-gray-400">No hay mesas disponibles con esta exactitud.</p>
                                </div>
                            )}

                            <button onClick={() => setPaso(4)} className="w-full flex justify-center items-center gap-2 bg-fondo text-white border border-fondo-borde py-4 rounded-xl text-lg font-bold hover:bg-fondo-borde transition-all">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Atrás, Modificar Búsqueda
                            </button>
                        </div>
                    )}

                    {paso === 6 && (
                        <div className="animate-fade-in-up relative bg-fondo-tarjeta/40 backdrop-blur-sm p-8 rounded-3xl border border-fondo-borde">

                            <div className="flex justify-between items-center mb-6 border-b border-fondo-borde pb-4">
                                <h2 className="text-3xl font-black text-white">
                                    {isModifying ? 'Confirmar Modificación' : 'Resumen de la Reserva'}
                                </h2>
                                <div className="bg-mostaza/20 px-5 py-3 rounded-full flex items-center gap-3 border border-mostaza/30">
                                    <span className="text-mostaza font-bold uppercase tracking-wider text-xs">Tiempo Restante:</span>
                                    <span className="font-mono text-3xl font-bold text-mostaza animate-pulse">{formatTime(timeLeft)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
                                <div className="bg-fondo-tarjeta p-5 rounded-2xl border border-fondo-borde">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Datos del Cliente</h3>
                                    <p className="text-lg font-bold text-white">{userName}</p>
                                    <p className="text-md text-gray-400">📞 {userPhone}</p>
                                </div>
                                <div className="bg-fondo-tarjeta p-5 rounded-2xl border border-fondo-borde">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Detalles de la Mesa</h3>
                                    <p className="text-lg font-bold text-white">📅 {fecha.split('-').reverse().join('/')} a las {hora}</p>
                                    <p className="text-md text-gray-400">👥 {personas} Personas - {zona}</p>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-6">
                                <button onClick={resetFlujo} className="flex-1 bg-transparent border-2 border-red-500 text-red-500 py-4 rounded-xl text-lg font-bold hover:bg-red-500/10 transition-all">Cancelar</button>
                                <button onClick={handleConfirmar} className="flex-1 bg-mostaza text-black py-4 rounded-xl text-lg font-bold hover:bg-mostaza-hover transition-all shadow-xl hover:-translate-y-1 active:scale-95">
                                    {isModifying ? 'Guardar Cambios' : 'Confirmar Reserva'}
                                </button>
                            </div>
                        </div>
                    )}

                    {paso === 7 && (
                        <div className="animate-fade-in-up text-center">
                            <div className="w-20 h-20 bg-mostaza/20 border-2 border-mostaza rounded-full flex items-center justify-center mx-auto mb-6 scale-110">
                                <svg className="w-10 h-10 text-mostaza" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            
                            <h2 className="text-4xl font-black text-white mb-2 tracking-tight">¡Reserva Confirmada!</h2>
                            <p className="text-gray-400 mb-8 max-w-md mx-auto">Te hemos enviado un correo de confirmación. Tu mesa te estará esperando puntualmente.</p>

                            <div className="bg-fondo-tarjeta/40 border border-fondo-borde rounded-3xl p-6 mb-8 text-left space-y-4 max-w-sm mx-auto shadow-xl">
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-gray-500 text-xs font-bold uppercase">Código</span>
                                    <span className="text-white font-mono font-bold">#{reservaId || modifyingReservaId}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-gray-500 text-xs font-bold uppercase">Teléfono</span>
                                    <span className="text-white font-bold">{userPhone}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-gray-500 text-xs font-bold uppercase">Fecha</span>
                                    <span className="text-white font-bold">{fecha.split('-').reverse().join('/')}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-gray-500 text-xs font-bold uppercase">Hora</span>
                                    <span className="text-white font-bold">{hora}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-gray-500 text-xs font-bold uppercase">Mesa</span>
                                    <span className="text-mostaza font-bold">{zona}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 text-xs font-bold uppercase">Pax</span>
                                    <span className="text-white font-bold">{personas} personas</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={generatePDF}
                                    className="w-full bg-white text-black py-4 rounded-xl text-lg font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-3 shadow-lg"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Descargar Justificante (PDF)
                                </button>
                                <button 
                                    onClick={handleEnviarEmail}
                                    disabled={isSendingEmail}
                                    className="w-full bg-mostaza text-black py-4 rounded-xl text-lg font-bold hover:bg-mostaza/80 transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
                                >
                                    {isSendingEmail ? (
                                        <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    )}
                                    {isSendingEmail ? 'Enviando...' : 'Enviar a mi correo'}
                                </button>
                                <button 
                                    onClick={resetFlujo}
                                    className="w-full bg-fondo-tarjeta border border-fondo-borde text-white py-4 rounded-xl text-lg font-bold hover:bg-fondo-borde transition-all"
                                >
                                    Realizar otra reserva
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </main>

            {/* Modal de Éxito de Email */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSuccessModal(false)}></div>
                    <div className="relative bg-fondo-tarjeta border border-fondo-borde p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-300">
                        <button 
                            onClick={() => setShowSuccessModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="w-16 h-16 bg-mostaza/20 border-2 border-mostaza rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-mostaza" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2">¡Email Enviado!</h3>
                        <p className="text-gray-400 mb-6 font-medium">Hemos enviado el justificante a tu correo con éxito.</p>
                        <button 
                            onClick={() => setShowSuccessModal(false)}
                            className="w-full bg-mostaza text-black py-4 rounded-xl text-lg font-bold hover:shadow-lg transition-all active:scale-95"
                        >
                            Aceptar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}