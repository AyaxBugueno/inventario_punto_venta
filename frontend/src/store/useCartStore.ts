// src/store/useCartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type CartItem } from '../domain/models/Venta';
import { type Producto } from '../domain/models/Producto';

interface CartState {
    cartItems: CartItem[];
    cartTotal: number;
    
    addToCart: (producto: Producto, cantidad: number) => void;
    removeFromCart: (indexToRemove: number) => void;
    clearCart: () => void;
}

// Envolvemos el store con persist()
export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            cartItems: [],
            cartTotal: 0,

            addToCart: (producto, cantidad) => {
                const { cartItems } = get();

                if (cantidad > producto.stock_actual) {
                    alert(`¡Atención! Solo quedan ${producto.stock_actual} unidades de ${producto.nombre}.`);
                    return;
                }

                const existingItemIndex = cartItems.findIndex(item => item.producto.id === producto.id);
                let newItems = [...cartItems];

                if (existingItemIndex > -1) {
                    const updatedItem = newItems[existingItemIndex];
                    
                    if (updatedItem.cantidad + cantidad > producto.stock_actual) {
                        alert("No puedes agregar más de este producto, superas el stock disponible.");
                        return;
                    }

                    newItems[existingItemIndex] = {
                        ...updatedItem,
                        cantidad: updatedItem.cantidad + cantidad,
                        subtotal: updatedItem.precio_congelado * (updatedItem.cantidad + cantidad)
                    };
                } else {
                    const newItem: CartItem = {
                        producto,
                        cantidad,
                        precio_congelado: producto.precio_venta,
                        subtotal: producto.precio_venta * cantidad
                    };
                    newItems.push(newItem);
                }

                const newTotal = newItems.reduce((sum, item) => sum + item.subtotal, 0);
                set({ cartItems: newItems, cartTotal: newTotal });
            },

            removeFromCart: (indexToRemove) => {
                const newItems = get().cartItems.filter((_, index) => index !== indexToRemove);
                const newTotal = newItems.reduce((sum, item) => sum + item.subtotal, 0);
                set({ cartItems: newItems, cartTotal: newTotal });
            },

            clearCart: () => set({ cartItems: [], cartTotal: 0 })
        }),
        {
            name: 'pos-cart-storage', // El nombre con el que se guardará en LocalStorage
        }
    )
);