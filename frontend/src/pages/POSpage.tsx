import { useState } from 'react';
import { POSTemplate } from '../components/templates/PosTemplate';
import { ProductFinder } from '../components/molecules/ProductFinder';
import { SaleTable } from '../components/organisms/SaleTable';
import { ventaService } from '../services/venta.service';
import { Banknote, CreditCard, Landmark, ShoppingCart } from 'lucide-react';

// Importamos el store global de Zustand
import { useCartStore } from '../store/useCartStore';

const POSPage = () => {
    // Selectores de Zustand (Mejor rendimiento, evita re-renders innecesarios)
    const cartItems = useCartStore((state) => state.cartItems);
    const cartTotal = useCartStore((state) => state.cartTotal);
    const addToCart = useCartStore((state) => state.addToCart);
    const removeFromCart = useCartStore((state) => state.removeFromCart);
    const clearCart = useCartStore((state) => state.clearCart);

    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');

    const handleProcessSale = async () => {
        if (cartItems.length === 0) return;
        
        setIsProcessing(true);
        try {
            const payload = {
                metodo_pago: paymentMethod,
                detalles: cartItems.map(item => ({
                    producto_id: item.producto.id,
                    cantidad: item.cantidad
                }))
            };

            const nuevaVenta = await ventaService.create(payload as any);
            alert(`✅ Venta exitosa por $${nuevaVenta.total.toLocaleString()}`);
            clearCart();

        } catch (error: any) {
            console.error("Error procesando venta:", error);
            const msg = error.response?.data?.error || "Error al procesar la venta.";
            alert(`❌ ${msg}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const ScannerArea = <ProductFinder onProductSelected={addToCart} />;
    const CartArea = <SaleTable items={cartItems} onRemove={removeFromCart} />;
    
    const SummarySidebar = (
        <div className="h-full flex flex-col justify-between bg-white rounded-xl shadow-[0_4px_24px_0_rgba(0,0,0,0.06)] border border-slate-100 p-6">
            
            {/* Parte Superior del Sidebar */}
            <div>
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                        <ShoppingCart size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Resumen de Venta</h2>
                </div>
                
                {/* Selector Método Pago */}
                <div className="mb-8">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                        Método de Pago
                    </label>
                    <div className="relative">
                        <select 
                            className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold p-3.5 pl-10 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all cursor-pointer shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                            value={paymentMethod}
                            onChange={e => setPaymentMethod(e.target.value)}
                        >  
                            <option value="EFECTIVO">Efectivo</option>
                            <option value="DEBITO">Tarjeta de Débito</option>
                            <option value="CREDITO">Tarjeta de Crédito</option>
                            <option value="TRANSFERENCIA">Transferencia</option>
                        </select>
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            {paymentMethod === 'EFECTIVO' && <Banknote size={18} />}
                            {(paymentMethod === 'DEBITO' || paymentMethod === 'CREDITO') && <CreditCard size={18} />}
                            {paymentMethod === 'TRANSFERENCIA' && <Landmark size={18} />}
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                {/* Subtotales */}
                <div className="space-y-3 px-2">
                    <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                        <span>Total Ítems:</span>
                        <span className="text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{cartItems.length}</span>
                    </div>
                </div>
            </div>

            {/* Parte Inferior (Total y Botón) */}
            <div className="mt-auto pt-6">
                <div className="bg-slate-800 p-5 rounded-2xl shadow-lg mb-6 relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"></div>
                    
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total a Pagar</span>
                    <span className="block text-4xl font-black text-white tracking-tight">
                        <span className="text-emerald-400 mr-1">$</span>
                        {cartTotal.toLocaleString()}
                    </span>
                </div>

                <button 
                    onClick={handleProcessSale}
                    disabled={cartItems.length === 0 || isProcessing}
                    className={`relative w-full p-4 rounded-xl text-lg font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden
                        ${cartItems.length === 0 || isProcessing 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                            : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none'
                        }
                    `}
                >
                    {isProcessing ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Procesando...</span>
                        </>
                    ) : (
                        <span>Cobrar (F10)</span>
                    )}
                </button>
                <p className="text-center text-[11px] font-medium text-slate-400 mt-4 uppercase tracking-wider">
                    Asegúrese de recibir el pago
                </p>
            </div>
        </div>
    );

    return (
        <POSTemplate 
            scannerArea={ScannerArea}
            cartArea={CartArea}
            summarySidebar={SummarySidebar}
        />
    );
};

export default POSPage;