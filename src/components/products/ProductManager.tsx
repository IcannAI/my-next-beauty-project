'use client';

import { useState, useCallback } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';

interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    stock: number;
}

interface Props {
    kolProfileId: string;
    initialProducts: Product[];
}

export default function ProductManager({
    kolProfileId,
    initialProducts,
}: Props) {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const handleImageUpload = useCallback((url: string) => {
        setPendingImageUrl(url);
    }, []);

    const handleSaveImage = async (productId: string) => {
        if (!pendingImageUrl) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/products/${productId}/update-image`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: pendingImageUrl }),
            });
            if (res.ok) {
                setProducts(prev =>
                    prev.map(p =>
                        p.id === productId
                            ? { ...p, imageUrl: pendingImageUrl }
                            : p
                    )
                );
                setEditingId(null);
                setPendingImageUrl(null);
                setMessage('圖片更新成功！');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch {
            setMessage('儲存失敗，請重試');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            {message && (
                <div className="mb-4 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm">
                    {message}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map(product => (
                    <div
                        key={product.id}
                        className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
                    >
                        <div className="flex gap-4">
                            {/* 圖片區塊 */}
                            <div className="flex-shrink-0">
                                {editingId === product.id ? (
                                    <ImageUploader
                                        onUpload={handleImageUpload}
                                        uploadEndpoint="/api/products/upload-image"
                                        currentImageUrl={product.imageUrl}
                                        aspectRatio="product"
                                        label="上傳產品圖"
                                    />
                                ) : (
                                    <div
                                        className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => {
                                            setEditingId(product.id);
                                            setPendingImageUrl(null);
                                        }}
                                    >
                                        {product.imageUrl ? (
                                            <img
                                                src={product.imageUrl}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                                <span className="text-2xl">📷</span>
                                                <span className="text-xs mt-1">點擊上傳</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* 產品資訊 */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 truncate">
                                    {product.name}
                                </h3>
                                <p className="text-rose-500 font-bold mt-1">
                                    NT$ {product.price.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    庫存：{product.stock}
                                </p>
                                {editingId === product.id && (
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => handleSaveImage(product.id)}
                                            disabled={!pendingImageUrl || saving}
                                            className="px-3 py-1 bg-rose-500 text-white rounded-lg text-xs hover:bg-rose-600 disabled:opacity-50"
                                        >
                                            {saving ? '儲存中...' : '儲存'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingId(null);
                                                setPendingImageUrl(null);
                                            }}
                                            className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200"
                                        >
                                            取消
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
