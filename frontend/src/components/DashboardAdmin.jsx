import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, Cell
} from 'recharts';

export default function DashboardAdmin() {
  const [activeTab, setActiveTab] = useState('usuarios');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [profile, setProfile] = useState({ nombre: 'Administrador', fotoPerfil: null });
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5105';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        if (!token.includes('.')) throw new Error("Invalid token format");
        const payload = JSON.parse(atob(token.split('.')[1]));
        const id = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] 
                || payload.nameid || payload.sub;
        if (id) setLoggedInUserId(parseInt(id));
      } catch (e) {
        console.error('Error parsing token', e);
      }

      const fetchProfile = async () => {
        try {
          const res = await axios.get(`${API_URL}/api/usuarios/perfil`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setProfile(res.data);
        } catch (error) {
          console.error('Error fetching profile', error);
        }
      };
      fetchProfile();
    }
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`);
    } catch(e) {}
    localStorage.removeItem('usuario');
    localStorage.removeItem('rol');
    navigate('/');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Informe Financiero Mensual", 14, 20);
    doc.setFontSize(10);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 30);
    
    const dummyData = [
      ["01/03/2026", "Ventas en sala", "1.250,00€"],
      ["02/03/2026", "Ventas en sala", "980,00€"],
      ["03/03/2026", "Ventas delivery", "1.420,00€"],
      ["04/03/2026", "Catering externos", "3.500,00€"],
      ["05/03/2026", "Ventas en sala", "1.100,00€"]
    ];

    doc.autoTable({
      startY: 40,
      head: [['Fecha', 'Concepto', 'Ingresos']],
      body: dummyData,
    });

    doc.save("Informe_Finanzas.pdf");
  };

  const tabs = [
    { id: 'usuarios', label: 'Usuarios' },
    { id: 'empleados', label: 'Empleados' },
    { id: 'menu', label: 'Menú y Carta' },
    { id: 'inventario', label: 'Inventario' },
    { id: 'gastos', label: 'Gastos' },
    { id: 'finanzas', label: 'Finanzas' },
  ];

  return (
    <div className="flex h-screen bg-transparent font-sans text-white">
      {/* Sidebar Desktop y Mobile */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-fondo-tarjeta text-gray-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col border-r border-fondo-borde shadow-2xl`}>
        <div className="flex items-center justify-center p-4 border-b border-fondo-borde bg-transparent gap-3">
          <img src="/images/logo.jpg" alt="Mild & Limon" className="h-14 w-14 object-cover rounded-full shadow-lg" />
          <h1 className="text-xl font-black uppercase tracking-widest text-white flex flex-col leading-none">
            Mild<span>&<br/>Limon</span>
          </h1>
        </div>
        
        <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }}
              className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 font-medium tracking-wide ${
                activeTab === tab.id 
                  ? 'bg-mostaza/10 text-mostaza border border-mostaza/20' 
                  : 'text-gray-400 hover:bg-fondo hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center w-full">
                <span className="truncate">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-mostaza shadow-[0_0_8px_rgba(234,179,8,0.8)]"></div>
                )}
              </div>
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-fondo-borde relative">
          <div className="flex items-center gap-3 px-2 cursor-pointer" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
            {profile.fotoPerfil ? (
              <img src={profile.fotoPerfil} alt="Perfil" className="w-10 h-10 rounded-full border border-fondo-borde object-cover shadow-lg" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-mostaza flex items-center justify-center text-black font-bold shadow-lg">
                {(profile.nombre || 'A').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white leading-tight truncate">{profile.nombre}</span>
              <span className="text-xs text-mostaza/70 truncate">Mixto/Menú</span>
            </div>
            <div className="ml-auto text-gray-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          {/* Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className="absolute bottom-full mb-2 left-4 right-4 bg-fondo-tarjeta rounded-xl shadow-xl border border-fondo-borde overflow-hidden z-50">
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 flex items-center gap-3 text-mostaza hover:bg-mostaza/10 transition-colors"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-semibold text-sm">Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden transition-opacity" 
            onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header Mobile */}
        <header className="flex items-center justify-between h-16 bg-fondo-tarjeta/60 backdrop-blur-md border-b border-fondo-borde px-4 md:hidden shadow-sm z-30">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="p-2 -ml-2 text-mostaza hover:text-white focus:outline-none hover:bg-fondo/50 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <img src="/images/logo.jpg" alt="Logo" className="h-10 w-10 object-cover rounded-full" />
            <span className="font-bold text-white uppercase tracking-widest text-sm">Manager App</span>
          </div>
          <div className="w-8"></div> {/* Spacer balance */}
        </header>

        <main className="flex-1 overflow-auto bg-transparent relative z-10 w-full mb-12 sm:mb-0">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto h-full space-y-6">
            <header className="mb-8">
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
              <p className="text-gray-400 mt-1">
                Panel de control de administración
              </p>
            </header>

            {/* Dynamic Content */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'usuarios' && <EmpleadosModule loggedInUserId={loggedInUserId} />}
                {activeTab === 'empleados' && <GestionEmpleadosModule />}
                {activeTab === 'menu' && <MenuModule />}
                {activeTab === 'inventario' && <InventarioModule />}
                {activeTab === 'gastos' && <GastosModule />}
                {activeTab === 'finanzas' && <FinanzasModule exportToPDF={exportToPDF} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function EmpleadosModule({ loggedInUserId }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [modal, setModal] = useState({ show: false, usuarioId: null, newRole: '', nombre: '' });
  const [inviteModal, setInviteModal] = useState({ show: false, email: '', rol: 'camarero' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5105';

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/usuarios`);
      setUsuarios(response.data);
    } catch (error) {
      console.error('Error fetching usuarios:', error);
      showToast('Error al cargar la lista de usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (usuarioId, newRole) => {
    try {
      await axios.put(`${API_URL}/api/usuarios/${usuarioId}/rol`, 
        { rol: newRole }
      );
      setUsuarios(usuarios.map(u => u.id === usuarioId ? { ...u, rol: newRole } : u));
      showToast('Rol actualizado correctamente', 'success');
    } catch (error) {
      console.error('Error updating role:', error);
      showToast('Error al modificar privilegios', 'error');
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  const triggerRoleChange = (usuario, newRole) => {
    setModal({ show: true, usuarioId: usuario.id, newRole, nombre: usuario.nombre });
  };

  const confirmRoleChange = async () => {
    await handleRoleChange(modal.usuarioId, modal.newRole);
    setModal({ show: false, usuarioId: null, newRole: '', nombre: '' });
  };

  const cancelRoleChange = () => {
    setModal({ show: false, usuarioId: null, newRole: '', nombre: '' });
  };

  const submitInvite = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/auth/invite`, {
        email: inviteModal.email,
        rol: inviteModal.rol
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Invitación enviada correctamente', 'success');
      setInviteModal({ show: false, email: '', rol: 'camarero' });
      fetchUsuarios();
    } catch (error) {
      console.error(error);
      showToast(error.response?.data || 'Error al enviar invitación', 'error');
    }
  };

  const filteredUsuarios = usuarios.filter(u => {
    const matchesSearch = (u.nombre || '').toLowerCase().includes(search.toLowerCase()) || 
                          (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === '' || u.rol === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) return (
    <div className="h-64 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-mostaza/20 border-t-mostaza rounded-full animate-spin"></div>
        <span className="text-sm font-medium text-gray-400 animate-pulse">Cargando personal...</span>
    </div>
  );

  return (
    <div className="bg-fondo-tarjeta rounded-2xl shadow-sm border border-fondo-borde overflow-hidden">
      {/* Header & Filters */}
      <div className="p-5 sm:p-6 border-b border-fondo-borde flex flex-col sm:flex-row gap-4 justify-between items-center bg-fondo-tarjeta z-20 relative">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-md group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-500 group-focus-within:text-mostaza transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <input 
                type="text" 
                placeholder="Buscar por nombre o email..." 
                className="w-full pl-10 pr-4 py-2.5 bg-fondo-tarjeta border border-fondo-borde text-white rounded-xl text-sm focus:ring-2 focus:ring-mostaza focus:border-mostaza transition-all shadow-sm outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>

        {/* Filter and Invite Button */}
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-4">
            <div className="min-w-[180px]">
                <select 
                    className="w-full px-4 py-2.5 bg-fondo-tarjeta border border-fondo-borde text-white rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-mostaza focus:border-mostaza transition-all shadow-sm appearance-none hover:cursor-pointer"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23eab308' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: `2.5rem` }}
                >
                    <option value="">Todos los perfiles</option>
                    <option value="cliente" className="bg-fondo text-white">👤 Cliente</option>
                    <option value="camarero" className="bg-fondo text-white">☕ Camarero</option>
                    <option value="cocinero" className="bg-fondo text-white">🍳 Cocinero</option>
                    <option value="jefe" className="bg-fondo text-white">⭐ Jefe</option>
                </select>
            </div>
            
            <button 
                onClick={() => setInviteModal({ show: true, email: '', rol: 'camarero' })}
                className="bg-mostaza hover:bg-mostaza-hover text-black font-bold py-2.5 px-5 rounded-xl text-sm transition-colors shadow-md flex items-center justify-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                Invitar Usuario
            </button>
        </div>
      </div>

      {/* Table grid */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-fondo/80 text-gray-400">
            <tr>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Información de Usuario</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Rol de Acceso</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right sm:text-center w-32">Configurar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fondo-borde">
            {filteredUsuarios.map(usuario => (
              <tr key={usuario.id} className="hover:bg-fondo/60 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-mostaza/20 text-mostaza flex items-center justify-center font-bold text-lg shadow-sm border border-mostaza/30">
                        {(usuario.nombre || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-[200px]">
                      <span className="font-semibold text-white truncate">{usuario.nombre}</span>
                      <span className="text-gray-400 text-xs mt-0.5 truncate">{usuario.email}</span>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm border
                    ${usuario.rol === 'jefe' ? 'bg-purple-900/30 text-purple-400 border-purple-900' : 
                      usuario.rol === 'camarero' ? 'bg-blue-900/30 text-blue-400 border-blue-900' : 
                      usuario.rol === 'cocinero' ? 'bg-orange-900/30 text-orange-400 border-orange-900' : 
                      'bg-fondo/50 text-gray-400 border-fondo-borde'}`}
                  >
                    {usuario.rol === 'jefe' && <span className="text-purple-500">★</span>}
                    {usuario.rol}
                  </span>
                </td>

                <td className="px-6 py-4 text-right sm:text-center">
                  <select 
                    className={`border border-fondo-borde rounded-lg px-3 py-1.5 text-sm font-medium outline-none shadow-sm transition-all appearance-none ${
                        usuario.id === loggedInUserId 
                        ? 'bg-fondo/50 text-gray-500 cursor-not-allowed opacity-70' 
                        : 'bg-fondo text-white focus:ring-2 focus:ring-mostaza focus:border-mostaza cursor-pointer hover:bg-fondo-tarjeta'
                    }`}
                    value={usuario.rol}
                    onChange={(e) => triggerRoleChange(usuario, e.target.value)}
                    disabled={usuario.id === loggedInUserId}
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23eab308' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.2rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.2em 1.2em`, paddingRight: `1.8rem` }}
                  >
                    <option value="cliente" className="bg-fondo text-white">Cliente</option>
                    <option value="camarero" className="bg-fondo text-white">Camarero</option>
                    <option value="cocinero" className="bg-fondo text-white">Cocinero</option>
                    <option value="jefe" className="bg-fondo text-white">Jefe</option>
                  </select>
                </td>
              </tr>
            ))}
            {filteredUsuarios.length === 0 && (
                <tr>
                    <td colSpan="3" className="text-center py-16 px-4">
                        <div className="flex flex-col items-center text-gray-500">
                            <svg className="w-12 h-12 mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span className="font-medium text-gray-400">No se ha encontrado a nadie</span>
                            <span className="text-xs mt-1">Intenta con otro término de búsqueda</span>
                        </div>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 lg:bottom-8 lg:right-8 px-5 py-3.5 rounded-xl shadow-2xl text-white transform transition-all duration-300 translate-y-0 opacity-100 flex items-center gap-3 z-50
          ${toast.type === 'success' ? 'bg-fondo-tarjeta border border-mostaza shadow-mostaza/20' : 'bg-fondo-tarjeta border border-red-500'}`}>
          {toast.type === 'success' ? (
              <div className="w-6 h-6 rounded-full bg-mostaza/20 text-mostaza flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
              </div>
          ) : (
              <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0 border border-white/20">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
          )}
          <span className="font-medium text-sm tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* Confirmation Modal via Portal */}
      {modal.show && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={cancelRoleChange}></div>
            <div className="bg-fondo-tarjeta text-white border border-fondo-borde rounded-3xl shadow-2xl relative z-10 w-full max-w-sm p-8 animate-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out">
                <div className="p-6">
                    <div className="w-12 h-12 rounded-full bg-mostaza/20 flex items-center justify-center mx-auto mb-4 border border-mostaza/30">
                        <svg className="w-6 h-6 text-mostaza" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-center text-white mb-2">Confirmar Cambio de Rol</h3>
                    <p className="text-sm text-center text-gray-400">
                        ¿Estás seguro de que quieres cambiar el rol de <strong className="text-white font-semibold">{modal.nombre}</strong> a <strong className="text-white font-semibold uppercase">{modal.newRole}</strong>?
                    </p>
                </div>
                <div className="bg-fondo-tarjeta p-4 border-t border-fondo-borde flex gap-3">
                    <button 
                        onClick={cancelRoleChange}
                        className="flex-1 py-2.5 px-4 bg-transparent border border-fondo-borde text-gray-300 font-medium rounded-xl hover:bg-fondo-borde transition-colors shadow-sm"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={confirmRoleChange}
                        className="flex-1 py-2.5 px-4 bg-mostaza text-black font-bold rounded-xl hover:bg-mostaza-hover transition-colors shadow-sm"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>,
        document.body
      )}

      {/* Invite Modal via Portal */}
      {inviteModal.show && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={() => setInviteModal({ ...inviteModal, show: false })}></div>
            <div className="bg-fondo-tarjeta text-white border border-fondo-borde rounded-3xl shadow-2xl relative z-10 w-full max-w-sm p-8 animate-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out">
                <div className="p-2 mb-4">
                    <h3 className="text-xl font-bold text-white mb-2">Invitar Usuario</h3>
                    <p className="text-sm text-gray-400">
                        Enviaremos un enlace único para que configure su cuenta.
                    </p>
                </div>
                <form onSubmit={submitInvite} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                        <input required type="email" className="w-full px-4 py-2 bg-transparent border border-fondo-borde rounded-xl text-sm text-white focus:ring-2 focus:ring-mostaza outline-none" value={inviteModal.email} onChange={e => setInviteModal({...inviteModal, email: e.target.value})} placeholder="empleado@restaurante.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Rol</label>
                        <select className="w-full px-4 py-2 bg-transparent border border-fondo-borde rounded-xl text-sm text-white focus:ring-2 focus:ring-mostaza outline-none appearance-none" value={inviteModal.rol} onChange={e => setInviteModal({...inviteModal, rol: e.target.value})}
                          style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23eab308' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: `2.5rem` }}
                        >
                            <option className="bg-fondo text-white" value="camarero">Camarero</option>
                            <option className="bg-fondo text-white" value="cocinero">Cocinero</option>
                            <option className="bg-fondo text-white" value="jefe">Jefe</option>
                        </select>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setInviteModal({ ...inviteModal, show: false })} className="flex-1 py-2.5 px-4 bg-transparent border border-fondo-borde text-gray-300 font-medium rounded-xl hover:bg-fondo-borde transition-colors shadow-sm">Cancelar</button>
                        <button type="submit" className="flex-1 py-2.5 px-4 bg-mostaza text-black font-bold rounded-xl hover:bg-mostaza-hover transition-colors shadow-sm">Enviar Invitación</button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function MenuModule() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [modal, setModal] = useState({ show: false, editingProduct: null });
  const [formData, setFormData] = useState({ 
    nombre: '', 
    descripcion: '', 
    precio: 0, 
    categoria: 'Principal', 
    disponible: true 
  });
  
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, nombre: '' });
  const [categoriasList, setCategoriasList] = useState([]);
  const [categoriasModal, setCategoriasModal] = useState({ show: false, newName: '' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5105';

  useEffect(() => {
    fetchProductos();
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/categorias`);
      setCategoriasList(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProductos = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/productos`);
      setProductos(res.data);
    } catch (error) {
      console.error(error);
      showToast('Error al cargar menú', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  const openAddModal = () => {
    setFormData({ nombre: '', descripcion: '', precio: 0, categoria: 'Entrante', disponible: true });
    setModal({ show: true, editingProduct: null });
  };

  const openEditModal = (prod) => {
    setFormData({ ...prod, descripcion: prod.descripcion || '' });
    setModal({ show: true, editingProduct: prod.id });
  };

  const closeModals = () => {
    setModal({ show: false, editingProduct: null });
    setDeleteModal({ show: false, id: null, nombre: '' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (modal.editingProduct) {
        await axios.put(`${API_URL}/api/productos/${modal.editingProduct}`, 
            { ...formData, id: modal.editingProduct }
        );
        showToast('Producto actualizado', 'success');
      } else {
        await axios.post(`${API_URL}/api/productos`, formData);
        showToast('Producto creado', 'success');
      }
      closeModals();
      fetchProductos();
    } catch (error) {
      console.error(error);
      showToast('Error al guardar', 'error');
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API_URL}/api/productos/${deleteModal.id}`);
      showToast('Producto eliminado', 'success');
      closeModals();
      fetchProductos();
    } catch (error) {
      console.error(error);
      showToast('Error al eliminar', 'error');
    }
  };

  const handleAddCategoria = async (e) => {
    e.preventDefault();
    if (!categoriasModal.newName.trim()) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/categorias`, 
        { nombre: categoriasModal.newName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('Categoría añadida', 'success');
      setCategoriasModal({ ...categoriasModal, newName: '' });
      fetchCategorias();
    } catch (error) {
      console.error(error);
      showToast('Error al añadir categoría', 'error');
    }
  };

  const handleDeleteCategoria = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/categorias/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Categoría eliminada', 'success');
      fetchCategorias();
    } catch (error) {
      console.error(error);
      showToast('Error al eliminar categoría', 'error');
    }
  };

  if (loading) return (
    <div className="h-64 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-mostaza/20 border-t-mostaza rounded-full animate-spin"></div>
        <span className="text-sm font-medium text-gray-400 animate-pulse">Cargando menú...</span>
    </div>
  );

  return (
    <div className="bg-fondo-tarjeta rounded-2xl shadow-sm border border-fondo-borde overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-fondo-borde flex justify-between items-center bg-fondo-tarjeta z-20 relative">
        <h3 className="text-lg font-bold text-white">Gestión de Carta</h3>
        <div className="flex gap-2">
            <button 
                onClick={() => setCategoriasModal({ show: true, newName: '' })}
                className="bg-fondo text-gray-300 font-bold py-2.5 px-4 rounded-xl text-sm transition-colors border border-fondo-borde hover:bg-fondo-borde flex items-center gap-2"
            >
                Gestionar Categorías
            </button>
            <button 
                onClick={openAddModal}
                className="bg-mostaza hover:bg-mostaza-hover text-black font-bold py-2.5 px-5 rounded-xl text-sm transition-colors shadow-md flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                Añadir Producto
            </button>
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-fondo/80 text-gray-400 border-b border-fondo-borde">
            <tr>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Producto</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Categoría</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Precio</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Estado</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right w-32">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fondo-borde">
            {productos.map(prod => (
              <tr key={prod.id} className="hover:bg-fondo/60 transition-colors group">
                <td className="px-6 py-4">
                    <div className="flex flex-col min-w-[200px]">
                      <span className="font-semibold text-white truncate">{prod.nombre}</span>
                      <span className="text-gray-400 text-xs mt-0.5 truncate max-w-[200px]">{prod.descripcion || 'Sin descripción'}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-fondo text-gray-300 border border-fondo-borde">
                    {prod.categoria}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-mostaza">
                    {prod.precio.toFixed(2)}€
                </td>
                <td className="px-6 py-4">
                  {prod.disponible ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-green-500 bg-green-950/30 border border-green-900/50">
                          Disponible
                      </span>
                  ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-red-500 bg-red-950/30 border border-red-900/50">
                          Agotado
                      </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openEditModal(prod)} className="text-mostaza hover:text-white font-medium text-sm mr-4 transition-colors">Editar</button>
                  <button onClick={() => setDeleteModal({ show: true, id: prod.id, nombre: prod.nombre })} className="text-mostaza hover:text-white font-medium text-sm transition-colors">Borrar</button>
                </td>
              </tr>
            ))}
            {productos.length === 0 && (
                <tr>
                    <td colSpan="5" className="text-center py-16 px-4 text-gray-500">
                        No hay productos en el menú aún.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal.show && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={closeModals}></div>
            <div className="bg-fondo-tarjeta border border-fondo-borde rounded-3xl shadow-2xl relative z-10 w-full max-w-lg p-8 text-white animate-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out">
                <h3 className="text-xl font-bold text-white mb-6">{modal.editingProduct ? 'Editar Producto' : 'Añadir Nuevo Producto'}</h3>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                        <input required type="text" className="w-full px-4 py-2 bg-transparent border border-fondo-borde rounded-xl text-sm text-white focus:ring-2 focus:ring-mostaza outline-none" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
                        <textarea className="w-full px-4 py-2 bg-transparent border border-fondo-borde rounded-xl text-sm text-white focus:ring-2 focus:ring-mostaza outline-none" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Precio</label>
                            <input required type="number" step="0.01" className="w-full px-4 py-2 bg-transparent border border-fondo-borde rounded-xl text-sm text-white focus:ring-2 focus:ring-mostaza outline-none" value={formData.precio} onChange={e => setFormData({...formData, precio: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Categoría</label>
                            <select className="w-full px-4 py-2 bg-transparent border border-fondo-borde rounded-xl text-sm text-white focus:ring-2 focus:ring-mostaza outline-none appearance-none" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})}
                              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23eab308' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: `2.5rem` }}
                            >
                                {categoriasList.map(cat => (
                                    <option key={cat.id} className="bg-fondo text-white" value={cat.nombre}>{cat.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <input type="checkbox" id="dispo" className="w-4 h-4 text-mostaza rounded border-fondo-borde bg-transparent focus:ring-mostaza cursor-pointer" checked={formData.disponible} onChange={e => setFormData({...formData, disponible: e.target.checked})} />
                        <label htmlFor="dispo" className="text-sm text-gray-300 font-medium cursor-pointer">Disponible para venta</label>
                    </div>
                    
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={closeModals} className="flex-1 py-2.5 px-4 bg-transparent border border-fondo-borde text-gray-300 font-medium rounded-xl hover:bg-fondo transition-colors">Cancelar</button>
                        <button type="submit" className="flex-1 py-2.5 px-4 bg-mostaza text-black font-bold rounded-xl hover:bg-mostaza-hover transition-colors">Guardar Producto</button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
      )}

      {deleteModal.show && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={closeModals}></div>
            <div className="bg-fondo-tarjeta border border-fondo-borde rounded-3xl shadow-2xl relative z-10 w-full max-w-sm p-8 text-center text-white animate-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out">
                <div className="w-12 h-12 rounded-full bg-red-950/30 flex items-center justify-center mx-auto mb-4 border border-red-900/50">
                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Eliminar Producto</h3>
                <p className="text-sm text-gray-400 mb-6">¿Estás seguro de eliminar <strong className="text-mostaza font-bold">"{deleteModal.nombre}"</strong>? Esta acción no se puede deshacer.</p>
                <div className="flex gap-3">
                    <button onClick={closeModals} className="flex-1 py-2.5 bg-fondo border border-fondo-borde text-gray-300 font-medium rounded-xl hover:bg-fondo-borde transition-colors">Cancelar</button>
                    <button onClick={confirmDelete} className="flex-1 py-2.5 bg-mostaza text-black font-bold rounded-xl hover:bg-mostaza-hover transition-colors">Eliminar</button>
                </div>
            </div>
        </div>,
        document.body
      )}

      {toast.show && (
        <div className={`fixed bottom-6 right-6 lg:bottom-8 lg:right-8 px-5 py-3.5 rounded-xl shadow-2xl text-white transform transition-all duration-300 z-50 flex items-center gap-3 ${toast.type === 'success' ? 'bg-fondo-tarjeta border border-mostaza shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-fondo-tarjeta border border-red-500'}`}>
          {toast.type === 'success' ? (
              <div className="w-6 h-6 rounded-full bg-mostaza/20 text-mostaza flex items-center justify-center shrink-0 border border-mostaza/30">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
              </div>
          ) : (
              <div className="w-6 h-6 rounded-full bg-red-950/30 text-red-500 flex items-center justify-center shrink-0 border border-red-900/50">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
          )}
          <span className="font-medium text-sm text-white">{toast.message}</span>
        </div>
      )}

      {/* Modal Categorías */}
      {categoriasModal.show && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-fondo-tarjeta border border-fondo-borde rounded-2xl p-6 w-full max-w-md shadow-xl relative animate-fadeIn">
                <button onClick={() => setCategoriasModal({ show: false, newName: '' })} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <h3 className="text-xl font-bold text-white mb-4">Gestionar Categorías</h3>
                
                <form onSubmit={handleAddCategoria} className="flex gap-2 mb-6">
                    <input required type="text" placeholder="Nueva categoría..." className="flex-1 px-4 py-2 bg-transparent border border-fondo-borde rounded-xl text-sm text-white focus:ring-2 focus:ring-mostaza outline-none" value={categoriasModal.newName} onChange={e => setCategoriasModal({...categoriasModal, newName: e.target.value})} />
                    <button type="submit" className="bg-mostaza text-black font-bold py-2 px-4 rounded-xl text-sm transition-colors shadow-md hover:bg-mostaza-hover">Añadir</button>
                </form>

                <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
                    {categoriasList.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-4">No hay categorías disponibles.</p>
                    ) : (
                        categoriasList.map(cat => (
                            <div key={cat.id} className="flex justify-between items-center p-3 rounded-xl bg-fondo/50 border border-fondo-borde">
                                <span className="text-white text-sm font-medium">{cat.nombre}</span>
                                <button onClick={() => handleDeleteCategoria(cat.id)} className="text-red-400 hover:text-red-300 transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>,
        document.body
      )}

    </div>
  );
}

function InventarioModule() {
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [modal, setModal] = useState({ show: false, editingArticulo: null });
  const [formData, setFormData] = useState({ 
    nombre: '', 
    cantidadActual: 0, 
    unidadMedida: 'Kg', 
    precioCoste: 0 
  });
  
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, nombre: '' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5105';

  useEffect(() => {
    fetchInventario();
  }, []);

  const fetchInventario = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/inventario`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setArticulos(res.data);
    } catch (error) {
      console.error(error);
      showToast('Error al cargar inventario', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  const openAddModal = () => {
    setFormData({ nombre: '', cantidadActual: 0, unidadMedida: 'Kg', precioCoste: 0 });
    setModal({ show: true, editingArticulo: null });
  };

  const openEditModal = (art) => {
    setFormData({ ...art });
    setModal({ show: true, editingArticulo: art.id });
  };

  const closeModals = () => {
    setModal({ show: false, editingArticulo: null });
    setDeleteModal({ show: false, id: null, nombre: '' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      if (modal.editingArticulo) {
        await axios.put(`${API_URL}/api/inventario/${modal.editingArticulo}`, 
            { ...formData, id: modal.editingArticulo },
            { headers }
        );
        showToast('Artículo actualizado', 'success');
      } else {
        await axios.post(`${API_URL}/api/inventario`, formData, { headers });
        showToast('Artículo creado', 'success');
      }
      closeModals();
      fetchInventario();
    } catch (error) {
      console.error(error);
      showToast('Error al guardar', 'error');
    }
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/inventario/${deleteModal.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Artículo eliminado', 'success');
      closeModals();
      fetchInventario();
    } catch (error) {
      console.error(error);
      showToast('Error al eliminar', 'error');
    }
  };

  if (loading) return (
    <div className="h-64 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-mostaza/20 border-t-mostaza rounded-full animate-spin"></div>
        <span className="text-sm font-medium text-gray-400 animate-pulse">Cargando inventario...</span>
    </div>
  );

  return (
    <div className="bg-fondo-tarjeta rounded-2xl shadow-sm border border-fondo-borde overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-fondo-borde flex justify-between items-center bg-fondo-tarjeta z-20 relative">
        <h3 className="text-lg font-bold text-white">Inventario de Cocina</h3>
        <button 
            onClick={openAddModal}
            className="bg-mostaza hover:bg-mostaza-hover text-black font-bold py-2.5 px-5 rounded-xl text-sm transition-colors shadow-md flex items-center gap-2"
        >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            Añadir Artículo
        </button>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-fondo/80 text-gray-400 border-b border-fondo-borde">
            <tr>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Artículo</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Stock Actual</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Unidad</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Coste/Uds</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right w-32">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fondo-borde">
            {articulos.map(art => (
              <tr key={art.id} className="hover:bg-fondo/60 transition-colors group">
                <td className="px-6 py-4">
                    <span className="font-semibold text-white">{art.nombre}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${art.cantidadActual < 5 ? 'bg-red-950/30 text-red-400 border-red-900/50' : 'bg-mostaza/20 text-mostaza border-mostaza/30'}`}>
                    {art.cantidadActual}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-300">
                    {art.unidadMedida}
                </td>
                <td className="px-6 py-4 font-bold text-mostaza">
                    {art.precioCoste.toFixed(2)}€
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openEditModal(art)} className="text-mostaza hover:text-white font-medium text-sm mr-4 transition-colors">Editar</button>
                  <button onClick={() => setDeleteModal({ show: true, id: art.id, nombre: art.nombre })} className="text-mostaza hover:text-white font-medium text-sm transition-colors">Borrar</button>
                </td>
              </tr>
            ))}
            {articulos.length === 0 && (
                <tr>
                    <td colSpan="5" className="text-center py-16 px-4 text-gray-500">
                        No hay artículos en el inventario aún.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal.show && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={closeModals}></div>
            <div className="bg-fondo-tarjeta border border-fondo-borde rounded-3xl shadow-2xl relative z-10 w-full max-w-lg p-8 text-white animate-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out">
                <h3 className="text-xl font-bold text-white mb-6">{modal.editingArticulo ? 'Editar Artículo' : 'Añadir Nuevo Artículo'}</h3>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                        <input required type="text" className="w-full px-4 py-2 bg-transparent border border-fondo-borde rounded-xl text-sm text-white focus:ring-2 focus:ring-mostaza outline-none" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Stock Actual</label>
                            <input required type="number" step="0.01" className="w-full px-4 py-2 bg-transparent border border-fondo-borde rounded-xl text-sm text-white focus:ring-2 focus:ring-mostaza outline-none" value={formData.cantidadActual} onChange={e => setFormData({...formData, cantidadActual: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Unidad de Medida</label>
                            <select className="w-full px-4 py-2 bg-transparent border border-fondo-borde rounded-xl text-sm text-white focus:ring-2 focus:ring-mostaza outline-none appearance-none" value={formData.unidadMedida} onChange={e => setFormData({...formData, unidadMedida: e.target.value})}
                              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23eab308' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: `2.5rem` }}
                            >
                                <option className="bg-fondo text-white" value="Kg">Kg</option>
                                <option className="bg-fondo text-white" value="Gramos">Gramos</option>
                                <option className="bg-fondo text-white" value="Litros">Litros</option>
                                <option className="bg-fondo text-white" value="Mililitros">Mililitros</option>
                                <option className="bg-fondo text-white" value="Unidad">Unidad</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Precio de Coste</label>
                        <input required type="number" step="0.01" className="w-full px-4 py-2 bg-transparent border border-fondo-borde rounded-xl text-sm text-white focus:ring-2 focus:ring-mostaza outline-none" value={formData.precioCoste} onChange={e => setFormData({...formData, precioCoste: parseFloat(e.target.value) || 0})} />
                    </div>
                    
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={closeModals} className="flex-1 py-2.5 px-4 bg-transparent border border-fondo-borde text-gray-300 font-medium rounded-xl hover:bg-fondo transition-colors">Cancelar</button>
                        <button type="submit" className="flex-1 py-2.5 px-4 bg-mostaza text-black font-bold rounded-xl hover:bg-mostaza-hover transition-colors">Guardar Artículo</button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
      )}

      {deleteModal.show && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={closeModals}></div>
            <div className="bg-fondo-tarjeta border border-fondo-borde rounded-3xl shadow-2xl relative z-10 w-full max-w-sm p-8 text-center text-white animate-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out">
                <div className="w-12 h-12 rounded-full bg-red-950/30 flex items-center justify-center mx-auto mb-4 border border-red-900/50">
                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Eliminar Artículo</h3>
                <p className="text-sm text-gray-400 mb-6">¿Estás seguro de eliminar <strong className="text-mostaza font-bold">"{deleteModal.nombre}"</strong>? Esta acción no se puede deshacer.</p>
                <div className="flex gap-3">
                    <button onClick={closeModals} className="flex-1 py-2.5 bg-fondo border border-fondo-borde text-gray-300 font-medium rounded-xl hover:bg-fondo-borde transition-colors">Cancelar</button>
                    <button onClick={confirmDelete} className="flex-1 py-2.5 bg-mostaza text-black font-bold rounded-xl hover:bg-mostaza-hover transition-colors">Eliminar</button>
                </div>
            </div>
        </div>,
        document.body
      )}

      {toast.show && (
        <div className={`fixed bottom-6 right-6 lg:bottom-8 lg:right-8 px-5 py-3.5 rounded-xl shadow-2xl text-white transform transition-all duration-300 z-50 flex items-center gap-3 ${toast.type === 'success' ? 'bg-fondo-tarjeta border border-mostaza shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-fondo-tarjeta border border-red-500'}`}>
          {toast.type === 'success' ? (
              <div className="w-6 h-6 rounded-full bg-mostaza/20 text-mostaza flex items-center justify-center shrink-0 border border-mostaza/30">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
              </div>
          ) : (
              <div className="w-6 h-6 rounded-full bg-red-950/30 text-red-500 flex items-center justify-center shrink-0 border border-red-900/50">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
          )}
          <span className="font-medium text-sm text-white">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

function GestionEmpleadosModule() {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [modal, setModal] = useState({ show: false, mode: 'add' }); // 'add' or 'edit'
  const [deleteModal, setDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '', apellidos: '', dni: '', correo: '', telefono: '', sueldo: 0, rango: 'camarero'
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5105';

  useEffect(() => {
    fetchEmpleados();
  }, []);

  const fetchEmpleados = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/empleados`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmpleados(res.data);
    } catch (error) {
      console.error(error);
      showToast('Error al cargar empleados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  const handleAdd = () => {
    setFormData({ nombre: '', apellidos: '', dni: '', correo: '', telefono: '', sueldo: 0, rango: 'camarero' });
    setModal({ show: true, mode: 'add' });
  };

  const handleEdit = () => {
    if (!selectedId) return;
    const emp = empleados.find(e => e.id === selectedId);
    setFormData({ ...emp });
    setModal({ show: true, mode: 'edit' });
  };

  const handleDelete = () => {
    if (!selectedId) return;
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/empleados/${selectedId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Empleado eliminado', 'success');
      setDeleteModal(false);
      setSelectedId(null);
      fetchEmpleados();
    } catch (error) {
      console.error(error);
      showToast('Error al eliminar', 'error');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      if (modal.mode === 'edit') {
        await axios.put(`${API_URL}/api/empleados/${selectedId}`, formData, { headers });
        showToast('Empleado actualizado', 'success');
      } else {
        await axios.post(`${API_URL}/api/empleados`, formData, { headers });
        showToast('Empleado creado', 'success');
      }
      setModal({ show: false, mode: 'add' });
      fetchEmpleados();
    } catch (error) {
      console.error(error);
      showToast('Error al guardar', 'error');
    }
  };

  if (loading) return (
    <div className="h-64 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-mostaza/20 border-t-mostaza rounded-full animate-spin"></div>
        <span className="text-sm font-medium text-gray-400 animate-pulse">Cargando personal...</span>
    </div>
  );

  return (
    <div className="bg-fondo-tarjeta rounded-2xl shadow-sm border border-fondo-borde overflow-hidden">
      {/* Botones Superiores */}
      <div className="p-5 sm:p-6 border-b border-fondo-borde flex flex-wrap gap-4 bg-fondo-tarjeta z-20 relative">
        <button 
            onClick={handleAdd}
            className="bg-mostaza hover:bg-mostaza-hover text-black font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-md flex items-center gap-2"
        >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            Añadir Empleado
        </button>

        <button 
            onClick={handleEdit}
            disabled={!selectedId}
            className={`py-2.5 px-6 rounded-xl text-sm font-bold transition-colors shadow-md flex items-center gap-2 border ${selectedId ? 'bg-fondo text-white border-mostaza/50 hover:bg-mostaza/10' : 'bg-fondo/50 text-gray-500 border-fondo-borde cursor-not-allowed'}`}
        >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Editar Seleccionado
        </button>

        <button 
            onClick={handleDelete}
            disabled={!selectedId}
            className={`py-2.5 px-6 rounded-xl text-sm font-bold transition-colors shadow-md flex items-center gap-2 border ${selectedId ? 'bg-red-950/20 text-red-500 border-red-900/50 hover:bg-red-900/20' : 'bg-fondo/50 text-gray-500 border-fondo-borde cursor-not-allowed'}`}
        >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Eliminar Seleccionado
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-fondo/80 text-gray-400 border-b border-fondo-borde">
            <tr>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Nombre y Apellidos</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">DNI</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Contacto</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Sueldo</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Rango</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fondo-borde">
            {empleados.map(emp => (
              <tr 
                key={emp.id} 
                onClick={() => setSelectedId(selectedId === emp.id ? null : emp.id)}
                className={`transition-colors cursor-pointer ${selectedId === emp.id ? 'bg-mostaza/10' : 'hover:bg-fondo/60'}`}
              >
                <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{emp.nombre} {emp.apellidos}</span>
                    </div>
                </td>
                <td className="px-6 py-4 text-gray-300 font-mono text-xs">
                    {emp.dni}
                </td>
                <td className="px-6 py-4">
                    <div className="flex flex-col text-xs gap-1">
                      <span className="text-gray-300">{emp.correo}</span>
                      <span className="text-mostaza/70">{emp.telefono}</span>
                    </div>
                </td>
                <td className="px-6 py-4 font-bold text-white">
                    {emp.sueldo.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold uppercase bg-fondo border border-fondo-borde text-gray-300">
                    {emp.rango}
                  </span>
                </td>
              </tr>
            ))}
            {empleados.length === 0 && (
                <tr>
                    <td colSpan="5" className="text-center py-16 px-4 text-gray-500">
                        No hay empleados registrados.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Añadir/Editar */}
      {modal.show && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={() => setModal({ ...modal, show: false })}></div>
            <div className="bg-fondo-tarjeta border border-fondo-borde rounded-3xl shadow-2xl relative z-10 w-full max-w-2xl p-8 text-white animate-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out">
                <h3 className="text-xl font-bold text-white mb-6">{modal.mode === 'edit' ? 'Editar Empleado' : 'Nuevo Empleado'}</h3>
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                        <input required type="text" className="w-full px-4 py-2 bg-transparent border border-fondo-borde rounded-xl text-sm text-white focus:ring-2 focus:ring-mostaza outline-none" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Apellidos</label>
                        <input required type="text" className="w-full px-4 py-2 bg-transparent border border-fondo-borde rounded-xl text-sm text-white focus:ring-2 focus:ring-mostaza outline-none" value={formData.apellidos} onChange={e => setFormData({...formData, apellidos: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">DNI</label>
                        <input required type="text" className="w-full px-4 py-2 bg-transparent border border-fondo-borde rounded-xl text-sm text-white focus:ring-2 focus:ring-mostaza outline-none" value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Correo Electrónico</label>
                        <input required type="email" className="w-full px-4 py-2 bg-transparent border border-fondo-borde rounded-xl text-sm text-white focus:ring-2 focus:ring-mostaza outline-none" value={formData.correo} onChange={e => setFormData({...formData, correo: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Teléfono</label>
                        <input type="text" className="w-full px-4 py-2 bg-transparent border border-fondo-borde rounded-xl text-sm text-white focus:ring-2 focus:ring-mostaza outline-none" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Sueldo Bruto Mensual</label>
                        <input required type="number" step="0.01" className="w-full px-4 py-2 bg-transparent border border-fondo-borde rounded-xl text-sm text-white focus:ring-2 focus:ring-mostaza outline-none" value={formData.sueldo} onChange={e => setFormData({...formData, sueldo: parseFloat(e.target.value) || 0})} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">Rango / Puesto</label>
                        <select className="w-full px-4 py-2 bg-transparent border border-fondo-borde rounded-xl text-sm text-white focus:ring-2 focus:ring-mostaza outline-none appearance-none" value={formData.rango} onChange={e => setFormData({...formData, rango: e.target.value})}
                          style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23eab308' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: `2.5rem` }}
                        >
                            <option className="bg-fondo text-white" value="camarero">Camarero</option>
                            <option className="bg-fondo text-white" value="jefe de sala">Jefe de Sala</option>
                            <option className="bg-fondo text-white" value="jefe de cocina">Jefe de Cocina</option>
                            <option className="bg-fondo text-white" value="ayudante de cocina">Ayudante de Cocina</option>
                            <option className="bg-fondo text-white" value="cocinero">Cocinero</option>
                            <option className="bg-fondo text-white" value="jefe">Jefe / Gerente</option>
                        </select>
                    </div>
                    
                    <div className="md:col-span-2 pt-6 flex gap-3">
                        <button type="button" onClick={() => setModal({ ...modal, show: false })} className="flex-1 py-3 px-4 bg-transparent border border-fondo-borde text-gray-300 font-medium rounded-xl hover:bg-fondo transition-colors">Cancelar</button>
                        <button type="submit" className="flex-1 py-3 px-4 bg-mostaza text-black font-bold rounded-xl hover:bg-mostaza-hover transition-colors shadow-lg shadow-mostaza/20">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
      )}

      {/* Modal Confirmar Borrado */}
      {deleteModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={() => setDeleteModal(false)}></div>
            <div className="bg-fondo-tarjeta border border-fondo-borde rounded-3xl shadow-2xl relative z-10 w-full max-w-sm p-8 text-center text-white animate-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out">
                <div className="w-12 h-12 rounded-full bg-red-950/30 flex items-center justify-center mx-auto mb-4 border border-red-900/50">
                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Baja de Empleado</h3>
                <p className="text-sm text-gray-400 mb-6">¿Estás seguro de que quieres eliminar al empleado seleccionado? Esta acción es irreversible.</p>
                <div className="flex gap-3">
                    <button onClick={() => setDeleteModal(false)} className="flex-1 py-2.5 bg-fondo border border-fondo-borde text-gray-300 font-medium rounded-xl hover:bg-fondo-borde transition-colors">Cancelar</button>
                    <button onClick={confirmDelete} className="flex-1 py-2.5 bg-mostaza text-black font-bold rounded-xl hover:bg-mostaza-hover transition-colors">Confirmar Baja</button>
                </div>
            </div>
        </div>,
        document.body
      )}

      {/* Toasts */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 lg:bottom-8 lg:right-8 px-5 py-3.5 rounded-xl shadow-2xl text-white transform transition-all duration-300 z-50 flex items-center gap-3 ${toast.type === 'success' ? 'bg-fondo-tarjeta border border-mostaza shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-fondo-tarjeta border border-red-500'}`}>
          {toast.type === 'success' ? (
              <div className="w-6 h-6 rounded-full bg-mostaza/20 text-mostaza flex items-center justify-center shrink-0 border border-mostaza/30">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
              </div>
          ) : (
              <div className="w-6 h-6 rounded-full bg-red-950/30 text-red-500 flex items-center justify-center shrink-0 border border-red-900/50">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
          )}
          <span className="font-medium text-sm text-white">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

function GastosModule() {
  const [gastos, setGastos] = useState([]);
  const [resumen, setResumen] = useState({ totalBruto: 0, totalNeto: 0, totalInventario: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [modal, setModal] = useState({ show: false, editingGasto: null });
  const [formData, setFormData] = useState({ 
    tipo: 'Fijo', 
    descripcion: 'Alquiler', 
    monto: 0, 
    fecha: new Date().toISOString().split('T')[0] 
  });
  
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, desc: '' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5105';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [resGastos, resResumen] = await Promise.all([
        axios.get(`${API_URL}/api/gastos`, { headers }),
        axios.get(`${API_URL}/api/gastos/resumen`, { headers })
      ]);
      setGastos(resGastos.data);
      setResumen(resResumen.data);
    } catch (error) {
      console.error(error);
      showToast('Error al cargar datos financieros', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      if (modal.editingGasto) {
        await axios.put(`${API_URL}/api/gastos/${modal.editingGasto}`, { ...formData, id: modal.editingGasto }, { headers });
      } else {
        await axios.post(`${API_URL}/api/gastos`, formData, { headers });
      }
      setModal({ show: false, editingGasto: null });
      fetchData();
      showToast('Gasto guardado correctamente', 'success');
    } catch (error) {
      showToast('Error al guardar el gasto', 'error');
    }
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/gastos/${deleteModal.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteModal({ show: false, id: null, desc: '' });
      fetchData();
      showToast('Gasto eliminado', 'success');
    } catch (error) {
      showToast('Error al eliminar', 'error');
    }
  };

  if (loading) return (
    <div className="h-64 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-mostaza/20 border-t-mostaza rounded-full animate-spin"></div>
        <span className="text-sm font-medium text-gray-400 animate-pulse">Calculando balances...</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Resumen Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-fondo-tarjeta border border-fondo-borde p-6 rounded-3xl shadow-xl">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Nóminas Mensuales</span>
          <div className="mt-2 flex flex-col">
            <span className="text-2xl font-black text-white">{resumen.totalBruto.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} <span className="text-xs text-gray-500 font-normal">Bruto</span></span>
            <span className="text-mostaza font-bold">{resumen.totalNeto.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} <span className="text-xs text-mostaza/60 font-normal">Neto Est.</span></span>
          </div>
        </div>

        <div className="bg-fondo-tarjeta border border-fondo-borde p-6 rounded-3xl shadow-xl">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Valor Total Inventario</span>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">{resumen.totalInventario.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
            <p className="text-xs text-gray-500 mt-1">Coste acumulado de existencias</p>
          </div>
        </div>

        <div className="bg-fondo-tarjeta border border-fondo-borde p-6 rounded-3xl shadow-xl flex flex-col justify-center">
            <button 
                onClick={() => {
                    setFormData({ tipo: 'Fijo', descripcion: 'Alquiler', monto: 0, fecha: new Date().toISOString().split('T')[0] });
                    setModal({ show: true, editingGasto: null });
                }}
                className="w-full bg-mostaza text-black font-black py-4 rounded-2xl hover:bg-mostaza-hover transition-all shadow-lg shadow-mostaza/20 flex items-center justify-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                Registrar Nuevo Gasto
            </button>
        </div>
      </div>

      {/* Tabla de Gastos */}
      <div className="bg-fondo-tarjeta rounded-3xl shadow-sm border border-fondo-borde overflow-hidden">
        <div className="p-6 border-b border-fondo-borde">
            <h3 className="text-lg font-bold text-white">Listado de Gastos Operativos</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-fondo/80 text-gray-400 uppercase text-xs font-bold">
                    <tr>
                        <th className="px-6 py-4">Concepto</th>
                        <th className="px-6 py-4">Tipo</th>
                        <th className="px-6 py-4">Fecha</th>
                        <th className="px-6 py-4">Monto</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-fondo-borde">
                    {gastos.map(g => (
                        <tr key={g.id} className="hover:bg-fondo/50 transition-colors">
                            <td className="px-6 py-4 font-semibold text-white">{g.descripcion}</td>
                            <td className="px-6 py-4">
                                <span className="px-2 py-1 rounded-lg bg-fondo text-gray-400 border border-fondo-borde text-[10px] font-bold uppercase">{g.tipo}</span>
                            </td>
                            <td className="px-6 py-4 text-gray-400">{new Date(g.fecha).toLocaleDateString()}</td>
                            <td className="px-6 py-4 font-black text-white">{g.monto.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                            <td className="px-6 py-4 text-right space-x-3">
                                <button onClick={() => {
                                    setFormData({ ...g, fecha: g.fecha.split('T')[0] });
                                    setModal({ show: true, editingGasto: g.id });
                                }} className="text-mostaza hover:text-white transition-colors">Editar</button>
                                <button onClick={() => setDeleteModal({ show: true, id: g.id, desc: g.descripcion })} className="text-red-500 hover:text-red-400 transition-colors">Eliminar</button>
                            </td>
                        </tr>
                    ))}
                    {gastos.length === 0 && (
                        <tr>
                            <td colSpan="5" className="text-center py-10 text-gray-500 italic">No hay gastos registrados.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Modal Añadir/Editar */}
      {modal.show && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setModal({ show: false, editingGasto: null })}></div>
            <div className="bg-fondo-tarjeta border border-fondo-borde rounded-3xl shadow-2xl relative z-10 w-full max-md p-8">
                <h3 className="text-xl font-bold text-white mb-6">{modal.editingGasto ? 'Editar Gasto' : 'Nuevo Registro de Gasto'}</h3>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Concepto / Descripción</label>
                        <select 
                            className="w-full px-4 py-3 bg-transparent border border-fondo-borde rounded-xl text-white outline-none focus:ring-2 focus:ring-mostaza appearance-none"
                            value={formData.descripcion}
                            onChange={e => setFormData({...formData, descripcion: e.target.value})}
                            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23eab308' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: `2.5rem` }}
                        >
                            <option className="bg-fondo text-white" value="Alquiler">🏠 Alquiler</option>
                            <option className="bg-fondo text-white" value="Luz">💡 Luz</option>
                            <option className="bg-fondo text-white" value="Agua">🚰 Agua</option>
                            <option className="bg-fondo text-white" value="Gas">🔥 Gas</option>
                            <option className="bg-fondo text-white" value="Reparaciones">🛠️ Reparaciones Maquinaria</option>
                            <option className="bg-fondo text-white" value="Suministros">📦 Suministros Varios</option>
                            <option className="bg-fondo text-white" value="Marketing">📣 Marketing</option>
                            <option className="bg-fondo text-white" value="Otros">❓ Otros</option>
                        </select>
                        {formData.descripcion === 'Otros' && (
                             <input 
                                type="text" 
                                placeholder="Especifique el concepto..."
                                className="w-full mt-2 px-4 py-3 bg-transparent border border-fondo-borde rounded-xl text-white outline-none focus:ring-2 focus:ring-mostaza"
                                onChange={e => setFormData({...formData, descripcion: e.target.value})}
                            />
                        )}
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Monto (€)</label>
                            <input required type="number" step="0.01" className="w-full px-4 py-3 bg-transparent border border-fondo-borde rounded-xl text-white outline-none focus:ring-2 focus:ring-mostaza" value={formData.monto} onChange={e => setFormData({...formData, monto: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Fecha</label>
                            <input required type="date" className="w-full px-4 py-3 bg-transparent border border-fondo-borde rounded-xl text-white outline-none focus:ring-2 focus:ring-mostaza" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} />
                        </div>
                    </div>
                    <div className="pt-6 flex gap-3">
                        <button type="button" onClick={() => setModal({ show: false, editingGasto: null })} className="flex-1 py-3 text-gray-400 font-bold">Cancelar</button>
                        <button type="submit" className="flex-1 py-3 bg-mostaza text-black font-black rounded-xl hover:bg-mostaza-hover transition-colors">Guardar Gasto</button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
      )}

      {/* Modal Borrado */}
      {deleteModal.show && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setDeleteModal({ show: false, id: null, desc: '' })}></div>
            <div className="bg-fondo-tarjeta border border-fondo-borde rounded-3xl p-8 max-w-sm text-center">
                <h3 className="text-xl font-bold text-white mb-2">¿Eliminar registro?</h3>
                <p className="text-gray-400 text-sm mb-6">Vas a eliminar el gasto de <strong className="text-white">"{deleteModal.desc}"</strong>.</p>
                <div className="flex gap-3">
                    <button onClick={() => setDeleteModal({ show: false, id: null, desc: '' })} className="flex-1 py-3 text-gray-400 font-bold">No, cancelar</button>
                    <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors">Sí, eliminar</button>
                </div>
            </div>
        </div>,
        document.body
      )}

      {/* Toasts */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-2xl shadow-2xl text-white z-50 flex items-center gap-3 animate-in slide-in-from-right-10 ${toast.type === 'success' ? 'bg-fondo-tarjeta border border-mostaza' : 'bg-fondo-tarjeta border border-red-500'}`}>
            <span className="font-bold">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

function FinanzasModule({ exportToPDF }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5105';

  useEffect(() => {
    fetchData();
  }, [year]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/finanzas/resumen-anual?year=${year}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const totalIngresos = data.reduce((acc, curr) => acc + curr.ingresos, 0);
  const totalGastos = data.reduce((acc, curr) => acc + curr.gastos, 0);
  const balanceTotal = totalIngresos - totalGastos;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-fondo-tarjeta border border-fondo-borde p-4 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-white font-bold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm flex justify-between gap-4" style={{ color: entry.color }}>
              <span>{entry.name}:</span>
              <span className="font-mono">{entry.value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-mostaza/20 border-t-mostaza rounded-full animate-spin"></div>
        <span className="text-sm font-medium text-gray-400 animate-pulse">Generando reporte anual...</span>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Finanzas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h3 className="text-xl font-bold text-white">Análisis de Rendimiento</h3>
            <p className="text-sm text-gray-400">Comparativa de ingresos y gastos operativos</p>
        </div>
        <div className="flex items-center gap-3">
            <select 
                className="bg-fondo-tarjeta border border-fondo-borde text-white px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-mostaza"
                value={year}
                onChange={e => setYear(parseInt(e.target.value))}
            >
                {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button 
                onClick={exportToPDF}
                className="bg-mostaza/10 text-mostaza border border-mostaza/20 hover:bg-mostaza/20 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                PDF
            </button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-fondo-tarjeta border border-fondo-borde p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg className="w-16 h-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className="text-gray-400 text-xs font-bold uppercase">Ingresos Totales</span>
            <div className="text-2xl font-black text-white mt-1">{totalIngresos.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
            <div className="text-xs text-green-500 mt-1">Facturación anual acumulada</div>
        </div>
        <div className="bg-fondo-tarjeta border border-fondo-borde p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg className="w-16 h-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className="text-gray-400 text-xs font-bold uppercase">Gastos Totales</span>
            <div className="text-2xl font-black text-white mt-1">{totalGastos.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
            <div className="text-xs text-red-500 mt-1">Incluye nóminas y gastos fijos</div>
        </div>
        <div className={`border p-6 rounded-3xl relative overflow-hidden group ${balanceTotal >= 0 ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
            <span className="text-gray-400 text-xs font-bold uppercase">Balance Neto</span>
            <div className={`text-2xl font-black mt-1 ${balanceTotal >= 0 ? 'text-green-500' : 'text-red-500'}`}>{balanceTotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
            <div className="text-xs text-gray-500 mt-1">{balanceTotal >= 0 ? 'Rentabilidad positiva' : 'Pérdida neta acumulada'}</div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Income vs Expenses Chart */}
        <div className="bg-fondo-tarjeta border border-fondo-borde p-6 rounded-3xl shadow-xl">
            <h4 className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-wider">Comparativa Mensual</h4>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                        <Legend iconType="circle" />
                        <Bar dataKey="ingresos" name="Ingresos" fill="#eab308" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} opacity={0.6} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Profit Trend Chart */}
        <div className="bg-fondo-tarjeta border border-fondo-borde p-6 rounded-3xl shadow-xl">
            <h4 className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-wider">Tendencia de Beneficios</h4>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="balance" name="Balance Neto" stroke="#eab308" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="bg-fondo-tarjeta rounded-3xl border border-fondo-borde overflow-hidden shadow-sm">
        <div className="p-6 border-b border-fondo-borde flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Desglose Detallado</h3>
            <span className="text-xs text-gray-500 italic">Valores expresados en EUR</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-fondo/80 text-gray-400 text-xs font-bold uppercase">
                    <tr>
                        <th className="px-6 py-4">Mes</th>
                        <th className="px-6 py-4">Ingresos</th>
                        <th className="px-6 py-4">Gastos</th>
                        <th className="px-6 py-4">Balance</th>
                        <th className="px-6 py-4">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-fondo-borde">
                    {data.map((m, i) => (
                        <tr key={i} className="hover:bg-fondo/40 transition-colors">
                            <td className="px-6 py-4 font-bold text-white">{m.mes}</td>
                            <td className="px-6 py-4 text-gray-300">{m.ingresos.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                            <td className="px-6 py-4 text-gray-300">{m.gastos.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                            <td className={`px-6 py-4 font-black ${m.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {m.balance.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                            </td>
                            <td className="px-6 py-4">
                                {m.balance >= 0 ? (
                                    <span className="flex items-center gap-1.5 text-green-500 text-xs font-bold uppercase">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                        Ganancia
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-red-500 text-xs font-bold uppercase">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                        Pérdida
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
