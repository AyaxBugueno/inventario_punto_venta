// src/components/organisms/SaleTable.tsx
import { type CartItem } from "../../../domain/models/Venta";

interface Props {
    items: CartItem[];
    onRemove: (index: number) => void;
}

export const SaleTable = ({ items, onRemove }: Props) => {
    if (items.length === 0) {
        return <div className="p-8 text-center text-gray-400 border-2 border-dashed rounded">
            El carrito de ventas está vacío. Escanea un producto para comenzar.
        </div>
    }

    return (
        <div className="bg-white rounded shadow-sm overflow-hidden border border-gray-200">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold">
                    <tr>
                        <th className="p-3">Producto</th>
                        <th className="p-3 text-center">Cant.</th>
                        <th className="p-3 text-right">Precio U.</th>
                        <th className="p-3 text-right">Subtotal</th>
                        <th className="p-3 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {items.map((item, index) => (
                        // En el map de ítems dentro de SaleTable.tsx
                        <tr key={`${item.producto.id}-${index}`} className="hover:bg-indigo-50 transition-colors">
                            <td className="p-3">
                                <p className="font-bold text-slate-800">{item.producto.nombre}</p>
                                <p className="text-xs text-slate-500 font-mono">{item.producto.codigo_serie}</p>
                            </td>
                            <td className="p-3 text-center">
                                <span className="bg-slate-100 px-3 py-1 rounded-full font-bold text-slate-700">
                                    {item.cantidad}
                                </span>
                            </td>
                            <td className="p-3 text-right text-slate-600">${item.precio_congelado.toLocaleString()}</td>
                            <td className="p-3 text-right font-black text-indigo-600">
                                ${item.subtotal.toLocaleString()}
                            </td>
                            <td className="p-3 text-center">
                                <button
                                    onClick={() => onRemove(index)}
                                    className="text-red-400 hover:text-red-600 transition-colors p-2"
                                    title="Quitar producto"
                                >
                                    <span className="text-xl">×</span>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


