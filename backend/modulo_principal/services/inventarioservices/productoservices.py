from django.db.models import Q
from django.db import transaction

from modulo_principal.models.inventario import Producto, Categoria


class ProductoService:
    
    @staticmethod
    def listar_productos():
        return Producto.objects.select_related('categoria').all().order_by(
            '-activo', '-stock_actual', 'nombre'
        )
    
    @staticmethod
    def obtener_producto_por_id(producto_id):
        try:
            return Producto.objects.get(id=producto_id)
        except Producto.DoesNotExist:
            return None
    
    @staticmethod
    def crear_producto(datos):
        return Producto.objects.create(**datos)
    
    @staticmethod
    def actualizar_producto(producto, datos):
        for attr, value in datos.items():
            setattr(producto, attr, value)
        producto.save()
        return producto
    
    @staticmethod
    def puede_eliminar(producto):
        from django.db.models.deletion import ProtectedError
        try:
            producto.delete()
            return True, None
        except ProtectedError:
            return False, {
                "error": "No se puede eliminar este producto porque tiene ventas asociadas.",
                "detalle": "Para mantener la integridad de tu historial contable, el sistema protege los productos que ya han sido vendidos."
            }
    
    @staticmethod
    def listar_productos_simple():
        return Producto.objects.values('id', 'nombre', 'stock_actual', 'precio_venta')
    
    @staticmethod
    @transaction.atomic
    def ajustar_stock(producto, tipo_ajuste, cantidad, motivo_detalle, usuario):
        cantidad = int(cantidad)
        if cantidad <= 0:
            raise ValueError("La cantidad debe ser mayor a 0.")
        
        if tipo_ajuste == 'CARGA':
            cantidad_cambio = cantidad
            tipo_movimiento = 'ENTRADA_AJUSTE'
            motivo_final = f"Carga de Stock: {motivo_detalle}"
        elif tipo_ajuste == 'DESCUENTO':
            cantidad_cambio = -cantidad
            tipo_movimiento = 'SALIDA_AJUSTE'
            motivo_final = f"Descuento por {motivo_detalle}"
        else:
            raise ValueError("El tipo_ajuste debe ser CARGA o DESCUENTO.")
        
        producto.modificar_stock(
            cantidad_cambio=cantidad_cambio,
            tipo_movimiento=tipo_movimiento,
            motivo=motivo_final,
            usuario=usuario
        )
        producto.refresh_from_db()
        
        return {
            "mensaje": "Stock actualizado correctamente.",
            "nuevo_stock": producto.stock_actual
        }
    
    @staticmethod
    def buscar_para_pos(query):
        if not query:
            return []
        
        exact_match = list(Producto.objects.filter(
            activo=True,
            stock_actual__gt=0,
            codigo_serie=query
        ).values('id', 'nombre', 'codigo_serie', 'precio_venta', 'stock_actual')[:1])
        
        if exact_match:
            return exact_match
        
        return list(Producto.objects.filter(
            Q(nombre__icontains=query) | Q(codigo_serie__icontains=query),
            activo=True,
            stock_actual__gt=0
        ).values('id', 'nombre', 'codigo_serie', 'precio_venta', 'stock_actual')[:10])
