'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('USER');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async () => {
        if (!name || !email || !password) {
            setError('請填寫所有欄位');
            return;
        }
        if (password.length < 6) {
            setError('密碼至少 6 個字元');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || '註冊失敗');
                return;
            }
            router.push('/login?registered=1');
        } catch {
            setError('發生錯誤，請重試');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-gray-900 rounded-3xl p-8 border border-white/5 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-white italic tracking-tighter">
                        BEAUTY<span className="text-rose-500">LIVE</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-2">建立新帳號</p>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1 block">名稱</label>
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="你的名字"
                            className="bg-gray-800 border-white/10 text-white rounded-xl"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1 block">Email</label>
                        <Input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="bg-gray-800 border-white/10 text-white rounded-xl"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1 block">密碼</label>
                        <Input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="至少 6 個字元"
                            className="bg-gray-800 border-white/10 text-white rounded-xl"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1 block">角色</label>
                        <select
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-3 py-2 text-sm"
                        >
                            <option value="USER">一般用戶</option>
                            <option value="KOL">KOL 直播主</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">※ 管理員帳號需由現有管理員指派</p>
                    </div>
                    {error && (
                        <p className="text-sm text-rose-500 text-center">{error}</p>
                    )}
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold h-12"
                    >
                        {loading ? '註冊中...' : '建立帳號'}
                    </Button>
                    <p className="text-center text-sm text-gray-400">
                        已有帳號？
                        <Link href="/login" className="text-rose-500 hover:underline ml-1">立即登入</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
