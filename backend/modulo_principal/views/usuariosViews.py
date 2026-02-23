from rest_framework import viewsets
from ..models import UsuarioCustom
from ..serializers import UsuarioListaSerializer, UsuarioRegistroSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny


class UsuarioViewSet(viewsets.ModelViewSet):

    permission_classes = [AllowAny]#quitar en produccion
    authentication_classes = []#quitar en produccion

    queryset = UsuarioCustom.objects.all()
    pagination_class = None

    def get_serializer_class(self):
        
        if self.action == 'create':
            return UsuarioRegistroSerializer
        
        return UsuarioListaSerializer

#vista para mantener autenticado al usuario

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UsuarioListaSerializer(request.user)
        return Response(serializer.data)