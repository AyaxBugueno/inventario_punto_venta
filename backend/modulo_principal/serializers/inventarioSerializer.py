from ..models import Producto,Categoria
from rest_framework import serializers


#-------------------Productos-------------------------


class ProductoSerializer(serializers.ModelSerializer):
    Categoria_nombre = serializers.CharField(source = 'categoria.nombre', read_only=True)
    
    class Meta:
        model = Producto
        fields = '__all__'
    
    def validate(self, data):
        # self.instance solo existe cuando estamos haciendo un UPDATE (PUT/PATCH)
        # Si es un POST (crear producto nuevo), esto se lo salta.
        if self.instance:
            # Obtenemos el código que manda React, si no manda nada, asumimos que es el que ya tenía
            nuevo_codigo = data.get('codigo_serie', self.instance.codigo_serie)
            
            # REGLA 1: ¿Intentaron cambiar el código de barras?
            if nuevo_codigo != self.instance.codigo_serie:
                
                # REGLA 2: ¿El producto tiene historial de ventas?
                # Usamos el related_name 'ventas_historicas' de tu modelo DetalleVenta
                if self.instance.ventas_historicas.exists():
                    
                    # Lanzamos el error amarrado al campo específico 'codigo_serie'
                    raise serializers.ValidationError({
                        "codigo_serie": "No se puede modificar el código de barras porque este producto ya tiene ventas asociadas."
                    })
                    
        return data


class CategoriaSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Categoria
        fields = '__all__'
