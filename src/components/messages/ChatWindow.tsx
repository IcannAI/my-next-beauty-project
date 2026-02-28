'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { pusherClient } from '@/lib/pusher';

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
  otherUser: { id: string; name: string | null; email: string };
}

export default function ChatWindow({
  conversationId,
  initialMessages,
  currentUserId,
  otherUser,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
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
    return () => {
      pusherClient.unsubscribe(`conversation-${conversationId}`);
    };
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
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
    } finally {
      setSending(false);
    }
  };

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
        <div className="w-9 h-9 rounded-full bg-rose-500 flex items-center justify-center text-white font-bold">
          {otherUser.name?.[0]?.toUpperCase() || '?'}
        </div>
        <span className="font-medium text-gray-900">
          {otherUser.name || otherUser.email}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
        {messages.map(msg => {
          const isMine = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-2 rounded-2xl text-sm ${
                  isMine
                    ? `bg-rose-500 text-white ${msg.pending ? 'opacity-60' : ''}`
                    : 'bg-white text-gray-900 shadow-sm border border-gray-100'
                }`}>
                  {msg.content}
                </div>
                <span className="text-xs text-gray-400">
                  {msg.pending ? '傳送中...' : new Date(msg.createdAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="px-4 py-3 border-t border-gray-200 bg-white flex gap-3 items-end">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
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
