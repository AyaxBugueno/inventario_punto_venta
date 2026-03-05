// src/hooks/Dashboard/useDashboard.ts
import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../../services/dashboard.service';
import { type DashboardData } from '../../domain/models/Dashboard';

// Ahora recibe el ID como parámetro
export const useDashboard = (sesionId?: string | null) => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboard = useCallback(async () => {
        // Si no hay ID de sesión (caja cerrada y sin historial), no consultamos nada y limpiamos.
        if (!sesionId) {
            setData(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const result = await dashboardService.getHoy(sesionId);
            setData(result);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Error al cargar las métricas.');
        } finally {
            setLoading(false);
        }
    }, [sesionId]);

    useEffect(() => {
        fetchDashboard();
        // Cleanup: si cambia el ID o nos vamos, limpiamos los datos fantasmas
        return () => setData(null);
    }, [fetchDashboard]);

    return { data, loading, error, refetch: fetchDashboard };
};