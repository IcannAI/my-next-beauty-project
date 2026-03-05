'use client';

import {
    createContext, useContext, useState,
    useEffect, useCallback, ReactNode
} from 'react';

export interface CartItem {
    productId: string;
    name: string;
    price: number;
    imageUrl: string | null;
    stock: number;
    quantity: number;
}

interface CartContextValue {
    items: CartItem[];
    totalCount: number;
    totalAmount: number;
    addItem: (item: Omit<CartItem, 'quantity'>) => void;
    removeItem: (productId: string) => void;
    updateQty: (productId: string, quantity: number) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    // 從 localStorage 載入
    useEffect(() => {
        try {
            const saved = localStorage.getItem('beautylive_cart');
            if (saved) setItems(JSON.parse(saved));
        } catch { }
    }, []);

    // 同步到 localStorage
    useEffect(() => {
        try {
            localStorage.setItem('beautylive_cart', JSON.stringify(items));
        } catch { }
    }, [items]);

    const addItem = useCallback((newItem: Omit<CartItem, 'quantity'>) => {
        setItems(prev => {
            const existing = prev.find(i => i.productId === newItem.productId);
            if (existing) {
                return prev.map(i =>
                    i.productId === newItem.productId
                        ? { ...i, quantity: Math.min(i.quantity + 1, i.stock) }
                        : i
                );
            }
            return [...prev, { ...newItem, quantity: 1 }];
        });
    }, []);

    const removeItem = useCallback((productId: string) => {
        setItems(prev => prev.filter(i => i.productId !== productId));
    }, []);

    const updateQty = useCallback((productId: string, quantity: number) => {
        if (quantity <= 0) {
            setItems(prev => prev.filter(i => i.productId !== productId));
        } else {
            setItems(prev =>
                prev.map(i =>
                    i.productId === productId
                        ? { ...i, quantity: Math.min(quantity, i.stock) }
                        : i
                )
            );
        }
    }, []);

    const clearCart = useCallback(() => setItems([]), []);

    const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    return (
        <CartContext.Provider value={{
            items, totalCount, totalAmount,
            addItem, removeItem, updateQty, clearCart,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
}
