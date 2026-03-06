import React, { useEffect, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import { type MovimientoKardex } from '../../../domain/models/Kardex';
import { kardexService } from '../../../services/kardex.service';
import { useSoftLoading } from '../../../hooks/softLoading/useSoftLoading';
import { SmartFilter, type FilterConfig } from '../SmartFilter/SmartFilter';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    productoId: number | null;
    productoNombre: string;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export const KardexModal = ({ isOpen, onClose, productoId, productoNombre }: Props) => {
    const [movimientos, setMovimientos] = useState<MovimientoKardex[]>([]);
    const [isInitialLoad, setIsInitialLoad] = useState(false);
    const { isSoftLoading: isPaginating, startLoading, stopLoading } = useSoftLoading(300);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const ITEMS_PER_PAGE = 10;

    const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});

    // Solo dejamos los filtros de fecha como pediste
    const filterConfig: FilterConfig[] = useMemo(() => [
        { key: 'fecha_desde', label: 'Desde', type: 'date' },
        { key: 'fecha_hasta', label: 'Hasta', type: 'date' }
    ], []);

    useEffect(() => {
        if (isOpen && productoId) {
            setCurrentPage(1);
            setCurrentFilters({});
            setMovimientos([]);
            cargarKardex(productoId, 1, {}, true);
        }
    }, [isOpen, productoId]);

    const cargarKardex = async (id: number, page: number, filtros: Record<string, any>, isInitial: boolean = false) => {
        if (isInitial) {
            setIsInitialLoad(true);
        } else {
            startLoading();
        }

        try {
            const payload = {
                producto: id,
                page,
                ...filtros
            };

            const responseData = await kardexService.obtenerHistorial(payload);
            const data = responseData as unknown as PaginatedResponse<MovimientoKardex>;

            if (data.results) {
                setMovimientos(data.results);
                setTotalItems(data.count);
                setTotalPages(Math.ceil(data.count / ITEMS_PER_PAGE));
            } else {
                const rawData = responseData as unknown as MovimientoKardex[];
                setMovimientos(Array.isArray(rawData) ? rawData : []);
                setTotalPages(1);
                setTotalItems(Array.isArray(rawData) ? rawData.length : 0);
            }
        } catch (error) {
            console.error("Error cargando Kardex", error);
        } finally {
            setIsInitialLoad(false);
            stopLoading();
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
        setCurrentPage(newPage);
        cargarKardex(productoId!, newPage, currentFilters, false);
    };

    const handleFilterChange = (newFilters: Record<string, any>) => {
        setCurrentFilters(newFilters);
        setCurrentPage(1);
        cargarKardex(productoId!, 1, newFilters, false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* 👇 1. Cambiamos max-h-[90vh] a max-h-[95vh] para darle más altura base */}
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200">

                {/* 1. HEADER (Fijo) */}
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-8 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight leading-none">Kardex de Movimientos</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5">{productoNombre}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-slate-200 text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 2. FILTROS (Fijo) */}
                <div className="px-6 pt-6 bg-slate-50/30 border-b border-slate-100 shrink-0">
                    <SmartFilter
                        config={filterConfig}
                        onFilterChange={handleFilterChange}
                    />
                </div>

                {/* 3. TABLA (Flexible con Scroll) */}
                {/* 👇 2. Cambiamos min-h-[400px] a min-h-[350px] para que no aplaste al paginador */}
                <div className="flex-1 overflow-y-auto bg-white p-6 relative min-h-[350px]">
                    {isInitialLoad ? (
                        <div className="flex flex-col justify-center items-center h-full gap-3">
                            <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
                            <span className="text-sm text-slate-400 font-medium">Cargando catálogo...</span>
                        </div>
                    ) : movimientos.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-xl">
                            <p className="text-slate-400 font-medium">
                                {Object.keys(currentFilters).length > 0
                                    ? "No se encontraron movimientos en este rango de fechas."
                                    : "No hay movimientos registrados para este producto."}
                            </p>
                        </div>
                    ) : (
                        <div className="relative rounded-xl border border-slate-100 overflow-hidden h-full">

                            {isPaginating && (
                                <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center transition-all duration-200">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin shadow-[0_0_15px_rgba(79,70,229,0.3)]"></div>
                                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest bg-white/80 px-2 py-1 rounded">Actualizando...</span>
                                    </div>
                                </div>
                            )}

                            <table className={`w-full text-left border-collapse ${isPaginating ? 'pointer-events-none' : ''}`}>
                                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-200 sticky top-0 z-20">
                                    <tr>
                                        <th className="py-3 px-4">Fecha</th>
                                        <th className="py-3 px-4">Tipo</th>
                                        <th className="py-3 px-4">Cant.</th>
                                        <th className="py-3 px-4">Saldo</th>
                                        <th className="py-3 px-4">Usuario</th>
                                        <th className="py-3 px-4">Motivo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {movimientos.map((mov) => (
                                        <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="py-3 px-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                                                {new Date(mov.fecha).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>

                                            {/* COLUMNA TIPO CON TAMAÑO FIJO Y UNIFICADO */}
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div className="flex justify-start">
                                                    <span className="inline-flex items-center justify-center w-36 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-700 text-white border border-slate-800 shadow-sm">
                                                        <span className="mr-2 opacity-50">•</span>
                                                        {mov.tipo_movimiento.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="py-3 px-4 text-sm font-bold text-slate-700">
                                                {mov.tipo_movimiento.includes('ENTRADA') || mov.tipo_movimiento.includes('POSITIVO') || mov.tipo_movimiento.includes('DEVOLUCION') ? '+' : '-'}{mov.cantidad}
                                            </td>

                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs text-slate-400 line-through">{mov.stock_anterior}</span>
                                                    <span className="text-[10px] text-slate-300">→</span>
                                                    <span className="text-sm font-black text-indigo-600">{mov.stock_nuevo}</span>
                                                </div>
                                            </td>

                                            <td className="py-3 px-4 text-xs font-semibold text-slate-600">
                                                <span className="bg-slate-100 px-2 py-1 rounded-md">
                                                    {mov.usuario_nombre || 'Sistema'}
                                                </span>
                                            </td>

                                            <td className="py-3 px-4 text-xs text-slate-500 italic max-w-[200px] truncate" title={mov.motivo}>
                                                {mov.motivo}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* 4. PAGINACIÓN (Fija al fondo) */}
                {!isInitialLoad && totalPages > 1 && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-4 flex items-center justify-between shrink-0">
                        <span className="text-xs text-slate-500 font-medium">
                            Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} de {totalItems} registros
                        </span>

                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => handlePageChange(currentPage - 5)}
                                disabled={currentPage <= 1 || isPaginating}
                                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronsLeft size={16} />
                            </button>

                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1 || isPaginating}
                                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            <span className="px-3 py-1.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-md min-w-[70px] text-center">
                                {currentPage} / {totalPages}
                            </span>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages || isPaginating}
                                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={16} />
                            </button>

                            <button
                                onClick={() => handlePageChange(currentPage + 5)}
                                disabled={currentPage >= totalPages || isPaginating}
                                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronsRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};