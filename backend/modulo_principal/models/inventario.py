from django.db import models, transaction
from django.core.exceptions import ValidationError

#--------------------------------------CATEGORIA--------------------------------------
class Categoria(models.Model):
    nombre = models.CharField(max_length=100, unique=True, verbose_name="Nombre de Categoría")
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción")
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"
        ordering = ['nombre']

#--------------------------------------PRODUCTO--------------------------------------
class Producto(models.Model):
    categoria = models.ForeignKey(
        Categoria, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="productos"
    )
    nombre = models.CharField(max_length=200, db_index=True)
    descripcion = models.TextField(blank=True, verbose_name="Descripción")
    codigo_serie = models.CharField(max_length=13, unique=True, verbose_name="Código de Barras / SKU")
    precio_venta = models.PositiveIntegerField(default=0)
    
    stock_actual = models.PositiveIntegerField(default=0, verbose_name="Stock Disponible")
    stock_critico = models.PositiveIntegerField(default=5, help_text="Nivel mínimo para alertas")
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre

    @transaction.atomic
    def modificar_stock(self, cantidad_cambio, tipo_movimiento, motivo, usuario):
        """
        MOTOR DEL KARDEX. Única forma legal de alterar el stock.
        """
        if cantidad_cambio == 0:
            return

        stock_anterior = self.stock_actual
        nuevo_stock = stock_anterior + cantidad_cambio

        if nuevo_stock < 0:
            raise ValidationError(f"Stock negativo no permitido para '{self.nombre}'. (Intento: {nuevo_stock})")

        # 1. Guardar el nuevo stock
        self.stock_actual = nuevo_stock
        
        # 🚨 CORRECCIÓN: Solo lo desactivamos si llega a 0. NUNCA lo reactivamos automáticamente.
        if self.stock_actual <= 0 and self.activo:
            self.activo = False
            
        self.save(update_fields=['stock_actual', 'activo'])

        # 2. Lazy Import para evitar dependencia circular
        from .kardex import MovimientoKardex 

        # 3. Registrar el movimiento inmutable
        MovimientoKardex.objects.create(
            producto=self,
            usuario=usuario,
            tipo_movimiento=tipo_movimiento,
            cantidad=abs(cantidad_cambio),
            stock_anterior=stock_anterior,
            stock_nuevo=nuevo_stock,
            motivo=motivo
        )

    class Meta:
        verbose_name = "Producto"
        ordering = ['nombre']