'use client';

import { useTheme } from './ThemeProvider';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

const options = [
  { value: 'light', label: '淺色', icon: Sun },
  { value: 'dark',  label: '深色', icon: Moon },
  { value: 'system', label: '系統', icon: Monitor },
] as const;

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = options.find(o => o.value === theme) ?? options[2];
  const Icon = current.icon;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-center h-8 w-8 rounded-full border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
        title="切換主題"
      >
        <Icon className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-32 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
          {options.map(opt => {
            const OptIcon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => { setTheme(opt.value); setOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-colors',
                  theme === opt.value
                    ? 'bg-white/10 text-rose-500'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                )}
              >
                <OptIcon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
