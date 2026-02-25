from django.shortcuts import render
from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.core.exceptions import ValidationError
from django.db.models import Sum, Count, F
from django.db.models.functions import ExtractHour
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from .models import Venta, DetalleVenta,SesionCaja
from .serializers import VentaSerializer, SesionCajaSerializer
from modulo_principal.models import Producto # Asegúrate de que la ruta sea correcta
from django.db.models.functions import ExtractHour, Coalesce
from django.shortcuts import render, get_object_or_404
from rest_framework.pagination import PageNumberPagination

class EstándarPagination(PageNumberPagination):
    page_size = 10 # Limite de 10 por página
    page_size_query_param = 'page_size'
    max_page_size = 100


class VentaViewSet(viewsets.ModelViewSet):
    # En producción deberías usar IsAuthenticated
    permission_classes = [AllowAny] 
    
    serializer_class = VentaSerializer
    queryset = Venta.objects.all().select_related('usuario').prefetch_related('detalles__producto')
    
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    
    filterset_fields = {
        'fecha': ['gte', 'lte'],      
        'metodo_pago': ['exact'],     
        'usuario': ['exact'],         
        'anulada': ['exact'],
    }
    
    ordering_fields = ['fecha', 'total']
    ordering = ['-fecha'] 

    http_method_names = ['get', 'post', 'head', 'options']

    @transaction.atomic # 🛡️ Lógica ACID
    def create(self, request, *args, **kwargs):
        """
        Procesa el Checkout del POS.
        """
        detalles_data = request.data.get('detalles', [])
        metodo_pago = request.data.get('metodo_pago', 'EFECTIVO')

        if not detalles_data:
            return Response(
                {"error": "El carrito está vacío. Agregue productos para vender."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # ==========================================
        # 🚨 NUEVA LÓGICA: VALIDAR CAJA ABIERTA 🚨
        # ==========================================
        caja_abierta = SesionCaja.objects.filter(esta_abierta=True).first()
        
        if not caja_abierta:
            return Response(
                {"error": "No puedes registrar ventas sin abrir la caja previamente."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        # ==========================================

        from django.contrib.auth import get_user_model
        User = get_user_model()
        usuario_actual = request.user if request.user.is_authenticated else User.objects.first()

        try:
            # 1. Crear la Venta (Asignando la sesión de caja)
            venta = Venta.objects.create(
                usuario=usuario_actual,
                sesion=caja_abierta,  # <-- Aquí vinculamos la venta a la caja activa
                metodo_pago=metodo_pago,
                total=0
            )

            total_calculado = 0
            objetos_detalle = []

            # 2. Iterar sobre cada ítem del carrito
            for item in detalles_data:
                prod_id = item.get('producto_id')
                cantidad_solicitada = int(item.get('cantidad', 1))

                producto = Producto.objects.select_for_update().get(id=prod_id)

                if producto.stock_actual < cantidad_solicitada:
                    raise ValidationError(f"Stock insuficiente para '{producto.nombre}'. Quedan {producto.stock_actual} unidades.")

                producto.stock_actual -= cantidad_solicitada
                if producto.stock_actual == 0:
                    producto.activo = False
                producto.save()

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

            # 3. Guardar todos los detalles juntos
            DetalleVenta.objects.bulk_create(objetos_detalle)

            # 4. Actualizar la venta con el total real
            venta.total = total_calculado
            venta.save()

            # 5. Devolver la respuesta
            serializer = self.get_serializer(venta)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Producto.DoesNotExist:
            return Response({"error": "Uno de los productos escaneados no existe."}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as e:
            return Response({"error": str(e.message if hasattr(e, 'message') else e.messages[0])}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Error interno al procesar la venta: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
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
        ventas_por_hora = (
            ventas_sesion.annotate(hora=ExtractHour('fecha'))
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
    
class CajaActivaView(APIView):
    """
    GET: Devuelve la sesión de caja actualmente abierta (si existe).
    POST: Abre una nueva sesión de caja.
    """
    def get(self, request):
        caja_abierta = SesionCaja.objects.filter(esta_abierta=True).first()
        if caja_abierta:
            serializer = SesionCajaSerializer(caja_abierta)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response({"mensaje": "No hay caja abierta"}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        # 1. Verificar que no haya otra caja abierta
        if SesionCaja.objects.filter(esta_abierta=True).exists():
            return Response(
                {"error": "Ya existe una caja abierta. Debes cerrarla primero."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 2. Crear la nueva caja
        monto_inicial = request.data.get('monto_inicial', 0)
        nueva_caja = SesionCaja.objects.create(
            usuario_apertura=request.user, # Asume que tienes autenticación configurada
            monto_inicial=monto_inicial,
            esta_abierta=True
        )
        
        serializer = SesionCajaSerializer(nueva_caja)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class CerrarCajaView(APIView):
    """
    POST: Cierra la sesión de caja actual.
    """
    def post(self, request):
        caja_abierta = SesionCaja.objects.filter(esta_abierta=True).first()
        if not caja_abierta:
            return Response(
                {"error": "No hay ninguna caja abierta para cerrar."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Usamos el método que creamos en el modelo
        caja_abierta.cerrar_caja()
        serializer = SesionCajaSerializer(caja_abierta)
        return Response(serializer.data, status=status.HTTP_200_OK)

class HistorialCajasView(APIView):
    def get(self, request):
        # 1. Base del Queryset (Igual que antes)
        cajas = SesionCaja.objects.filter(esta_abierta=False).annotate(
            total_ingresos=Coalesce(Sum('ventas__total'), 0),
            cantidad_ventas=Count('ventas')
        ).order_by('-fecha_apertura')

        # 2. Aplicar Filtros del SmartFilter (Igual que antes)
        fecha_desde = request.query_params.get('fecha_desde')
        fecha_hasta = request.query_params.get('fecha_hasta')
        if fecha_desde:
            cajas = cajas.filter(fecha_apertura__date__gte=fecha_desde)
        if fecha_hasta:
            cajas = cajas.filter(fecha_apertura__date__lte=fecha_hasta)

        # 3. 🚀 PAGINACIÓN MÁGICA
        paginator = EstándarPagination()
        page = paginator.paginate_queryset(cajas, request)
        
        if page is not None:
            serializer = SesionCajaSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        # Caso por si no hay paginación
        serializer = SesionCajaSerializer(cajas, many=True)
        return Response(serializer.data)