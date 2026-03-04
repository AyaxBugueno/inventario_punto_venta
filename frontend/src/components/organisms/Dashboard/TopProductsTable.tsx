import { type TopProducto } from '../../../domain/models/Dashboard';

interface Props {
    data: TopProducto[];
}

export const TopProductsTable = ({ data }: Props) => {
    const formatCLP = (value: number) => 
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);

    return (
        <div className=" bg-[#ffffff] p-6 rounded-sm shadow-[0_4px_24px_0_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="p-5 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-700">Top 5 Productos Más Vendidos</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr>
                            <th className="px-6 py-3">Producto</th>
                            <th className="px-6 py-3 text-center">Cant. Vendida</th>
                            <th className="px-6 py-3 text-right">Ingreso Generado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.length === 0 && (
                            <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400">Aún no hay ventas para mostrar.</td></tr>
                        )}
                        {data.map((prod, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-800">{prod.nombre}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md font-bold">
                                        {prod.cantidad_vendida}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-semibold text-emerald-600">
                                    {formatCLP(prod.ingreso_generado)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};