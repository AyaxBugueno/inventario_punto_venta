from modulo_principal.models.kardex import MovimientoKardex


class KardexService:
    
    @staticmethod
    def listar_movimientos():
        return MovimientoKardex.objects.select_related('producto', 'usuario').all()
    
    @staticmethod
    def obtener_movimiento_por_id(movimiento_id):
        try:
            return MovimientoKardex.objects.select_related('producto', 'usuario').get(id=movimiento_id)
        except MovimientoKardex.DoesNotExist:
            return None
    
    @staticmethod
    def obtener_movimientos_por_producto(producto_id):
        return MovimientoKardex.objects.select_related('producto', 'usuario').filter(
            producto_id=producto_id
        ).order_by('-fecha')
