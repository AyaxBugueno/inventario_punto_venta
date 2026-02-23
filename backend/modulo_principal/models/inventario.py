from django.db import models

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
    
    # --- NUEVOS CAMPOS DE STOCK INTEGRADO ---
    stock_actual = models.PositiveIntegerField(default=0, verbose_name="Stock Disponible")
    stock_critico = models.PositiveIntegerField(default=5, help_text="Nivel mínimo para alertas de bajo stock")
    
    activo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.nombre}"
    
    def save(self, *args, **kwargs):
        # Lógica Fricción Cero: Si el stock llega a 0, se desactiva solo.
        if self.stock_actual <= 0 and self.activo:
            self.activo = False
        # Si le vuelven a cargar stock y estaba inactivo, se activa solo.
        elif self.stock_actual > 0 and not self.activo:
            self.activo = True
            
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Producto"
        ordering = ['nombre']