import api from '../api/axios';
import { type DashboardData } from '../domain/models/Dashboard';

// Ajusta la URL a tu configuración (si usas un axios instanciado con interceptores, úsalo aquí)


export const dashboardService = {
    getHoy: async (sesionId?: string): Promise<DashboardData> => {
        const response = await api.get('/dashboard/hoy/', {
            // Axios tomará esto y armará la URL así: /dashboard/hoy/?sesion_id=123
            params: { sesion_id: sesionId } 
        });
        return response.data;
    }
};