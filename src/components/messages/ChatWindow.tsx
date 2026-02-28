'use client';

import { useState, useEffect, useRef } from 'react';
import { pusherClient } from '@/lib/pusher';
import { Send, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Message {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
}

interface ChatWindowProps {
    conversationId: string;
    initialMessages: Message[];
    currentUserId: string;
    otherUser: { id: string; name: string };
}

export default function ChatWindow({
    conversationId,
    initialMessages,
    currentUserId,
    otherUser
}: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const channelName = `conversation-${conversationId}`;
        const channel = pusherClient.subscribe(channelName);

        channel.bind('new-message', (data: Message) => {
            setMessages((prev) => {
                if (prev.find((m) => m.id === data.id)) return prev;
                return [...prev, data];
            });
        });

        return () => {
            pusherClient.unsubscribe(channelName);
        };
    }, [conversationId]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isSending) return;

        const content = input.trim();
        setInput('');
        setIsSending(true);

        try {
            const res = await fetch(`/api/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });

            if (!res.ok) {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            console.error(error);
            // Revert input on error
            setInput(content);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-950 rounded-xl shadow-sm border overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 border-b bg-gray-50 dark:bg-gray-900">
                <Link href="/messages" className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </Link>
                <div className="flex-1">
                    <h2 className="font-bold text-gray-900 dark:text-gray-100">{otherUser.name}</h2>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                    const isMe = message.senderId === currentUserId;
                    return (
                        <div
                            key={message.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMe
                                        ? 'bg-rose-500 text-white rounded-br-none'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none'
                                    }`}
                            >
                                <p className="break-words text-sm">{message.content}</p>
                                <span
                                    className={`text-[10px] mt-1 block ${isMe ? 'text-rose-100' : 'text-gray-400 dark:text-gray-500'
                                        }`}
                                >
                                    {new Date(message.createdAt).toLocaleTimeString('zh-TW', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-white dark:bg-gray-950">
                <form onSubmit={sendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="輸入訊息..."
                        className="flex-1 border dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        disabled={isSending}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isSending}
                        className="p-2 bg-rose-500 text-white rounded-full hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center w-10 h-10"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
