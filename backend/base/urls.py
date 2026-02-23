from django.contrib import admin
from django.urls import path,include
from modulo_principal.views import CookieTokenObtainPairView, CookieTokenRefreshView, LogoutView, UserProfileView



urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/',include('modulo_principal.urls')),
    path('api/', include('punto_venta.urls')),
    
    #vistas de sesión
    path('api/token/', CookieTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('api/logout/', LogoutView.as_view(), name='logout'),
    path('api/me/',UserProfileView.as_view(), name='user-profile'),
]
