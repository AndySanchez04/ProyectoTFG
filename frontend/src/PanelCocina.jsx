import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function PanelCocina() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [historial, setHistorial] = useState([]);

  const fetchTicketsCocina = async () => {
    try {
      const response = await axios.get('http://localhost:5105/api/comandas/cocina');
      setTickets(response.data);
    } catch (error) {
      console.error("Error al obtener tickets de cocina:", error);
    } finally {
      setCargando(false);
    }
  };

  const fetchHistorial = async () => {
    try {
      const response = await axios.get('http://localhost:5105/api/comandas/historial-cocina');
      setHistorial(response.data);
    } catch (error) {
      console.error("Error al obtener historial:", error);
    }
  };

  const toggleHistorial = () => {
    if (!mostrarHistorial) fetchHistorial();
    setMostrarHistorial(!mostrarHistorial);
  };

  useEffect(() => {
    fetchTicketsCocina();
    // Podríamos recargar cada X segundos si hubiese necesidad
    const intervalId = setInterval(fetchTicketsCocina, 5000); // Polling cada 5s
    return () => clearInterval(intervalId);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5105/api/auth/logout');
    } catch(e) {}
    localStorage.removeItem('usuario');
    localStorage.removeItem('rol');
    navigate('/');
  };

  const marcarPlatoListo = async (idLinea) => {
    try {
      await axios.put(`http://localhost:5105/api/comandas/linea/${idLinea}/servir`);

      // Actualización optimista: marcar como servida en lugar de borrar el plato
      setTickets(prevTickets => {
        const nuevosTickets = prevTickets.map(ticket => {
          return {
            ...ticket,
            platos: ticket.platos.map(plato => 
              plato.idLinea === idLinea ? { ...plato, servida: true } : plato
            )
          };
        });
        
        // Filtramos para quitar solo los tickets donde TODOS los platos estén ya servidos
        return nuevosTickets.filter(ticket => !ticket.platos.every(p => p.servida));
      });

    } catch (error) {
      console.error("Error al marcar plato como listo:", error);
      alert("Hubo un error al confirmar la preparación.");
    }
  };

  // Función auxiliar para calcular minutos de espera
  const calcularEspera = (fechaHora) => {
    if (!fechaHora) return 0;
    // Aseguramos que la fecha se interprete correctamente
    const comandaDate = new Date(fechaHora);
    const ahora = new Date();
    const diffMs = ahora - comandaDate;
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    return diffMins;
  };

  if (cargando && tickets.length === 0) {
    return (
      <div className="min-h-screen bg-fondo flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-mostaza"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-6 font-sans text-white">
      <header className="mb-8 flex justify-between items-center border-b border-fondo-borde pb-4 sticky top-0 bg-fondo/50 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <img src="/images/logo.jpg" alt="Logo" className="h-20 w-20 object-cover rounded-full shadow-xl" />
          <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-tight">
            Mild & Limon <br />
            <span className="text-mostaza text-lg tracking-widest">Pantalla de Cocina (KDS)</span>
          </h1>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-sm font-bold bg-fondo-tarjeta border border-fondo-borde px-4 py-2 rounded-lg shadow text-gray-300">
            Tickets activos: {tickets.length}
          </div>
          <button 
            onClick={toggleHistorial} 
            className="text-sm font-bold bg-mostaza/10 text-mostaza hover:bg-mostaza/20 border border-mostaza/30 px-4 py-2 rounded-lg shadow transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Historial de comandas
          </button>
          <button onClick={handleLogout} className="text-sm font-bold bg-transparent text-mostaza hover:bg-mostaza/10 border border-mostaza px-4 py-2 rounded-lg shadow transition-colors">
            Cerrar Sesión
          </button>
        </div>
      </header>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-32 opacity-50">
          <span className="text-8xl mb-6">👨‍🍳</span>
          <p className="text-2xl text-gray-500 font-bold uppercase">Sin comandas de comida</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tickets.map((ticket, index) => {
            const minsEspera = calcularEspera(ticket.fechaHora);
            const cabeceraColor = minsEspera > 15 ? "bg-mostaza border-b border-mostaza/80 text-black" : minsEspera > 10 ? "bg-orange-500 border-b border-orange-700 text-white" : "bg-fondo-tarjeta border-b border-fondo-borde text-mostaza";

            return (
              <div 
                key={`${ticket.mesa}-${ticket.fechaHora}`} 
                className="bg-fondo-tarjeta rounded-lg shadow-xl overflow-hidden border border-fondo-borde flex flex-col max-h-[70vh]"
              >
                {/* Cabecera del Ticket */}
                <div className={`${cabeceraColor} p-4 flex justify-between items-center shadow-md z-10`}>
                  <h2 className="text-3xl font-black">Mesa {ticket.mesa}</h2>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold uppercase opacity-80">Espera</span>
                    <span className="text-xl font-bold">{minsEspera} min</span>
                  </div>
                </div>

                {/* Cuerpo del Ticket (Scrollable si hay muchos platos) */}
                <div className="p-4 flex-1 overflow-y-auto bg-fondo/50">
                  <ul className="space-y-4">
                    {ticket.platos.map(plato => (
                      <li key={plato.idLinea} className={`flex flex-col border-b border-fondo-borde pb-3 last:border-0 last:pb-0 ${plato.servida ? 'opacity-40' : ''}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white leading-tight">
                              <span className={`bg-mostaza/20 text-mostaza px-2 rounded font-black mr-2 ${plato.servida ? 'bg-gray-500/20 text-gray-500' : ''}`}>
                                {plato.cantidad}x
                              </span>
                              {plato.nombrePlato}
                            </h3>
                            {plato.notas && (
                              <div className="mt-2 text-mostaza font-bold text-lg bg-white/10 backdrop-blur-sm p-2 rounded-lg inline-block border border-white/10">
                                ⚠️ NOTA: {plato.notas}
                              </div>
                            )}
                          </div>
                          {!plato.servida ? (
                            <button
                              onClick={() => marcarPlatoListo(plato.idLinea)}
                              className="ml-4 w-14 h-14 bg-mostaza hover:bg-mostaza-hover active:bg-mostaza/80 active:scale-95 text-white rounded-xl shadow-md flex items-center justify-center transition-transform touch-manipulation flex-shrink-0 border border-mostaza-hover"
                              title="Marcar como listo"
                            >
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                              </svg>
                            </button>
                          ) : (
                            <div className="ml-4 w-14 h-14 bg-mostaza/20 text-mostaza rounded-xl flex items-center justify-center border border-mostaza/30">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                              </svg>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Overlay de Historial */}
      {mostrarHistorial && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-fondo-tarjeta h-full shadow-2xl border-l border-fondo-borde flex flex-col">
            <div className="p-6 border-b border-fondo-borde flex justify-between items-center bg-fondo/50">
              <div>
                <h2 className="text-2xl font-black text-mostaza uppercase tracking-tight">Historial Mensual</h2>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Comandas completadas este mes</p>
              </div>
              <button 
                onClick={() => setMostrarHistorial(false)} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {historial.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 opacity-30">
                  <span className="text-6xl mb-4 text-center block">📜</span>
                  <p className="font-bold uppercase tracking-widest text-center">No hay comandas registradas este mes</p>
                </div>
              ) : (
                historial.map((ticket) => (
                  <div key={ticket.idComanda} className="bg-fondo/30 border border-fondo-borde rounded-xl overflow-hidden shadow-lg">
                    <div className="bg-fondo-borde/30 p-4 flex justify-between items-center border-b border-fondo-borde">
                      <div>
                        <span className="text-mostaza font-black text-xl mr-3">MESA {ticket.mesa}</span>
                        <span className="text-gray-400 text-sm font-bold uppercase tracking-tight">
                          {new Date(ticket.fechaHora).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })} • {new Date(ticket.fechaHora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-tighter">Camarero</span>
                        <span className="text-white font-bold">{ticket.camarero}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <table className="w-full text-left text-sm border-separate border-spacing-y-2">
                        <thead>
                          <tr className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                            <th className="pb-1 px-3">Producto</th>
                            <th className="pb-1 px-3 text-center">Cant.</th>
                            <th className="pb-1 px-3 text-right">Precio</th>
                            <th className="pb-1 px-3 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ticket.platos.map((plato, idx) => (
                            <tr key={idx} className="bg-white/5">
                              <td className="py-2 px-3 font-bold text-white rounded-l-lg">{plato.nombre}</td>
                              <td className="py-2 px-3 text-center text-mostaza font-black">x{plato.cantidad}</td>
                              <td className="py-2 px-3 text-right text-gray-400 italic">{plato.precioUnitario.toFixed(2)}€</td>
                              <td className="py-2 px-3 text-right text-white font-bold rounded-r-lg">{plato.subtotal.toFixed(2)}€</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-4 bg-mostaza/5 border-t border-mostaza/10 flex justify-between items-center">
                      <span className="text-gray-400 font-bold uppercase text-xs tracking-widest">Importe Total</span>
                      <span className="text-mostaza font-black text-2xl">{ticket.totalComanda.toFixed(2)}€</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
