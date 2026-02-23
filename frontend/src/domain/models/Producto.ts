export interface Producto {
    id?: number;
    nombre: string;
    descripcion: string;
    codigo_serie: string;
    precio_venta: number;
    
    // Nuevos campos del backend
    stock_actual: number;
    stock_critico: number;
    
    activo: boolean;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}