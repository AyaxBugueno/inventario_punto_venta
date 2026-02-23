import axios from 'axios';
import { type DashboardData } from '../domain/models/Dashboard';

// Ajusta la URL a tu configuración (si usas un axios instanciado con interceptores, úsalo aquí)
const API_URL = 'http://localhost:8000/api/';

export const dashboardService = {
    getHoy: async (): Promise<DashboardData> => {
        // Asegúrate de enviar el token si la ruta en Django está protegida
        const response = await axios.get(`${API_URL}dashboard/hoy/`);
        return response.data;
    }
};