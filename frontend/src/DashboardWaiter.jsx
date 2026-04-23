import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

export default function DashboardWaiter() {
  const navigate = useNavigate();
  // Estados
  const [productos, setProductos] = useState({ Comida: {}, Bebidas: {} });
  const [mesasDisponibles, setMesasDisponibles] = useState([]);
  const [carrito, setCarrito] = useState({});
  const [categoriasExpandidas, setCategoriasExpandidas] = useState({});
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mesaSeleccionada, setMesaSeleccionada] = useState('');
  const [notasAbiertas, setNotasAbiertas] = useState({});
  const [activeTab, setActiveTab] = useState('tomar_comanda');
  
  // Estado de Reservas para Camareros
  const [reservasHoy, setReservasHoy] = useState([]);
  const [errorReservas, setErrorReservas] = useState(null);
  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split('T')[0]);
  const fechaFiltroRef = useRef(fechaFiltro);
  const fetchReservasHoyRef = useRef(null);

  // Estado de bebidas y modales
  const [bebidasPendientes, setBebidasPendientes] = useState([]);
  const [cargandoBebidas, setCargandoBebidas] = useState(false);
  const [modalServirAbierto, setModalServirAbierto] = useState(false);
  const [bebidaAServir, setBebidaAServir] = useState(null);
  const [modalMensaje, setModalMensaje] = useState({ show: false, titulo: '', mensaje: '', isError: false });
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [historial, setHistorial] = useState([]);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5105/api/auth/logout');
    } catch(e) {}
    localStorage.removeItem('usuario');
    localStorage.removeItem('rol');
    navigate('/');
  };

  // SignalR: actualizar en tiempo real cuando lleguen nuevos datos
  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl('http://localhost:5105/restauranteHub', { withCredentials: true })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('ActualizarDatos', () => {
      const tab = activeTabRef.current;
      if (tab === 'reservas') fetchReservasHoyRef.current();
      if (tab === 'bebidas_pendientes') fetchBebidasPendientes();
    });

    const startConnection = async () => {
      try {
        await connection.start();
        console.log('SignalR conectado en DashboardWaiter.');
      } catch (err) {
        console.error('SignalR error:', err);
        setTimeout(startConnection, 5000);
      }
    };
    startConnection();

    return () => { connection.stop(); };
  }, []);

  // 1. Estructura de Datos (Carga desde backend Petición GET)
  useEffect(() => {
    const fetchInicial = async () => {
      try {
        // Peticiones Paralelas
        const [resProductos, resMesas] = await Promise.all([
          axios.get('http://localhost:5105/api/productos'),
          axios.get('http://localhost:5105/api/mesas')
        ]);
        
        // 1. Procesar Productos
        const prods = resProductos.data;
        const dataEstructurada = { Comida: {}, Bebidas: {} };
        const categoriasBebida = ["Cervezas", "Vinos", "Refrescos", "Zumos y Batidos", "Copas", "Cócteles", "Tequila y Mezcal", "Otros"];
        
        // Inicializar categorías base para mantener el orden deseado
        categoriasBebida.forEach(c => dataEstructurada.Bebidas[c] = []);
        ["Tacos", "Quesadillas", "Hamburguesas", "Nachos", "Especialidades", "Raciones", "Ensaladas", "Postres", "MenuDiario"].forEach(c => dataEstructurada.Comida[c] = []);

        prods.forEach(p => {
          let cat = p.categoria || "Varios";
          if (cat === "Entrante" || cat === "Entrantes") cat = "Postres";
          
          if (categoriasBebida.includes(cat)) {
            if (!dataEstructurada.Bebidas[cat]) dataEstructurada.Bebidas[cat] = [];
            dataEstructurada.Bebidas[cat].push({ id: p.id, nombre: p.nombre, precio: p.precio });
          } else {
            if (!dataEstructurada.Comida[cat]) dataEstructurada.Comida[cat] = [];
            dataEstructurada.Comida[cat].push({ id: p.id, nombre: p.nombre, precio: p.precio });
          }
        });
        
        setProductos(dataEstructurada);

        // 2. Procesar Mesas (Agruparlas por Zona para el Select)
        const mesasAgrupadas = resMesas.data.reduce((acc, mesa) => {
          if (!acc[mesa.zona]) {
            acc[mesa.zona] = [];
          }
          acc[mesa.zona].push(mesa);
          return acc;
        }, {});
        
        setMesasDisponibles(mesasAgrupadas);

      } catch (error) {
        console.error("Error al cargar datos base desde BBDD:", error);
      }
    };

    fetchInicial();
  }, []);

  // Cargar bebidas agrupadas por ticket (diseño tipo cocina)
  const fetchBebidasPendientes = async () => {
    try {
      setCargandoBebidas(true);
      const response = await axios.get('http://localhost:5105/api/comandas/barra');
      setBebidasPendientes(response.data);
    } catch (error) {
      console.error("Error al obtener bebidas agrupadas:", error);
    } finally {
      setCargandoBebidas(false);
    }
  };

  const fetchHistorialBarra = async () => {
    try {
      const response = await axios.get('http://localhost:5105/api/comandas/historial-barra');
      setHistorial(response.data);
    } catch (error) {
      console.error("Error al obtener historial de barra:", error);
    }
  };

  const toggleHistorial = () => {
    if (!mostrarHistorial) fetchHistorialBarra();
    setMostrarHistorial(!mostrarHistorial);
  };

  // Mantener ref sincronizada con estado
  useEffect(() => { fechaFiltroRef.current = fechaFiltro; }, [fechaFiltro]);

  // Cargar reservas de la fecha seleccionada
  const fetchReservasHoy = async () => {
    const fecha = fechaFiltroRef.current;
    setErrorReservas(null);
    try {
      const response = await axios.get(`http://localhost:5105/api/reservas/hoy?fecha=${fecha}`);
      console.log('Reservas recibidas:', response.data);
      setReservasHoy(response.data);
    } catch (error) {
      console.error("Error al obtener reservas:", error);
      const status = error.response?.status;
      const msg = status === 401 ? 'No autorizado (401). Asegúrate de haber iniciado sesión como camarero o jefe.'
                : status === 403 ? 'Acceso denegado (403). Tu rol no tiene permisos para ver reservas.'
                : `Error ${status || 'de red'}: ${error.message}`;
      setErrorReservas(msg);
    }
  };
  fetchReservasHoyRef.current = fetchReservasHoy;

  // Cargar datos cuando se cambia de pestaña o fecha
  useEffect(() => {
    if (activeTab === 'bebidas_pendientes') {
      fetchBebidasPendientes();
    } else if (activeTab === 'reservas') {
      fetchReservasHoy();
    }
  }, [activeTab, fechaFiltro]);

  const handleEstadoReserva = async (id, nuevoEstado) => {
    try {
      await axios.put(`http://localhost:5105/api/reservas/${id}/estado`, { estado: nuevoEstado });
      setReservasHoy(prev => prev.map(r => r.id === id ? { ...r, estado: nuevoEstado } : r));
    } catch (error) {
      console.error("Error al cambiar estado de reserva:", error);
      alert("Hubo un fallo al actualizar la reserva.");
    }
  };

  const toggleCategoria = (categoria) => {
    setCategoriasExpandidas(prev => ({
      ...prev,
      [categoria]: !prev[categoria]
    }));
  };

  const abrirModalServir = (bebida) => {
    setBebidaAServir(bebida);
    setModalServirAbierto(true);
  };

  const confirmarServido = async () => {
    if (!bebidaAServir) return;

    try {
      await axios.put(`http://localhost:5105/api/comandas/linea/${bebidaAServir.idPedido}/servir`);
      
      // Actualización optimista igual que en cocina
      setBebidasPendientes(prevTickets => {
        const nuevosTickets = prevTickets.map(ticket => {
          return {
            ...ticket,
            bebidas: ticket.bebidas.map(b => 
              b.idLinea === bebidaAServir.idPedido ? { ...b, servida: true } : b
            )
          };
        });
        
        // Filtramos para quitar solo los tickets donde TODAS las bebidas estén ya servidas
        return nuevosTickets.filter(ticket => !ticket.bebidas.every(b => b.servida));
      });
      
      // Cerrar modal y limpiar
      setModalServirAbierto(false);
      setBebidaAServir(null);
    } catch (error) {
      console.error("Error al marcar bebida como servida:", error);
      setModalMensaje({ show: true, titulo: 'Error', mensaje: 'Hubo un error al confirmar la entrega.', isError: true });
    }
  };

  const toggleNota = (productoId) => {
    setNotasAbiertas(prev => ({
      ...prev,
      [productoId]: !prev[productoId]
    }));
  };

  const modificarCantidad = (producto, delta) => {
    setCarrito(prev => {
      const itemActual = prev[producto.id] || { cantidad: 0, nota: '' };
      const nuevaCantidad = itemActual.cantidad + delta;
      
      if (nuevaCantidad <= 0) {
        const nuevoCarrito = { ...prev };
        delete nuevoCarrito[producto.id];
        return nuevoCarrito;
      }

      return {
        ...prev,
        [producto.id]: {
          producto,
          cantidad: nuevaCantidad,
          nota: itemActual.nota
        }
      };
    });
  };

  const actualizarNota = (producto, texto) => {
    setCarrito(prev => {
      const itemActual = prev[producto.id];
      if (!itemActual) return prev;
      return {
        ...prev,
        [producto.id]: {
          ...itemActual,
          nota: texto
        }
      };
    });
  };

  const calcularTotal = () => {
    let totalItems = 0;
    let totalPrice = 0;
    Object.values(carrito).forEach(item => {
      totalItems += item.cantidad;
      totalPrice += item.cantidad * item.producto.precio;
    });
    return { totalItems, totalPrice };
  };

  const { totalItems, totalPrice } = calcularTotal();

  const handleMandarComanda = async () => {
    const payloadItems = Object.values(carrito).map(item => ({
      productoId: item.producto.id,
      cantidad: item.cantidad,
      notas: item.nota || ""
    }));

    const body = {
      mesa: mesaSeleccionada,
      items: payloadItems
    };

    try {
      await axios.post('http://localhost:5105/api/comandas', body);

      // Resetear el estado para el siguiente cliente
      setCarrito({});
      setModalAbierto(false);
      setMesaSeleccionada('');
      setNotasAbiertas({});
      setModalMensaje({ show: true, titulo: '¡Éxito!', mensaje: '¡Comanda enviada a cocina y barra con éxito!', isError: false });

      // Si estábamos en la vista de bebidas y mandamos una comanda nueva,
      // podríamos querer refrescarlas
      if (activeTab === 'bebidas_pendientes') {
        fetchBebidasPendientes();
      }

    } catch (error) {
      console.error("Error al enviar comanda:", error);
      setModalMensaje({ show: true, titulo: 'Error', mensaje: typeof error.response?.data === 'string' ? error.response.data : "Ocurrió un error al enviar la comanda.", isError: true });
    }
  };

  const toggleGluten = (prod) => {
    const itemCarr = carrito[prod.id];
    if (!itemCarr) {
      // Si no está en el carrito, lo añadimos con cantidad 1 y la nota
      modificarCantidad(prod, 1);
      setTimeout(() => {
        actualizarNota(prod, "SIN GLUTEN");
      }, 50);
      return;
    }

    const nuevaNota = itemCarr.nota === "SIN GLUTEN" ? "" : "SIN GLUTEN";
    actualizarNota(prod, nuevaNota);
  };

  // Renderizado de las filas de productos
  const renderListaProductos = (lista, esComida = false) => {
    return lista.map(prod => {
      const itemCarr = carrito[prod.id];
      const cantidad = itemCarr?.cantidad || 0;
      const nota = itemCarr?.nota || "";
      const mostrarNota = notasAbiertas[prod.id] && cantidad > 0;
      const isGlutenFree = nota.toUpperCase().includes("SIN GLUTEN");

      return (
        <div key={prod.id} className="flex flex-col border-b border-fondo-borde bg-fondo-tarjeta">
          <div className="flex items-center justify-between p-4">
            <div className="flex-1 pr-2">
              <h4 className="text-white font-medium text-[1.05rem] leading-tight">{prod.nombre}</h4>
              <p className="text-gray-400 mt-1">{prod.precio.toFixed(2)}€</p>
            </div>
            
            <div className="flex items-center space-x-2">
              {cantidad > 0 && (
                <>
                  {esComida && (
                    <button 
                      onClick={() => toggleGluten(prod)}
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all shadow-md touch-manipulation border ${isGlutenFree ? 'bg-orange-500 border-orange-500 text-white' : 'bg-fondo border-fondo-borde text-gray-400'}`}
                      title="Sin Gluten"
                    >
                      🌾
                    </button>
                  )}
                  <button 
                    onClick={() => toggleNota(prod.id)}
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all shadow-md touch-manipulation border ${mostrarNota || nota ? 'bg-mostaza border-mostaza text-black' : 'bg-fondo border-fondo-borde text-gray-400'}`}
                  >
                    📝
                  </button>
                </>
              )}

              <div className="flex items-center space-x-3 bg-fondo shadow-inner rounded-full p-1 pl-2 border border-fondo-borde">
                <button 
                  onClick={() => modificarCantidad(prod, -1)}
                  className="w-11 h-11 rounded-full bg-red-600/90 flex items-center justify-center text-white text-3xl font-light active:bg-red-700 active:scale-95 transition-all shadow-md touch-manipulation"
                >
                  -
                </button>
                <span className="text-white font-bold text-xl w-6 text-center select-none">
                  {cantidad}
                </span>
                <button 
                  onClick={() => modificarCantidad(prod, 1)}
                  className="w-11 h-11 rounded-full bg-green-600/90 flex items-center justify-center text-white text-3xl font-light active:bg-green-700 active:scale-95 transition-all shadow-md touch-manipulation"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Campo de notas individuales del producto */}
          {mostrarNota && (
            <div className="px-4 pb-4 animate-fadeIn">
              <input 
                type="text"
                placeholder={`Nota para ${prod.nombre} (ej. Sin cebolla)`}
                value={nota}
                onChange={(e) => actualizarNota(prod, e.target.value)}
                className="w-full bg-fondo border border-fondo-borde text-white rounded-lg p-3 text-sm focus:ring-2 focus:ring-mostaza outline-none touch-manipulation"
              />
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-gray-100 font-sans pb-28">
      {/* Cabecera */}
      <header className="px-5 py-4 bg-fondo/60 backdrop-blur-md border-b border-fondo-borde flex justify-between items-center sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-3">
          <img src="/images/logo.jpg" alt="Logo" className="h-14 w-14 object-cover rounded-full shadow-md" />
          <h1 className="text-xl font-black uppercase tracking-tight text-mostaza leading-none">
            Mild & Limon <span className="text-white text-xs block opacity-60">POS Camareros</span>
          </h1>
        </div>
        <div className="flex gap-4 items-center">
          <button 
            onClick={toggleHistorial} 
            className="text-sm font-bold bg-mostaza/10 text-mostaza hover:bg-mostaza/20 border border-mostaza/30 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Historial de comandas
          </button>
          <button onClick={handleLogout} className="text-sm font-bold bg-fondo text-mostaza hover:bg-mostaza/10 px-4 py-2 border border-mostaza rounded-lg transition-colors">
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Navegación por Pestañas */}
      <div className="flex bg-fondo-tarjeta border-b border-fondo-borde sticky top-[60px] z-10 w-full shadow-md">
        <button
          onClick={() => setActiveTab('tomar_comanda')}
          className={`flex-1 py-4 text-sm font-bold tracking-wider uppercase transition-colors ${
            activeTab === 'tomar_comanda' 
              ? 'text-mostaza border-b-4 border-mostaza bg-fondo' 
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Tomar Comanda
        </button>
        <button
          onClick={() => setActiveTab('bebidas_pendientes')}
          className={`flex-1 py-4 text-sm font-bold tracking-wider uppercase transition-colors relative ${
            activeTab === 'bebidas_pendientes' 
              ? 'text-mostaza border-b-4 border-mostaza bg-fondo' 
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Barra
          {bebidasPendientes.length > 0 && (
            <span className="absolute top-3 right-4 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-bounce">
              {bebidasPendientes.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('reservas')}
          className={`flex-1 py-4 text-sm font-bold tracking-wider uppercase transition-colors ${
            activeTab === 'reservas' 
              ? 'text-mostaza border-b-4 border-mostaza bg-fondo' 
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Reservas
        </button>
      </div>

      {/* Main Content - Vista Tomar Comanda */}
      {activeTab === 'tomar_comanda' && (
        <main className="flex-1 overflow-y-auto w-full mx-auto pb-4 pt-6">

          {/* Sección: Mesa y Observaciones */}
          <div className="px-5 mb-8">
          <div>
            <label className="block text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">
              Seleccionar Mesa *
            </label>
            <div className="relative">
              <select 
                value={mesaSeleccionada}
                onChange={(e) => setMesaSeleccionada(e.target.value)}
                className="w-full bg-fondo border-2 border-fondo-borde text-white rounded-xl p-4 text-lg font-medium focus:ring-2 focus:ring-mostaza outline-none appearance-none touch-manipulation"
              >
                <option value="" disabled>Elegir mesa...</option>
                {Object.entries(mesasDisponibles).map(([zona, mesas]) => (
                  <optgroup key={zona} label={zona}>
                    {mesas.map(mesa => (
                      <option key={mesa.id} value={mesa.numeroMesa}>Mesa {mesa.numeroMesa}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-mostaza">
                ▼
              </div>
            </div>
          </div>
        </div>
          {Object.entries(productos).map(([tipo, categorias]) => (
            <div key={tipo} className="mt-4">
              <h2 className="px-5 py-2 text-lg font-bold text-gray-500 uppercase tracking-widest bg-fondo sticky top-[116px] z-0">
                {tipo}
              </h2>
              
              {Object.entries(categorias)
                .filter(([_, lista]) => lista.length > 0)
                .map(([nombreCategoria, listaProductos]) => (
                <div key={nombreCategoria} className="mt-2 px-3">
                  {/* Botón Acordeón Grande */}
                  <button
                    onClick={() => toggleCategoria(nombreCategoria)}
                    className="w-full flex items-center justify-between p-5 bg-fondo-tarjeta rounded-xl shadow-sm border border-fondo-borde active:bg-fondo transition-colors touch-manipulation"
                  >
                    <span className="text-lg font-semibold text-gray-100">{nombreCategoria}</span>
                    <span className="text-mostaza text-3xl leading-none flex items-center justify-center w-6 h-6">
                      {categoriasExpandidas[nombreCategoria] ? '−' : '+'}
                    </span>
                  </button>
                  
                  {/* Contenido Desplegable */}
                  {categoriasExpandidas[nombreCategoria] && (
                    <div className="mt-2 mb-4 rounded-xl overflow-hidden border border-fondo-borde bg-fondo">
                      {renderListaProductos(listaProductos, tipo === 'Comida')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </main>
      )}

      {/* Main Content - Vista Bebidas Pendientes */}
      {activeTab === 'bebidas_pendientes' && (
        <main className="flex-1 overflow-y-auto w-full mx-auto p-5 space-y-4">
          {cargandoBebidas ? (
            <div className="flex flex-col items-center justify-center mt-20">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mostaza mb-4"></div>
               <p className="text-gray-400 font-bold">Cargando pedidos de barra...</p>
            </div>
          ) : bebidasPendientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-20 opacity-50">
              <span className="text-6xl mb-4">🍹</span>
              <p className="text-xl text-gray-400 font-bold">Sin bebidas pendientes</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bebidasPendientes.map((ticket) => {
                const ahora = new Date();
                const ticketHora = new Date(ticket.fechaHora);
                const diff = Math.floor((ahora - ticketHora) / 60000);
                
                return (
                  <div key={`${ticket.mesa}-${ticket.fechaHora}`} className="bg-fondo-tarjeta border border-fondo-borde rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                    {/* Cabecera del Ticket (Estilo Cocina) */}
                    <div className="bg-mostaza p-4 flex justify-between items-center text-black">
                      <div>
                        <h3 className="text-2xl font-black uppercase">Mesa {ticket.mesa}</h3>
                        <p className="text-xs font-bold opacity-70 uppercase tracking-tighter">{ticket.camarero}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold block opacity-70 uppercase">Espera</span>
                        <span className="text-xl font-black">{diff} min</span>
                      </div>
                    </div>

                    {/* Lista de Bebidas */}
                    <div className="p-4 flex-1 bg-fondo/30">
                      <ul className="space-y-3">
                        {ticket.bebidas.map((b) => (
                          <li key={b.idLinea} className={`flex items-center justify-between border-b border-fondo-borde pb-2 last:border-0 ${b.servida ? 'opacity-40' : ''}`}>
                            <div className="flex-1">
                              <p className="text-white font-bold text-lg leading-tight">
                                <span className={`bg-mostaza/20 text-mostaza px-1.5 rounded mr-2 font-black ${b.servida ? 'bg-gray-500/20 text-gray-500' : ''}`}>{b.cantidad}x</span>
                                {b.nombreBebida}
                              </p>
                              {b.notas && <p className="text-mostaza text-xs font-bold mt-1 uppercase italic">📝 {b.notas}</p>}
                            </div>
                            {!b.servida ? (
                              <button 
                                  onClick={() => {
                                    setBebidaAServir({ idPedido: b.idLinea, nombreBebida: b.nombreBebida, cantidad: b.cantidad, mesa: ticket.mesa });
                                    setModalServirAbierto(true);
                                  }}
                                className="ml-3 w-10 h-10 bg-mostaza/10 hover:bg-mostaza text-mostaza hover:text-black rounded-lg transition-all border border-mostaza/30 flex items-center justify-center shrink-0"
                              >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                              </button>
                            ) : (
                              <div className="ml-3 w-10 h-10 bg-mostaza/20 text-mostaza rounded-lg border border-mostaza/30 flex items-center justify-center shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Botón Servir Todo */}
                    <button
                      onClick={async () => {
                        try {
                          // Servir todas las líneas de este ticket
                          await Promise.all(ticket.bebidas.map(b => 
                            axios.put(`http://localhost:5105/api/comandas/linea/${b.idLinea}/servir`)
                          ));
                          fetchBebidasPendientes();
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="w-full bg-fondo border-t border-fondo-borde hover:bg-mostaza/10 text-mostaza py-3 font-black uppercase text-xs tracking-widest transition-colors"
                    >
                      Servir Todo el Ticket
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* Main Content - Vista Reservas para Control de Sala */}
      {activeTab === 'reservas' && (
        <main className="flex-1 overflow-y-auto w-full mx-auto p-5 space-y-4">
          {/* Barra de acciones y filtros */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-fondo-tarjeta p-4 rounded-2xl border border-fondo-borde mb-6 shadow-sm gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="text-gray-400 font-bold text-sm uppercase tracking-wider">Fecha:</label>
              <input 
                type="date" 
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
                className="bg-fondo border border-fondo-borde text-white px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-mostaza transition-all font-medium flex-1 sm:flex-none"
              />
            </div>
            <button
              onClick={fetchReservasHoy}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-fondo border border-fondo-borde text-gray-300 hover:text-mostaza hover:border-mostaza px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Actualizar
            </button>
          </div>
          {errorReservas ? (
            <div className="flex flex-col items-center justify-center mt-20">
              <span className="text-5xl mb-4">⚠️</span>
              <p className="text-xl text-red-400 font-bold mb-2">Error al cargar reservas</p>
              <p className="text-gray-500 text-sm text-center max-w-md px-4">{errorReservas}</p>
              <button onClick={fetchReservasHoy} className="mt-4 bg-mostaza text-black px-6 py-2 rounded-xl font-bold">Reintentar</button>
            </div>
          ) : reservasHoy.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-20 opacity-50">
              <span className="text-6xl mb-4">📅</span>
              <p className="text-xl text-gray-400 font-bold">Sin reservas</p>
              <p className="text-gray-600 text-sm mt-2">No hay reservas programadas para el {fechaFiltro.split('-').reverse().join('/')}</p>
            </div>
          ) : (
            reservasHoy.map(res => (
              <div key={res.id} className={`bg-fondo-tarjeta border-2 border-fondo-borde rounded-2xl p-5 shadow-lg flex flex-col space-y-4 transition-all ${res.estado === 'Finalizada' || res.estado === 'Cancelada' ? 'opacity-40 grayscale focus-within:opacity-100 focus-within:grayscale-0' : ''}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="bg-mostaza/20 text-mostaza font-bold px-3 py-1 rounded-full text-sm mr-2 shadow-sm">
                      Mesa {res.mesa}
                    </span>
                    <span className="text-mostaza font-bold px-3 py-1 bg-mostaza/10 rounded-lg text-sm border border-mostaza/30 shadow-inner">
                      {res.horaInicio.substring(0, 5)}
                    </span>
                    <h3 className="text-white text-2xl font-bold mt-4 tracking-tight">
                      {res.cliente}
                    </h3>
                    <p className="text-gray-400 text-md font-medium mt-1 uppercase tracking-widest text-xs">👥 {res.numPersonas} Pax • {res.zona}</p>
                  </div>
                  <div className="flex flex-col gap-2 relative">
                    <select 
                      value={res.estado} 
                      onChange={(e) => handleEstadoReserva(res.id, e.target.value)}
                      className={`font-black outline-none text-sm p-3 rounded-xl border-2 uppercase tracking-wide cursor-pointer transition-all ${
                        res.estado === 'Pendiente' ? 'bg-orange-950/20 border-orange-500 text-orange-400 focus:ring-orange-500' :
                        res.estado === 'Confirmada' ? 'bg-green-950/20 border-green-500 text-green-400 focus:ring-green-500' :
                        res.estado === 'Sentados' ? 'bg-mostaza/10 border-mostaza text-mostaza focus:ring-mostaza' :
                        'bg-fondo border-fondo-borde text-gray-500 focus:ring-gray-500'
                      } appearance-none focus:ring-2`}
                    >
                      <option value="Pendiente" className="bg-fondo text-orange-400 font-bold">⏱️ Pendiente</option>
                      <option value="Confirmada" className="bg-fondo text-green-400 font-bold">✅ Confirmada</option>
                      <option value="Sentados" className="bg-fondo text-mostaza font-bold">🍽️ Sentados</option>
                      <option value="Finalizada" className="bg-fondo text-gray-400 font-bold">🏁 Finalizada</option>
                      <option value="Cancelada" className="bg-fondo text-red-400 font-bold">❌ Cancelada</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-70">
                      ▼
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </main>
      )}


      {/* 3. Sticky Bottom Bar Solo en Tomar Comanda */}
      {activeTab === 'tomar_comanda' && (
      <div className="fixed bottom-0 w-full bg-fondo-tarjeta border-t border-fondo-borde px-4 py-4 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.5)] z-20 pb-safe">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          <div className="flex flex-col pl-2">
            <span className="text-gray-400 text-sm font-medium tracking-wide">TOTAL ({totalItems})</span>
            <span className="text-3xl font-extrabold text-white">{totalPrice.toFixed(2)}€</span>
          </div>
          <button
            disabled={totalItems === 0 || !mesaSeleccionada}
            onClick={() => setModalAbierto(true)}
            className={`px-6 py-4 rounded-2xl font-bold text-xl uppercase tracking-wider transition-all duration-200 shadow-lg ${
              totalItems > 0 && mesaSeleccionada
                ? 'bg-mostaza hover:bg-mostaza-hover text-black active:scale-95'
                : 'bg-fondo text-gray-500 cursor-not-allowed shadow-none border border-fondo-borde'
            }`}
          >
            {totalItems > 0 && !mesaSeleccionada ? 'Elige Mesa' : 'Mandar'}
          </button>
        </div>
      </div>
      )}

      {/* 4. Modal de Confirmación Definitivo */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-fondo w-full max-w-md rounded-3xl shadow-2xl border border-fondo-borde flex flex-col max-h-[95vh] overflow-hidden">
            
            <div className="p-6 border-b border-fondo-borde bg-fondo-tarjeta">
              <h3 className="text-2xl font-bold text-white text-center">Detalles del Envío</h3>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Resumen de Mesa y Observaciones */}
              <div className="bg-fondo-tarjeta p-4 rounded-xl border border-fondo-borde">
                <p className="text-gray-300 text-lg mb-2"><span className="font-bold text-gray-400 uppercase text-sm tracking-wider">Mesa:</span> {mesaSeleccionada}</p>
              </div>

              {/* Resumen del Carrito */}
              <div>
                <label className="block text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">
                  Resumen de la Comanda
                </label>
                <div className="bg-fondo-tarjeta rounded-xl p-4 border border-fondo-borde max-h-48 overflow-y-auto">
                  {Object.values(carrito).map(item => (
                    <div key={item.producto.id} className="flex justify-between items-center py-2 border-b border-fondo-borde last:border-0">
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <span className="bg-mostaza/20 text-mostaza font-bold px-2 py-1 rounded-md text-sm mr-3">
                            {item.cantidad}x
                          </span>
                          <span className="text-gray-200">{item.producto.nombre}</span>
                        </div>
                        {item.nota && (
                          <div className="text-gray-500 text-sm mt-1 ml-10 italic">
                            Nota: {item.nota}
                          </div>
                        )}
                      </div>
                      <span className="text-mostaza font-medium">
                        {(item.cantidad * item.producto.precio).toFixed(2)}€
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Acciones Finales del Modal */}
            <div className="p-5 border-t border-fondo-borde bg-fondo-tarjeta flex gap-3">
              <button 
                onClick={() => setModalAbierto(false)}
                className="flex-1 bg-fondo text-white border border-fondo-borde p-4 rounded-xl font-bold text-lg hover:bg-fondo-borde active:scale-95 transition-all"
              >
                Cancelar
              </button>
              <button 
                disabled={!mesaSeleccionada}
                onClick={handleMandarComanda}
                className={`flex-[1.5] p-4 rounded-xl font-bold text-lg transition-all shadow-lg uppercase tracking-wide ${
                  mesaSeleccionada 
                    ? 'bg-mostaza text-black hover:bg-mostaza-hover active:scale-95' 
                    : 'bg-fondo text-mostaza/50 cursor-not-allowed shadow-none border border-fondo-borde'
                }`}
              >
                Confirmar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal de Confirmación de Bebida Servida */}
      {modalServirAbierto && bebidaAServir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-fondo w-full max-w-sm rounded-3xl shadow-2xl border border-fondo-borde flex flex-col overflow-hidden text-center">
            
            <div className="p-8">
              <div className="text-6xl mb-4">🍻</div>
              <h3 className="text-2xl font-bold text-white mb-2">¿Confirmar Entrega?</h3>
              <p className="text-gray-400 text-lg">
                Se marcará la bebida <span className="text-mostaza font-bold">{bebidaAServir.cantidad}x {bebidaAServir.nombreBebida}</span> como entregada en la <span className="text-mostaza font-bold">Mesa {bebidaAServir.mesa}</span>.
              </p>
            </div>

            <div className="p-4 border-t border-fondo-borde bg-fondo-tarjeta flex gap-3">
              <button 
                onClick={() => {
                  setModalServirAbierto(false);
                  setBebidaAServir(null);
                }}
                className="flex-1 bg-fondo text-white border border-fondo-borde py-3 rounded-xl font-bold text-lg hover:bg-fondo-borde active:scale-95 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarServido}
                className="flex-1 bg-mostaza text-black py-3 rounded-xl font-bold text-lg hover:bg-mostaza-hover active:scale-95 transition-all shadow-lg"
              >
                Confirmar
              </button>
            </div>
            
          </div>
        </div>
      )}
      {/* Modal Mensaje (Pop Up) */}
      {modalMensaje.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-fondo w-full max-w-sm rounded-3xl shadow-2xl border border-fondo-borde flex flex-col overflow-hidden text-center">
            
            <div className="p-8">
              <div className="text-6xl mb-4">
                {modalMensaje.isError ? '❌' : '✅'}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{modalMensaje.titulo}</h3>
              <p className="text-gray-400 text-lg">
                {modalMensaje.mensaje}
              </p>
            </div>

            <div className="p-4 border-t border-fondo-borde bg-fondo-tarjeta flex">
              <button 
                onClick={() => setModalMensaje({ show: false, titulo: '', mensaje: '', isError: false })}
                className="flex-1 bg-fondo border border-fondo-borde py-3 rounded-xl font-bold text-lg text-white hover:bg-fondo-borde active:scale-95 transition-all shadow-lg"
              >
                Cerrar
              </button>
            </div>
            
          </div>
        </div>
      )}
      {/* Overlay de Historial de Bebidas */}
      {mostrarHistorial && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-fondo-tarjeta h-full shadow-2xl border-l border-fondo-borde flex flex-col animate-slide-in">
            <div className="p-6 border-b border-fondo-borde flex justify-between items-center bg-fondo/50">
              <div>
                <h2 className="text-xl font-black text-mostaza uppercase tracking-tight">Historial de Bebidas</h2>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Completadas este mes</p>
              </div>
              <button 
                onClick={() => setMostrarHistorial(false)} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {historial.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 opacity-30">
                  <span className="text-5xl mb-4">🍹</span>
                  <p className="font-bold uppercase tracking-widest text-xs">No hay historial de barra este mes</p>
                </div>
              ) : (
                historial.map((ticket) => (
                  <div key={ticket.idComanda} className="bg-fondo/30 border border-fondo-borde rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-fondo-borde/30 p-3 flex justify-between items-center border-b border-fondo-borde">
                      <div>
                        <span className="text-mostaza font-black text-lg mr-2 uppercase">Mesa {ticket.mesa}</span>
                        <span className="text-gray-500 text-[10px] font-bold">
                          {new Date(ticket.fechaHora).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })} • {new Date(ticket.fechaHora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <table className="w-full text-left text-xs border-separate border-spacing-y-1">
                        <tbody>
                          {ticket.bebidas.map((b, idx) => (
                            <tr key={idx} className="bg-white/5">
                              <td className="py-2 px-2 font-bold text-white rounded-l-lg">
                                <span className="text-mostaza mr-1">{b.cantidad}x</span> {b.nombre}
                              </td>
                              <td className="py-2 px-2 text-right text-white font-bold rounded-r-lg">{b.subtotal.toFixed(2)}€</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-3 bg-mostaza/5 border-t border-mostaza/10 flex justify-between items-center">
                      <span className="text-gray-500 font-bold uppercase text-[9px] tracking-widest">Subtotal Barra</span>
                      <span className="text-mostaza font-black text-xl">{ticket.totalBebidas.toFixed(2)}€</span>
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
