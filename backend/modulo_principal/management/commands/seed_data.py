from django.core.management.base import BaseCommand
from django.db import transaction
from faker import Faker
import random

# Asegúrate de que la ruta de importación sea la correcta para tu app
from modulo_principal.models import Producto, Categoria # Adiós a Lote

class Command(BaseCommand):
    help = 'Seed de alto rendimiento para Minimarket / Botillería (Fricción Cero)'

    def handle(self, *args, **kwargs):
        fake = Faker('es_CL')
        self.stdout.write(self.style.WARNING('Iniciando SEED MASIVO (Modo Minimarket Fricción Cero)...'))

        # Cantidades (ajustables) - 500 es un número súper realista para un minimarket
        CANT_PRODS = 500  

        with transaction.atomic():
            # ==========================================
            # 1. CATEGORÍAS (Rubro Minimarket/Botillería)
            # ==========================================
            self.stdout.write('Generando Categorías maestras...')
            
            # Diccionario ajustado al negocio real local
            mapa_categorias = {
                'Bebidas y Jugos': ['Coca-Cola 2L', 'Sprite 1.5L', 'Jugo Watts Durazno', 'Agua Mineral Cachantun', 'Gatorade Blue'],
                'Licores y Cervezas': ['Pisco Mistral 35°', 'Pisco Alto del Carmen 40°', 'Cerveza Cristal Lata', 'Cerveza Escudo', 'Vino Gato Tinto'],
                'Snacks y Salados': ['Papas Fritas Lays', 'Ramitas de Queso Evercrisp', 'Mani Salado', 'Doritos', 'Cheetos'],
                'Dulces y Chocolates': ['Super 8', 'Chocolate Trencito', 'Galletas Tritón', 'Gomitas Frugelé', 'Sahne Nuss'],
                'Abarrotes Básicos': ['Arroz Tucapel', 'Fideos Carozzi', 'Aceite Natura', 'Salsa de Tomate Pomarola', 'Azúcar Iansa'],
                'Lácteos y Fiambrería': ['Leche Colun Semidescremada', 'Yogur Soprole', 'Queso Gouda Soprole', 'Jamón Pierna San Jorge'],
                'Aseo del Hogar': ['Cloro Quix', 'Detergente Omo', 'Lavalozas Quix', 'Papel Higiénico Confort', 'Toallas Maravilla'],
                'Aseo Personal': ['Shampoo Ballerina', 'Jabón Le Sancy', 'Pasta Dental Colgate', 'Desodorante Axe', 'Cepillo de Dientes'],
                'Congelados': ['Helado Savory', 'Hamburguesas Receta del Abuelo', 'Papas Prefritas', 'Choclo Congelado'],
                'Panadería': ['Pan Hallulla (Kilo)', 'Pan Marraqueta (Kilo)', 'Pan de Molde Castaño', 'Empanadas de Pino']
            }

            categorias_creadas = {}
            for nombre_cat in mapa_categorias.keys():
                cat, _ = Categoria.objects.get_or_create(
                    nombre=nombre_cat,
                    defaults={'descripcion': f"Productos de la categoría {nombre_cat}"}
                )
                categorias_creadas[nombre_cat] = cat
                
            self.stdout.write(self.style.SUCCESS(f'✓ {len(categorias_creadas)} Categorías creadas.'))

            # ==========================================
            # 2. PRODUCTOS (Fricción Cero con Stock Integrado)
            # ==========================================
            self.stdout.write(f'Generando {CANT_PRODS} productos en memoria...')
            prods_buffer = []
            
            # Tamaños o variantes para darle realismo
            variantes = ['Normal', 'Light', 'Zero', 'Familiar', 'Promo', 'Individual']

            for _ in range(CANT_PRODS):
                # 1. Elegimos una categoría al azar
                nombre_categoria_elegida = random.choice(list(mapa_categorias.keys()))
                categoria_obj = categorias_creadas[nombre_categoria_elegida]
                
                # 2. Elegimos un producto base
                producto_base = random.choice(mapa_categorias[nombre_categoria_elegida])
                
                # Ejemplo: "Coca-Cola 2L Zero"
                nombre_prod = f"{producto_base} {random.choice(variantes)}"
                
                # Generamos un stock realista para un minimarket
                stock_generado = random.randint(0, 150)
                
                # Lógica Fricción Cero: Si el stock es 0, el producto nace inactivo.
                estado_activo = stock_generado > 0

                prods_buffer.append(
                    Producto(
                        categoria=categoria_obj,
                        nombre=nombre_prod,
                        descripcion=fake.text(max_nb_chars=80),
                        # Usamos EAN13 porque es el estándar en supermercados y almacenes
                        codigo_serie=fake.unique.ean13(), 
                        # Precios realistas para Chile (entre $500 y $15.000)
                        precio_venta=random.randint(5, 150) * 100, 
                        
                        # NUEVOS CAMPOS DE STOCK DIRECTO
                        stock_actual=stock_generado,
                        stock_critico=random.randint(5, 15),
                        activo=estado_activo
                    )
                )

            # INSERT MASIVO
            Producto.objects.bulk_create(prods_buffer, batch_size=2000)
            self.stdout.write(self.style.SUCCESS(f'✓ {CANT_PRODS} Productos insertados con su stock actual (Lotes eliminados).'))

        self.stdout.write(self.style.SUCCESS(f'🚀 SEED FINALIZADO: Tu Minimarket tiene {len(categorias_creadas)} Categorías y {CANT_PRODS} Productos listos para vender.'))