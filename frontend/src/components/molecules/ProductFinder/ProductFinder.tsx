// src/components/molecules/ProductFinder.tsx
import { useState, useRef, useEffect } from 'react';
import { type Producto } from '../../../domain/models/Producto';
import { useProductStore } from '../../../store/useProductStore';
import { ScanLine, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
    onProductSelected: (prod: Producto, cantidad: number) => void;
}

export const ProductFinder = ({ onProductSelected }: Props) => {
    // Solo guardamos lo que el usuario digita y la cantidad
    const [query, setQuery] = useState('');
    const [qty, setQty] = useState(1);
    
    // Nos conectamos directo al Store Global
    const { buscarLocal, isLoading, cargarCatalogoLocal } = useProductStore();

    const inputRef = useRef<HTMLInputElement>(null);
    const qtyRef = useRef<HTMLInputElement>(null);

    // Cargamos el catálogo la primera vez que se abre el POS
    useEffect(() => {
        cargarCatalogoLocal();
        inputRef.current?.focus();
    }, [cargarCatalogoLocal]);

    // 🔥 ESTADO DERIVADO (La solución al Bug):
    // Como el diccionario es O(1), calculamos el resultado al instante en cada render.
    // Sin retrasos, sin useEffects, sin desincronizaciones.
    const coincidencias = query.trim().length >= 2 ? buscarLocal(query) : [];
    const stagedProduct = coincidencias.length > 0 ? coincidencias[0] : null;

    // 2. LA MAGIA: El manejador a prueba de velocidad
    const handleKeyDown = (e: React.KeyboardEvent, target: 'search' | 'qty') => {
        if (e.key === 'Enter') {
            e.preventDefault();

            if (target === 'search') {
                // BYPASS: Leemos el valor REAL e instantáneo del HTML, no el estado de React que podría venir desfasado
                const realValue = inputRef.current?.value.trim() || '';
                
                // Hacemos una búsqueda forzada con ese valor real
                const instantMatches = realValue.length >= 2 ? buscarLocal(realValue) : [];
                const instantProduct = instantMatches.length > 0 ? instantMatches[0] : null;

                if (instantProduct) {
                    setQuery(realValue); // Obligamos a React a actualizarse al valor real
                    qtyRef.current?.focus();
                    qtyRef.current?.select();
                }
            } 
            else if (target === 'qty') {
                // Recuperamos el producto ya sea del estado o forzando la búsqueda de nuevo
                const realValue = inputRef.current?.value.trim() || '';
                const instantMatches = realValue.length >= 2 ? buscarLocal(realValue) : [];
                const productToAdd = instantMatches.length > 0 ? instantMatches[0] : stagedProduct;

                if (productToAdd) {
                    // 1. Agregamos al carrito
                    onProductSelected(productToAdd, qty);
                    
                    // 2. LIMPIEZA EXTREMA: Vaciamos el DOM directamente para que no haya choques
                    if (inputRef.current) inputRef.current.value = '';
                    
                    // 3. Limpiamos el estado de React
                    setQuery('');
                    setQty(1);
                    
                    // 4. Devolvemos el foco listo para el siguiente disparo
                    inputRef.current?.focus();
                }
            }
        }
    };

    const baseInputStyles = "w-full bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:shadow-none outline-none transition-all text-slate-800 text-lg font-medium";

    // El error solo se muestra si escribiste 2+ letras, ya terminó de cargar, y el diccionario O(1) no encontró nada.
    const showError = !isLoading && query.trim().length >= 2 && !stagedProduct;

    return (
        <div className="bg-white p-6 rounded-xl shadow-[0_4px_24px_0_rgba(0,0,0,0.06)] border border-slate-100 mb-6">
            <div className="flex gap-4 items-end">
                {/* Input "Escáner" */}
                <div className="flex-grow relative">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                        <ScanLine size={14} className="text-emerald-500" />
                        Escanear o Buscar (F1)
                    </label>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => handleKeyDown(e, 'search')}
                        className={baseInputStyles}
                        placeholder="...esperando código"
                        autoComplete="off"
                    />
                </div>
                
                {/* Input Cantidad */}
                <div className="w-32 relative">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 text-center">
                        Cantidad
                    </label>
                    <input
                        ref={qtyRef}
                        type="number"
                        min={1}
                        value={qty}
                        onChange={e => setQty(Number(e.target.value))}
                        onKeyDown={e => handleKeyDown(e, 'qty')}
                        className={`${baseInputStyles} text-center ${!stagedProduct ? 'opacity-50 bg-slate-100' : ''}`}
                        disabled={!stagedProduct}
                    />
                </div>
            </div>

            {/* Vista Previa "Staged Product" */}
            <div className={`mt-4 rounded-xl border transition-all duration-300 overflow-hidden ${
                stagedProduct 
                ? 'bg-emerald-50/50 border-emerald-200' 
                : showError ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-100'
            }`}>
                <div className="p-4 min-h-[84px] flex items-center">
                    {isLoading && (
                        <div className="flex items-center gap-3 text-slate-500">
                            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="font-medium text-sm">Cargando catálogo en memoria...</span>
                        </div>
                    )}
                    
                    {showError && (
                        <div className="flex items-center gap-2 text-red-500">
                            <AlertCircle size={20} />
                            <span className="font-bold text-sm">Producto no encontrado en el sistema.</span>
                        </div>
                    )}

                    {!isLoading && !query && (
                        <p className="text-slate-400 text-sm italic">El producto escaneado aparecerá aquí...</p>
                    )}

                    {stagedProduct && !isLoading && (
                        <div className="flex justify-between items-center w-full">
                            <div className="flex items-center gap-4">
                                <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 leading-tight">{stagedProduct.nombre}</h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-xs mr-2">{stagedProduct.codigo_serie}</span>
                                        Stock: <span className="font-bold text-slate-700">{stagedProduct.stock_actual}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Precio Unitario</p>
                                <p className="text-3xl font-black text-slate-800">${stagedProduct.precio_venta.toLocaleString()}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};