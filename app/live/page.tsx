import { prisma } from '@/infrastructure/db/prisma';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import Avatar from '@/components/shared/Avatar';
import { PlayCircle, Clock } from 'lucide-react';

export default async function LiveListPage() {
    const [liveStreams, recentStreams] = await Promise.all([
        prisma.liveStream.findMany({
            where: { status: 'LIVE' },
            include: {
                kolProfile: {
                    select: {
                        avatarUrl: true,
                        userId: true,
                        user: { select: { name: true } },
                    },
                },
            },
            orderBy: { startedAt: 'desc' },
        }),
        prisma.liveStream.findMany({
            where: { status: 'ENDED' },
            include: {
                kolProfile: {
                    select: {
                        avatarUrl: true,
                        userId: true,
                        user: { select: { name: true } },
                    },
                },
            },
            orderBy: { endedAt: 'desc' },
            take: 12,
        }),
    ]);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen bg-white dark:bg-gray-950">
            {/* 直播中 */}
            <section className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    <h2 className="text-xl font-black text-gray-900 dark:text-white">直播中</h2>
                    <Badge className="bg-rose-500 text-white text-xs rounded-full">
                        {liveStreams.length}
                    </Badge>
                </div>

                {liveStreams.length === 0 ? (
                    <div className="py-12 text-center bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-white/5">
                        <PlayCircle className="w-10 h-10 mx-auto text-gray-600 mb-3" />
                        <p className="text-gray-500 font-medium">目前沒有進行中的直播</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {liveStreams.map(stream => (
                            <Link
                                key={stream.id}
                                href={`/live/${stream.id}`}
                                className="group flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-rose-500/30 transition-all"
                            >
                                <Avatar
                                    avatarUrl={stream.kolProfile.avatarUrl}
                                    name={stream.kolProfile.user.name}
                                    size={48}
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 dark:text-white truncate group-hover:text-rose-400 transition-colors">
                                        {stream.title}
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        {stream.kolProfile.user.name}
                                    </p>
                                </div>
                                <Badge className="bg-rose-500 text-white text-xs rounded-full animate-pulse flex-shrink-0">
                                    LIVE
                                </Badge>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* 最近結束 */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <h2 className="text-xl font-black text-gray-900 dark:text-white">最近直播</h2>
                </div>

                {recentStreams.length === 0 ? (
                    <div className="py-12 text-center bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-white/5">
                        <p className="text-gray-500 font-medium">尚無直播記錄</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {recentStreams.map(stream => (
                            <div
                                key={stream.id}
                                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-white/5"
                            >
                                <Avatar
                                    avatarUrl={stream.kolProfile.avatarUrl}
                                    name={stream.kolProfile.user.name}
                                    size={48}
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 dark:text-white truncate">
                                        {stream.title}
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        {stream.kolProfile.user.name}
                                    </p>
                                    {stream.endedAt && (
                                        <p className="text-xs text-gray-600 mt-0.5">
                                            {new Date(stream.endedAt).toLocaleDateString('zh-TW')}
                                        </p>
                                    )}
                                </div>
                                <Badge className="bg-gray-700 text-gray-400 text-xs rounded-full flex-shrink-0">
                                    已結束
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
