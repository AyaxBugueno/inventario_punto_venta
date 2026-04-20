from modulo_principal.models.usuarios import UsuarioCustom
from modulo_principal.serializers import UsuarioListaSerializer, UsuarioRegistroSerializer


class UsuarioService:
    
    @staticmethod
    def listar_usuarios():
        return UsuarioCustom.objects.all()
    
    @staticmethod
    def obtener_usuario_por_id(usuario_id):
        try:
            return UsuarioCustom.objects.get(id=usuario_id)
        except UsuarioCustom.DoesNotExist:
            return None
    
    @staticmethod
    def obtener_serializers():
        return {
            'lista': UsuarioListaSerializer,
            'registro': UsuarioRegistroSerializer,
        }
    
    @staticmethod
    def get_serializer_class(action):
        if action == 'create':
            return UsuarioRegistroSerializer
        return UsuarioListaSerializer
