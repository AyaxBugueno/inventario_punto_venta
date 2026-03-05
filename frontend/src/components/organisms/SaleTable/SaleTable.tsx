// src/components/organisms/SaleTable.tsx
import { type CartItem } from "../../../domain/models/Venta";
import { Trash2, ShoppingBag } from "lucide-react"; // <-- Asegúrate de tener lucide-react

interface Props {
    items: CartItem[];
    onRemove: (index: number) => void;
}

export const SaleTable = ({ items, onRemove }: Props) => {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-white border border-slate-200 border-dashed rounded-xl h-full min-h-[400px]">
                <ShoppingBag size={48} strokeWidth={1} className="mb-4 text-slate-300" />
                <p className="text-lg font-medium text-slate-500">El carrito está vacío</p>
                <p className="text-sm">Escanea un producto para comenzar la venta.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-[0_4px_24px_0_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden flex flex-col h-full">
            <div className="overflow-y-auto flex-grow">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 font-bold tracking-wider sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-4 pl-6">Producto</th>
                            <th className="p-4 text-center">Cant.</th>
                            <th className="p-4 text-right">Precio U.</th>
                            <th className="p-4 text-right">Subtotal</th>
                            <th className="p-4 w-14"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.map((item, index) => (
                            <tr key={`${item.producto.id}-${index}`} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="p-4 pl-6">
                                    <p className="font-bold text-slate-800 text-sm">{item.producto.nombre}</p>
                                    <p className="text-xs text-slate-400 font-mono mt-0.5">{item.producto.codigo_serie}</p>
                                </td>
                                <td className="p-4 text-center">
                                    <span className="bg-white border border-slate-200 shadow-sm px-3 py-1 rounded-md font-bold text-slate-700 text-sm inline-block min-w-[2.5rem]">
                                        {item.cantidad}
                                    </span>
                                </td>
                                <td className="p-4 text-right text-slate-500 text-sm">
                                    ${item.precio_congelado.toLocaleString()}
                                </td>
                                <td className="p-4 text-right font-black text-emerald-600 text-base">
                                    ${item.subtotal.toLocaleString()}
                                </td>
                                <td className="p-4 text-center pr-6">
                                    <button
                                        onClick={() => onRemove(index)}
                                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all opacity-50 group-hover:opacity-100"
                                        title="Quitar producto"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};