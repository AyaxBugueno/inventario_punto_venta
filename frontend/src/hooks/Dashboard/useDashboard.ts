import { useState, useEffect } from 'react';
import { dashboardService } from '../../services/dashboard.service';
import { type DashboardData } from '../../domain/models/Dashboard';

export const useDashboard = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const result = await dashboardService.getHoy();
            setData(result);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Error al cargar las métricas del día.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    return { data, loading, error, refetch: fetchDashboard };
};