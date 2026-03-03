'use client';

import { useRouter } from 'next/navigation';
import Avatar from '@/components/shared/Avatar';

interface Participant {
  id: string;
  name: string | null;
  email: string;
  kolProfile?: {
    avatarUrl: string | null;
  } | null;
}

interface LastMessage {
  content: string;
  createdAt: Date | string;
  read: boolean;
  senderId: string;
}

interface Conversation {
  id: string;
  participants: Participant[];
  messages: LastMessage[];
}

interface Props {
  conversations: Conversation[];
  currentUserId: string;
}

export default function ConversationList({ conversations, currentUserId }: Props) {
  const router = useRouter();

  const getOtherUser = (participants: Participant[]) =>
    participants.find(p => p.id !== currentUserId);

  const hasUnread = (conv: Conversation) =>
    conv.messages.some(m => !m.read && m.senderId !== currentUserId);

  return (
    <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
      {conversations.map(conv => {
        const other = getOtherUser(conv.participants);
        const lastMsg = conv.messages[0];
        const unread = hasUnread(conv);
        return (
          <div
            key={conv.id}
            onClick={() => router.push(`/messages/${conv.id}`)}
            className="flex items-center gap-4 p-4 hover:bg-rose-50 cursor-pointer transition-colors"
          >
            <Avatar
              avatarUrl={other?.kolProfile?.avatarUrl}
              name={other?.name}
              size={48}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`font-medium ${unread ? 'text-gray-900' : 'text-gray-700'}`}>
                  {other?.name || other?.email || '未知用戶'}
                </span>
                {lastMsg && (
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(lastMsg.createdAt).toLocaleDateString('zh-TW')}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className={`text-sm truncate ${unread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                  {lastMsg?.content || '開始對話'}
                </p>
                {unread && (
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0 ml-2" />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
