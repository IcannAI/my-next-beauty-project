import { getCurrentUser } from '@/infrastructure/auth/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/infrastructure/db/prisma';
import ProductManager from '@/components/products/ProductManager';

export default async function ProductsPage() {
    const currentUser = await getCurrentUser();
    if (!currentUser) redirect('/login');
    if (!['KOL', 'ADMIN'].includes(currentUser.role || '')) {
        redirect('/');
    }

    const kolProfile = await prisma.kolProfile.findUnique({
        where: { userId: currentUser.id },
        include: {
            products: {
                orderBy: { createdAt: 'desc' },
            },
        },
    });

    if (!kolProfile) {
        if (currentUser.role !== 'ADMIN') redirect('/');

        const allProducts = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                kolProfile: {
                    include: { user: { select: { name: true } } }
                }
            }
        });

        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    產品管理（全部）
                </h1>
                <p className="text-sm text-gray-400 mb-6">管理員檢視所有 KOL 產品</p>
                <div className="grid gap-4">
                    {allProducts.length === 0 ? (
                        <div className="py-12 text-center text-gray-400">目前沒有任何產品</div>
                    ) : (
                        allProducts.map(product => (
                            <div
                                key={product.id}
                                className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm"
                            >
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl">
                                            🛍️
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 dark:text-white truncate">
                                        {product.name}
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        KOL：{(product.kolProfile as any).user.name} ·
                                        NT$ {product.price.toLocaleString()} ·
                                        庫存 {product.stock}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        評分 {product.avgRating.toFixed(1)} ★ ·
                                        {product.reviewCount} 則評論
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">產品管理</h1>
            <ProductManager
                kolProfileId={kolProfile.id}
                initialProducts={kolProfile.products}
            />
        </div>
    );
}
