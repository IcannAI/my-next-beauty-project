'use client'

import Avatar from '@/components/shared/Avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Video, BarChart3 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import FollowButton from '@/components/follow/FollowButton';
import MessageButton from '@/components/messages/MessageButton';

type KolProfileWithData = {
  id: string
  userId: string
  bio: string | null
  commissionRate: number
  avatarUrl?: string | null;
  user: {
    name: string | null
    email: string
    image: string | null
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

interface KolProfileViewProps {
  profile: KolProfileWithData;
  initialFollowing: boolean;
  isLoggedIn: boolean;
}

export default function KolProfileView({
  profile,
  initialFollowing,
  isLoggedIn
}: KolProfileViewProps) {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-500">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Profile Header */}
        <section className="flex flex-col items-center text-center md:text-left md:flex-row md:items-start gap-10 mb-20">
          <div className="relative group">
            <div className="absolute -inset-1.5 bg-gradient-to-tr from-rose-500 to-orange-400 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <Avatar
              avatarUrl={profile.user.image}
              name={profile.user.name}
              size={160}
              priority={true}
            />
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6">
              <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter italic">
                {profile.user.name}
              </h1>
              <div className="flex gap-3 justify-center">
                <FollowButton
                  targetUserId={profile.userId}
                  initialFollowing={initialFollowing}
                  isLoggedIn={isLoggedIn}
                />
                <MessageButton
                  targetUserId={profile.userId}
                  isLoggedIn={isLoggedIn}
                />
              </div>
            </div>

            <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
              {profile.bio || "這位作者很低調，尚未填寫簡介。"}
            </p>

            {/* Stats Bar */}
            <div className="mt-10 flex flex-wrap justify-center md:justify-start gap-12 border-t dark:border-gray-900 pt-8">
              <div className="text-center md:text-left">
                <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter italic">
                  {Math.round(profile.commissionRate * 100)}%
                </p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 mt-1">分潤比例</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter italic">
                  {profile.liveStreams.length}
                </p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 mt-1">直播場次</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter italic">
                  8.4k
                </p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 mt-1">追蹤人數</p>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Streams Section */}
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b dark:border-gray-900 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                <Video className="w-5 h-5 text-rose-500" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">最近直播</h2>
            </div>
            <span className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest cursor-pointer hover:text-rose-500 transition-colors">
              查看全部
            </span>
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
                  className="group flex items-center justify-between p-8 bg-white dark:bg-gray-900 border-2 border-transparent hover:border-rose-500/20 rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 dark:shadow-none transition-all duration-500"
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
