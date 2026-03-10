// src/store/useProductStore.ts
import { create } from 'zustand';
import { type Producto } from '../domain/models/Producto';
import { productoService } from '../services/producto.service';

interface ProductState {
    productosArray: Producto[];
    productosPorEAN: Record<string, Producto>;
    isInitialized: boolean;
    isLoading: boolean;
    
    // Acciones
    cargarCatalogoLocal: (force?: boolean) => Promise<void>;
    buscarLocal: (query: string) => Producto[];
    
    // 🔥 NUEVA ACCIÓN: Sincronización quirúrgica de un producto
    upsertProduct: (productoActualizado: Producto) => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
    productosArray: [],
    productosPorEAN: {},
    isInitialized: false,
    isLoading: false,

    cargarCatalogoLocal: async (force = false) => {
        if (get().isInitialized && !force) return; 

        set({ isLoading: true });
        try {
            const response: any = await productoService.getAll(1, { page_size: 5000 }); 
            const data: Producto[] = response.results ? response.results : response;

            const diccionario = data.reduce((acc: Record<string, Producto>, prod) => {
                acc[prod.codigo_serie] = prod;
                return acc;
            }, {});

            set({ 
                productosArray: data, 
                productosPorEAN: diccionario, 
                isInitialized: true,
                isLoading: false 
            });
        } catch (error) {
            console.error("Error cargando catálogo local", error);
            set({ isLoading: false });
        }
    },

    buscarLocal: (query: string) => {
        const { productosPorEAN, productosArray } = get();
        if (!query || query.length < 2) return [];

        // RUTA BALA (O(1))
        const matchExacto = productosPorEAN[query.trim()];
        if (matchExacto) {
            return [matchExacto];
        }

        // RUTA SECUNDARIA (O(n))
        const qLower = query.toLowerCase();
        const coincidencias = productosArray.filter(p => 
            p.nombre.toLowerCase().includes(qLower) || 
            p.codigo_serie.includes(query)
        );

        return coincidencias.slice(0, 10); 
    },

    upsertProduct: (producto: Producto) => {
        set((state) => {
            // 1. Actualizamos el Diccionario (Si no existe, lo crea. Si existe, lo pisa)
            const nuevoDiccionario = { ...state.productosPorEAN };
            nuevoDiccionario[producto.codigo_serie] = producto;

            // 2. Actualizamos la Lista
            const index = state.productosArray.findIndex(p => p.id === producto.id);
            const nuevaLista = [...state.productosArray];

            if (index > -1) {
                nuevaLista[index] = producto; // Si existe, lo actualizamos
            } else {
                nuevaLista.push(producto); // Si es nuevo, lo agregamos al final
            }

            return {
                productosPorEAN: nuevoDiccionario,
                productosArray: nuevaLista
            };
        });
    }
}));