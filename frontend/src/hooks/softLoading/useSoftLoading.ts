import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Hook para manejar estados de carga con retraso (Delay).
 * Evita el "parpadeo" (Layout Shift) ocultando el spinner 
 * si la petición a la API se resuelve más rápido que el delay.
 * * @param delayMs Tiempo en milisegundos a esperar antes de mostrar el loading (Default: 300ms)
 */
export const useSoftLoading = (delayMs: number = 300) => {
    const [isSoftLoading, setIsSoftLoading] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startLoading = useCallback(() => {
        // Limpiamos cualquier temporizador previo por seguridad
        if (timerRef.current) clearTimeout(timerRef.current);
        
        timerRef.current = setTimeout(() => {
            setIsSoftLoading(true);
        }, delayMs);
    }, [delayMs]);

    const stopLoading = useCallback(() => {
        // Si la petición termina antes de los 300ms, cancelamos el temporizador
        // y el spinner nunca llega a aparecer.
        if (timerRef.current) clearTimeout(timerRef.current);
        setIsSoftLoading(false);
    }, []);

    // Cleanup: Si el componente se desmonta mientras el timer corre, lo matamos.
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return { isSoftLoading, startLoading, stopLoading };
};