import { type Categoria } from '../../../domain/models/Categoria';
import { EditButton } from '../../atoms/Button/EditButton';
import { DeleteButton } from '../../atoms/Button/DeleteButton';

interface Props {
    data: Categoria[];
    onDelete: (id: number) => void;
    onEdit: (cat: Categoria) => void;
}

export const CategoriaTable = ({ data, onDelete, onEdit }: Props) => {

    if (data.length === 0) {
        return (
            <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500">No hay categorías registradas.</p>
            </div>
        );
    }

    return (
        <div className="bg-[#ffffff] rounded-sm shadow-[0_4px_24px_0_rgba(0,0,0,0.06)] overflow-hidden ">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-300">
                    <thead className="bg-[#ffffff]">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Descripción</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-slate-50' divide-y divide-slate-300">
                        {data.map((cat) => (
                            <tr key={cat.id} className="hover:bg-slate-100 transition-colors">
                                
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {cat.nombre}
                                </td>

                                <td className='px-6 py-4 text-sm text-gray-600 truncate max-w-xs'>
                                    {cat.descripcion || <span className="text-gray-400 italic">Sin descripción</span>}
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${cat.activo 
                                            ? 'bg-green-100 text-green-800 border border-green-400' 
                                            : 'bg-red-100 text-red-800'}`
                                    }>
                                        {cat.activo ? 'Activa' : 'Inactiva'}
                                    </span>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <EditButton className='bg-yellow-100 text-yellow-700 hover:bg-yellow-200 m-1 border border-transparent' onClick={() => (onEdit(cat))}/>
                                    <DeleteButton className='bg-red-50 text-red-600 hover:bg-red-100 border border-transparent ' onClick={() => cat.id && onDelete(cat.id)} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};