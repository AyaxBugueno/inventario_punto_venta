from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UsuarioViewSet, ProductoViewSet, GlobalSearchView,CategoriaViewSet


router = DefaultRouter()

#api de usuarios
router.register(r'usuarios',UsuarioViewSet, basename = 'usuario')

#api de inventario
router.register(r'categorias',CategoriaViewSet, basename='categoria')
router.register(r'productos',ProductoViewSet,basename = 'producto')



urlpatterns = [
    path('', include(router.urls)),
    path('global-search/',GlobalSearchView.as_view(), name='global-search')
]
