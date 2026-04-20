from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework.permissions import AllowAny


class CookieTokenObtainPairView(TokenObtainPairView):
    permission_classes =[AllowAny]

    def post(self, request, *args, **kwargs):

        response = super().post(request, *args, **kwargs)

       

        if response.status_code == 200:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')

            response.set_cookie(
                key=settings.AUTH_COOKIE,
                value=access_token,
                httponly=settings.AUTH_COOKIE_HTTP_ONLY,
                secure=settings.AUTH_COOKIE_SECURE,
                samesite=settings.AUTH_COOKIE_SAMESITE,
                path=settings.AUTH_COOKIE_PATH,
            )

            response.set_cookie(
                key=settings.AUTH_COOKIE_REFRESH,
                value=refresh_token,
                httponly=settings.AUTH_COOKIE_HTTP_ONLY,
                secure=settings.AUTH_COOKIE_SECURE,
                samesite=settings.AUTH_COOKIE_SAMESITE,
                path=settings.AUTH_COOKIE_PATH
            )

            del response.data['access']
            del response.data['refresh']
            response.data['message'] = 'Login exitoso. Cookies establecidas'




        return response




class CookieTokenRefreshView(TokenRefreshView):
    permission_classes =[AllowAny]

    def post(self, request, *args, **kwargs):
      
        refresh_token = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)
        
    
        mutable_data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        
        if refresh_token:
            mutable_data['refresh'] = refresh_token
        else:
          
            return Response(
                {"detail": "No se encontró la cookie 'refresh_token'."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=mutable_data)

        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])

        response = Response(serializer.validated_data, status=status.HTTP_200_OK)

     
        access_token = serializer.validated_data.get('access')
        response.set_cookie(
            key=settings.AUTH_COOKIE,
            value=access_token,
            httponly=settings.AUTH_COOKIE_HTTP_ONLY,
            secure=settings.AUTH_COOKIE_SECURE,
            samesite=settings.AUTH_COOKIE_SAMESITE,
            path=settings.AUTH_COOKIE_PATH,
        )

        # Si se rotó el refresh token, actualizar la cookie
        if 'refresh' in serializer.validated_data:
            refresh_token = serializer.validated_data.get('refresh')
            response.set_cookie(
                key=settings.AUTH_COOKIE_REFRESH,
                value=refresh_token,
                httponly=settings.AUTH_COOKIE_HTTP_ONLY,
                secure=settings.AUTH_COOKIE_SECURE,
                samesite=settings.AUTH_COOKIE_SAMESITE,
                path=settings.AUTH_COOKIE_PATH
            )

        
        del response.data['access']
        if 'refresh' in response.data:
            del response.data['refresh']

        response.data['message'] = 'Sesión renovada'
        return response

class LogoutView(APIView):
    permission_classes =[AllowAny]

    def post(self, request):
        response = Response({"message":"Logout exitoso"},status=status.HTTP_200_OK)

        response.delete_cookie(settings.AUTH_COOKIE)
        response.delete_cookie(settings.AUTH_COOKIE_REFRESH)
        return response