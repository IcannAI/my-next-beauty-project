'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Video, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function StartLivePage() {
  const [title, setTitle] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const router = useRouter();

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsStarting(true);
    try {
      const res = await fetch('/api/live/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/live/${data.id}`);
      } else {
        alert('無法開始直播，請稍後再試');
      }
    } catch (err) {
      console.error(err);
      alert('發生錯誤');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <Link href="/dashboard/live" className="inline-flex items-center gap-2 text-gray-400 hover:text-rose-500 font-bold text-xs uppercase tracking-widest transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          返回工作室
        </Link>

        <div className="bg-white dark:bg-gray-900 p-10 md:p-16 rounded-[3rem] shadow-2xl shadow-gray-200/50 dark:shadow-none space-y-10 border border-gray-100 dark:border-gray-800">
          <div className="text-center space-y-2">
            <div className="w-20 h-20 bg-rose-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 shadow-lg shadow-rose-200 dark:shadow-none animate-in zoom-in duration-500">
              <Video className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter italic">準備開始？</h1>
            <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px]">Set your title and go live instantly</p>
          </div>

          <form onSubmit={handleStart} className="space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-black uppercase text-gray-400 dark:text-gray-600 tracking-widest ml-1">直播主題</label>
              <Input
                placeholder="例如：春季新品大特賣 🌸"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="py-8 px-6 text-xl rounded-[1.5rem] bg-gray-50 dark:bg-gray-950 border-none focus:ring-2 focus:ring-rose-500 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-700 font-bold"
              />
            </div>

            <Button
              type="submit"
              disabled={isStarting || !title.trim()}
              className="w-full py-10 h-auto bg-rose-500 hover:bg-rose-600 text-white text-2xl font-black italic tracking-tighter rounded-[2rem] shadow-2xl shadow-rose-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
            >
              {isStarting ? '正在開啟直播...' : '開始直播'}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
