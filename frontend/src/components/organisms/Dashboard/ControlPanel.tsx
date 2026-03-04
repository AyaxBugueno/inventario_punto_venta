// src/components/organisms/Dashboard/CajaControlPanel.tsx
import { useState } from 'react';
import { useCaja } from '../../../hooks/Caja/useCaja'; // Ajusta la ruta según tu estructura exacta
import { Lock, Unlock, Play, Square, AlertCircle } from 'lucide-react';

export const CajaControlPanel = () => {
    const { cajaActiva, loading, error, abrirCaja, cerrarCaja } = useCaja();
    const [montoInicial, setMontoInicial] = useState<number>(0);

    const handleAbrir = async () => {
        const exito = await abrirCaja(montoInicial);
        if (exito) {
            setMontoInicial(0); // Reseteamos el input si se abre correctamente
        }
    };

    const handleCerrar = async () => {
        // Confirmación de seguridad nativa del navegador
        if (window.confirm('¿Estás seguro de que deseas cerrar la caja del día? Esta acción detendrá las ventas.')) {
            await cerrarCaja();
        }
    };

    if (loading) {
        return (
            <div className=" bg-[#ffffff] p-6 rounded-sm shadow-[0_4px_24px_0_rgba(0,0,0,0.06)] animate-pulse flex items-center justify-center h-24 mb-6">
                <span className="text-slate-500 font-medium">Sincronizando estado de la caja...</span>
            </div>
        );
    }

    return (
        <div className=" bg-[#ffffff] p-6 rounded-sm shadow-[0_4px_24px_0_rgba(0,0,0,0.06)] mb-8">
            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md flex items-center gap-2 text-sm border border-red-100">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {!cajaActiva ? (
                // --- VISTA: CAJA CERRADA ---
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-red-500 text-white rounded-full">
                            <Lock size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Caja Cerrada</h3>
                            <p className="text-sm text-slate-500">Debes abrir la caja para comenzar a registrar ventas.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex flex-col">
                            <label className="text-xs text-slate-500 mb-1 font-medium">Monto Inicial (Sencillo)</label>
                            <input 
                                type="number" 
                                min="0"
                                value={montoInicial}
                                onChange={(e) => setMontoInicial(Number(e.target.value))}
                                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32"
                                placeholder="Ej: 15000"
                            />
                        </div>
                        <button 
                            onClick={handleAbrir}
                            className="mt-5 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition shadow-sm"
                        >
                            <Play size={18} />
                            Abrir Caja
                        </button>
                    </div>
                </div>
            ) : (
                // --- VISTA: CAJA ABIERTA ---
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full relative">
                            <Unlock size={28} />
                            {/* Un pequeño punto verde parpadeante para indicar que está activa */}
                            <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-ping"></span>
                            <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Caja Abierta y Operativa</h3>
                            <p className="text-sm text-slate-500">
                                Abierta el: {new Date(cajaActiva.fecha_apertura).toLocaleString('es-CL')} | 
                                Fondo inicial: ${cajaActiva.monto_inicial}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={handleCerrar}
                        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-sm w-full md:w-auto justify-center"
                    >
                        <Square size={18} />
                        Cerrar Caja
                    </button>
                </div>
            )}
        </div>
    );
};