from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VentaViewSet, DashboardDiaView, CajaActivaView, CerrarCajaView,HistorialCajasView

router = DefaultRouter()
router.register(r'ventas', VentaViewSet, basename='venta')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/hoy/', DashboardDiaView.as_view(), name='dashboard-hoy'),
    path('caja/activa/', CajaActivaView.as_view(), name='caja-activa'),
    path('caja/cerrar/', CerrarCajaView.as_view(), name='caja-cerrar'),
    path('caja/historial/', HistorialCajasView.as_view(), name='caja-historial')
]