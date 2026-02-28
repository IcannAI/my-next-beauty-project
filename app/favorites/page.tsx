import { prisma } from '@/infrastructure/db/prisma';
import { getCurrentUser } from '@/infrastructure/auth/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import FavoriteButton from '@/components/favorite/FavoriteButton';

export default async function FavoritesPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login');

  const favorites = await prisma.favorite.findMany({
    where: { userId: currentUser.id },
    include: {
      product: {
        include: {
          kolProfile: { include: { user: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">我的收藏</h1>
      {favorites.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">還沒有收藏任何產品</p>
          <Link href="/search" className="mt-4 inline-block text-rose-500 hover:underline">
            去搜尋產品
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map(({ product }) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                  <p className="text-rose-500 font-bold mt-2">NT$ {product.price.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    by {product.kolProfile.user.name}
                  </p>
                </div>
                <FavoriteButton
                  productId={product.id}
                  initialFavorited={true}
                  isLoggedIn={true}
                />
              </div>
              <Link
                href={`/products/${product.id}`}
                className="mt-4 block text-center bg-rose-50 text-rose-500 py-2 rounded-lg text-sm hover:bg-rose-100 transition-colors"
              >
                查看產品
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
