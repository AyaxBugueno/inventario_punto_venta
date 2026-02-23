from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VentaViewSet, DashboardDiaView

router = DefaultRouter()
router.register(r'ventas', VentaViewSet, basename='venta')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/hoy/', DashboardDiaView.as_view(), name='dashboard-hoy'),
]