import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Cartas() {
    const navigate = useNavigate();

    const menuOptions = [
        { title: 'Carta de Comida', subtitle: 'Versión en Español', link: '/Cartas/CartaComidaAlcala.pdf', icon: '🍽️' },
        { title: 'Food Menu', subtitle: 'English Version', link: '/Cartas/CartaComidaAlcala_EN.pdf', icon: '🍽️' },
        { title: 'Carta de Bebidas', subtitle: 'Versión en Español', link: '/Cartas/CartaBebidasAlcala.pdf', icon: '🍷' },
        { title: 'Drinks Menu', subtitle: 'English Version', link: '/Cartas/CartaBebidasAlcala_EN.pdf', icon: '🍷' },
    ];

    return (
        <div className="min-h-screen relative flex flex-col font-sans p-6 md:p-12 items-center justify-center overflow-hidden">
            {/* Fondo fotográfico con overlay oscuro */}
            <div 
                className="absolute inset-0 z-0 bg-cover bg-center bg-fixed" 
                style={{ backgroundImage: "url('/images/catrina.jpg')" }}
            ></div>
            <div className="absolute inset-0 z-0 bg-black/80 backdrop-blur-sm"></div>

            {/* Contenido principal sobre el fondo */}
            <div className="max-w-4xl w-full relative z-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-mostaza/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-mostaza/5 rounded-full blur-[80px] pointer-events-none -z-10"></div>


                <div className="text-center mb-12 animate-fade-in-up">
                    <img src="/images/logo.jpg" alt="Logo" className="w-24 h-24 mx-auto rounded-full shadow-lg border-2 border-fondo-borde mb-6" />
                    <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">Nuestra Carta Digital</h1>
                    <p className="text-gray-400 text-lg">Selecciona la carta y el idioma que deseas descargar o visualizar.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    {menuOptions.map((opt, idx) => (
                        <a 
                            key={idx}
                            href={opt.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-fondo-tarjeta border border-fondo-borde p-8 rounded-3xl hover:border-mostaza hover:bg-fondo/80 hover:-translate-y-1 transition-all duration-300 group flex items-center justify-between shadow-xl"
                        >
                            <div>
                                <h2 className="text-2xl font-bold text-white group-hover:text-mostaza transition-colors mb-1">{opt.title}</h2>
                                <p className="text-gray-400 font-medium">{opt.subtitle}</p>
                            </div>
                            <div className="text-4xl bg-fondo-borde/40 w-16 h-16 flex items-center justify-center rounded-full group-hover:scale-110 transition-transform shadow-inner">
                                {opt.icon}
                            </div>
                        </a>
                    ))}
                </div>

                <div className="mt-16 text-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <button 
                        onClick={() => navigate('/inicio')} 
                        className="flex items-center justify-center mx-auto transition-all p-4 bg-black/60 backdrop-blur-md rounded-full border border-fondo-borde hover:bg-mostaza hover:border-mostaza shadow-lg group hover:scale-110 active:scale-95"
                        title="Volver a la Bienvenida"
                    >
                        <svg className="w-8 h-8 text-mostaza group-hover:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
