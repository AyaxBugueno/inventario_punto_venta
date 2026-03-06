import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model
from modulo_principal.models import Producto, MovimientoKardex 
from punto_venta.models import Venta, DetalleVenta, SesionCaja

User = get_user_model()

class Command(BaseCommand):
    help = 'Simula 1 año de historial de cajas/ventas y garantiza 26+ movimientos de Kardex por producto para probar paginación.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('🔥 INICIANDO STRESS TEST: 1 AÑO & 26+ KARDEX POR PRODUCTO GARANTIZADOS'))

        usuario = User.objects.first()
        productos = list(Producto.objects.all())
        
        if not productos or not usuario:
            self.stdout.write(self.style.ERROR('Error: Necesitas al menos un usuario y productos registrados.'))
            return

        ahora = timezone.now()

        # =========================================================
        # FASE 1: GARANTIZAR 26 MOVIMIENTOS POR PRODUCTO (Para UI)
        # =========================================================
        self.stdout.write('Inyectando 26 movimientos base por producto para asegurar la paginación (3 páginas)...')
        kardex_base = []
        
        with transaction.atomic():
            for p in productos:
                stock_ficticio = 100
                for i in range(26):
                    # Distribuimos aleatoriamente estos 26 registros en los últimos 360 días
                    dias_atras = random.randint(1, 360)
                    fecha_mov = ahora - timedelta(days=dias_atras, hours=random.randint(1, 23), minutes=random.randint(0, 59))
                    
                    es_entrada = random.choice([True, False])
                    cant = random.randint(1, 5)
                    nuevo_stock = stock_ficticio + cant if es_entrada else stock_ficticio - cant
                    
                    kardex_base.append(MovimientoKardex(
                        producto=p,
                        usuario=usuario,
                        tipo_movimiento='ENTRADA_AJUSTE' if es_entrada else 'SALIDA_AJUSTE',
                        cantidad=cant,
                        stock_anterior=stock_ficticio,
                        stock_nuevo=nuevo_stock,
                        motivo=f"Ajuste automático para paginación #{i+1}",
                        fecha=fecha_mov
                    ))
                    stock_ficticio = nuevo_stock
                    
            # bulk_create inserta miles de registros en SQLite en una sola pasada de disco (amigable con HDD)
            MovimientoKardex.objects.bulk_create(kardex_base)
            
        self.stdout.write(self.style.SUCCESS(f'✅ {len(kardex_base)} movimientos base inyectados correctamente.'))

        # =========================================================
        # FASE 2: GENERAR 1 AÑO DE CAJAS Y VENTAS (Realismo)
        # =========================================================
        DIAS_TOTALES = 365
        for mes_atras in range(11, -1, -1):
            fecha_referencia = ahora - timedelta(days=mes_atras * 30)
            self.stdout.write(f'Generando ventas y cajas para: {fecha_referencia.strftime("%B %Y")}...')
            
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

                    # 2. Generar entre 3 y 8 ventas diarias para no saturar SQLite pero dar continuidad
                    ventas_del_dia = random.randint(3, 8)
                    
                    for _ in range(ventas_del_dia):
                        hora_v = random.randint(9, 21) 
                        min_v = random.randint(0, 59)
                        momento_venta = timezone.make_aware(timezone.datetime(fecha_dia.year, fecha_dia.month, fecha_dia.day, hora_v, min_v, 0))

                        venta = Venta.objects.create(
                            usuario=usuario,
                            sesion=caja,
                            metodo_pago=random.choice(['EFECTIVO', 'DEBITO', 'TRANSFERENCIA']),
                            total=0 
                        )

                        total_v = 0
                        detalles = []
                        kardex_ventas = [] 
                        
                        items = random.sample(productos, random.randint(1, 3))
                        for p in items:
                            cant = random.randint(1, 2)
                            sub = cant * p.precio_venta
                            total_v += sub
                            
                            detalles.append(DetalleVenta(
                                venta=venta, producto=p, cantidad=cant,
                                precio_unitario=p.precio_venta, subtotal=sub
                            ))

                            stock_previo_ficticio = random.randint(cant, 100) 

                            kardex_ventas.append(MovimientoKardex(
                                producto=p,
                                usuario=usuario,
                                tipo_movimiento='SALIDA_VENTA',
                                cantidad=cant,
                                stock_anterior=stock_previo_ficticio,
                                stock_nuevo=stock_previo_ficticio - cant,
                                motivo=f"Venta Simulada #{str(venta.id)[:8]}",
                                fecha=momento_venta 
                            ))
                        
                        DetalleVenta.objects.bulk_create(detalles)
                        MovimientoKardex.objects.bulk_create(kardex_ventas)
                        Venta.objects.filter(id=venta.id).update(fecha=momento_venta, total=total_v)

        self.stdout.write(self.style.SUCCESS('✅ ¡STRESS TEST FINALIZADO! Tienes 1 año de cajas y +26 Kardex por producto garantizados.'))