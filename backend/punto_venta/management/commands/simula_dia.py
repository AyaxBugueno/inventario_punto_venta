import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model

# Imports exactos de tus apps
from modulo_principal.models import Producto
from punto_venta.models import Venta, DetalleVenta

User = get_user_model()

class Command(BaseCommand):
    help = 'Simula un día completo de ventas (9:00 a 22:00) para probar el Dashboard.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('Iniciando simulación del día en el Minimarket...'))

        # 1. Obtener el usuario (Cajero)
        usuario = User.objects.first()
        if not usuario:
            self.stdout.write(self.style.ERROR('No hay usuarios en la BD. Crea un superuser primero (python manage.py createsuperuser).'))
            return

        # 2. Configurar el "Día de Hoy"
        hoy = timezone.now().date()
        
        # 3. Traer todos los productos con stock disponible
        productos_disponibles = list(Producto.objects.filter(activo=True, stock_actual__gt=0))
        
        if not productos_disponibles:
            self.stdout.write(self.style.ERROR('No hay productos con stock. Corre tu seed de minimarket primero.'))
            return

        boletas_generadas = 0
        ingresos_simulados = 0

        with transaction.atomic():
            # Limpiar ventas SOLO DE HOY por si corres el script varias veces, para no duplicar datos
            inicio_dia = timezone.make_aware(timezone.datetime.combine(hoy, timezone.datetime.min.time()))
            Venta.objects.filter(fecha__gte=inicio_dia).delete()
            self.stdout.write('Ventas de hoy reiniciadas. Comenzando nueva simulación...')

            # Bucle de horas: de 09:00 a 21:00 (cerrando a las 22:00)
            for hora in range(9, 22):
                
                # SIMULADOR DE FLUJO DE CLIENTES:
                # - Mañana (9 a 12): Flujo normal
                # - Almuerzo (13 a 14): Flujo medio
                # - Tarde (15 a 17): Flujo bajo
                # - Salida del trabajo (18 a 21): Hora PEAK
                if hora in [18, 19, 20, 21]:
                    clientes_en_esta_hora = random.randint(15, 30)
                elif hora in [13, 14]:
                    clientes_en_esta_hora = random.randint(5, 12)
                elif hora in [15, 16, 17]:
                    clientes_en_esta_hora = random.randint(1, 4)
                else:
                    clientes_en_esta_hora = random.randint(3, 8)

                for _ in range(clientes_en_esta_hora):
                    # Generar un minuto y segundo aleatorio dentro de esta hora
                    minuto = random.randint(0, 59)
                    segundo = random.randint(0, 59)
                    hora_simulada = timezone.make_aware(timezone.datetime(hoy.year, hoy.month, hoy.day, hora, minuto, segundo))

                    # Crear la boleta base
                    venta = Venta.objects.create(
                        usuario=usuario,
                        metodo_pago=random.choice(['EFECTIVO', 'DEBITO', 'DEBITO', 'EFECTIVO', 'TRANSFERENCIA']),
                        total=0
                    )
                    
                    # TRUCO DJANGO: Como 'fecha' tiene auto_now_add=True, forzamos la hora simulada con un update directo
                    Venta.objects.filter(id=venta.id).update(fecha=hora_simulada)

                    total_boleta = 0
                    cant_tipos_productos = random.randint(1, 4) # El cliente lleva entre 1 y 4 productos distintos
                    
                    # Seleccionar productos al azar para esta compra
                    productos_comprados = random.sample(productos_disponibles, min(cant_tipos_productos, len(productos_disponibles)))
                    
                    objetos_detalle = []

                    for prod in productos_comprados:
                        # Refrescar el producto desde la BD por si se le acabó el stock en la compra anterior
                        prod.refresh_from_db()
                        
                        if prod.stock_actual <= 0:
                            continue

                        # Unidades que lleva de este producto (ej: 2 bebidas)
                        cantidad_lleva = random.randint(1, min(3, prod.stock_actual))
                        
                        subtotal = cantidad_lleva * prod.precio_venta
                        total_boleta += subtotal

                        # Descontar stock directamente (Lógica Fricción Cero)
                        prod.stock_actual -= cantidad_lleva
                        if prod.stock_actual == 0:
                            prod.activo = False
                        prod.save(update_fields=['stock_actual', 'activo'])

                        objetos_detalle.append(DetalleVenta(
                            venta=venta,
                            producto=prod,
                            cantidad=cantidad_lleva,
                            precio_unitario=prod.precio_venta,
                            subtotal=subtotal
                        ))

                    # Guardar los detalles en bloque
                    if objetos_detalle:
                        DetalleVenta.objects.bulk_create(objetos_detalle)
                        # Actualizar el total de la venta
                        Venta.objects.filter(id=venta.id).update(total=total_boleta)
                        
                        boletas_generadas += 1
                        ingresos_simulados += total_boleta

        self.stdout.write(self.style.SUCCESS(f'🚀 SIMULACIÓN EXITOSA!'))
        self.stdout.write(self.style.SUCCESS(f'✅ Boletas emitidas hoy: {boletas_generadas}'))
        self.stdout.write(self.style.SUCCESS(f'💰 Ingresos totales: ${ingresos_simulados:,.0f} CLP'))
        self.stdout.write(self.style.SUCCESS('Ve a tu Frontend y revisa el Dashboard. ¡Los gráficos deberían estar llenos!'))