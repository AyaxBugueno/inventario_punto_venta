// src/pages/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainTemplate } from '../components/templates/MainTemplate';
import { useDashboard } from '../hooks/Dashboard/useDashboard';
import { useCaja } from '../hooks/Caja/useCaja'; 
import { StatCard } from '../components/molecules/StatCard';
import { SalesChart } from '../components/organisms/Dashboard/SalesChart';
import { TopProductsTable } from '../components/organisms/Dashboard/TopProductsTable';
import { CajaControlPanel } from '../components/organisms/Dashboard/ControlPanel'; 
import { DollarSign, ReceiptText, TrendingUp, RefreshCcw, AlertCircle } from 'lucide-react';
import { VentasDetallePanel } from '../components/organisms/Dashboard/VentasDetallePanel'; 

import { type Venta } from '../domain/models/Venta';
import { ventaService } from '../services/venta.service';

const DashboardPage = () => {
    // 1. Manejo de URL y Estado de la Caja (NUEVO: Extraemos funciones y error)
    const [searchParams] = useSearchParams();
    const urlSesionId = searchParams.get('sesion_id');
    const { cajaActiva, loading: loadingCaja, error: errorCaja, abrirCaja, cerrarCaja } = useCaja();

    // 🧠 LA LÓGICA CORE: ¿A quién miramos?
    // Prioridad 1: Historial de la URL. Prioridad 2: Caja abierta actual. Prioridad 3: Nada (null).
    const targetSesionId = urlSesionId || (cajaActiva ? cajaActiva.id.toString() : null);
    const isHistorialMode = !!urlSesionId;

    // 2. Pasamos el ID exacto a tu hook modificado
    const { data, loading: loadingDash, error, refetch } = useDashboard(targetSesionId);

    // 3. Tabla de Desglose
    const [ventasList, setVentasList] = useState<Venta[]>([]);
    const [loadingVentas, setLoadingVentas] = useState(false);

    const formatCLP = (value: number) => 
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);

    // 4. Efecto de la tabla sincronizado EXACTAMENTE con la sesión activa o histórica
    useEffect(() => {
        if (!targetSesionId) {
            setVentasList([]); // Limpiamos tabla si no hay sesión
            return;
        }

        const fetchDetalleVentas = async () => {
            setLoadingVentas(true);
            try {
                const response = await ventaService.getAll({ sesion: targetSesionId });
                const resultados = response.results ? response.results : response;
                setVentasList(resultados);
            } catch (err) {
                console.error("Error al cargar ventas:", err);
            } finally {
                setLoadingVentas(false);
            }
        };

        fetchDetalleVentas();
        
        // Cleanup al cambiar de pestaña
        return () => setVentasList([]);
    }, [targetSesionId]);

    // Pantalla de carga unificada
    const isLoading = loadingCaja || (targetSesionId && loadingDash);

    if (isLoading) {
        return (
            <MainTemplate>
                <div className="flex h-64 items-center justify-center animate-pulse text-slate-500 font-medium">
                    Cargando información del panel...
                </div>
            </MainTemplate>
        );
    }

    return (
        <MainTemplate>
            <div className="max-w-7xl mx-auto p-2 md:p-6">
                
                {/* Cabecera */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">
                            {isHistorialMode ? 'Resumen de Turno Pasado' : 'Resumen del Día'}
                        </h1>
                        {data && (
                            <p className="text-slate-500 font-medium mt-1">
                                Datos al {data.fecha_reporte}
                            </p>
                        )}
                    </div>
                    {targetSesionId && (
                        <button 
                            onClick={refetch}
                            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm active:scale-95 font-medium"
                        >
                            <RefreshCcw size={16} /> Actualizar
                        </button>
                    )}
                </div>

                {/* 👇 PANEL SINCRONIZADO: Recibe props del padre 👇 */}
                {!isHistorialMode && (
                    <CajaControlPanel 
                        cajaActiva={cajaActiva}
                        loading={loadingCaja}
                        error={errorCaja}
                        onAbrir={abrirCaja}
                        onCerrar={cerrarCaja}
                    />
                )}

                {/* ESTADO VACÍO: CAJA CERRADA */}
                {!targetSesionId && !isHistorialMode && (
                    <div className="mt-8 bg-amber-50 border border-amber-200 p-10 rounded-xl text-center flex flex-col items-center justify-center shadow-sm">
                        <AlertCircle size={48} className="text-amber-400 mb-4" />
                        <h2 className="text-2xl font-bold text-amber-800 mb-2">Caja Cerrada</h2>
                        <p className="text-amber-700 font-medium">No hay información de ventas para mostrar. Utiliza el panel superior para abrir la caja y comenzar la jornada.</p>
                    </div>
                )}

                {/* ERROR DE RED */}
                {error && targetSesionId && (
                    <div className="mt-8 bg-red-50 text-red-600 p-6 rounded-lg border border-red-200 shadow-sm font-medium">
                        {error}
                    </div>
                )}

                {/* DASHBOARD CON DATOS (Solo se muestra si hay un targetSesionId válido) */}
                {data && targetSesionId && !error && (
                    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <StatCard 
                                title="Ingresos Totales" 
                                value={formatCLP(data.resumen.ingresos_totales)} 
                                icon={<DollarSign size={24} />} 
                            />
                            <StatCard 
                                title="Boletas Emitidas" 
                                value={data.resumen.cantidad_boletas.toString()} 
                                icon={<ReceiptText size={24} />} 
                            />
                            <StatCard 
                                title="Ticket Promedio" 
                                value={formatCLP(data.resumen.ticket_promedio)} 
                                icon={<TrendingUp size={24} />} 
                            />
                        </div>

                        {/* Mantenemos tu orden: Detalle primero, luego los gráficos */}
                        <VentasDetallePanel 
                            ventas={ventasList} 
                            loading={loadingVentas} 
                        />

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            <div className="lg:col-span-2">
                                <SalesChart data={data.ventas_por_hora} />
                            </div>
                            <div className="lg:col-span-1">
                                <TopProductsTable data={data.top_productos} />
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </MainTemplate>
    );
};

export default DashboardPage;