'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { pusherClient } from '@/lib/pusher';
import { formatMessageTime, formatDateGroup, shouldShowDateDivider, shouldShowTime } from '@/lib/messageUtils';
import Avatar from '@/components/shared/Avatar';

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: Date | string;
  read: boolean;
  sender?: { id: string; name: string | null };
  pending?: boolean;
}

interface Props {
  conversationId: string;
  initialMessages: Message[];
  currentUserId: string;
  currentUserName: string;
  otherUser: { id: string; name: string | null; email: string; avatarUrl?: string | null };
}

export default function ChatWindow({
  conversationId,
  initialMessages,
  currentUserId,
  currentUserName,
  otherUser,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  // 初始化已讀狀態
  const [readMessageIds, setReadMessageIds] = useState<Set<string>>(
    new Set(initialMessages.filter(m => m.read).map(m => m.id))
  );

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const channel = pusherClient.subscribe(`conversation-${conversationId}`);
    channel.bind('new-message', (data: Message) => {
      setMessages(prev => {
        if (prev.find(m => m.id === data.id)) return prev;
        return [...prev, data];
      });
    });

    channel.bind('typing', (data: { userId: string; name: string }) => {
      if (data.userId !== currentUserId) {
        setTypingUser(data.name);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 2000);
      }
    });

    channel.bind('messages-read', (data: { readBy: string }) => {
      if (data.readBy !== currentUserId) {
        // 對方已讀，標記我發送的所有訊息為已讀
        setReadMessageIds(prev => {
          const next = new Set(prev);
          messages
            .filter(m => m.senderId === currentUserId)
            .forEach(m => next.add(m.id));
          return next;
        });
      }
    });

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      pusherClient.unsubscribe(`conversation-${conversationId}`);
    };
  }, [conversationId, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput('');
    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      content,
      senderId: currentUserId,
      createdAt: new Date(),
      read: false,
      pending: true,
    };
    setMessages(prev => [...prev, tempMessage]);
    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const real = await res.json();
      setMessages(prev =>
        prev.map(m => (m.id === tempId ? { ...real, pending: false } : m))
      );
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(content);
    } finally {
      setSending(false);
    }
  }, [input, conversationId, currentUserId, sending]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      try {
        fetch(`/api/conversations/${conversationId}/typing`, {
          method: 'POST',
        }).catch(() => { });
      } catch {
        // 忽略錯誤
      }
    },
    [conversationId]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
        <button onClick={() => router.push('/messages')} className="text-gray-500 hover:text-gray-700">
          ← 返回
        </button>
        <Avatar
          avatarUrl={otherUser.avatarUrl}
          name={otherUser.name}
          size={36}
        />
        <span className="font-medium text-gray-900">
          {otherUser.name || otherUser.email}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
        {messages.map((msg, index) => {
          const prev = messages[index - 1];
          const showDivider = shouldShowDateDivider(msg, prev);
          const showTime = shouldShowTime(msg, prev);
          const isMine = msg.senderId === currentUserId;

          return (
            <div key={msg.id}>
              {/* 日期分隔線 */}
              {showDivider && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 px-2">
                    {formatDateGroup(msg.createdAt)}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              )}

              {/* 訊息氣泡 */}
              <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}>
                <div className={`max-w-xs lg:max-w-md flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2 rounded-2xl text-sm ${isMine
                    ? `bg-rose-500 text-white ${msg.pending ? 'opacity-60' : ''}`
                    : 'bg-white text-gray-900 shadow-sm border border-gray-100'
                    }`}>
                    {msg.content}
                  </div>
                  {showTime && (
                    <span className="text-xs text-gray-400">
                      {formatMessageTime(msg.createdAt)}
                      {isMine && (
                        <span className="ml-1">
                          {readMessageIds.has(msg.id) ? (
                            <span className="text-blue-400">✓✓ 已讀</span>
                          ) : msg.pending ? (
                            <span>傳送中...</span>
                          ) : (
                            <span>✓ 已送達</span>
                          )}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {typingUser && (
        <div className="flex justify-start px-4 py-2">
          <div className="bg-white rounded-2xl px-4 py-1 shadow-sm border border-gray-100 flex items-center gap-2">
            <span className="text-xs text-gray-500">{typingUser} 正在輸入</span>
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </div>
        </div>
      )}

      {/* 輸入區 */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white flex gap-3 items-end">
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="輸入訊息... (Enter 發送)"
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 max-h-32"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors disabled:opacity-50"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
