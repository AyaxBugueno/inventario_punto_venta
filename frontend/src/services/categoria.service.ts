import axios from 'axios';
import { type Categoria } from '../domain/models/Categoria';

const API_URL = 'http://127.0.0.1:8000/api/categorias/'; // Asegúrate de que coincida con tu urls.py de Django

export const categoriaService = {
    getAll: async (page: number = 1, filters: Record<string, any> = {}) => {
        const response = await axios.get(API_URL, {
            params: {
                page,
                ...filters 
            }
        });
        return response.data;
    },

    getById: async (id: number): Promise<Categoria> => {
        const response = await axios.get(`${API_URL}${id}/`);
        return response.data;
    },

    create: async (categoria: Categoria): Promise<Categoria> => {
        const response = await axios.post(API_URL, categoria);
        return response.data;
    },

    update: async (id: number, categoria: Categoria): Promise<Categoria> => {
        const response = await axios.put(`${API_URL}${id}/`, categoria);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await axios.delete(`${API_URL}${id}/`);
    }
};