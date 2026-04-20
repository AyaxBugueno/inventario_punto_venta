from rest_framework import status
from rest_framework.response import Response
from django.db.models import Q

from modulo_principal.models.inventario import Categoria


class CategoriaService:
    
    @staticmethod
    def listar_categorias():
        return Categoria.objects.all()
    
    @staticmethod
    def obtener_categoria_por_id(categoria_id):
        try:
            return Categoria.objects.get(id=categoria_id)
        except Categoria.DoesNotExist:
            return None
    
    @staticmethod
    def crear_categoria(datos):
        return Categoria.objects.create(**datos)
    
    @staticmethod
    def actualizar_categoria(categoria, datos):
        for attr, value in datos.items():
            setattr(categoria, attr, value)
        categoria.save()
        return categoria
    
    @staticmethod
    def eliminar_categoria(categoria):
        categoria.delete()
    
    @staticmethod
    def buscar_categorias(query):
        return Categoria.objects.filter(
            Q(nombre__icontains=query)
        ).only('id', 'nombre')[:3]
