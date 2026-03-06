// src/components/organisms/ProductoTable.tsx
import { type Producto } from '../../../domain/models/Producto';
import { ActionDropdown } from '../../molecules/ActionDropDown/ActionDropDown';
import { FileText, Edit, Trash2, ArrowUpDown } from 'lucide-react'; // Añadimos ArrowUpDown para el ajuste

interface Props {
    data: Producto[];
    onDelete: (id: number) => void;
    onEdit: (prod: Producto) => void;
    onViewKardex: (prod: Producto) => void;
    onAjustarStock: (prod: Producto) => void; // <-- Nueva prop para el modal de stock
}

export const ProductoTable = ({ data, onDelete, onEdit, onViewKardex, onAjustarStock }: Props) => {

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
        <div className="bg-[#ffffff] rounded-sm shadow-[0_4px_24px_0_rgba(0,0,0,0.06)]">
            <div className="overflow-x-auto overflow-y-visible"> 
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
                            const isStockCritico = prod.stock_actual <= prod.stock_critico;
                            
                            return (
                            <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600">
                                    {prod.codigo_serie}
                                </td>

                                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800'>
                                    {prod.nombre}
                                </td>
                                
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
                                    <div className="flex items-center justify-end gap-2">
                                        
                                        {/* ACCIÓN PRIMARIA 1: Ajustar Stock */}
                                        <button 
                                            onClick={() => onAjustarStock(prod)}
                                            title="Cargar o descontar stock"
                                            className="bg-amber-50 text-amber-600 hover:bg-amber-100 px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 transition-colors font-semibold text-xs"
                                        >
                                            <ArrowUpDown size={14} />
                                            <span>Ajustar</span>
                                        </button>

                                        {/* ACCIÓN PRIMARIA 2: Ver Kardex */}
                                        <button 
                                            onClick={() => onViewKardex(prod)}
                                            title="Ver historial de Kardex"
                                            className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 transition-colors font-semibold text-xs"
                                        >
                                            <FileText size={14} />
                                            <span>Kardex</span>
                                        </button>

                                        {/* ACCIONES SECUNDARIAS: Dropdown Menu (Solo Editar y Eliminar) */}
                                        <div className="ml-1 border-l border-slate-200 pl-1">
                                            <ActionDropdown 
                                                actions={[
                                                    {
                                                        label: 'Editar producto',
                                                        icon: <Edit size={14} />,
                                                        onClick: () => onEdit(prod)
                                                    },
                                                    {
                                                        label: 'Eliminar',
                                                        icon: <Trash2 size={14} />,
                                                        onClick: () => prod.id && onDelete(prod.id),
                                                        danger: true
                                                    }
                                                ]}
                                            />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
        </div>
    );
};