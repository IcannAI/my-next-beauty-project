import { getCurrentUser } from '@/infrastructure/auth/auth';
import { prisma } from '@/infrastructure/db/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

export default async function MessagesPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    const conversations = await prisma.conversation.findMany({
        where: {
            participants: {
                some: {
                    id: user.id
                }
            }
        },
        include: {
            participants: true,
            messages: {
                orderBy: {
                    createdAt: 'desc'
                },
                take: 1
            }
        },
        orderBy: {
            updatedAt: 'desc'
        }
    });

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-2xl font-bold mb-6">我的訊息</h1>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {conversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        目前沒有對話紀錄。
                    </div>
                ) : (
                    <div className="divide-y">
                        {conversations.map(conversation => {
                            const otherUser = conversation.participants.find(p => p.id !== user.id);
                            const lastMessage = conversation.messages[0];
                            const hasUnread = lastMessage &&
                                !lastMessage.read &&
                                lastMessage.senderId !== user.id;

                            return (
                                <Link
                                    key={conversation.id}
                                    href={`/messages/${conversation.id}`}
                                    className="block p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className={`font-semibold ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {otherUser?.name || '未知使用者'}
                                            </h3>
                                            {hasUnread && (
                                                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block"></span>
                                            )}
                                        </div>
                                        {lastMessage && (
                                            <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                                                {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true, locale: zhTW })}
                                            </span>
                                        )}
                                    </div>
                                    {lastMessage && (
                                        <p className={`text-sm truncate ${hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                            {lastMessage.content.length > 50
                                                ? `${lastMessage.content.substring(0, 50)}...`
                                                : lastMessage.content}
                                        </p>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
