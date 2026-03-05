// src/components/organisms/Dashboard/VentasDetallePanel.tsx
import { useState } from 'react';
import { 
    ChevronDown, 
    ReceiptText, 
    Banknote, 
    CreditCard, 
    Landmark,
    CheckCircle2,
    XCircle,
    Eye,
    ChevronLeft,
    ChevronRight,
    X
} from 'lucide-react';
import { type Venta } from '../../../domain/models/Venta'; // Ajusta la ruta a tu dominio

interface Props {
    ventas: Venta[];
    loading?: boolean;
}

export const VentasDetallePanel = ({ ventas, loading = false }: Props) => {
    // 1. Estados del Acordeón y Paginación Principal
    const [isOpen, setIsOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // 2. Estados del Modal y Paginación Secundaria
    const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);
    const [modalCurrentPage, setModalCurrentPage] = useState(1);
    const MODAL_ITEMS_PER_PAGE = 5;

    // --- Funciones de Formateo ---
    const formatCLP = (value: number) => 
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);

    const formatHora = (fechaString: string) => {
        return new Date(fechaString).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    };

    const getMetodoPagoIcon = (metodo: string) => {
        switch (metodo) {
            case 'EFECTIVO': return <Banknote size={16} className="text-emerald-500" />;
            case 'DEBITO': 
            case 'CREDITO': return <CreditCard size={16} className="text-blue-500" />;
            case 'TRANSFERENCIA': return <Landmark size={16} className="text-indigo-500" />;
            default: return <Banknote size={16} className="text-slate-400" />;
        }
    };

    // --- Lógica de Paginación Principal ---
    const totalPages = Math.ceil(ventas.length / ITEMS_PER_PAGE);
    const currentVentas = ventas.slice(
        (currentPage - 1) * ITEMS_PER_PAGE, 
        currentPage * ITEMS_PER_PAGE
    );

    // --- Lógica de Paginación Modal ---
    const detallesVenta = selectedVenta?.detalles || [];
    const totalModalPages = Math.ceil(detallesVenta.length / MODAL_ITEMS_PER_PAGE);
    const currentDetalles = detallesVenta.slice(
        (modalCurrentPage - 1) * MODAL_ITEMS_PER_PAGE,
        modalCurrentPage * MODAL_ITEMS_PER_PAGE
    );

    const openModal = (venta: Venta) => {
        setSelectedVenta(venta);
        setModalCurrentPage(1); // Resetear a la página 1 al abrir
    };

    const closeModal = () => {
        setSelectedVenta(null);
    };

    return (
        <div className="mt-8 mb-4">
            {/* Botón / Barra Colapsable */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white p-5 rounded-xl shadow-[0_4px_24px_0_rgba(0,0,0,0.06)] border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300 group"
            >
                <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-lg transition-colors ${isOpen ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-500 group-hover:bg-indigo-100'}`}>
                        <ReceiptText size={24} />
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-bold text-slate-800 leading-none">Desglose de Transacciones</h3>
                        <p className="text-sm text-slate-500 mt-1">Ver el detalle de las {ventas.length} ventas realizadas</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-400 group-hover:text-indigo-500 transition-colors">
                        {isOpen ? 'Ocultar detalle' : 'Abrir detalle'}
                    </span>
                    <div className={`p-2 rounded-full bg-slate-50 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-indigo-50 text-indigo-500' : ''}`}>
                        <ChevronDown size={20} />
                    </div>
                </div>
            </button>

            {/* Contenido Expandible (Tabla Principal Paginada) */}
            {isOpen && (
                <div className="mt-4 bg-white rounded-xl shadow-[0_4px_24px_0_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 font-bold tracking-wider border-b border-slate-100">
                                <tr>
                                    <th className="p-4 pl-6">Folio / Hora</th>
                                    <th className="p-4">Vendedor</th>
                                    <th className="p-4">Método de Pago</th>
                                    <th className="p-4 text-center">Artículos</th>
                                    <th className="p-4 text-right">Total</th>
                                    <th className="p-4 text-center">Estado</th>
                                    <th className="p-4 pr-6 text-center">Detalle</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-slate-400 animate-pulse font-medium">Cargando transacciones...</td></tr>
                                ) : ventas.length === 0 ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-slate-400 font-medium">No hay transacciones registradas.</td></tr>
                                ) : (
                                    currentVentas.map((venta) => (
                                        <tr key={venta.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="p-4 pl-6">
                                                <p className="font-mono text-sm font-bold text-slate-700">#{venta.id.substring(0, 8).toUpperCase()}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{formatHora(venta.fecha)}</p>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                                                    {venta.vendedor_nombre}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                                    {getMetodoPagoIcon(venta.metodo_pago)}
                                                    <span className="capitalize">{venta.metodo_pago.toLowerCase()}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="text-sm font-bold text-slate-500">{venta.detalles?.length || 0}</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className={`text-base font-black ${venta.anulada ? 'text-slate-400 line-through' : 'text-emerald-600'}`}>
                                                    {formatCLP(venta.total)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {venta.anulada ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-600 border border-red-100">
                                                        <XCircle size={12} /> Anulada
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                        <CheckCircle2 size={12} /> Completada
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 pr-6 text-center">
                                                <button 
                                                    onClick={() => openModal(venta)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    title="Ver productos"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Controles de Paginación Principal */}
                    {!loading && totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                            <span className="text-xs text-slate-500 font-medium">
                                Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, ventas.length)} de {ventas.length} transacciones
                            </span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="px-3 py-1.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-md">
                                    {currentPage} / {totalPages}
                                </span>
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 👇 MODAL DE DETALLE DE VENTA 👇 */}
            {selectedVenta && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Cabecera del Modal */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Boleta #{selectedVenta.id.substring(0, 8).toUpperCase()}</h3>
                                <p className="text-xs text-slate-500 font-medium mt-1">
                                    Atendido por {selectedVenta.vendedor_nombre} a las {formatHora(selectedVenta.fecha)}
                                </p>
                            </div>
                            <button 
                                onClick={closeModal}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Cuerpo del Modal (Tabla de Detalles) */}
                        <div className="p-5 overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                                        <th className="pb-3 w-12 text-center">Cant.</th>
                                        <th className="pb-3">Producto</th>
                                        <th className="pb-3 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {currentDetalles.map((det) => (
                                        <tr key={det.id} className="text-sm">
                                            <td className="py-3 text-center">
                                                <span className="font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded">
                                                    {det.cantidad}x
                                                </span>
                                            </td>
                                            <td className="py-3 font-medium text-slate-700">
                                                {det.nombre_producto}
                                                <div className="text-[10px] text-slate-400 mt-0.5">Precio unitario: {formatCLP(det.precio_unitario)}</div>
                                            </td>
                                            <td className="py-3 text-right font-bold text-slate-800">
                                                {formatCLP(det.subtotal)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer del Modal: Paginación y Totales */}
                        <div className="border-t border-slate-100 bg-slate-50 p-5 mt-auto">
                            {/* Paginación Interna (Solo si hay más de 5 productos) */}
                            {totalModalPages > 1 && (
                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                                    <span className="text-xs text-slate-500 font-medium">Pág. {modalCurrentPage} de {totalModalPages}</span>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setModalCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={modalCurrentPage === 1}
                                            className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeft size={14} />
                                        </button>
                                        <button 
                                            onClick={() => setModalCurrentPage(prev => Math.min(prev + 1, totalModalPages))}
                                            disabled={modalCurrentPage === totalModalPages}
                                            className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Boleta</span>
                                <span className="text-2xl font-black text-indigo-600">{formatCLP(selectedVenta.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};