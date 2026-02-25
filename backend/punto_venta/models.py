import uuid
from django.db import models, transaction
from django.conf import settings
from django.core.exceptions import ValidationError
from modulo_principal.models import Producto # Ya no importamos Lote
from django.utils import timezone

class SesionCaja(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Quién abrió la caja
    usuario_apertura = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='cajas_abiertas'
    )
    
    # Tiempos
    fecha_apertura = models.DateTimeField(auto_now_add=True, db_index=True)
    fecha_cierre = models.DateTimeField(null=True, blank=True)
    
    # Control de dinero
    monto_inicial = models.PositiveIntegerField(default=0, help_text="Sencillo o vuelto inicial")
    
    # Estado de la caja
    esta_abierta = models.BooleanField(default=True, db_index=True)

    class Meta:
        verbose_name = "Sesión de Caja"
        verbose_name_plural = "Sesiones de Caja"
        ordering = ['-fecha_apertura']

    def __str__(self):
        estado = "ABIERTA" if self.esta_abierta else "CERRADA"
        return f"Caja {str(self.id)[:8]} - {estado} ({self.fecha_apertura.strftime('%d/%m/%Y')})"

    def cerrar_caja(self):
        """Método de utilidad para cerrar la sesión actual."""
        if not self.esta_abierta:
            raise ValidationError("Esta caja ya se encuentra cerrada.")
        
        self.esta_abierta = False
        self.fecha_cierre = timezone.now()
        self.save(update_fields=['esta_abierta', 'fecha_cierre'])


class Venta(models.Model):

    sesion = models.ForeignKey(
        SesionCaja,
        on_delete=models.PROTECT,
        related_name='ventas',
        null=True,  # Permitimos nulos temporalmente
        blank=True
    )
    
    METODOS_PAGO = [
        ('EFECTIVO', 'Efectivo'),
        ('DEBITO', 'Tarjeta Débito'),
        ('CREDITO', 'Tarjeta Crédito'),
        ('TRANSFERENCIA', 'Transferencia'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='ventas_realizadas'
    )
    
    fecha = models.DateTimeField(auto_now_add=True, db_index=True)
    total = models.PositiveIntegerField(default=0)
    metodo_pago = models.CharField(max_length=20, choices=METODOS_PAGO, default='EFECTIVO')
    
    anulada = models.BooleanField(default=False)

    def __str__(self):
        return f"Venta {str(self.id)[:8]} - ${self.total}"

    def anular_venta(self):
        """
        Método para anular la venta y devolver el stock a los productos.
        Se usa transaction.atomic para asegurar que si algo falla, no se altere la BD.
        """
        if self.anulada:
            raise ValidationError("Esta venta ya está anulada.")
            
        with transaction.atomic():
            self.anulada = True
            self.save(update_fields=['anulada'])
            
            # Devolver el stock de cada detalle al producto
            for detalle in self.detalles.all():
                producto = detalle.producto
                producto.stock_actual = models.F('stock_actual') + detalle.cantidad
                producto.save(update_fields=['stock_actual'])
                # Nota: El save() del producto evaluará si debe volver a cambiar 'activo' a True

    class Meta:
        verbose_name = "Venta"
        verbose_name_plural = "Ventas"
        ordering = ['-fecha']


class DetalleVenta(models.Model):
    venta = models.ForeignKey(
        Venta, 
        on_delete=models.CASCADE, 
        related_name='detalles'
    )
    
    producto = models.ForeignKey(
        Producto, 
        on_delete=models.PROTECT,
        related_name='ventas_historicas'
    )
    
    # ADIÓS AL CAMPO LOTE 👋
    
    cantidad = models.PositiveIntegerField()
    precio_unitario = models.PositiveIntegerField(verbose_name="Precio al momento de venta")
    subtotal = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.cantidad}x {self.producto.nombre}"
    
    def save(self, *args, **kwargs):
        # Auto-calcular el subtotal por seguridad si no viene
        if not self.subtotal:
            self.subtotal = self.cantidad * self.precio_unitario
        super().save(*args, **kwargs)



