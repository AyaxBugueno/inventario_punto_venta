import axios from 'axios';
import { type Producto } from '../domain/models/Producto';

const API_URL = 'http://127.0.0.1:8000/api/productos/';

export const productoService = {
    // AHORA: acepta filtros
    getAll: async (page: number = 1, filters: Record<string, any> = {}) => {
        const response = await axios.get(API_URL, {
            params: {
                page,
                ...filters // Aquí irán: laboratorio, activo, es_bioequivalente, etc.
            }
        });
        return response.data;
    },

    getById: async (id: number): Promise<Producto> => {
        const response = await axios.get(`${API_URL}${id}/`);
        return response.data;
    },

    create: async (producto: Producto): Promise<Producto> => {
        const response = await axios.post(API_URL, producto);
        return response.data;
    },

    update: async (id: number, producto: Producto): Promise<Producto> => {
        const response = await axios.put(`${API_URL}${id}/`, producto);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await axios.delete(`${API_URL}${id}/`);
    }
};