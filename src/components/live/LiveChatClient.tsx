'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Pusher from 'pusher-js';

interface ChatMessage {
  id: string;
  userName: string;
  message: string;
  timestamp: string;
}

interface LiveChatClientProps {
  liveStreamId: string;
  currentUserId: string;
  currentUserName: string;
}

export function LiveChatClient({
  liveStreamId, currentUserName
}: LiveChatClientProps) {
  const pusherRef = useRef<Pusher | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 初始化 Pusher
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    pusherRef.current = pusher;

    const channel = pusher.subscribe(`live-${liveStreamId}`);

    pusher.connection.bind('state_change', (states: any) => {
      setConnected(states.current === 'connected');
    });

    channel.bind('chat-message', (data: ChatMessage) => {
      setMessages(prev => [...prev.slice(-199), data]);
    });

    return () => {
      pusher.unsubscribe(`live-${liveStreamId}`);
      pusher.disconnect();
    };
  }, [liveStreamId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim()) return;

    const currentInput = input.trim();
    setInput('');

    try {
      const res = await fetch(`/api/live/${liveStreamId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          userName: currentUserName,
        }),
      });

      if (!res.ok) throw new Error('Failed to send');
    } catch (err) {
      console.error('Send message error:', err);
      // 可選：在 UI 顯示錯誤
    }
  }, [input, liveStreamId, currentUserName]);

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800">
      {/* 標頭 */}
      <div className="px-6 py-4 border-b border-gray-800">
        <h3 className="text-lg font-black text-white tracking-tight italic uppercase">
          Live Chat
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-rose-500 animate-pulse' : 'bg-gray-600'}`} />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            {connected ? 'Connected' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* 訊息列表 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-[0.2em]">Say something...</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className="group animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider italic">
                {msg.userName}
              </span>
              <div className="bg-gray-800/50 p-3 rounded-2xl rounded-tl-none border border-gray-800 group-hover:border-rose-500/20 transition-colors shadow-sm">
                <p className="text-sm text-gray-200 leading-relaxed font-medium">
                  {msg.message}
                </p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 輸入區 */}
      <div className="p-6 bg-gray-900/80 backdrop-blur-md border-t border-gray-800">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="傳送訊息..."
              className="w-full bg-gray-800 text-gray-100 text-sm rounded-2xl px-5 py-4 border-2 border-transparent focus:border-rose-500 outline-none transition-all placeholder:text-gray-600 font-medium"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-500/20 transition-all active:scale-90 disabled:opacity-50 disabled:bg-gray-700 disabled:shadow-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-90" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest text-center">Press enter to broadcast</p>
        </div>
      </div>
    </div>
  );
}
