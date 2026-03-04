import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { type VentaPorHora } from '../../../domain/models/Dashboard';

interface Props {
    data: VentaPorHora[];
}

export const SalesChart = ({ data }: Props) => {
    const formatCLP = (value: number) => 
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);

    if (data.length === 0) {
        return <div className="h-64 flex items-center justify-center text-slate-400">No hay ventas registradas hoy.</div>;
    }

    return (
        <div className=" bg-[#ffffff] p-6 rounded-sm shadow-[0_4px_24px_0_rgba(0,0,0,0.06)]">
            <h3 className="text-lg font-bold text-slate-700 mb-4">Ingresos por Hora</h3>
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="hora" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                        <YAxis tickFormatter={(val) => `$${val/1000}k`} axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                        <Tooltip 
                            formatter={(value: number) => [formatCLP(value), 'Ingresos']}
                            labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                            cursor={{fill: '#f1f5f9'}}
                        />
                        <Bar dataKey="ingresos" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};