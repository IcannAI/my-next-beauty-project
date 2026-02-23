'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import io from 'socket.io-client';

type Socket = ReturnType<typeof io>;

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
}

interface LiveChatClientProps {
  liveStreamId: string;
  currentUserId: string;
  currentUserName: string;
}

export function LiveChatClient({
  liveStreamId, currentUserId, currentUserName
}: LiveChatClientProps) {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
      path: '/api/socket',
      transports: ['websocket'],
      auth: { userId: currentUserId },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-live', { liveStreamId });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('chat-message', (msg: ChatMessage) => {
      setMessages(prev => [...prev.slice(-199), msg]); // 最多保留 200 則
    });

    socket.on('viewer-count', (count: number) => {
      setViewerCount(count);
    });

    return () => {
      socket.emit('leave-live', { liveStreamId });
      socket.disconnect();
    };
  }, [liveStreamId, currentUserId]);

  // 自動捲動至最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || !socketRef.current?.connected) return;

    socketRef.current.emit('send-chat', {
      liveStreamId,
      userId: currentUserId,
      userName: currentUserName,
      content: input.trim(),
    });
    setInput('');
  }, [input, liveStreamId, currentUserId, currentUserName]);

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden">
      {/* 標頭 */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-white">
        <span className="text-sm font-medium">直播聊天室</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{viewerCount} 人觀看</span>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
        </div>
      </div>

      {/* 訊息列表 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-950">
        {messages.map(msg => (
          <div key={msg.id} className="text-sm">
            <span className="font-semibold text-blue-400">{msg.userName}</span>
            <span className="text-gray-300 ml-2">{msg.content}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 輸入區 */}
      <div className="flex gap-2 p-3 bg-gray-900">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder={connected ? '傳送訊息...' : '連線中...'}
          disabled={!connected}
          className="flex-1 px-3 py-1.5 text-sm rounded bg-gray-800 text-white
          border border-gray-700 focus:outline-none focus:border-blue-500
          disabled:opacity-50"
        />
        <button
          onClick={sendMessage}
          disabled={!connected || !input.trim()}
          className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded
          hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          送出
        </button>
      </div>
    </div>
  );
}
