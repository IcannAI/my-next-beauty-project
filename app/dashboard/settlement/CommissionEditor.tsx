'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Check, X } from 'lucide-react';

interface Props {
    kolProfileId: string;
    currentRate: number;
    isAdmin: boolean;
}

export default function CommissionEditor({
    kolProfileId,
    currentRate,
    isAdmin,
}: Props) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(String(Math.round(currentRate * 100)));
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    if (!isAdmin) {
        return (
            <span className="text-3xl font-black text-gray-900 dark:text-white italic tracking-tighter">
                {Math.round(currentRate * 100)}%
            </span>
        );
    }

    const handleSave = async () => {
        const rate = Number(value) / 100;
        if (isNaN(rate) || rate < 0 || rate > 1) {
            alert('請輸入 0~100 之間的數值');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/kol/${kolProfileId}/commission`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commissionRate: rate }),
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || '更新失敗');
                return;
            }
            setEditing(false);
            router.refresh();
        } catch {
            alert('更新失敗，請重試');
        } finally {
            setSaving(false);
        }
    };

    if (!editing) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-gray-900 dark:text-white italic tracking-tighter">
                    {Math.round(currentRate * 100)}%
                </span>
                <button
                    onClick={() => setEditing(true)}
                    className="p-1.5 rounded-full hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                >
                    <Pencil className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
                <Input
                    type="number"
                    min="0"
                    max="100"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    className="w-20 h-8 text-sm rounded-lg"
                />
                <span className="text-sm font-bold text-gray-500">%</span>
            </div>
            <button
                onClick={handleSave}
                disabled={saving}
                className="p-1.5 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50"
            >
                <Check className="w-3.5 h-3.5" />
            </button>
            <button
                onClick={() => { setEditing(false); setValue(String(Math.round(currentRate * 100))); }}
                className="p-1.5 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
