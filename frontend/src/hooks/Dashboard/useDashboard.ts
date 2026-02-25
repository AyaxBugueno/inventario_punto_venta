import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'; // <-- NUEVO IMPORT
import { dashboardService } from '../../services/dashboard.service';
import { type DashboardData } from '../../domain/models/Dashboard';

export const useDashboard = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    // Capturamos los parámetros de la URL (Ej: ?sesion_id=123)
    const [searchParams] = useSearchParams();
    const sesionId = searchParams.get('sesion_id');

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            // Le pasamos el ID al servicio (asegúrate de que tu servicio dashboardService acepte este parámetro y lo mande a Axios)
            const result = await dashboardService.getHoy(sesionId || undefined);
            setData(result);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Error al cargar las métricas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, [sesionId]); // <-- IMPORTANTÍSIMO: Refrescar si cambia la URL

    return { data, loading, error, refetch: fetchDashboard };
};