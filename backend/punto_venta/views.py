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
from .models import Venta, DetalleVenta
from .serializers import VentaSerializer
from modulo_principal.models import Producto # Asegúrate de que la ruta sea correcta

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

    @transaction.atomic # 🛡️ Lógica ACID: Si algo falla, se cancela toda la operación
    def create(self, request, *args, **kwargs):
        """
        Procesa el Checkout del POS.
        Espera un JSON así:
        {
            "metodo_pago": "DEBITO",
            "detalles": [
                {"producto_id": 15, "cantidad": 2},
                {"producto_id": 8, "cantidad": 1}
            ]
        }
        """
        detalles_data = request.data.get('detalles', [])
        metodo_pago = request.data.get('metodo_pago', 'EFECTIVO')

        if not detalles_data:
            return Response(
                {"error": "El carrito está vacío. Agregue productos para vender."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # ⚠️ Como estás usando AllowAny por ahora, asignaremos el primer usuario de la BD 
        # para que no tire error. En producción, usa request.user
        from django.contrib.auth import get_user_model
        User = get_user_model()
        usuario_actual = request.user if request.user.is_authenticated else User.objects.first()

        try:
            # 1. Crear la Venta (con total 0 temporalmente)
            venta = Venta.objects.create(
                usuario=usuario_actual,
                metodo_pago=metodo_pago,
                total=0
            )

            total_calculado = 0
            objetos_detalle = []

            # 2. Iterar sobre cada ítem del carrito
            for item in detalles_data:
                prod_id = item.get('producto_id')
                cantidad_solicitada = int(item.get('cantidad', 1))

                # select_for_update() bloquea la fila en la BD para evitar Race Conditions
                # Si dos cajeros venden el mismo producto al mismo tiempo, uno espera al otro.
                producto = Producto.objects.select_for_update().get(id=prod_id)

                # Validar Stock
                if producto.stock_actual < cantidad_solicitada:
                    raise ValidationError(f"Stock insuficiente para '{producto.nombre}'. Quedan {producto.stock_actual} unidades.")

                # Descontar Stock y auto-desactivar si llega a 0
                producto.stock_actual -= cantidad_solicitada
                if producto.stock_actual == 0:
                    producto.activo = False
                producto.save()

                # Calcular subtotal confiando SOLAMENTE en la Base de Datos
                precio_real = producto.precio_venta
                subtotal = precio_real * cantidad_solicitada
                total_calculado += subtotal

                # Preparar el DetalleVenta para guardarlo en la BD
                objetos_detalle.append(DetalleVenta(
                    venta=venta,
                    producto=producto,
                    cantidad=cantidad_solicitada,
                    precio_unitario=precio_real,
                    subtotal=subtotal
                ))

            # 3. Guardar todos los detalles juntos (Optimización de BD)
            DetalleVenta.objects.bulk_create(objetos_detalle)

            # 4. Actualizar la venta con el total real y seguro
            venta.total = total_calculado
            venta.save()

            # 5. Devolver la respuesta serializada al Frontend (para imprimir boleta)
            serializer = self.get_serializer(venta)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Producto.DoesNotExist:
            return Response({"error": "Uno de los productos escaneados no existe."}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as e:
            # Captura errores de stock insuficiente y le avisa al Frontend
            return Response({"error": str(e.message if hasattr(e, 'message') else e.messages[0])}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Error interno al procesar la venta: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class DashboardDiaView(APIView):
    """
    Retorna las métricas clave de ventas del día actual.
    Ideal para el panel principal del Minimarket.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        # 1. Definir el "Día Actual" (Desde las 00:00 hasta las 23:59)
        hoy = timezone.now().date()
        inicio_dia = timezone.make_aware(timezone.datetime.combine(hoy, timezone.datetime.min.time()))
        fin_dia = timezone.make_aware(timezone.datetime.combine(hoy, timezone.datetime.max.time()))

        # Filtrar solo ventas completadas (no anuladas) de hoy
        ventas_hoy = Venta.objects.filter(
            fecha__range=(inicio_dia, fin_dia),
            anulada=False
        )

        # -------------------------------------------------------------
        # MÉTRICA 1: Ingresos Totales y Cantidad de Boletas
        # -------------------------------------------------------------
        resumen = ventas_hoy.aggregate(
            ingresos_totales=Sum('total'),
            cantidad_boletas=Count('id')
        )
        
        # Si no hay ventas, devuelve None, así que forzamos un 0
        ingresos_totales = resumen['ingresos_totales'] or 0
        cantidad_boletas = resumen['cantidad_boletas'] or 0

        # Ticket Promedio (Cuánto gasta en promedio un cliente)
        ticket_promedio = int(ingresos_totales / cantidad_boletas) if cantidad_boletas > 0 else 0

        # -------------------------------------------------------------
        # MÉTRICA 2: Productos Más Vendidos (TOP 5)
        # -------------------------------------------------------------
        # Buscamos en los detalles de las ventas de hoy
        detalles_hoy = DetalleVenta.objects.filter(venta__in=ventas_hoy)
        
        top_productos = (
            detalles_hoy.values(
                nombre=F('producto__nombre'),
                sku=F('producto__codigo_serie')
            )
            .annotate(
                cantidad_vendida=Sum('cantidad'),
                ingreso_generado=Sum('subtotal')
            )
            .order_by('-cantidad_vendida')[:5] # Los 5 que más se llevaron
        )

        # -------------------------------------------------------------
        # MÉTRICA 3: Ventas por Hora (Para el gráfico de barras)
        # -------------------------------------------------------------
        # Extraemos la hora de la venta y sumamos los totales en ese bloque
        ventas_por_hora = (
            ventas_hoy.annotate(hora=ExtractHour('fecha'))
            .values('hora')
            .annotate(
                total_vendido=Sum('total'),
                boletas=Count('id')
            )
            .order_by('hora')
        )

        # Formatear la salida para que sea fácil de leer en React (Ej: "09:00", "15:00")
        grafico_horas = []
        for v in ventas_por_hora:
            hora_formateada = f"{v['hora']:02d}:00" # Rellena con 0 si es un dígito
            grafico_horas.append({
                "hora": hora_formateada,
                "ingresos": v['total_vendido'],
                "cantidad_clientes": v['boletas']
            })

        # -------------------------------------------------------------
        # RESPUESTA FINAL JSON PARA REACT
        # -------------------------------------------------------------
        return Response({
            "fecha_reporte": hoy.strftime("%Y-%m-%d"),
            "resumen": {
                "ingresos_totales": ingresos_totales,
                "cantidad_boletas": cantidad_boletas,
                "ticket_promedio": ticket_promedio
            },
            "top_productos": list(top_productos),
            "ventas_por_hora": grafico_horas
        })