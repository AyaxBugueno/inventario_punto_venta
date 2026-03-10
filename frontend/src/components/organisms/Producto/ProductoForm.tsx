import { useState, useEffect, type FormEvent } from 'react';
import { type Producto, type Categoria } from '../../../domain/models/Producto';
import axios from 'axios';

interface Props {
    onSubmit: (producto: Producto) => Promise<void | any>;
    initialData?: Producto | null;
    onCancel?: () => void;
    categorias: Categoria[]; // 👈 NUEVO: Recibimos las categorías desde la página principal
}

export const ProductoForm = ({ onSubmit, initialData, onCancel, categorias }: Props) => {

    const initialState: Producto = {
        nombre: '',
        descripcion: '',
        codigo_serie: '',
        precio_venta: 0,
        stock_actual: 0,
        stock_critico: 5,
        activo: true,
        categoria_id: '',
    };

    const [form, setForm] = useState<Producto>(initialState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    // 🔥 MAGIA AQUÍ: Cuando llega la data para editar, nos aseguramos de atrapar el ID 
    // sin importar si Django lo mandó como 'categoria_id' o 'categoria'.
    useEffect(() => {
        if (initialData) {
            setForm({
                ...initialData,
                // Usamos as any temporalmente por si tu interfaz Producto no tiene 'categoria' definida
                categoria_id: initialData.categoria_id || (initialData as any).categoria || '',
            });
        } else {
            setForm(initialState);
        }
        setErrors({});
    }, [initialData]);

    const handleChange = (field: keyof Producto, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrors({}); 
        setIsSubmitting(true);

        if (!form.categoria_id) {
            setErrors(prev => ({ ...prev, categoria_id: ['Debes seleccionar una categoría'] }));
            setIsSubmitting(false);
            return;
        }

        const productoParaEnviar: Producto = {
            ...form,
            id: initialData?.id, 
        };

        try {
            await onSubmit(productoParaEnviar);
            if (!initialData) setForm(initialState);
            if (onCancel) onCancel(); 
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 400) {
                setErrors(error.response.data); 
            } else {
                alert("Ocurrió un error inesperado al guardar el producto.");
                console.error(error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = (fieldName: string) => `
        w-full border p-2 rounded focus:ring-2 outline-none transition-colors
        ${errors[fieldName] 
            ? 'border-red-500 ring-red-200 focus:ring-red-500' 
            : 'border-gray-300 focus:ring-indigo-500'
        }
    `;

    return (
        <div className="bg-slate-50 p-6 rounded-sm mb-6">
            <h2 className="text-xl font-semibold mb-4 text-slate-800 border-b pb-2">
                {initialData ? 'Editar Producto' : 'Registrar Nuevo Producto'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {errors.non_field_errors && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                        {errors.non_field_errors[0]}
                    </div>
                )}

                {/* FILA 1: Categoría */}
                <div className="grid grid-cols-1 gap-4">
                    <div> 
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Categoría *</label>
                        <select
                            className={inputClass('categoria_id')}
                            value={form.categoria_id || ''} // 👈 Fallback a '' para evitar undefined
                            onChange={e => handleChange('categoria_id', Number(e.target.value))}
                            required
                        >
                            <option value="">Selecciona una categoría...</option>
                            {categorias.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.nombre}
                                </option>
                            ))}
                        </select>
                        {errors.categoria_id && (
                            <span className="text-red-500 text-xs font-bold mt-1 block">
                                {errors.categoria_id[0]}
                            </span>
                        )}
                    </div>
                </div>

                {/* FILA 2: Nombre y SKU */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                        <input
                            className={inputClass('nombre')}
                            placeholder="Ej: Red Bull 250ml"
                            value={form.nombre}
                            onChange={e => handleChange('nombre', e.target.value)}
                            required
                        />
                        {errors.nombre && <span className="text-red-500 text-xs font-bold mt-1 block">{errors.nombre[0]}</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">SKU / Código Barra *</label>
                        <input
                            className={inputClass('codigo_serie')}
                            placeholder="Ej: 78000123"
                            value={form.codigo_serie}
                            onChange={e => handleChange('codigo_serie', e.target.value)}
                            required
                        />
                         {errors.codigo_serie && <span className="text-red-500 text-xs font-bold mt-1 block">{errors.codigo_serie[0]}</span>}
                    </div>
                </div>

                {/* FILA 3: Precio y Stock */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Precio Venta *</label>
                        <input
                            type="number"
                            min="0"
                            className={inputClass('precio_venta')}
                            value={form.precio_venta === 0 ? '' : form.precio_venta}
                            onChange={e => handleChange('precio_venta', Number(e.target.value))}
                            required
                        />
                        {errors.precio_venta && <span className="text-red-500 text-xs font-bold mt-1 block">{errors.precio_venta[0]}</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Stock Inicial *</label>
                        <input
                            type="number"
                            min="0"
                            className={inputClass('stock_actual')}
                            value={form.stock_actual === 0 ? '' : form.stock_actual}
                            onChange={e => handleChange('stock_actual', Number(e.target.value))}
                            required
                        />
                         {errors.stock_actual && <span className="text-red-500 text-xs font-bold mt-1 block">{errors.stock_actual[0]}</span>}
                    </div>
                </div>

                {/* FILA 4: Alerta Stock y Descripción */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Alerta Stock Bajo (Crítico)</label>
                        <input
                            type="number"
                            min="0"
                            className={inputClass('stock_critico')}
                            value={form.stock_critico}
                            onChange={e => handleChange('stock_critico', Number(e.target.value))}
                        />
                        <span className="text-xs text-slate-500">Avisar cuando queden esta cantidad o menos.</span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Descripción (Opcional)</label>
                        <textarea
                            className={inputClass('descripcion')}
                            rows={2}
                            value={form.descripcion}
                            onChange={e => handleChange('descripcion', e.target.value)}
                        />
                    </div>
                </div>

                {/* CHECKBOX ACTIVO */}
                <div className="flex gap-6 items-center py-2 border-t mt-4 pt-4">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 select-none">
                        <input
                            type="checkbox"
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                            checked={form.activo}
                            onChange={e => handleChange('activo', e.target.checked)}
                        />
                        <span className="font-medium">Producto Activo para la Venta</span>
                    </label>
                </div>

                {/* BOTONES */}
                <div className="flex gap-3 justify-end mt-4">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={() => { setForm(initialState); setErrors({}); onCancel(); }}
                            className="px-4 py-2 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`px-6 py-2 rounded font-medium text-white transition shadow-sm
                            ${isSubmitting ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-700'}
                        `}
                    >
                        {isSubmitting ? 'Guardando...' : (initialData ? 'Actualizar Producto' : 'Guardar Producto')}
                    </button>
                </div>
            </form>
        </div>
    );
};