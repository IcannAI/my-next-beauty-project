import { prisma } from '@/infrastructure/db/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShoppingBag, ArrowLeft, ShieldCheck, Truck, RefreshCcw } from 'lucide-react';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      kolProfile: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 pb-20">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-rose-500 font-bold text-xs uppercase tracking-widest transition-colors mb-12 group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          返回商城
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left: Product Image */}
          <div className="space-y-6">
            <div className="aspect-square bg-gray-50 dark:bg-gray-900 rounded-[3rem] overflow-hidden flex items-center justify-center border border-gray-100 dark:border-gray-800 shadow-2xl shadow-gray-200/50">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag className="w-24 h-24 text-gray-200 dark:text-gray-700" />
              )}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="flex flex-col">
            <header className="space-y-4 mb-10">
              <div className="flex items-center gap-3">
                <Badge className="bg-rose-500 text-white border-none px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-full">
                  In Stock
                </Badge>
                <Badge variant="outline" className="border-gray-200 text-gray-400 px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-full">
                  Beauty Essential
                </Badge>
              </div>
              <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase">
                {product.name}
              </h1>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-black text-rose-500 uppercase italic">NT$</span>
                <span className="text-5xl font-black text-rose-500 italic tracking-tighter">
                  {product.price.toLocaleString()}
                </span>
              </div>
            </header>

            <div className="space-y-8 flex-1">
              <div className="p-8 bg-gray-50 dark:bg-gray-900 rounded-[2rem] space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">產品描述</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                  {product.description || "暫無詳細描述。"}
                </p>
              </div>

              <div className="flex items-center gap-6 p-6 border-2 border-gray-50 dark:border-gray-900 rounded-[2rem]">
                <Link href={`/kol/${product.kolProfile.userId}`}>
                  <Avatar className="h-14 w-14 border-2 border-rose-500/20 hover:scale-105 transition-transform">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${product.kolProfile.user.name}`} />
                    <AvatarFallback>{product.kolProfile.user.name?.[0]}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">推薦 KOL</p>
                  <Link href={`/kol/${product.kolProfile.userId}`} className="text-lg font-black text-gray-900 dark:text-white hover:text-rose-500 transition-colors">
                    {product.kolProfile.user.name}
                  </Link>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">庫存</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white italic">{product.stock} 件</p>
                </div>
              </div>
            </div>

            <div className="mt-12 space-y-6">
              <Button className="w-full py-10 h-auto bg-rose-500 hover:bg-rose-600 text-white text-2xl font-black italic tracking-tighter rounded-[2rem] shadow-2xl shadow-rose-200 dark:shadow-none transition-all active:scale-95">
                立即購買
              </Button>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center text-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">正品保證</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <Truck className="w-5 h-5 text-blue-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">快速到貨</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <RefreshCcw className="w-5 h-5 text-orange-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">七天鑑賞</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
