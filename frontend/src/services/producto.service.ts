import api from '../api/axios'; // ¡Usa siempre tu instancia personalizada!
import { type Producto } from '../domain/models/Producto';

const URL_BASE = '/productos/';

export const productoService = {
    getAll: async (page: number = 1, filters: Record<string, any> = {}) => {
        const response = await api.get(URL_BASE, {
            params: {
                page,
                ...filters
            }
        });
        return response.data;
    },
    buscarParaPOS: async (query: string): Promise<Producto[]> => {
        if (!query || query.length < 2) return [];
        
        // Llama al nuevo endpoint de Django que creamos antes
        const response = await api.get(`${URL_BASE}buscar-pos/`, {
            params: { q: query }
        });
        return response.data;
    },
    ajustarStock: async (id: number, payload: { tipo_ajuste: string; cantidad: number; motivo: string }) => {
        const { data } = await api.post(`/productos/${id}/ajustar-stock/`, payload);
        return data;
    },

    getById: async (id: number): Promise<Producto> => {
        const response = await api.get(`${URL_BASE}${id}/`);
        return response.data;
    },

    create: async (producto: Producto): Promise<Producto> => {
        const response = await api.post(URL_BASE, producto);
        return response.data;
    },

    // CAMBIO A PATCH: Ideal para actualizaciones parciales
    update: async (id: number, producto: Partial<Producto>): Promise<Producto> => {
        const response = await api.patch(`${URL_BASE}${id}/`, producto);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`${URL_BASE}${id}/`);
    }
};