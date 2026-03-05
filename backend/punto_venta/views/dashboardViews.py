from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Sum, Count, F
from django.db.models.functions import ExtractHour
from django.utils import timezone
from rest_framework.views import APIView
from ..models import Venta, DetalleVenta,SesionCaja
from django.db.models.functions import ExtractHour
from django.shortcuts import get_object_or_404








class DashboardDiaView(APIView):
    """
    Retorna las métricas clave de ventas de la Sesión de Caja actual (o una histórica).
    """
    permission_classes = [AllowAny]

    def get(self, request):
        # 1. ¿Queremos ver una caja histórica o la actual?
        sesion_id = request.query_params.get('sesion_id')

        if sesion_id:
            # MODO HISTORIAL: Busca la caja específica que el usuario quiere ver
            sesion = get_object_or_404(SesionCaja, id=sesion_id)
        else:
            # MODO EN VIVO: Busca la caja que esté abierta en este momento
            sesion = SesionCaja.objects.filter(esta_abierta=True).first()

        # 2. Si no hay caja (ej: el usuario acaba de cerrar caja y no pidió ver historial)
        if not sesion:
            return Response({
                "fecha_reporte": timezone.now().strftime("%Y-%m-%d"),
                "mensaje": "No hay caja abierta",
                "resumen": {
                    "ingresos_totales": 0,
                    "cantidad_boletas": 0,
                    "ticket_promedio": 0
                },
                "top_productos": [],
                "ventas_por_hora": []
            })

        # 3. Filtrar ventas de ESA sesión específica
        ventas_sesion = Venta.objects.filter(
            sesion=sesion,
            anulada=False
        )

        # -------------------------------------------------------------
        # MÉTRICA 1: Ingresos Totales y Cantidad de Boletas
        # -------------------------------------------------------------
        resumen = ventas_sesion.aggregate(
            ingresos_totales=Sum('total'),
            cantidad_boletas=Count('id')
        )
        
        ingresos_totales = resumen['ingresos_totales'] or 0
        cantidad_boletas = resumen['cantidad_boletas'] or 0
        ticket_promedio = int(ingresos_totales / cantidad_boletas) if cantidad_boletas > 0 else 0

        # -------------------------------------------------------------
        # MÉTRICA 2: Productos Más Vendidos (TOP 5)
        # -------------------------------------------------------------
        detalles_sesion = DetalleVenta.objects.filter(venta__in=ventas_sesion)
        
        top_productos = (
            detalles_sesion.values(
                nombre=F('producto__nombre'),
                sku=F('producto__codigo_serie')
            )
            .annotate(
                cantidad_vendida=Sum('cantidad'),
                ingreso_generado=Sum('subtotal')
            )
            .order_by('-cantidad_vendida')[:5]
        )

        # -------------------------------------------------------------
        # MÉTRICA 3: Ventas por Hora (Para el gráfico de barras)
        # -------------------------------------------------------------
        tz = timezone.get_current_timezone() # Captura la zona horaria de tu settings.py (ej: America/Santiago)

        ventas_por_hora = (
            ventas_sesion.annotate(hora=ExtractHour('fecha', tzinfo=tz)) # INYECTAMOS EL TZ AQUI
            .values('hora')
            .annotate(
                total_vendido=Sum('total'),
                boletas=Count('id')
            )
            .order_by('hora')
        )

        grafico_horas = []
        for v in ventas_por_hora:
            hora_formateada = f"{v['hora']:02d}:00"
            grafico_horas.append({
                "hora": hora_formateada,
                "ingresos": v['total_vendido'],
                "cantidad_clientes": v['boletas']
            })

        # -------------------------------------------------------------
        # RESPUESTA FINAL JSON
        # -------------------------------------------------------------
        return Response({
            "fecha_reporte": sesion.fecha_apertura.strftime("%Y-%m-%d"),
            "resumen": {
                "ingresos_totales": ingresos_totales,
                "cantidad_boletas": cantidad_boletas,
                "ticket_promedio": ticket_promedio
            },
            "top_productos": list(top_productos),
            "ventas_por_hora": grafico_horas
        })