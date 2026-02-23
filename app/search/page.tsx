'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Search, Users, ShoppingBag, Video, Newspaper, Loader2 } from 'lucide-react'
import debounce from 'lodash/debounce'
import { Suspense } from 'react';

type SearchResult = {
  type: 'user' | 'product' | 'live' | 'article'
  id: string
  title: string
  subtitle?: string
  imageUrl?: string
  url: string
  extra?: any
}

function SearchPageContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState('all')
  const [results, setResults] = useState<{ [key: string]: SearchResult[] }>({
    all: [],
    users: [],
    products: [],
    lives: [],
    articles: [],
  })
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const fetchSearch = useCallback(
    debounce(async (q: string, tab: string, p: number) => {
      if (!q || q.length < 2) {
        setResults(prev => ({ ...prev, [tab]: [] }))
        setHasMore(false)
        return
      }

      setLoading(true)
      try {
        const params = new URLSearchParams({
          q,
          page: p.toString(),
          limit: '20',
          type: tab === 'all' ? 'all' : tab,
        })

        const res = await fetch(`/api/search?${params}`)
        if (!res.ok) throw new Error('搜尋失敗')

        const data = await res.json()
        const newResults = data.results || []

        setResults(prev => ({
          ...prev,
          [tab]: p === 1 ? newResults : [...prev[tab], ...newResults],
        }))

        setHasMore(newResults.length === 20)
      } catch (err) {
        console.error(err)
        setResults(prev => ({ ...prev, [tab]: [] }))
      } finally {
        setLoading(false)
      }
    }, 400),
    []
  )

  useEffect(() => {
    fetchSearch(query, activeTab, 1)
    setPage(1)
    setHasMore(true)
  }, [query, activeTab, fetchSearch])

  useEffect(() => {
    if (!loadMoreRef.current || loading || !hasMore) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setPage(prev => prev + 1)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreRef.current)

    return () => observer.disconnect()
  }, [loading, hasMore])

  useEffect(() => {
    if (page > 1) {
      fetchSearch(query, activeTab, page)
    }
  }, [page, query, activeTab, fetchSearch])

  const displayResults = results[activeTab] || []

  const highlight = (text?: string) => {
    if (!text || !query) return text || ''
    const regex = new RegExp(`(${query})`, 'gi')
    return text.replace(regex, '<span class="bg-yellow-100">$1</span>')
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">搜尋</h1>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="搜尋 KOL、商品、直播、文章..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-12 py-6 text-lg rounded-full border-2 shadow-sm focus-visible:ring-primary"
          autoFocus
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="users">KOL / 用戶</TabsTrigger>
          <TabsTrigger value="products">商品</TabsTrigger>
          <TabsTrigger value="lives">直播</TabsTrigger>
          <TabsTrigger value="articles">文章</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading && page === 1 ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-muted-foreground">搜尋中...</p>
            </div>
          ) : displayResults.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {query.length < 2 ? '輸入至少兩個字開始搜尋' : '沒有找到相關結果'}
            </div>
          ) : (
            <div className="space-y-4">
              {displayResults.map(item => (
                <Card
                  key={`${item.type}-${item.id}`}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {item.type === 'user' && <Users className="h-8 w-8 text-muted-foreground" />}
                          {item.type === 'product' && <ShoppingBag className="h-8 w-8 text-muted-foreground" />}
                          {item.type === 'live' && <Video className="h-8 w-8 text-red-400" />}
                          {item.type === 'article' && <Newspaper className="h-8 w-8 text-blue-400" />}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-lg line-clamp-2">
                            <span dangerouslySetInnerHTML={{ __html: highlight(item.title) }} />
                          </h3>
                          {item.subtitle && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              <span dangerouslySetInnerHTML={{ __html: highlight(item.subtitle) }} />
                            </p>
                          )}
                        </div>

                        <Link href={item.url}>
                          <span className="text-primary hover:underline text-sm whitespace-nowrap">
                            查看
                          </span>
                        </Link>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {item.type === 'product' && item.extra?.price && (
                          <div className="font-medium text-green-600">
                            NT$ {item.extra.price.toLocaleString()}
                          </div>
                        )}
                        {item.type === 'user' && item.extra?.followerCount && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {item.extra.followerCount.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {hasMore && (
                <div ref={loadMoreRef} className="py-8 text-center text-muted-foreground">
                  {loading ? '載入更多...' : '向上滾動載入更多'}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>載入中...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
