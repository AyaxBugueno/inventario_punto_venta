import { MainTemplate } from '../components/templates/MainTemplate';
import { useDashboard } from '../hooks/Dashboard/useDashboard';
import { StatCard } from '../components/molecules/StatCard';
import { SalesChart } from '../components/organisms/Dashboard/SalesChart';
import { TopProductsTable } from '../components/organisms/Dashboard/TopProductsTable';
import { DollarSign, ReceiptText, TrendingUp, RefreshCcw } from 'lucide-react';

const DashboardPage = () => {
    const { data, loading, error, refetch } = useDashboard();

    const formatCLP = (value: number) => 
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);

    if (loading) {
        return (
            <MainTemplate>
                <div className="flex h-64 items-center justify-center animate-pulse text-slate-500">
                    Cargando métricas del día...
                </div>
            </MainTemplate>
        );
    }

    if (error || !data) {
        return (
            <MainTemplate>
                <div className="bg-red-50 text-red-600 p-6 rounded-lg border border-red-200">
                    {error || "No se pudieron cargar los datos."}
                </div>
            </MainTemplate>
        );
    }

    return (
        <MainTemplate>
            <div className="max-w-7xl mx-auto p-2">
                
                {/* Cabecera */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Resumen del Día</h1>
                        <p className="text-slate-500">Datos actualizados al {data.fecha_reporte}</p>
                    </div>
                    <button 
                        onClick={refetch}
                        className="flex items-center gap-2 bg-white border border-slate-300 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition shadow-sm"
                    >
                        <RefreshCcw size={16} /> Actualizar
                    </button>
                </div>

                {/* Tarjetas de Resumen */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard 
                        title="Ingresos Totales" 
                        value={formatCLP(data.resumen.ingresos_totales)} 
                        icon={<DollarSign size={24} />} 
                        subtitle="Ventas concretadas hoy"
                    />
                    <StatCard 
                        title="Boletas Emitidas" 
                        value={data.resumen.cantidad_boletas} 
                        icon={<ReceiptText size={24} />} 
                    />
                    <StatCard 
                        title="Ticket Promedio" 
                        value={formatCLP(data.resumen.ticket_promedio)} 
                        icon={<TrendingUp size={24} />} 
                        subtitle="Gasto promedio por cliente"
                    />
                </div>

                {/* Gráficos y Tablas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <SalesChart data={data.ventas_por_hora} />
                    </div>
                    <div className="lg:col-span-1">
                        <TopProductsTable data={data.top_productos} />
                    </div>
                </div>

            </div>
        </MainTemplate>
    );
};

export default DashboardPage;