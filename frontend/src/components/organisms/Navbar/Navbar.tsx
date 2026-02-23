import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_LINKS } from '../../../data/navigation';
import { LogoutButton } from '../../molecules/LogoutBtn';
// Importa tus iconos si tienes, o usa los de svg que tenías

export const Navbar = () => {
    const [initial, setInitial] = useState("U");
    const [name, setName] = useState("");
    const location = useLocation(); // Para saber en qué ruta estamos y marcarla activa

    useEffect(() => {
        const username = localStorage.getItem('username');
        if (username) {
            setInitial(username.charAt(0).toUpperCase());
            setName(username);
        }
    }, []);

    return (
        // El Sidebar fijo a la izquierda
        <aside className="fixed top-0 left-0 w-64 h-screen bg-white text-black flex flex-col shadow-xl">
            
            {/* Cabecera del Sidebar (Logo/Nombre del Sistema) */}
            <div className="h-16 flex items-center justify-center border-b border-slate-700">
                <span className="text-xl font-bold text-black-400">Mi Sistema POS</span>
            </div>

            {/* Perfil de Usuario */}
            <div className="p-4 flex items-center gap-3 border-b border-gray-700">
                <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-black font-bold shadow-md">
                    {initial}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium">Bienvenido</span>
                    <span className="text-xs text-black-400">{name}</span>
                </div>
            </div>

            {/* Lista de Módulos */}
            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="flex flex-col gap-2 px-2">
                    {NAV_LINKS.map((link) => {
                        const isActive = location.pathname === link.path;
                        return (
                            <li key={link.path}>
                                <Link
                                    to={link.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                        isActive 
                                        ? 'bg-indigo-500 text-white' // Estilo activo
                                        : 'text-black-300 hover:bg-slate-500 hover:text-white' // Estilo inactivo
                                    }`}
                                >
                                    {/* Aquí podrías agregar un icono dependiendo del label */}
                                    <span className="font-medium">{link.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Pie del Sidebar (Logout) */}
            <div className="p-4 border-t border-slate-700 flex justify-center">
                <LogoutButton />
            </div>
        </aside>
    );
};