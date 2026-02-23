import { type Producto } from '../../../domain/models/Producto';
import { EditButton } from '../../atoms/Button/EditButton';
import { DeleteButton } from '../../atoms/Button/DeleteButton';

interface Props {
    data: Producto[];
    onDelete: (id: number) => void;
    onEdit: (prod: Producto) => void;
}

export const ProductoTable = ({ data, onDelete, onEdit }: Props) => {

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
        <div className="bg-white rounded-sm shadow-sm overflow-hidden border border-slate-200">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">SKU / Código</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Producto</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Stock</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Precio</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {data.map((prod) => {
                            // Lógica visual para stock crítico
                            const isStockCritico = prod.stock_actual <= prod.stock_critico;
                            
                            return (
                            <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600">
                                    {prod.codigo_serie}
                                </td>

                                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800'>
                                    {prod.nombre}
                                </td>
                                
                                {/* NUEVA COLUMNA DE STOCK */}
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
                                            ? 'bg-green-100 text-green-800 border border-green-200' 
                                            : 'bg-red-100 text-red-800 border border-red-200'}`
                                    }>
                                        {prod.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <EditButton className='bg-indigo-100 text-indigo-700 hover:bg-indigo-200 m-1 border border-transparent' onClick={() => (onEdit(prod))}/>
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