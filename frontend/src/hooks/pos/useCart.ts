import { useState, useMemo } from 'react';
import { type CartItem } from '../../domain/models/Venta';
import { type Producto } from '../../domain/models/Producto';

export const useCart = () => {
    const [items, setItems] = useState<CartItem[]>([]);

    const total = useMemo(() => {
        return items.reduce((sum, item) => sum + item.subtotal, 0);
    }, [items]);

    const addToCart = (producto: Producto, cantidad: number) => {
        // 1. Usamos 'stock_actual' que es el nombre real en tu BD
        if (cantidad > producto.stock_actual) {
             alert(`¡Atención! Solo quedan ${producto.stock_actual} unidades de ${producto.nombre}.`);
             return;
        }

        setItems(prev => {
            // 2. Buscamos si el producto ya está en el carrito
            const existingItemIndex = prev.findIndex(item => item.producto.id === producto.id);

            if (existingItemIndex > -1) {
                // Si ya existe, creamos una nueva lista con la cantidad actualizada
                const newItems = [...prev];
                const updatedItem = newItems[existingItemIndex];
                
                // Validar que la suma no supere el stock
                if (updatedItem.cantidad + cantidad > producto.stock_actual) {
                    alert("No puedes agregar más de este producto, superas el stock disponible.");
                    return prev;
                }

                newItems[existingItemIndex] = {
                    ...updatedItem,
                    cantidad: updatedItem.cantidad + cantidad,
                    subtotal: updatedItem.precio_congelado * (updatedItem.cantidad + cantidad)
                };
                return newItems;
            }

            // 3. Si es nuevo, lo añadimos normalmente
            const newItem: CartItem = {
                producto,
                cantidad,
                precio_congelado: producto.precio_venta,
                subtotal: producto.precio_venta * cantidad
            };
            return [...prev, newItem];
        });
    };

    const removeFromCart = (indexToRemove: number) => {
        setItems(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const clearCart = () => setItems([]);

    return { cartItems: items, cartTotal: total, addToCart, removeFromCart, clearCart };
};