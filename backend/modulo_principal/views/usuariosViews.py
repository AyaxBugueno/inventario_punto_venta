from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from modulo_principal.models import UsuarioCustom
from modulo_principal.serializers import UsuarioListaSerializer
from modulo_principal.services.usuarioservices.usuarioservices import UsuarioService


class UsuarioViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    authentication_classes = []
    queryset = UsuarioCustom.objects.all()
    pagination_class = None

    def get_serializer_class(self):
        return UsuarioService.get_serializer_class(self.action)


class UserProfileView(APIView):
    # permission_classes = [AllowAny]

    def get(self, request):
        serializer = UsuarioListaSerializer(request.user)
        return Response(serializer.data)
