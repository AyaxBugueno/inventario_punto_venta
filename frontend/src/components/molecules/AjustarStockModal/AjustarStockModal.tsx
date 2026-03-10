// src/components/molecules/Modal/AjusteStockModal.tsx
import React, { useState, useEffect } from 'react';
import { X, ArrowDownCircle, ArrowUpCircle, Package, AlertCircle, Save } from 'lucide-react';
import { type Producto } from '../../../domain/models/Producto';
import { productoService } from '../../../services/producto.service'; // Ajusta tu ruta
import { useProductStore } from '../../../store/useProductStore'; // <-- NUEVO

interface Props {
    isOpen: boolean;
    onClose: () => void;
    producto: Producto | null;
    onSuccess: () => void; // Para recargar la tabla después de guardar
}

export const AjusteStockModal = ({ isOpen, onClose, producto, onSuccess }: Props) => {
    const [tipoAjuste, setTipoAjuste] = useState<'CARGA' | 'DESCUENTO'>('CARGA');
    const [cantidad, setCantidad] = useState<number | ''>('');
    const [motivo, setMotivo] = useState<string>('Carga manual de stock');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { upsertProduct } = useProductStore();

    // Opciones predefinidas para cuando es Descuento
    const opcionesDescuento = [
        "Merma (Vencimiento o Daño)",
        "Pérdida (Robo o Extravío)",
        "Consumo Interno",
        "Ajuste de Inventario (Cuadratura)",
        "Otro"
    ];

    // Resetear el formulario cuando se abre el modal o cambia el tipo
    useEffect(() => {
        if (isOpen) {
            setCantidad('');
            setError(null);
            setTipoAjuste('CARGA');
            setMotivo('Carga manual de stock');
        }
    }, [isOpen, producto]);

    useEffect(() => {
        if (tipoAjuste === 'CARGA') {
            setMotivo('Carga manual de stock');
        } else {
            setMotivo(opcionesDescuento[0]); // Seleccionar el primero por defecto
        }
    }, [tipoAjuste]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!producto || !cantidad || cantidad <= 0) {
            setError('La cantidad debe ser mayor a 0');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Capturamos el producto devuelto por Django con el stock ya calculado
            const productoConNuevoStock = await productoService.ajustarStock(producto.id!, {
                tipo_ajuste: tipoAjuste,
                cantidad: Number(cantidad),
                motivo: motivo
            });
            
            // 2. 🔥 Sincronizamos la memoria del POS para que el cajero vea el stock real
            upsertProduct(productoConNuevoStock);

            onSuccess(); // Recarga la tabla
            onClose();   // Cierra el modal
        } catch (err: any) {
            setError(err.response?.data?.error || 'Ocurrió un error al ajustar el stock.');
        } finally {
            setLoading(false);
        }
    };

    // Cálculos para UX visual
    const numCantidad = Number(cantidad) || 0;
    const stockActual = producto?.stock_actual || 0; // Asegúrate de que tu modelo usa stock_actual o stock
    const stockProyectado = tipoAjuste === 'CARGA' ? stockActual + numCantidad : stockActual - numCantidad;
    const isPeligroRojo = stockProyectado < 0;

    if (!isOpen || !producto) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Gestionar Stock</h2>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 truncate max-w-[250px]">
                            {producto.codigo_serie} • {producto.nombre}
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        disabled={loading}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Formulario Body */}
                <form onSubmit={handleSubmit} className="p-6">
                    
                    {/* Switch / Toggle Visual */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <button
                            type="button"
                            onClick={() => setTipoAjuste('CARGA')}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                                tipoAjuste === 'CARGA' 
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' 
                                    : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                            }`}
                        >
                            <ArrowUpCircle size={24} className="mb-1" />
                            <span className="text-sm font-bold">Cargar Stock</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setTipoAjuste('DESCUENTO')}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                                tipoAjuste === 'DESCUENTO' 
                                    ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm' 
                                    : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                            }`}
                        >
                            <ArrowDownCircle size={24} className="mb-1" />
                            <span className="text-sm font-bold">Descontar Stock</span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Input de Cantidad */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                Unidades a {tipoAjuste === 'CARGA' ? 'sumar' : 'restar'}
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Package size={18} className={tipoAjuste === 'CARGA' ? 'text-emerald-500' : 'text-rose-500'} />
                                </div>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    required
                                    value={cantidad}
                                    onChange={(e) => setCantidad(e.target.value ? Number(e.target.value) : '')}
                                    className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                    placeholder="Ej: 5"
                                />
                            </div>
                        </div>

                        {/* Input/Select de Motivo */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                Motivo del Movimiento
                            </label>
                            {tipoAjuste === 'CARGA' ? (
                                <input
                                    type="text"
                                    readOnly
                                    value={motivo}
                                    className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 font-medium cursor-not-allowed"
                                />
                            ) : (
                                <select
                                    value={motivo}
                                    onChange={(e) => setMotivo(e.target.value)}
                                    className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors cursor-pointer"
                                >
                                    {opcionesDescuento.map(op => (
                                        <option key={op} value={op}>{op}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Previsualización del Impacto (UX Brutal) */}
                    <div className={`mt-6 p-4 rounded-lg flex items-center justify-between border ${isPeligroRojo ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Stock Actual</p>
                            <p className="text-lg font-bold text-slate-700">{stockActual}</p>
                        </div>
                        <div className="text-slate-300 font-bold">→</div>
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Proyección</p>
                            <p className={`text-xl font-black ${isPeligroRojo ? 'text-red-600' : (tipoAjuste === 'CARGA' ? 'text-emerald-600' : 'text-rose-600')}`}>
                                {stockProyectado}
                            </p>
                        </div>
                    </div>

                    {/* Mensaje de Error */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-600 text-sm font-medium">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Botones de Acción */}
                    <div className="mt-6 pt-4 border-t border-slate-100 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || isPeligroRojo || !cantidad}
                            className={`flex-1 px-4 py-2.5 font-bold rounded-lg flex justify-center items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                tipoAjuste === 'CARGA' 
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-[0_4px_14px_0_rgba(16,185,129,0.39)]' 
                                    : 'bg-rose-600 text-white hover:bg-rose-700 shadow-[0_4px_14px_0_rgba(225,29,72,0.39)]'
                            }`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={18} />
                                    <span>Confirmar</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};