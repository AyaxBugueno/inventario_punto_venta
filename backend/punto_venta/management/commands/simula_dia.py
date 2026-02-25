import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model

# Imports de tus modelos
from modulo_principal.models import Producto
from punto_venta.models import Venta, DetalleVenta, SesionCaja

User = get_user_model()

class Command(BaseCommand):
    help = 'Simula 30 días de ventas para probar el Historial y Dashboard.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('🚀 Iniciando simulación de MES COMPLETO...'))

        usuario = User.objects.first()
        if not usuario:
            self.stdout.write(self.style.ERROR('No hay usuarios en la BD.'))
            return

        productos_disponibles = list(Producto.objects.filter(activo=True))
        if not productos_disponibles:
            self.stdout.write(self.style.ERROR('No hay productos.'))
            return

        hoy_dt = timezone.now()
        total_boletas_mes = 0

        # --- BUCLE DE 30 DÍAS HACIA ATRÁS ---
        for d in range(30, -1, -1):
            fecha_simulada = hoy_dt.date() - timedelta(days=d)
            self.stdout.write(f'Simulando día: {fecha_simulada}...')

            with transaction.atomic():
                # 1. Crear la Sesión de Caja para este día específico
                # La creamos como cerrada (esta_abierta=False) excepto si es el día de hoy
                es_hoy = (d == 0)
                
                caja = SesionCaja.objects.create(
                    usuario_apertura=usuario,
                    monto_inicial=15000,
                    esta_abierta=es_hoy,
                    fecha_cierre=None if es_hoy else timezone.make_aware(timezone.datetime.combine(fecha_simulada, timezone.datetime.min.time().replace(hour=21, minute=30)))
                )
                
                # Ajustamos la fecha de apertura manualmente
                hora_apertura = timezone.make_aware(timezone.datetime.combine(fecha_simulada, timezone.datetime.min.time().replace(hour=8, minute=50)))
                SesionCaja.objects.filter(id=caja.id).update(fecha_apertura=hora_apertura)

                # 2. Simular Ventas por hora
                for hora in range(9, 21):
                    # Flujo variable según la hora
                    if hora in [13, 14, 18, 19, 20]:
                        clientes = random.randint(10, 20)
                    else:
                        clientes = random.randint(2, 6)

                    for _ in range(clientes):
                        minuto = random.randint(0, 59)
                        momento_venta = timezone.make_aware(timezone.datetime.combine(fecha_simulada, timezone.datetime.min.time().replace(hour=hora, minute=minuto)))

                        venta = Venta.objects.create(
                            usuario=usuario,
                            sesion=caja,
                            metodo_pago=random.choice(['EFECTIVO', 'DEBITO', 'TRANSFERENCIA']),
                            total=0
                        )
                        # Forzamos la fecha de la venta
                        Venta.objects.filter(id=venta.id).update(fecha=momento_venta)

                        # Agregar productos al detalle
                        total_v = 0
                        items = random.sample(productos_disponibles, random.randint(1, 3))
                        detalles = []
                        
                        for p in items:
                            cant = random.randint(1, 2)
                            sub = cant * p.precio_venta
                            total_v += sub
                            detalles.append(DetalleVenta(
                                venta=venta, producto=p, cantidad=cant,
                                precio_unitario=p.precio_venta, subtotal=sub
                            ))
                        
                        DetalleVenta.objects.bulk_create(detalles)
                        Venta.objects.filter(id=venta.id).update(total=total_v)
                        total_boletas_mes += 1

        self.stdout.write(self.style.SUCCESS(f'✅ Simulación completada.'))
        self.stdout.write(self.style.SUCCESS(f'📊 Se generaron 31 sesiones de caja y {total_boletas_mes} ventas.'))