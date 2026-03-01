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

    if (!kolProfile) redirect('/');

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
