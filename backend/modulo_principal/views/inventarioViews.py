from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q

from ..models import Producto, Categoria
from ..serializers import (
    ProductoSerializer,
    CategoriaSerializer
)

# ---------------------------------------------------------
# 1. CATEGORÍAS
# ---------------------------------------------------------
class CategoriaViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    authentication_classes = []

    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'descripcion'] 
    filterset_fields = {'activo': ['exact']}
    ordering_fields = ['nombre', 'descripcion']


# ---------------------------------------------------------
# 2. PRODUCTOS
# ---------------------------------------------------------
class ProductoViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny] 
    authentication_classes = [] 

    serializer_class = ProductoSerializer
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'codigo_serie', 'descripcion', 'categoria__nombre']
    
    filterset_fields = {
        'activo': ['exact'],
        'categoria': ['exact'],
    }
    
    # Añadimos stock_actual para que el frontend pueda ordenar por los que tienen más/menos stock
    ordering_fields = ['nombre', 'precio_venta', 'stock_actual']

    def get_queryset(self):
        """
        Smart Sorting simplificado:
        1. Productos Activos
        2. Mayor stock actual
        3. Alfabético
        """
        return Producto.objects.select_related('categoria').all().order_by(
            '-activo', '-stock_actual', 'nombre'
        )

    @action(detail=False, methods=['get'], pagination_class=None)
    def simple_list(self, request):
        # Añadí stock_actual aquí, te será muy útil al armar el carrito en React
        data = Producto.objects.values('id', 'nombre', 'stock_actual', 'precio_venta')
        return Response(list(data))


# ---------------------------------------------------------
# 3. GLOBAL SEARCH
# ---------------------------------------------------------
class GlobalSearchView(APIView):
    """
    Busca simultáneamente en Productos y Categorías.
    """
    permission_classes = [AllowAny] 
    authentication_classes = []

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        
        if len(query) < 3:
            return Response([]) 

        categorias = Categoria.objects.filter(
            nombre__icontains=query
        ).only('id', 'nombre')[:3]

        # Como ya no buscamos lotes, podemos subir el límite de productos mostrados a 5 o 6
        productos = Producto.objects.filter(
            Q(nombre__icontains=query) | 
            Q(codigo_serie__icontains=query) 
        ).select_related('categoria').only(
            'id', 'nombre', 'codigo_serie', 'precio_venta', 'categoria__nombre', 'stock_actual'
        )[:6]

        data = {
            'categorias': [{
                'id': c.id,
                'titulo': c.nombre,
                'subtitulo': "Categoría",
                'extra': ""
            } for c in categorias],

            'productos': [{
                'id': p.id,
                'titulo': p.nombre,
                # Ahora el buscador global mostrará cuánto stock queda directamente
                'subtitulo': f"Precio: ${p.precio_venta} | Stock: {p.stock_actual}", 
                'extra': p.codigo_serie
            } for p in productos],
        }

        return Response(data)