'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Users, Video, Newspaper, Loader2, User, Settings, ExternalLink, ShoppingBag } from 'lucide-react'
import debounce from 'lodash/debounce'
import { Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { trackSearchWithTrace } from '../../lib/datadog-events'

type SearchData = {
  kols: Array<{ id: string; name: string; bio: string | null; userId: string }>
  lives: Array<{ id: string; title: string; status: string; kolName: string }>
  articles: Array<any>
  users: Array<{ id: string; name: string; email: string }>
  products: Array<{ id: string; name: string; price: number; kolName: string; imageUrl: string | null }>
}

function SearchPageContent() {
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role
  const isAdmin = userRole === 'ADMIN'
  const isLoggedIn = !!session

  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const initialTab = searchParams.get('tab') || 'all'
  const [query, setQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState(initialTab)
  const [data, setData] = useState<SearchData>({
    kols: [],
    lives: [],
    articles: [],
    users: [],
    products: [],
  })
  const [loading, setLoading] = useState(false)

  const fetchSearch = useMemo(
    () => debounce(async (q: string) => {
      if (!q.trim()) {
        setData({ kols: [], lives: [], articles: [], users: [], products: [] })
        return
      }

      setLoading(true)
      try {
        const res = await fetch(`/api/search/users?q=${encodeURIComponent(q)}`)
        if (!res.ok) throw new Error('搜尋失敗')

        const results = await res.json()
        setData(results)

        const totalCount = 
          results.kols.length + 
          results.lives.length + 
          results.articles.length + 
          results.users.length +
          (results.products?.length || 0)
        
        trackSearchWithTrace(q, totalCount)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, 300),
    []
  )

  useEffect(() => {
    fetchSearch(query)
  }, [query, fetchSearch])

  const highlight = (text?: string | null) => {
    if (!text || !query) return text || ''
    const regex = new RegExp(`(${query})`, 'gi')
    return text.replace(regex, '<span class="bg-rose-100 text-rose-900">$1</span>')
  }

  const handleFollow = () => {
    if (!isLoggedIn) {
      alert('請先登入後再進行追蹤')
    } else {
      alert('已成功追蹤（測試用）')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto py-12 px-4 max-w-5xl">
        <header className="flex items-center justify-between mb-12">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic">全站搜尋</h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Search for KOLs, Live Streams, Products and more</p>
          </div>
          {isAdmin && (
            <Button variant="outline" className="rounded-full gap-2 border-2 hover:bg-gray-100">
              <Settings className="w-4 h-4" />
              搜尋設定
            </Button>
          )}
        </header>

        <div className="relative mb-12 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
          <Input
            placeholder="搜尋名稱、直播標題、產品..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-16 py-10 text-2xl rounded-[2rem] bg-white border-none shadow-2xl shadow-gray-200/50 focus-visible:ring-2 focus-visible:ring-rose-500 font-bold placeholder:text-gray-300"
            autoFocus
          />
          {loading && (
            <div className="absolute right-8 top-1/2 -translate-y-1/2">
              <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
          <TabsList className="bg-white/50 backdrop-blur p-1.5 rounded-2xl shadow-sm inline-flex">
            {[
              { id: 'all', label: '全部' },
              { id: 'kol', label: 'KOL' },
              { id: 'live', label: '直播' },
              { id: 'product', label: '產品' },
              { id: 'article', label: '文章' },
            ].map(tab => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="rounded-xl px-8 py-3 text-sm font-black uppercase tracking-widest data-[state=active]:bg-rose-500 data-[state=active]:text-white transition-all"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="space-y-6">
            {/* KOLs */}
            {(activeTab === 'all' || activeTab === 'kol') && data.kols.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 ml-4">KOLs</h2>
                {data.kols.map(kol => (
                  <Card key={kol.id} className="group rounded-[2.5rem] border-none shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white">
                    <CardContent className="p-8 flex items-center gap-6">
                      <Avatar className="w-20 h-20 border-2 border-rose-100">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${kol.name}`} />
                        <AvatarFallback>{kol.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight italic" dangerouslySetInnerHTML={{ __html: highlight(kol.name) }} />
                        <p className="text-gray-500 font-medium line-clamp-1 mt-1" dangerouslySetInnerHTML={{ __html: highlight(kol.bio) }} />
                      </div>
                      <div className="flex items-center gap-3">
                        {isLoggedIn && (
                          <Button onClick={handleFollow} variant="outline" className="rounded-full px-6 border-2 font-bold hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100">
                            追蹤
                          </Button>
                        )}
                        <Link href={`/kol/${kol.userId}`}>
                          <Button className="rounded-full px-8 bg-rose-500 hover:bg-rose-600 text-white font-black shadow-lg shadow-rose-100 transition-all active:scale-95">
                            查看個人頁
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Lives */}
            {(activeTab === 'all' || activeTab === 'live') && data.lives.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 ml-4">Live Streams</h2>
                {data.lives.map(live => (
                  <Card key={live.id} className="group rounded-[2.5rem] border-none shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white">
                    <CardContent className="p-8 flex items-center gap-6">
                      <div className="w-24 h-24 bg-rose-50 rounded-3xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Video className="w-10 h-10 text-rose-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={
                            live.status === 'LIVE' ? 'bg-rose-500 animate-pulse' : 'bg-gray-400'
                          }>
                            {live.status}
                          </Badge>
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">by {live.kolName}</span>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase" dangerouslySetInnerHTML={{ __html: highlight(live.title) }} />
                      </div>
                      <Link href={`/live/${live.id}`}>
                        <Button className="rounded-full px-10 h-16 bg-gray-900 hover:bg-black text-white font-black uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95 flex gap-2">
                          進入直播
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Products */}
            {(activeTab === 'all' || activeTab === 'product') && data.products && data.products.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 ml-4">Products</h2>
                {data.products.map(product => (
                  <Card key={product.id} className="group rounded-[2.5rem] border-none shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white">
                    <CardContent className="p-8 flex items-center gap-6">
                      <div className="w-24 h-24 bg-rose-50 rounded-3xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        ) : (
                          <ShoppingBag className="w-10 h-10 text-rose-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">by {product.kolName}</p>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase" dangerouslySetInnerHTML={{ __html: highlight(product.name) }} />
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-[10px] font-black text-rose-500 uppercase italic">NT$</span>
                          <span className="text-xl font-black text-rose-500 italic tracking-tighter">{product.price.toLocaleString()}</span>
                        </div>
                      </div>
                      <Link href={`/products/${product.id}`}>
                        <Button className="rounded-full px-10 h-16 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95">
                          查看詳情
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Articles */}
            {(activeTab === 'all' || activeTab === 'article') && (
              <div className="space-y-4">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 ml-4">Articles</h2>
                <div className="p-12 text-center bg-gray-100/50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                  <p className="font-black text-gray-300 uppercase tracking-widest italic">即將推出 Coming Soon</p>
                </div>
              </div>
            )}

            {/* Users */}
            {(activeTab === 'all' || activeTab === 'kol') && data.users.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 ml-4">Users</h2>
                {data.users.map(u => (
                  <Card key={u.id} className="group rounded-[2.5rem] border-none shadow-sm bg-white/60">
                    <CardContent className="p-6 flex items-center justify-between px-10">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl"><User className="w-5 h-5" /></div>
                        <div>
                          <p className="font-black text-gray-900 italic uppercase" dangerouslySetInnerHTML={{ __html: highlight(u.name) }} />
                          {isAdmin && (
                            <p className="text-xs font-medium text-gray-400">{u.email}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!loading && query.trim() && data.kols.length === 0 && data.lives.length === 0 && data.users.length === 0 && (!data.products || data.products.length === 0) && (
              <div className="text-center py-32 bg-white rounded-[3rem] shadow-sm border border-gray-100">
                <p className="font-black text-gray-300 text-2xl uppercase italic tracking-widest">找不到相關結果</p>
                <p className="text-gray-400 mt-2 font-bold">試試其他的關鍵字搜尋</p>
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
