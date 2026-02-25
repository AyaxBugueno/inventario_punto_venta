import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model
from modulo_principal.models import Producto
from punto_venta.models import Venta, DetalleVenta, SesionCaja

User = get_user_model()

class Command(BaseCommand):
    help = 'Simula 10 años de historial forzando horas exactas (9:00 a 22:00) en SQLite.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('🔥 INICIANDO STRESS TEST: 10 AÑOS - FECHAS BULLETPROOF'))

        usuario = User.objects.first()
        productos = list(Producto.objects.all())
        
        if not productos or not usuario:
            self.stdout.write(self.style.ERROR('Error: Necesitas al menos un usuario y productos.'))
            return

        DIAS_TOTALES = 365 * 10 
        ahora = timezone.now()

        # Procesamos mes a mes para proteger la memoria de la RAM
        for mes_atras in range(120, -1, -1):
            fecha_referencia = ahora - timedelta(days=mes_atras * 30)
            self.stdout.write(f'Generando datos exactos para: {fecha_referencia.strftime("%B %Y")}...')
            
            with transaction.atomic():
                for d in range(30):
                    dia_offset = (mes_atras * 30) + d
                    if dia_offset > DIAS_TOTALES: continue
                    
                    fecha_dia = (ahora - timedelta(days=dia_offset)).date()
                    
                    # 1. Crear Caja y FORZAR su fecha de apertura a las 08:30
                    caja = SesionCaja.objects.create(
                        usuario_apertura=usuario,
                        monto_inicial=20000,
                        esta_abierta=False,
                        fecha_cierre=timezone.make_aware(timezone.datetime(fecha_dia.year, fecha_dia.month, fecha_dia.day, 22, 30, 0))
                    )
                    hora_apertura = timezone.make_aware(timezone.datetime(fecha_dia.year, fecha_dia.month, fecha_dia.day, 8, 30, 0))
                    SesionCaja.objects.filter(id=caja.id).update(fecha_apertura=hora_apertura)

                    # 2. Generar entre 15 y 35 ventas diarias
                    ventas_del_dia = random.randint(15, 35)
                    
                    for _ in range(ventas_del_dia):
                        # 🕒 MAGIA DE HORARIOS: Entre las 9:00 y las 21:59 (antes de las 22:00)
                        hora_v = random.randint(9, 21) 
                        min_v = random.randint(0, 59)
                        seg_v = random.randint(0, 59)
                        momento_venta = timezone.make_aware(timezone.datetime(fecha_dia.year, fecha_dia.month, fecha_dia.day, hora_v, min_v, seg_v))

                        # Creamos la venta vacía
                        venta = Venta.objects.create(
                            usuario=usuario,
                            sesion=caja,
                            metodo_pago=random.choice(['EFECTIVO', 'DEBITO', 'TRANSFERENCIA']),
                            total=0 
                        )

                        # Agregamos los productos
                        total_v = 0
                        detalles = []
                        items = random.sample(productos, random.randint(1, 3))
                        for p in items:
                            cant = random.randint(1, 2)
                            sub = cant * p.precio_venta
                            total_v += sub
                            detalles.append(DetalleVenta(
                                venta=venta, producto=p, cantidad=cant,
                                precio_unitario=p.precio_venta, subtotal=sub
                            ))
                        
                        DetalleVenta.objects.bulk_create(detalles)

                        # 🚀 TRUCO MAESTRO: Obligamos a la BD a reescribir la fecha y el total real
                        Venta.objects.filter(id=venta.id).update(fecha=momento_venta, total=total_v)

        self.stdout.write(self.style.SUCCESS('✅ ¡STRESS TEST PERFECTO! Las horas están distribuidas correctamente.'))