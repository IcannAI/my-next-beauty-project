'use client';

import { useState } from 'react';
import { useCart } from './CartContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function CartDrawer() {
    const [open, setOpen] = useState(false);
    const [checkingOut, setCheckingOut] = useState(false);
    const { items, totalCount, totalAmount, removeItem, updateQty, clearCart } = useCart();
    const { data: session } = useSession();
    const router = useRouter();

    const handleCheckout = async () => {
        if (!session) {
            router.push('/login');
            return;
        }
        if (items.length === 0) return;
        setCheckingOut(true);
        try {
            const res = await fetch('/api/orders/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || '結帳失敗');
                return;
            }
            clearCart();
            setOpen(false);
            router.push('/orders?checkout=success');
        } catch {
            alert('結帳失敗，請重試');
        } finally {
            setCheckingOut(false);
        }
    };

    return (
        <>
            {/* 懸浮購物車按鈕（右下角） */}
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-white shadow-2xl shadow-rose-500/30 hover:bg-rose-600 transition-all hover:scale-110 active:scale-95"
            >
                <ShoppingCart className="h-6 w-6" />
                {totalCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-rose-500 ring-2 ring-rose-500">
                        {totalCount > 99 ? '99+' : totalCount}
                    </span>
                )}
            </button>

            {/* 遮罩 */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* 側邊抽屜 */}
            <div className={cn(
                'fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-gray-950 shadow-2xl transition-transform duration-300 flex flex-col',
                open ? 'translate-x-0' : 'translate-x-full'
            )}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <ShoppingBag className="h-5 w-5 text-rose-500" />
                        <h2 className="text-lg font-black text-white">購物車</h2>
                        {totalCount > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white">
                                {totalCount}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* 購物車內容 */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                            <ShoppingCart className="h-16 w-16 text-gray-700" />
                            <p className="font-bold text-gray-500">購物車是空的</p>
                            <Button
                                variant="ghost"
                                onClick={() => { setOpen(false); router.push('/search'); }}
                                className="rounded-full text-rose-500 hover:text-rose-400"
                            >
                                去逛逛
                            </Button>
                        </div>
                    ) : (
                        items.map(item => (
                            <div
                                key={item.productId}
                                className="flex items-center gap-3 p-3 bg-gray-900 rounded-2xl border border-white/5"
                            >
                                {/* 圖片 */}
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
                                    {item.imageUrl ? (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xl">🛍️</div>
                                    )}
                                </div>

                                {/* 資訊 */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white text-sm truncate">{item.name}</p>
                                    <p className="text-rose-500 font-black text-sm">
                                        NT$ {(item.price * item.quantity).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        單價 NT$ {item.price.toLocaleString()}
                                    </p>
                                </div>

                                {/* 數量控制 */}
                                <div className="flex flex-col items-end gap-2">
                                    <button
                                        onClick={() => removeItem(item.productId)}
                                        className="text-gray-600 hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => updateQty(item.productId, item.quantity - 1)}
                                            className="h-6 w-6 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white transition-colors"
                                        >
                                            <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="w-6 text-center text-sm font-bold text-white">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQty(item.productId, item.quantity + 1)}
                                            disabled={item.quantity >= item.stock}
                                            className="h-6 w-6 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white transition-colors disabled:opacity-30"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer 結帳 */}
                {items.length > 0 && (
                    <div className="px-4 py-5 border-t border-white/5 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 font-bold text-sm">總計</span>
                            <span className="text-2xl font-black text-white">
                                NT$ {totalAmount.toLocaleString()}
                            </span>
                        </div>
                        <Button
                            onClick={handleCheckout}
                            disabled={checkingOut}
                            className="w-full rounded-full bg-rose-500 hover:bg-rose-600 text-white font-black h-12 text-base"
                        >
                            {checkingOut ? '處理中...' : `結帳 (${totalCount} 件)`}
                        </Button>
                        <button
                            onClick={clearCart}
                            className="w-full text-xs text-gray-500 hover:text-gray-400 font-bold py-1 transition-colors"
                        >
                            清空購物車
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
