from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from django.db.models.deletion import ProtectedError
from rest_framework import status
from django.db import transaction

# 👇 IMPORTAMOS TU PAGINADOR CENTRALIZADO
from modulo_principal.utils.pagination import EstándarPagination

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
    
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    
    # 👇 APLICAMOS EL PAGINADOR EXPLÍCITAMENTE
    pagination_class = EstándarPagination

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'descripcion'] 
    filterset_fields = {'activo': ['exact'],
                        'nombre':['exact']}
    ordering_fields = ['nombre', 'descripcion']


# ---------------------------------------------------------
# 2. PRODUCTOS
# ---------------------------------------------------------
class ProductoViewSet(viewsets.ModelViewSet):
    # AL QUITAR LOS OVERRIDES, DJANGO AHORA USARÁ IsAuthenticated Y CustomJWTAuthentication
    # DE TU settings.py POR DEFECTO PARA TODOS LOS ENDPOINTS DE PRODUCTOS.
    
    serializer_class = ProductoSerializer
    
    # 👇 APLICAMOS EL PAGINADOR EXPLÍCITAMENTE
    pagination_class = EstándarPagination
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'codigo_serie', 'descripcion', 'categoria__nombre']
    
    filterset_fields = {
        'activo': ['exact'],
        'categoria': ['exact'],
    }
    
    ordering_fields = ['nombre', 'precio_venta', 'stock_actual']

    def get_queryset(self):
        return Producto.objects.select_related('categoria').all().order_by(
            '-activo', '-stock_actual', 'nombre'
        )

    @action(detail=False, methods=['get'], pagination_class=None)
    def simple_list(self, request):
        data = Producto.objects.values('id', 'nombre', 'stock_actual', 'precio_venta')
        return Response(list(data))

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError as e:
            return Response(
                {
                    "error": "No se puede eliminar este producto porque tiene ventas asociadas.",
                    "detalle": "Para mantener la integridad de tu historial contable, el sistema protege los productos que ya han sido vendidos."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], url_path='ajustar-stock')
    @transaction.atomic
    def ajustar_stock(self, request, pk=None):
        producto = self.get_object()
        
        # AQUÍ request.user AHORA SÍ TRAERÁ TU USUARIO REAL GRACIAS A LAS COOKIES
        usuario_actual = request.user 

        tipo_ajuste = request.data.get('tipo_ajuste')
        cantidad = request.data.get('cantidad')
        motivo_detalle = request.data.get('motivo', 'Ajuste manual') 

        if not tipo_ajuste or cantidad is None:
            return Response({"error": "Faltan datos obligatorios."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cantidad = int(cantidad)
            if cantidad <= 0:
                raise ValueError("La cantidad debe ser mayor a 0.")
        except ValueError:
            return Response({"error": "La cantidad debe ser un número entero positivo."}, status=status.HTTP_400_BAD_REQUEST)

        if tipo_ajuste == 'CARGA':
            cantidad_cambio = cantidad 
            tipo_movimiento = 'ENTRADA_AJUSTE' 
            motivo_final = f"Carga de Stock: {motivo_detalle}"
        elif tipo_ajuste == 'DESCUENTO':
            cantidad_cambio = -cantidad 
            tipo_movimiento = 'SALIDA_AJUSTE'
            motivo_final = f"Descuento por {motivo_detalle}"
        else:
            return Response({"error": "El tipo_ajuste debe ser CARGA o DESCUENTO."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            producto.modificar_stock(
                cantidad_cambio=cantidad_cambio,
                tipo_movimiento=tipo_movimiento,
                motivo=motivo_final,
                usuario=usuario_actual
            )
            
            producto.refresh_from_db()
            
            return Response({
                "mensaje": "Stock actualizado correctamente.",
                "nuevo_stock": producto.stock_actual
            }, status=status.HTTP_200_OK)

        except ValidationError as e:
            mensaje = e.message if hasattr(e, 'message') else e.messages[0]
            return Response({"error": str(mensaje)}, status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=False, methods=['get'], url_path='buscar-pos', pagination_class=None)
    def buscar_para_venta(self, request):
        """
        Endpoint optimizado para POS.
        Prioriza la búsqueda exacta (Escáner) en 1 milisegundo.
        """
        q = request.query_params.get('q', '').strip()
        
        if not q:
            return Response([])

        # 1. RUTA RÁPIDA (ESCÁNER): Coincidencia exacta
        exact_match = list(Producto.objects.filter(
            activo=True, 
            stock_actual__gt=0, 
            codigo_serie=q
        ).values('id', 'nombre', 'codigo_serie', 'precio_venta', 'stock_actual')[:1])
        
        if exact_match:
            return Response(exact_match)
            
        # 2. RUTA LENTA (TECLADO): Si no es exacto, busca en Nombre o Código Parcial
        # 🔥 CLAVE: Agregado Q(codigo_serie__icontains=q) para que se comporte igual que tu antiguo buscador
        name_match = list(Producto.objects.filter(
            Q(nombre__icontains=q) | Q(codigo_serie__icontains=q),
            activo=True, 
            stock_actual__gt=0
        ).values('id', 'nombre', 'codigo_serie', 'precio_venta', 'stock_actual')[:10])
        
        return Response(name_match)

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
                'subtitulo': f"Precio: ${p.precio_venta} | Stock: {p.stock_actual} | Categoria: {p.categoria__nombre}", 
                'extra': p.codigo_serie
            } for p in productos],
        }

        return Response(data)