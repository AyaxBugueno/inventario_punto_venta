import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
// Asegúrate de que las rutas a tus imports sean correctas
import { NAV_LINKS } from '../../../data/navigation';
import { LogoutButton } from '../../molecules/LogoutBtn';

export const Navbar = () => {
    const [initial, setInitial] = useState("U");
    const [name, setName] = useState("");
    const location = useLocation();

    useEffect(() => {
        const username = localStorage.getItem('username');
        if (username) {
            setInitial(username.charAt(0).toUpperCase());
            setName(username);
        }
    }, []);

    // Calculamos el índice activo para que la caja "hundida" sepa a dónde deslizarse
    const activeIndex = NAV_LINKS.findIndex(link => location.pathname === link.path);

    return (
        // 👇 CAMBIO PRINCIPAL: top-0, left-0, h-screen, sin bordes redondeados y sombra lateral
        <aside className="fixed top-0 left-0 h-screen w-64 bg-[#ffffff] text-slate-700 flex flex-col border-r border-slate-200 shadow-[4px_0_24px_0_rgba(0,0,0,0.05)] z-50">
            
            {/* Cabecera del Sidebar */}
            <div className="h-20 flex items-center justify-center border-b border-slate-100 shrink-0">
                <span className="text-xl font-extrabold text-slate-800 tracking-tight">
                    jade <span className="text-emerald-500">POS</span>
                </span>
            </div>

            {/* Perfil de Usuario - Estilo Barra Alargada (Pill) */}
            <div className="px-4 py-5 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-1.5 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] w-full">
                    {/* Avatar circular flotando dentro de la barra hundida */}
                    <div className="w-10 h-10 shrink-0 rounded-full bg-white shadow-sm flex items-center justify-center text-emerald-600 font-bold text-sm">
                        {initial}
                    </div>
                    {/* Textos con truncate por si el nombre es muy largo */}
                    <div className="flex flex-col pr-3 overflow-hidden">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Bienvenido</span>
                        <span className="text-sm text-slate-800 font-bold leading-none truncate">{name || 'Usuario'}</span>
                    </div>
                </div>
            </div>

            {/* Lista de Módulos */}
            <nav className="flex-1 overflow-y-auto py-6">
                {/* ul relativo para contener la animación absoluta */}
                <ul className="relative flex flex-col gap-2 px-3">
                    
                    {/* LA MAGIA: Caja de fondo hundido que se desliza */}
                    {activeIndex >= 0 && (
                        <div 
                            className="absolute left-3 right-3 h-12 bg-slate-100 rounded-xl shadow-[inset_0_3px_8px_rgba(0,0,0,0.07),inset_0_1px_3px_rgba(0,0,0,0.04)] border border-slate-200/60 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-0"
                            style={{ 
                                // Cada 'li' mide 48px (h-12) + 8px de gap (gap-2) = 56px de salto exacto
                                transform: `translateY(${activeIndex * 56}px)` 
                            }}
                        />
                    )}

                    {NAV_LINKS.map((link) => {
                        const isActive = location.pathname === link.path;
                        const Icon = link.icon;

                        return (
                            // z-10 para que el texto y clic queden por encima de la caja animada
                            <li key={link.path} className="relative z-10 h-12">
                                <Link
                                    to={link.path}
                                    className={`flex items-center gap-3 px-4 h-full rounded-xl transition-colors duration-200 ${
                                        isActive 
                                        ? 'text-emerald-700 font-bold' 
                                        : 'text-slate-500 font-medium hover:text-emerald-600 hover:bg-slate-50 hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]' 
                                    }`}
                                >
                                    {Icon && <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />}
                                    <span>{link.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Pie del Sidebar */}
            <div className="p-4 border-t border-slate-100 flex justify-center pb-6 shrink-0">
                <LogoutButton/>
            </div>
        </aside>
    );
};