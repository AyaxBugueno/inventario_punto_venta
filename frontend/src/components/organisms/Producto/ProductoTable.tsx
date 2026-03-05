import { type Producto } from '../../../domain/models/Producto';
import { EditButton } from '../../atoms/Button/EditButton';
import { DeleteButton } from '../../atoms/Button/DeleteButton';

interface Props {
    data: Producto[];
    onDelete: (id: number) => void;
    onEdit: (prod: Producto) => void;
    onViewKardex: (prod: Producto) => void; // <-- Nueva prop para abrir el Kardex
}

export const ProductoTable = ({ data, onDelete, onEdit, onViewKardex }: Props) => {

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price);
    };

    if (data.length === 0) {
        return (
            <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
                <p className="text-slate-500">No hay productos registrados en el inventario.</p>
            </div>
        );
    }

    return (
        <div className="bg-[#ffffff] rounded-sm shadow-[0_4px_24px_0_rgba(0,0,0,0.06)] overflow-hidden ">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-300">
                    <thead className="bg-[#ffffff]">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">SKU / Código</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Producto</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Stock</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Precio</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-[#ffffff] divide-y divide-slate-300">
                        {data.map((prod) => {
                            // Lógica visual para stock crítico
                            const isStockCritico = prod.stock_actual <= prod.stock_critico;
                            
                            return (
                            <tr key={prod.id} className="hover:bg-slate-100 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600">
                                    {prod.codigo_serie}
                                </td>

                                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800'>
                                    {prod.nombre}
                                </td>
                                
                                {/* COLUMNA DE STOCK */}
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold">
                                    <span className={isStockCritico ? 'text-red-600' : 'text-slate-700'}>
                                        {prod.stock_actual}
                                    </span>
                                </td>
                    
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-semibold">
                                    {formatPrice(prod.precio_venta)}
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${prod.activo 
                                            ? 'bg-green-100 text-green-800 border border-green-400' 
                                            : 'bg-red-100 text-red-800 border border-red-200'}`
                                    }>
                                        {prod.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {/* NUEVO: Botón de Kardex */}
                                    <button 
                                        onClick={() => onViewKardex(prod)}
                                        title="Ver historial de movimientos"
                                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 m-1 border border-transparent p-1.5 rounded-md inline-flex items-center justify-center transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                    </button>

                                    <EditButton className='bg-yellow-100 text-yellow-700 hover:bg-yellow-200 m-1 border border-transparent' onClick={() => (onEdit(prod))}/>
                                    <DeleteButton className='bg-red-50 text-red-600 hover:bg-red-100 border border-transparent' onClick={() => prod.id && onDelete(prod.id)} />
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
        </div>
    );
};