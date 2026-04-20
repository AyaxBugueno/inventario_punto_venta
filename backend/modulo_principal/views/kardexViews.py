from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import AllowAny

from modulo_principal.utils.pagination import EstándarPagination
from modulo_principal.models.kardex import MovimientoKardex
from modulo_principal.serializers import MovimientoKardexSerializer
from modulo_principal.services.kardexservices.kardexservices import KardexService


class MovimientoKardexViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = MovimientoKardexSerializer
    pagination_class = EstándarPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = {
        'producto': ['exact'],
        'tipo_movimiento': ['exact'],
        'fecha': ['gte', 'lte'],
        'usuario': ['exact'],
    }
    ordering_fields = ['fecha']
    ordering = ['-fecha']

    def get_queryset(self):
        return KardexService.listar_movimientos()
