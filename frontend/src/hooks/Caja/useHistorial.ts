// src/hooks/Caja/useHistorial.ts
import { useState, useEffect, useCallback } from 'react';
import { cajaService } from '../../services/caja.services';
import { type SesionCaja, type FiltrosHistorial } from '../../domain/models/Caja';

export const useHistorial = () => {
    const [historial, setHistorial] = useState<SesionCaja[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [totalRecords, setTotalRecords] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastFilters, setLastFilters] = useState<FiltrosHistorial>({});

    const fetchHistorial = useCallback(async (page: number = 1, filtros: FiltrosHistorial = lastFilters) => {
        setLoading(true);
        try {
            // Unimos los filtros con la página actual
            const queryParams: FiltrosHistorial = { ...filtros, page };
            const response = await cajaService.getHistorial(queryParams);
            
            // Ahora TypeScript reconoce 'results' y 'count'
            setHistorial(response.results); 
            setTotalRecords(response.count);
            setCurrentPage(page);
            setLastFilters(filtros);
        } catch (err) {
            console.error("Error al cargar historial:", err);
        } finally {
            setLoading(false);
        }
    }, [lastFilters]);

    useEffect(() => {
        fetchHistorial(1);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return { 
        historial, 
        loading, 
        totalRecords, 
        currentPage, 
        fetchHistorial 
    };
};