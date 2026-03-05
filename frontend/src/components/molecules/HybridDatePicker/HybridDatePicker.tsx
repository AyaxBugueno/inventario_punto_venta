import { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface HybridDatePickerProps {
    value: string; 
    onChange: (value: string) => void;
    placeholder?: string;
}

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const MESES = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];
const MESES_COMPLETOS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

type ViewMode = 'days' | 'months' | 'years';

export const HybridDatePicker = ({ value, onChange, placeholder = "Seleccionar fecha" }: HybridDatePickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Estado interno
    const [viewDate, setViewDate] = useState(value ? new Date(value + 'T00:00:00') : new Date());
    const [mode, setMode] = useState<ViewMode>('days'); // <-- NUEVO ESTADO PARA CONTROLAR LA VISTA

    // Cierra el popover si hacen clic afuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
                setTimeout(() => setMode('days'), 200); // Resetea la vista al cerrar
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (value) setViewDate(new Date(value + 'T00:00:00'));
        else setViewDate(new Date());
    }, [value]);

    // --------------------------------------------------------
    // LÓGICA DE NAVEGACIÓN (Flechas) DEPENDIENDO DEL MODO
    // --------------------------------------------------------
    const handlePrev = () => {
        if (mode === 'days') setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
        if (mode === 'months') setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1));
        if (mode === 'years') setViewDate(new Date(viewDate.getFullYear() - 10, viewDate.getMonth(), 1));
    };

    const handleNext = () => {
        if (mode === 'days') setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
        if (mode === 'months') setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1));
        if (mode === 'years') setViewDate(new Date(viewDate.getFullYear() + 10, viewDate.getMonth(), 1));
    };

    // --------------------------------------------------------
    // GENERACIÓN DE CUADRÍCULAS
    // --------------------------------------------------------
    const calendarDays = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        let firstDay = new Date(year, month, 1).getDay();
        firstDay = firstDay === 0 ? 6 : firstDay - 1; 

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        const days = [];

        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ day: daysInPrevMonth - i, isCurrentMonth: false, date: new Date(year, month - 1, daysInPrevMonth - i) });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
        }
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
        }
        return days;
    }, [viewDate]);

    // Calcular la década actual para la vista de años
    const currentYear = viewDate.getFullYear();
    const startYear = Math.floor(currentYear / 10) * 10;
    const yearsArray = Array.from({ length: 12 }, (_, i) => startYear - 1 + i); // Incluye 1 año antes y 1 después de la década

    // --------------------------------------------------------
    // HANDLERS DE SELECCIÓN
    // --------------------------------------------------------
    const handleSelectDate = (date: Date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        onChange(`${yyyy}-${mm}-${dd}`);
        setIsOpen(false);
        setMode('days');
    };

    const handleSelectMonth = (monthIndex: number) => {
        setViewDate(new Date(viewDate.getFullYear(), monthIndex, 1));
        setMode('days'); // Vuelve a la vista de días
    };

    const handleSelectYear = (year: number) => {
        setViewDate(new Date(year, viewDate.getMonth(), 1));
        setMode('months'); // Vuelve a la vista de meses
    };

    // --------------------------------------------------------
    // HELPERS VISUALES
    // --------------------------------------------------------
    const displayValue = value ? (() => {
        const d = new Date(value + 'T00:00:00');
        return `${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
    })() : placeholder;

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    };

    const isSelected = (date: Date) => {
        if (!value) return false;
        const selected = new Date(value + 'T00:00:00');
        return date.getDate() === selected.getDate() && date.getMonth() === selected.getMonth() && date.getFullYear() === selected.getFullYear();
    };

    return (
        <div className="relative w-full" ref={ref}>
            {/* Input Trigger */}
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-slate-50 border border-slate-200 p-2 pl-3 rounded-lg text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] flex justify-between items-center cursor-pointer focus:ring-2 focus:ring-emerald-100 transition-all select-none ${isOpen ? 'ring-2 ring-emerald-100 border-emerald-400' : ''}`}
            >
                <span className={`truncate ${!value ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                    {displayValue}
                </span>
                <Calendar size={16} className={`transition-colors ${isOpen || value ? 'text-emerald-500' : 'text-slate-400'}`} />
            </div>

            {/* Popover del Calendario */}
            {isOpen && (
                <div className="absolute z-50 mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden p-3 right-0 md:left-0 md:right-auto animate-in fade-in zoom-in-95 duration-200">
                    
                    {/* Controles de Cabecera Dinámicos */}
                    <div className="flex items-center justify-between mb-4 px-1">
                        <button onClick={handlePrev} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        
                        {/* LOS BOTONES CLICKEEABLES */}
                        <div className="flex gap-1">
                            {mode === 'days' && (
                                <>
                                    <button onClick={() => setMode('months')} className="text-sm font-bold text-slate-800 hover:bg-slate-100 px-2 py-1 rounded-md transition-colors">
                                        {MESES_COMPLETOS[viewDate.getMonth()]}
                                    </button>
                                    <button onClick={() => setMode('years')} className="text-sm font-bold text-slate-800 hover:bg-slate-100 px-2 py-1 rounded-md transition-colors">
                                        {viewDate.getFullYear()}
                                    </button>
                                </>
                            )}
                            {mode === 'months' && (
                                <button onClick={() => setMode('years')} className="text-sm font-bold text-slate-800 hover:bg-slate-100 px-2 py-1 rounded-md transition-colors">
                                    {viewDate.getFullYear()}
                                </button>
                            )}
                            {mode === 'years' && (
                                <span className="text-sm font-bold text-slate-800 px-2 py-1">
                                    {startYear} - {startYear + 9}
                                </span>
                            )}
                        </div>

                        <button onClick={handleNext} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* VISTA 1: DÍAS */}
                    {mode === 'days' && (
                        <div className="animate-in fade-in duration-200">
                            <div className="grid grid-cols-7 mb-2">
                                {DIAS_SEMANA.map(dia => (
                                    <div key={dia} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">{dia}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {calendarDays.map((item, idx) => {
                                    const isSelectedDate = isSelected(item.date);
                                    const isTodayDate = isToday(item.date);
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelectDate(item.date)}
                                            className={`
                                                h-8 w-full flex items-center justify-center rounded-md text-sm transition-all
                                                ${!item.isCurrentMonth ? 'text-slate-300 hover:text-slate-500' : 'text-slate-700'}
                                                ${!isSelectedDate && item.isCurrentMonth ? 'hover:bg-slate-100' : ''}
                                                ${isSelectedDate ? 'bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/30' : ''}
                                                ${isTodayDate && !isSelectedDate ? 'border border-emerald-500/50 text-emerald-600 font-bold bg-emerald-50/50' : ''}
                                            `}
                                        >
                                            {item.day}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* VISTA 2: MESES */}
                    {mode === 'months' && (
                        <div className="grid grid-cols-3 gap-2 animate-in fade-in zoom-in-95 duration-200 py-2">
                            {MESES.map((mes, idx) => (
                                <button
                                    key={mes}
                                    onClick={() => handleSelectMonth(idx)}
                                    className={`h-12 flex items-center justify-center rounded-lg text-sm font-medium transition-all hover:bg-emerald-50 hover:text-emerald-700 ${viewDate.getMonth() === idx ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-600 hover:text-white' : 'text-slate-700'}`}
                                >
                                    {mes}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* VISTA 3: AÑOS */}
                    {mode === 'years' && (
                        <div className="grid grid-cols-3 gap-2 animate-in fade-in zoom-in-95 duration-200 py-2">
                            {yearsArray.map((year) => (
                                <button
                                    key={year}
                                    onClick={() => handleSelectYear(year)}
                                    className={`h-12 flex items-center justify-center rounded-lg text-sm font-medium transition-all hover:bg-emerald-50 hover:text-emerald-700 
                                        ${year < startYear || year > startYear + 9 ? 'text-slate-300' : 'text-slate-700'}
                                        ${viewDate.getFullYear() === year ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-600 hover:text-white' : ''}
                                    `}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Botón de limpiar */}
                    {value && mode === 'days' && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                            <button 
                                onClick={() => { onChange(""); setIsOpen(false); }}
                                className="w-full py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                            >
                                Limpiar filtro
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};