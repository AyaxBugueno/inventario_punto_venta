from rest_framework.pagination import PageNumberPagination

class EstándarPagination(PageNumberPagination):
    """
    Paginador estándar para todo el SaaS.
    Devuelve siempre 10 registros por página, permitiendo cambiar el tamaño
    vía query param ?page_size=20 hasta un máximo de 100.
    """
    page_size = 10 
    page_query_param = 'page'
    page_size_query_param = 'page_size'
    max_page_size = 100