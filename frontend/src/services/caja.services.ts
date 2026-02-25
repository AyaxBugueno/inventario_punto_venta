// src/services/caja.service.ts
import api from '../api/axios'; // <-- Ajusta el nombre del archivo si se llama axios.ts o de otra forma
import { type SesionCaja, type NuevaCajaPayload, type FiltrosHistorial, type PaginatedResponse } from '../domain/models/Caja';

export const cajaService = {
    // 1. Obtener la caja que está actualmente abierta
    getActiva: async (): Promise<SesionCaja> => {
        const response = await api.get('/caja/activa/');
        return response.data;
    },

    // 2. Abrir una caja nueva
    abrirCaja: async (payload: NuevaCajaPayload): Promise<SesionCaja> => {
        const response = await api.post('/caja/activa/', payload);
        return response.data;
    },

    // 3. Cerrar la caja activa
    cerrarCaja: async (): Promise<SesionCaja> => {
        const response = await api.post('/caja/cerrar/');
        return response.data;
    },

    // 4. Obtener todo el historial de cajas (para tu futura tabla de ventas históricas)
    getHistorial: async (filtros?: FiltrosHistorial): Promise<PaginatedResponse<SesionCaja>> => {
        const response = await api.get('/caja/historial/', { params: filtros });
        return response.data;
    }
};