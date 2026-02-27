'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Video, BarChart3, TrendingUp, DollarSign, Package, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

type KolProfileWithData = {
  id: string
  userId: string
  bio: string | null
  commissionRate: number
  user: {
    name: string | null
    email: string
  }
  liveStreams: Array<{
    id: string
    title: string
    status: string
    createdAt: Date
    totalRevenue: number
    kolEarnings: number
  }>
}

export default function KolProfileEditor({ profile, isAdmin }: { profile: KolProfileWithData, isAdmin: boolean }) {
  const [bio, setBio] = useState(profile.bio || '')
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/kol/${profile.userId}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio }),
      })

      if (res.ok) {
        toast({ title: '儲存成功', description: '您的簡介已更新。' })
        router.refresh()
      } else {
        toast({ title: '儲存失敗', variant: 'destructive' })
      }
    } catch (err) {
      console.error(err)
      toast({ title: '發生錯誤', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const totalRevenue = profile.liveStreams.reduce((sum, s) => sum + s.totalRevenue, 0)
  const totalEarnings = profile.liveStreams.reduce((sum, s) => sum + s.kolEarnings, 0)

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-500 pb-20">
      {/* Edit Mode Banner */}
      <div className="bg-orange-500/10 border-b border-orange-500/20 py-3 text-center">
        <p className="text-sm font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          編輯模式 - {isAdmin ? '管理員編輯中' : '個人資料編輯中'}
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Profile Header Editor */}
        <section className="flex flex-col items-center text-center md:text-left md:flex-row md:items-start gap-10 mb-20 border-2 border-orange-500/20 rounded-[3rem] p-10 bg-white dark:bg-gray-900/50 shadow-2xl shadow-orange-100">
          <div className="relative group">
            <Avatar className="w-40 h-40 border-4 border-white dark:border-gray-900 shadow-2xl relative">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.user.name}`} />
              <AvatarFallback className="text-4xl font-black bg-rose-50 text-rose-500">
                {profile.user.name?.[0]}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <div className="flex-1 w-full space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter italic">
                {profile.user.name}
              </h1>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="rounded-full px-12 py-6 h-auto bg-rose-500 hover:bg-rose-600 text-white font-black shadow-xl shadow-rose-200 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSaving ? '儲存中...' : '儲存變更'}
              </Button>
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">個人簡介</label>
              <Textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="寫點什麼來吸引粉絲吧..."
                className="min-h-[120px] rounded-3xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-rose-500 dark:text-white p-6 text-lg font-medium"
              />
            </div>
          </div>
        </section>

        {/* Sales Stats Block */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-lg border border-gray-100 dark:border-gray-800 space-y-2">
            <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl w-fit"><TrendingUp className="w-6 h-6" /></div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">直播總場次</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white italic">{profile.liveStreams.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-lg border border-gray-100 dark:border-gray-800 space-y-2">
            <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl w-fit"><DollarSign className="w-6 h-6" /></div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">累積總收益</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white italic">NT$ {totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-lg border border-gray-100 dark:border-gray-800 space-y-2">
            <div className="p-3 bg-purple-50 text-purple-500 rounded-2xl w-fit"><Package className="w-6 h-6" /></div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">累積分潤收益</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white italic">NT$ {totalEarnings.toLocaleString()}</p>
          </div>
        </div>

        {/* Recent Streams */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 border-b dark:border-gray-900 pb-6">
            <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
              <Video className="w-5 h-5 text-rose-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">最近直播</h2>
          </div>

          <div className="grid gap-6">
            {profile.liveStreams.length === 0 ? (
              <div className="py-20 text-center bg-gray-50 dark:bg-gray-900/50 rounded-[2.5rem] border-2 border-dashed dark:border-gray-800">
                <BarChart3 className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                <p className="font-bold text-gray-400 dark:text-gray-600 tracking-tight">尚無直播記錄</p>
              </div>
            ) : (
              profile.liveStreams.map(stream => (
                <div 
                  key={stream.id}
                  className="group flex items-center justify-between p-8 bg-white dark:bg-gray-900 border-2 border-transparent hover:border-rose-500/20 rounded-[2rem] shadow-sm hover:shadow-2xl transition-all duration-500"
                >
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight group-hover:text-rose-500 transition-colors">
                      {stream.title}
                    </h3>
                    <p className="text-sm font-bold text-gray-400 dark:text-gray-500 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
                      {new Date(stream.createdAt).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  
                  <Badge className={`
                    rounded-full px-6 py-2 text-[10px] font-black tracking-[0.15em] uppercase border-none
                    ${stream.status === 'LIVE' ? 'bg-rose-500 text-white animate-pulse' : 
                      stream.status === 'ENDED' ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' : 
                      'bg-orange-50 text-orange-600'}
                  `}>
                    {stream.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
