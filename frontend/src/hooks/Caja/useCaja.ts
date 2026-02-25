// src/hooks/useCaja.ts
import { useState, useEffect } from 'react';
import { cajaService } from '../../services/caja.services';
import { type SesionCaja, type NuevaCajaPayload } from '../../domain/models/Caja';

export const useCaja = () => {
    const [cajaActiva, setCajaActiva] = useState<SesionCaja | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Consulta si hay una caja abierta actualmente
    const fetchCajaActiva = async () => {
        setLoading(true);
        try {
            const caja = await cajaService.getActiva();
            setCajaActiva(caja);
            setError(null);
        } catch (err: any) {
            // Un 404 significa que no hay caja abierta. No es un error crítico.
            if (err.response?.status === 404) {
                setCajaActiva(null);
                setError(null);
            } else {
                console.error("Error al obtener la caja activa", err);
                setError('Error de conexión al verificar la caja.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Función para el botón verde
    const abrirCaja = async (monto_inicial: number = 0) => {
        setLoading(true);
        try {
            const payload: NuevaCajaPayload = { monto_inicial };
            const nuevaCaja = await cajaService.abrirCaja(payload);
            setCajaActiva(nuevaCaja);
            setError(null);
            return true; // Retornamos true para que el componente sepa que fue un éxito
        } catch (err: any) {
            console.error("Error al abrir caja", err);
            setError(err.response?.data?.error || 'No se pudo abrir la caja.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Función para el botón rojo
    const cerrarCaja = async () => {
        setLoading(true);
        try {
            await cajaService.cerrarCaja();
            setCajaActiva(null); // Limpiamos el estado local
            setError(null);
            return true;
        } catch (err: any) {
            console.error("Error al cerrar caja", err);
            setError(err.response?.data?.error || 'No se pudo cerrar la caja.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Ejecutar la consulta automáticamente al cargar la app
    useEffect(() => {
        fetchCajaActiva();
    }, []);

    return {
        cajaActiva,
        loading,
        error,
        abrirCaja,
        cerrarCaja,
        refetchCaja: fetchCajaActiva
    };
};