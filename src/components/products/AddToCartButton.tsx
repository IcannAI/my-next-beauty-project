'use client';

import { useCart } from '@/components/cart/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check } from 'lucide-react';
import { useState } from 'react';

interface Props {
    productId: string;
    name: string;
    price: number;
    imageUrl: string | null;
    stock: number;
}

export default function AddToCartButton({
    productId, name, price, imageUrl, stock
}: Props) {
    const { addItem } = useCart();
    const [added, setAdded] = useState(false);

    const handleAdd = () => {
        if (stock <= 0) return;
        addItem({ productId, name, price, imageUrl, stock });
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    if (stock <= 0) {
        return (
            <Button
                disabled
                className="flex-1 py-10 h-auto text-2xl font-black italic tracking-tighter rounded-[2rem] bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
            >
                已售完
            </Button>
        );
    }

    return (
        <Button
            onClick={handleAdd}
            className={`flex-1 py-10 h-auto text-2xl font-black italic tracking-tighter rounded-[2rem] shadow-2xl transition-all active:scale-95 ${added
                    ? 'bg-green-500 hover:bg-green-500 shadow-green-200 dark:shadow-none'
                    : 'bg-rose-500 hover:bg-rose-600 shadow-rose-200 dark:shadow-none'
                } text-white`}
        >
            {added ? (
                <span className="flex items-center gap-2">
                    <Check className="w-6 h-6" />
                    已加入購物車
                </span>
            ) : (
                <span className="flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6" />
                    加入購物車
                </span>
            )}
        </Button>
    );
}
