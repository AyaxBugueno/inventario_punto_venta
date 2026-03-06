from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import AllowAny, IsAuthenticated # Cambiar a IsAuthenticated en producción

# 👇 IMPORTAMOS TU PAGINADOR CENTRALIZADO
from modulo_principal.utils.pagination import EstándarPagination

from ..models.kardex import MovimientoKardex
from ..serializers import MovimientoKardexSerializer # Ajusta tu import según tu estructura

class MovimientoKardexViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Vista de solo lectura para el historial de movimientos de inventario.
    El Kardex NO se puede editar ni eliminar vía API bajo ninguna circunstancia.
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    
    # Usamos select_related para evitar el problema de N+1 queries. 
    queryset = MovimientoKardex.objects.select_related('producto', 'usuario').all()
    serializer_class = MovimientoKardexSerializer
    
    # 👇 APLICAMOS EL PAGINADOR EXPLÍCITAMENTE PARA ASEGURAR EL OBJETO {count, results} EN REACT
    pagination_class = EstándarPagination
    
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    
    # Filtros exactos y por rangos de fecha para que tu SmartFilter de React funcione perfecto
    filterset_fields = {
        'producto': ['exact'],            # Para ver la cartola de un solo producto
        'tipo_movimiento': ['exact'],     # Para filtrar solo ventas, o solo mermas
        'fecha': ['gte', 'lte'],          # Para filtrar "movimientos de hoy" o "de este mes"
        'usuario': ['exact'],             # Para auditar a un cajero específico
    }
    
    ordering_fields = ['fecha']
    ordering = ['-fecha'] # Por defecto, muestra lo más reciente arriba