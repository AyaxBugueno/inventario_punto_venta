from rest_framework import viewsets, filters, status
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.exceptions import ValidationError

from modulo_principal.utils.pagination import EstándarPagination
from modulo_principal.models import Producto, Categoria
from modulo_principal.serializers import ProductoSerializer, CategoriaSerializer
from modulo_principal.services.inventarioservices.categoriaservices import CategoriaService
from modulo_principal.services.inventarioservices.productoservices import ProductoService


class CategoriaViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    pagination_class = EstándarPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'descripcion']
    filterset_fields = {'activo': ['exact'], 'nombre': ['exact']}
    ordering_fields = ['nombre', 'descripcion']


class ProductoViewSet(viewsets.ModelViewSet):
    serializer_class = ProductoSerializer
    pagination_class = EstándarPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'codigo_serie', 'descripcion', 'categoria__nombre']
    filterset_fields = {'activo': ['exact'], 'categoria': ['exact']}
    ordering_fields = ['nombre', 'precio_venta', 'stock_actual']

    def get_queryset(self):
        return ProductoService.listar_productos()

    @action(detail=False, methods=['get'], pagination_class=None)
    def simple_list(self, request):
        data = ProductoService.listar_productos_simple()
        return Response(list(data))

    def destroy(self, request, *args, **kwargs):
        producto = self.get_object()
        puede_eliminar, error = ProductoService.puede_eliminar(producto)
        if not puede_eliminar:
            return Response(error, status=status.HTTP_400_BAD_REQUEST)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='ajustar-stock')
    def ajustar_stock(self, request, pk=None):
        producto = self.get_object()
        tipo_ajuste = request.data.get('tipo_ajuste')
        cantidad = request.data.get('cantidad')
        motivo = request.data.get('motivo', 'Ajuste manual')

        if not tipo_ajuste or cantidad is None:
            return Response({"error": "Faltan datos obligatorios."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            resultado = ProductoService.ajustar_stock(
                producto=producto,
                tipo_ajuste=tipo_ajuste,
                cantidad=cantidad,
                motivo_detalle=motivo,
                usuario=request.user
            )
            return Response(resultado, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except ValidationError as e:
            mensaje = e.message if hasattr(e, 'message') else e.messages[0]
            return Response({"error": str(mensaje)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='buscar-pos', pagination_class=None)
    def buscar_para_venta(self, request):
        query = request.query_params.get('q', '').strip()
        resultados = ProductoService.buscar_para_pos(query)
        return Response(resultados)



