import { useState, useEffect, useCallback } from 'react';
import { type Producto } from '../../domain/models/Producto';
import { productoService } from '../../services/producto.service';
import axios from 'axios';

// 1. Aceptamos los filtros como argumento opcional
export const useProductos = (filters: Record<string, any> = {}) => {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [globalError, setGlobalError] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const PAGE_SIZE = 10;

    // 🔥 SOLUCIÓN: Creamos una "firma" de texto de los filtros para comparar contenido, no referencias.
    const filtersString = JSON.stringify(filters);

    // 2. fetchProductos ahora depende de 'page' y 'filters'
    const fetchProductos = useCallback(async (currentPage: number, currentFilters: any) => {
        setLoading(true);
        setGlobalError(null);
        try {
            // Pasamos ambos parámetros al servicio
            const data = await productoService.getAll(currentPage, currentFilters);
            setProductos(data.results);
            setTotalPages(Math.ceil(data.count / PAGE_SIZE));
            
        } catch (err) {
            console.error(err);
            setGlobalError('Error al cargar el catálogo de productos');
        } finally {
            setLoading(false);
        }
    }, []);

    // 3. Resetear a página 1 cuando el usuario cambia los filtros
    // 🔥 CAMBIO: Dependemos del string, no del objeto
    useEffect(() => {
        setPage(1);
    }, [filtersString]);

    // 4. Efecto principal: reacciona a página y filtros
    // 🔥 CAMBIO: Usamos filtersString en la dependencia para romper el bucle infinito
    useEffect(() => {
        // Pasamos 'filters' (el objeto original) a la función, pero el efecto solo se dispara
        // si 'filtersString' cambia.
        fetchProductos(page, filters);
        
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, filtersString, fetchProductos]); 


    // --- TUS FUNCIONES AUXILIARES (INTACTAS) ---

    const crearProducto = async (prod: Producto) => {
        try {
            await productoService.create(prod);
            // Re-fetech para asegurar que el ordenamiento del backend (sanos primero) se mantenga
            await fetchProductos(page, filters);
            return true;
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 400){
                throw err; // El Formulario se encarga de mostrar estos errores
            }
            setGlobalError('Error crítico al crear el producto');
            throw err;
        }
    };

    const actualizarProducto = async (id: number, prod: Producto) => {
        setLoading(true);
        try {
            await productoService.update(id, prod);
            // CORRECCIÓN: Usamos 'page' y 'filters' que viven dentro de este hook
            await fetchProductos(page, filters);
            return true;
        } catch (err: any) {
            if (err.response?.status === 400) {
                throw err; 
            }
            
            // CORRECCIÓN: Usamos 'setGlobalError', que es el estado real de tu hook
            setGlobalError('Error crítico al actualizar el producto');
            throw err;
        } finally {
            setLoading(false);
        }
    };
    const eliminarProducto = async (id: number) => {
        // Podrías añadir un confirm aquí si no lo tienes en el componente
        try {
            await productoService.delete(id);
            // Si eliminamos el último de la página, fetchProductos lo manejará
            await fetchProductos(page, filters);
        } catch (err) {
            // Capturamos el error de protección de Django si tiene lotes
            if (axios.isAxiosError(err) && err.response?.status === 403) {
                 alert("No se puede eliminar: Este producto tiene lotes asociados.");
            } else {
                 setGlobalError('Error al eliminar producto');
            }
        }
    };

    // 5. Retornamos una interfaz de paginación consistente con useLotes
    return {
        productos,
        loading,
        error: globalError,
        pagination: {
            page,
            totalPages,
            goToPage: (num: number) => setPage(num), // Útil para el SmartFilter
            hasNext: page < totalPages,
            hasPrev: page > 1,
            nextPage: () => setPage(p => Math.min(p + 1, totalPages)),
            prevPage: () => setPage(p => Math.max(p - 1, 1))
        },
        crearProducto,
        actualizarProducto,
        eliminarProducto,
        refetch: () => fetchProductos(page, filters)
    };
};