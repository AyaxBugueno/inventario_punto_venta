// services/kardex.service.ts
import axios from 'axios';
import { type MovimientoKardex, type KardexFiltros } from '../domain/models/Kardex';

// IMPORTANTE: Asegúrate de importar la interfaz que creaste en el modal 
// o usar 'any' temporalmente en el retorno de la promesa si te da error de tipado.
import { type PaginatedResponse } from '../components/organisms/Kardex/Kardex'; // Ajusta esta ruta a donde tengas tu interfaz

const API_URL = 'http://127.0.0.1:8000/api/kardex/';

export const kardexService = {
    // 1. Cambiamos el tipo de retorno para que acepte el objeto paginado
    obtenerHistorial: async (filtros: KardexFiltros & { page?: number }): Promise<PaginatedResponse<MovimientoKardex> | MovimientoKardex[]> => {
        try {
            const params = new URLSearchParams();
            if (filtros.producto) params.append('producto', filtros.producto.toString());
            if (filtros.tipo_movimiento) params.append('tipo_movimiento', filtros.tipo_movimiento);
            if (filtros.fecha_desde) params.append('fecha__gte', filtros.fecha_desde);
            if (filtros.fecha_hasta) params.append('fecha__lte', filtros.fecha_hasta);
            
            // 👇 AÑADIMOS EL PARÁMETRO PAGE A LA URL
            if (filtros.page) params.append('page', filtros.page.toString());

            const response = await axios.get(`${API_URL}?${params.toString()}`, {
                withCredentials: true 
            });
            
            // 🚀 LA CORRECCIÓN: Devolvemos TODO el objeto, no solo los results.
            return response.data; 

        } catch (error) {
            console.error("Error al obtener el Kardex:", error);
            throw error;
        }
    }
};