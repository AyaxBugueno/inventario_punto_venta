from ..models import Producto,Categoria
from rest_framework import serializers


#-------------------Productos-------------------------


class ProductoSerializer(serializers.ModelSerializer):
    Categoria_nombre = serializers.CharField(source = 'categoria.nombre', read_only=True)
    
    class Meta:
        model = Producto
        fields = '__all__'


class CategoriaSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Categoria
        fields = '__all__'
