

// Esta interfaz sirve para cualquier modelo que pagines con Django
export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface SesionCaja {
    id: string;
    usuario_apertura?: number | string;
    usuario_nombre?: string;
    fecha_apertura: string;
    fecha_cierre: string | null;
    monto_inicial: number;
    esta_abierta: boolean;
    total_ingresos?: number;
    cantidad_ventas?: number;
}

export interface FiltrosHistorial {
    fecha_desde?: string;
    fecha_hasta?: string;
    usuario_id?: string;
    ingreso_min?: number;
    page?: number; // <-- Agregamos esto aquí
}

export interface NuevaCajaPayload {
    monto_inicial: number;
}