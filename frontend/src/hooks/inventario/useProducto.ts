import { useState, useEffect, useCallback } from 'react';
import { type Producto } from '../../domain/models/Producto';
import { productoService } from '../../services/producto.service';
import axios from 'axios';
import { useProductStore } from '../../store/useProductStore'; // <-- NUEVO



// 1. Aceptamos los filtros como argumento opcional
export const useProductos = (filters: Record<string, any> = {}) => {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const { upsertProduct } = useProductStore();

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
            // 1. Llamamos a Django
            const nuevoProducto = await productoService.create(prod); 
            
            // 2. Sincronizamos con el Store del POS al instante
            upsertProduct(nuevoProducto); 

            // 3. Refrescamos la tabla del maestro de productos
            await fetchProductos(page, filters);
            return true;
        } catch (err) {
            // Manejo de errores de validación de Django (400 Bad Request)
            if (axios.isAxiosError(err) && err.response?.status === 400) {
                throw err; 
            }
            setGlobalError('Error crítico al crear el producto');
            throw err;
        }
    };

    const actualizarProducto = async (id: number, prod: Producto) => {
        setLoading(true);
        try {
            // 1. Llamamos a Django
            const productoActualizado = await productoService.update(id, prod);
            
            // 2. Sincronizamos la memoria del POS
            upsertProduct(productoActualizado);

            // 3. Refrescamos la tabla local
            await fetchProductos(page, filters);
            return true;
        } catch (err: any) {
            if (err.response?.status === 400) {
                throw err; 
            }
            setGlobalError('Error crítico al actualizar el producto');
            throw err;
        } finally {
            setLoading(false);
        }
    };
   

    const eliminarProducto = async (id: number) => {
        setGlobalError(null); // Limpiamos cualquier error previo antes de intentar
        try {
            await productoService.delete(id);
            await fetchProductos(page, filters);
        } catch (err) {
            // Verificamos si es un error de Axios
            if (axios.isAxiosError(err) && err.response) {
                // Capturamos el 400 que manda Django (ProtectedError)
                if (err.response.status === 400 && err.response.data?.error) {
                    // Guardamos el mensaje que viene desde el backend
                    setGlobalError(`Reglas: ${err.response.data.error} Prefiera desactivar`);
                } else {
                    setGlobalError('Error al eliminar el producto. Intente nuevamente.');
                }
            } else {
                setGlobalError('Error de conexión con el servidor.');
            }
        }
    };

    // 5. Retornamos una interfaz de paginación consistente con useLotes
    return {
        productos,
        loading,
        error: globalError,
        clearError: () => setGlobalError(null),
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