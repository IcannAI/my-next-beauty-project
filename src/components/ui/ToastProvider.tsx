'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    conversationId?: string;
}

interface ToastContextType {
    showToast: (message: string, type?: Toast['type'], conversationId?: string) => void;
}

const ToastContext = createContext<ToastContextType>({
    showToast: () => { },
});

export function useToast() {
    return useContext(ToastContext);
}

export default function ToastProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback(
        (message: string, type: Toast['type'] = 'info', conversationId?: string) => {
            const id = `toast-${Date.now()}`;
            setToasts(prev => [...prev, { id, message, type, conversationId }]);
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 4000);
        },
        []
    );

    const handleClick = (toast: Toast) => {
        if (toast.conversationId) {
            window.location.href = `/messages/${toast.conversationId}`;
        }
        setToasts(prev => prev.filter(t => t.id !== toast.id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        onClick={() => handleClick(toast)}
                        className={`
              px-4 py-3 rounded-xl shadow-lg text-white text-sm
              flex items-center gap-2 cursor-pointer
              animate-in slide-in-from-right duration-300
              max-w-sm
              ${toast.type === 'success' ? 'bg-green-500' : ''}
              ${toast.type === 'error' ? 'bg-red-500' : ''}
              ${toast.type === 'info' ? 'bg-gray-800' : ''}
            `}
                    >
                        <span>
                            {toast.type === 'success' && '✓ '}
                            {toast.type === 'error' && '✕ '}
                            {toast.type === 'info' && '💬 '}
                        </span>
                        <span>{toast.message}</span>
                        {toast.conversationId && (
                            <span className="text-xs opacity-70 ml-1">點擊查看</span>
                        )}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
