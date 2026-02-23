export interface TopProducto {
    nombre: string;
    sku: string;
    cantidad_vendida: number;
    ingreso_generado: number;
}

export interface VentaPorHora {
    hora: string;
    ingresos: number;
    cantidad_clientes: number;
}

export interface DashboardData {
    fecha_reporte: string;
    resumen: {
        ingresos_totales: number;
        cantidad_boletas: number;
        ticket_promedio: number;
    };
    top_productos: TopProducto[];
    ventas_por_hora: VentaPorHora[];
}