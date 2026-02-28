import { getCurrentUser } from '@/infrastructure/auth/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/infrastructure/db/prisma';
import ConversationList from '@/components/messages/ConversationList';

export default async function MessagesPage() {
    const currentUser = await getCurrentUser();
    if (!currentUser) redirect('/login');

    const conversations = await prisma.conversation.findMany({
        where: { participants: { some: { id: currentUser.id } } },
        include: {
            participants: { select: { id: true, name: true, email: true } },
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { content: true, createdAt: true, read: true, senderId: true }
            }
        },
        orderBy: { updatedAt: 'desc' }
    });

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">私訊</h1>
            {conversations.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                    <p className="text-4xl mb-4">💬</p>
                    <p className="text-lg">還沒有任何對話</p>
                    <p className="text-sm mt-2">去 KOL 頁面點擊「私訊」開始對話</p>
                </div>
            ) : (
                <ConversationList
                    conversations={conversations}
                    currentUserId={currentUser.id}
                />
            )}
        </div>
    );
}
