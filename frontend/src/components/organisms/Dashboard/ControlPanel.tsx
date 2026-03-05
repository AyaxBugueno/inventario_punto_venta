// src/components/organisms/Dashboard/CajaControlPanel.tsx
import { useState } from 'react';
import { Lock, Unlock, Play, Square, AlertCircle } from 'lucide-react';
import { type SesionCaja } from '../../../domain/models/Caja';

interface Props {
    cajaActiva: SesionCaja | null;
    loading: boolean;
    error: string | null;
    onAbrir: (monto: number) => Promise<boolean>;
    onCerrar: () => Promise<boolean>;
}

export const CajaControlPanel = ({ cajaActiva, loading, error, onAbrir, onCerrar }: Props) => {
    const [montoInicial, setMontoInicial] = useState<number>(0);

    const handleAbrir = async () => {
        const exito = await onAbrir(montoInicial);
        if (exito) setMontoInicial(0);
    };

    const handleCerrar = async () => {
        if (window.confirm('¿Estás seguro de que deseas cerrar la caja del día?')) {
            await onCerrar();
        }
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-sm shadow-[0_4px_24px_0_rgba(0,0,0,0.06)] animate-pulse flex items-center justify-center h-24 mb-6">
                <span className="text-slate-500 font-medium">Sincronizando estado de la caja...</span>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-sm shadow-[0_4px_24px_0_rgba(0,0,0,0.06)] mb-8">
            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md flex items-center gap-2 text-sm border border-red-100">
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            {!cajaActiva ? (
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
                            <label className="text-xs text-slate-500 mb-1 font-medium">Monto Inicial</label>
                            <input 
                                type="number" 
                                value={montoInicial}
                                onChange={(e) => setMontoInicial(Number(e.target.value))}
                                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 w-32"
                            />
                        </div>
                        <button 
                            onClick={handleAbrir}
                            className="mt-5 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition shadow-sm"
                        >
                            <Play size={18} /> Abrir Caja
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full relative">
                            <Unlock size={28} />
                            <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-ping"></span>
                            <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Caja Abierta y Operativa</h3>
                            <p className="text-sm text-slate-500">
                                Abierta: {new Date(cajaActiva.fecha_apertura).toLocaleString('es-CL')} | 
                                Fondo: ${cajaActiva.monto_inicial}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={handleCerrar}
                        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-sm w-full md:w-auto justify-center"
                    >
                        <Square size={18} /> Cerrar Caja
                    </button>
                </div>
            )}
        </div>
    );
};