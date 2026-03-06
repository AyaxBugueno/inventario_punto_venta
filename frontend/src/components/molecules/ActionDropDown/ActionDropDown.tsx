// src/components/molecules/Dropdown/ActionDropdown.tsx
import { useState, useRef, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

export interface DropdownAction {
    label: string;
    icon: ReactNode;
    onClick: () => void;
    danger?: boolean;
}

interface Props {
    actions: DropdownAction[];
}

export const ActionDropdown = ({ actions }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0, isDropUp: false });

    // Efecto para cerrar el menú si se hace clic afuera o se hace scroll
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        // Si el usuario hace scroll en la tabla o página, cerramos el menú para que no flote
        const handleScroll = () => setIsOpen(false);

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // capture: true asegura que detecte el scroll de cualquier contenedor (como la tabla)
            window.addEventListener('scroll', handleScroll, { capture: true }); 
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, { capture: true });
        };
    }, [isOpen]);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation(); // Evita que el clic afecte otras filas
        
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            
            // Lógica inteligente: ¿Hay espacio abajo? (160px es el alto aprox del menú)
            const spaceBelow = window.innerHeight - rect.bottom;
            const isDropUp = spaceBelow < 160;

            setPosition({
                top: isDropUp ? rect.top - 8 : rect.bottom + 8,
                left: rect.right, // Alineamos a la derecha del botón
                isDropUp
            });
        }
        setIsOpen(!isOpen);
    };

    return (
        <>
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Opciones"
            >
                <MoreVertical size={18} />
            </button>

            {/* Inyectamos el menú directamente en el <body> usando createPortal */}
            {isOpen && createPortal(
                <div 
                    ref={dropdownRef}
                    style={{ 
                        position: 'fixed', 
                        top: position.top, 
                        left: position.left,
                        // Trasladamos -100% en X para que el borde derecho del menú coincida con el botón
                        // Trasladamos -100% en Y si es DropUp para que se dibuje hacia arriba
                        transform: position.isDropUp ? 'translate(-100%, -100%)' : 'translate(-100%, 0)',
                        zIndex: 99999 // Asegura que esté por encima de modales y navbars
                    }}
                    className={`w-40 bg-white rounded-lg shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-100 animate-in fade-in zoom-in-95 duration-100 ${position.isDropUp ? 'origin-bottom-right' : 'origin-top-right'}`}
                >
                    <div className="py-1">
                        {actions.map((action, index) => (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    action.onClick();
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${
                                    action.danger 
                                        ? 'text-rose-600 hover:bg-rose-50' 
                                        : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
                                }`}
                            >
                                {action.icon}
                                <span className="font-medium">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};