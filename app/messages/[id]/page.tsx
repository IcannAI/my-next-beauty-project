import { getCurrentUser } from '@/infrastructure/auth/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/infrastructure/db/prisma';
import ChatWindow from '@/components/messages/ChatWindow';

export default async function ConversationPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const currentUser = await getCurrentUser();
    if (!currentUser) redirect('/login');

    const { id } = await params;

    const conversation = await prisma.conversation.findFirst({
        where: {
            id,
            participants: { some: { id: currentUser.id } }
        },
        include: {
            participants: { select: { id: true, name: true, email: true } }
        }
    });

    if (!conversation) notFound();

    const messages = await prisma.message.findMany({
        where: { conversationId: id },
        include: { sender: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
        take: 50,
    });

    // 標記已讀
    await prisma.message.updateMany({
        where: {
            conversationId: id,
            senderId: { not: currentUser.id },
            read: false,
        },
        data: { read: true },
    });

    const otherUser = conversation.participants.find(
        p => p.id !== currentUser.id
    );

    return (
        <div className="max-w-2xl mx-auto h-[calc(100vh-64px)] flex flex-col">
            <ChatWindow
                conversationId={id}
                initialMessages={messages}
                currentUserId={currentUser.id}

                otherUser={{
                    id: otherUser?.id || '',
                    name: otherUser?.name || otherUser?.email || '用戶',
                    email: otherUser?.email || '',
                }}
            />
        </div>
    );
}
