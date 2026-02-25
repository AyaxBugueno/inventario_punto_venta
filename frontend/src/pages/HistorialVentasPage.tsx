// src/pages/HistorialVentasPage.tsx
import { useNavigate } from 'react-router-dom';
import { MainTemplate } from '../components/templates/MainTemplate';
import { useHistorial } from '../hooks/Caja/useHistorial';
import { SmartFilter, type FilterConfig } from '../components/organisms/SmartFilter/SmartFilter';
import { Eye, Lock, Unlock } from 'lucide-react';

const HistorialVentasPage = () => {
    // 1. Agregamos currentPage y totalRecords a la desestructuración
    const { historial, loading, totalRecords, currentPage, fetchHistorial } = useHistorial();
    const navigate = useNavigate();

    const filterConfig: FilterConfig[] = [
        { key: 'fecha_desde', label: 'Desde', type: 'date' },
        { key: 'fecha_hasta', label: 'Hasta', type: 'date' },
    ];

    const handleFilterChange = (filters: Record<string, any>) => {
        // Al filtrar, siempre volvemos a la página 1
        fetchHistorial(1, filters);
    };

    const formatCLP = (value: number) =>
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '---';
        return new Date(dateString).toLocaleString('es-CL', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <MainTemplate>
            <div className="max-w-7xl mx-auto p-2">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-800">Historial de Ventas</h1>
                    <p className="text-slate-500">Consulta los turnos y sesiones de caja anteriores.</p>
                </div>

                <SmartFilter config={filterConfig} onFilterChange={handleFilterChange} />

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mt-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4">Apertura</th>
                                    <th className="px-6 py-4">Cierre</th>
                                    <th className="px-6 py-4">Usuario</th>
                                    <th className="px-6 py-4 text-right">Ingresos</th>
                                    <th className="px-6 py-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={6} className="text-center py-8">Cargando historial...</td></tr>
                                ) : historial.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-8 text-slate-400">No hay registros.</td></tr>
                                ) : (
                                    historial.map((caja) => (
                                        <tr key={caja.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                {caja.esta_abierta ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                        <Unlock size={12} /> Abierta
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                                        <Lock size={12} /> Cerrada
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-800">{formatDate(caja.fecha_apertura)}</td>
                                            <td className="px-6 py-4 text-slate-500">{formatDate(caja.fecha_cierre)}</td>
                                            <td className="px-6 py-4 font-medium">{caja.usuario_nombre || 'Sistema'}</td>
                                            <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                                {formatCLP(caja.total_ingresos || 0)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => navigate(`/ventas?sesion_id=${caja.id}`)}
                                                    className="inline-flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    <Eye size={16} /> Ver Dashboard
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINADOR (Ahora fuera de la tabla para que no se rompa el diseño) */}
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 sm:px-6">
                        <div className="flex-1 flex justify-between items-center">
                            <p className="text-sm text-slate-700">
                                Mostrando <span className="font-medium">{historial.length}</span> de{' '}
                                <span className="font-medium">{totalRecords}</span> resultados
                            </p>
                            <div className="flex gap-2">
                                <button
                                    disabled={currentPage === 1 || loading}
                                    onClick={() => fetchHistorial(currentPage - 1)}
                                    className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
                                >
                                    Anterior
                                </button>
                                <span className="flex items-center px-4 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-md">
                                    {currentPage}
                                </span>
                                <button
                                    disabled={currentPage * 10 >= totalRecords || loading}
                                    onClick={() => fetchHistorial(currentPage + 1)}
                                    className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainTemplate>
    );
};

export default HistorialVentasPage;