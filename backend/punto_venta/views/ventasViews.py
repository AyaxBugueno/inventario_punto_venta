from django.shortcuts import render
from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.core.exceptions import ValidationError
from ..models import Venta, DetalleVenta,SesionCaja
from ..serializers import VentaSerializer
from modulo_principal.models import Producto 
from rest_framework.pagination import PageNumberPagination








class VentaViewSet(viewsets.ModelViewSet):
    # En producción deberías usar IsAuthenticated
    permission_classes = [AllowAny] 
    
    serializer_class = VentaSerializer
    queryset = Venta.objects.all().select_related('usuario').prefetch_related('detalles__producto')
    
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    
    filterset_fields = {
        'sesion': ['exact'],
        'fecha': ['gte', 'lte'],      
        'metodo_pago': ['exact'],     
        'usuario': ['exact'],         
        'anulada': ['exact'],
    }
    
    ordering_fields = ['fecha', 'total']
    ordering = ['-fecha'] 

    http_method_names = ['get', 'post', 'head', 'options']

    @transaction.atomic # 🛡️ Lógica ACID activada
    def create(self, request, *args, **kwargs):
        """
        Procesa el Checkout del POS y genera el Kardex automáticamente.
        """
        detalles_data = request.data.get('detalles', [])
        metodo_pago = request.data.get('metodo_pago', 'EFECTIVO')

        if not detalles_data:
            return Response(
                {"error": "El carrito está vacío. Agregue productos para vender."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1. VALIDAR CAJA ABIERTA
        caja_abierta = SesionCaja.objects.filter(esta_abierta=True).first()
        
        if not caja_abierta:
            return Response(
                {"error": "No puedes registrar ventas sin abrir la caja previamente."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        from django.contrib.auth import get_user_model
        User = get_user_model()
        usuario_actual = request.user if request.user.is_authenticated else User.objects.first()

        try:
            # 2. Crear la Venta (Cabecera)
            venta = Venta.objects.create(
                usuario=usuario_actual,
                sesion=caja_abierta,
                metodo_pago=metodo_pago,
                total=0
            )

            total_calculado = 0
            objetos_detalle = []

            # 3. Iterar sobre cada ítem del carrito
            for item in detalles_data:
                prod_id = item.get('producto_id')
                cantidad_solicitada = int(item.get('cantidad', 1))

                # Bloqueo a nivel de BD para evitar colisiones
                producto = Producto.objects.select_for_update().get(id=prod_id)

                # 🚨 NUEVA DEFENSA: Evitar venta de inactivos
                if not producto.activo:
                    raise ValidationError(f"El producto '{producto.nombre}' (SKU: {producto.codigo_serie}) está inactivo y no puede ser vendido.")

                # 🚀 LA MAGIA: DELEGAMOS AL KARDEX
                producto.modificar_stock(
                    cantidad_cambio=-cantidad_solicitada, 
                    tipo_movimiento='SALIDA_VENTA',
                    motivo=f"Venta POS - Ticket #{str(venta.id)[:8]}", 
                    usuario=usuario_actual
                )

                precio_real = producto.precio_venta
                subtotal = precio_real * cantidad_solicitada
                total_calculado += subtotal

                objetos_detalle.append(DetalleVenta(
                    venta=venta,
                    producto=producto,
                    cantidad=cantidad_solicitada,
                    precio_unitario=precio_real,
                    subtotal=subtotal
                ))

            # 4. Guardar todos los detalles juntos (Optimización SQL)
            DetalleVenta.objects.bulk_create(objetos_detalle)

            # 5. Actualizar la venta con el total real
            venta.total = total_calculado
            venta.save(update_fields=['total'])

            # 6. Devolver la respuesta al frontend
            serializer = self.get_serializer(venta)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Producto.DoesNotExist:
            return Response({"error": "Uno de los productos escaneados no existe."}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as e:
            # Captura el error exacto del Kardex (ej: "Stock negativo no permitido...")
            mensaje = e.message if hasattr(e, 'message') else e.messages[0]
            return Response({"error": str(mensaje)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Error interno al procesar la venta: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    def anular_venta(self, usuario_que_anula):
        """
        Anula la venta y devuelve el stock usando el motor del Kardex.
        """
        if self.anulada:
            raise ValidationError("Esta venta ya está anulada.")
            
        with transaction.atomic():
            self.anulada = True
            self.save(update_fields=['anulada'])
            
            # Devolver el stock de cada detalle usando el Kardex
            for detalle in self.detalles.select_related('producto').all():
                producto = detalle.producto
                
                # ==========================================
                # 🚀 DEVOLUCIÓN AL KARDEX
                # ==========================================
                producto.modificar_stock(
                    cantidad_cambio=detalle.cantidad, # Es POSITIVO porque el stock vuelve a entrar
                    tipo_movimiento='DEVOLUCION',
                    motivo=f"Anulación de Venta Folio #{str(self.id)[:8]}",
                    usuario=usuario_que_anula
                )

    def paginate_queryset(self, queryset):
        """
        Si la petición viene del Dashboard (filtrando por 'sesion'), 
        devolvemos TODAS las ventas para que React las pagine front-end.
        """
        if 'sesion' in self.request.query_params:
            return None
        return super().paginate_queryset(queryset)

class EstándarPagination(PageNumberPagination):
    page_size = 10 
    page_size_query_param = 'page_size'
    max_page_size = 100