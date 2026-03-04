import { useState, useRef, useEffect } from 'react';

interface Option {
    id: string | number;
    label: string;
}

interface CustomSelectProps {
    value: any;
    onChange: (value: any) => void;
    options?: Option[];
    placeholder?: string;
}

export const CustomSelect = ({ value, onChange, options = [], placeholder = "Todos" }: CustomSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Lógica de calidad: Cerrar el menú si el usuario hace clic fuera del componente
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Buscar el label de la opción seleccionada
    const selectedOption = options.find(opt => opt.id.toString() === value?.toString());

    return (
        <div className="relative w-full" ref={ref}>
            {/* 1. El "Input" visible (Mantiene tu diseño hundido) */}
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-slate-50 border border-slate-200 p-2 pl-3 rounded-lg text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] flex justify-between items-center cursor-pointer text-slate-700 focus:ring-2 focus:ring-emerald-100 transition-all select-none"
            >
                <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                <svg 
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </div>

            {/* 2. La lista desplegable (AQUÍ CONTROLAS EL HOVER) */}
            {isOpen && (
                <ul className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                    
                    {/* Opción por defecto (Limpiar) */}
                    <li 
                        onClick={() => { onChange(""); setIsOpen(false); }}
                        className="px-3 py-2.5 text-sm text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors border-b border-slate-50"
                    >
                        {placeholder}
                    </li>

                    {/* Mapeo de tus opciones */}
                    {options.map((opt) => (
                        <li 
                            key={opt.id}
                            onClick={() => { onChange(opt.id); setIsOpen(false); }}
                            className={`px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                                value?.toString() === opt.id.toString()
                                ? 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-500' // Estilo si está seleccionado
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900' // <-- AQUÍ ESTÁ TU HOVER SLATE
                            }`}
                        >
                            {opt.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};