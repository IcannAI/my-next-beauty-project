import { getCurrentUser } from '@/infrastructure/auth/auth';
import { prisma } from '@/infrastructure/db/prisma';
import { notFound, redirect } from 'next/navigation';
import ChatWindow from '@/components/messages/ChatWindow';

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    // Get conversation and initial messages
    const conversation = await prisma.conversation.findUnique({
        where: { id },
        include: {
            participants: true,
            messages: {
                orderBy: { createdAt: 'asc' },
                take: 50 // Load last 50 messages
            }
        }
    });

    if (!conversation) {
        notFound();
    }

    // Verify user is part of the conversation
    const isParticipant = conversation.participants.some(p => p.id === user.id);
    if (!isParticipant) {
        notFound();
    }

    const otherUser = conversation.participants.find(p => p.id !== user.id);

    if (!otherUser) {
        notFound();
    }

    // Mark all unread messages from the other user as read
    await prisma.message.updateMany({
        where: {
            conversationId: conversation.id,
            senderId: { not: user.id },
            read: false
        },
        data: {
            read: true
        }
    });

    return (
        <div className="container mx-auto max-w-4xl h-[calc(100vh-4rem)] flex flex-col pt-4 pb-0 px-0 sm:px-4">
            <ChatWindow
                conversationId={conversation.id}
                initialMessages={conversation.messages}
                currentUserId={user.id}
                otherUser={{ id: otherUser.id, name: otherUser.name || '未知使用者' }}
            />
        </div>
    );
}
