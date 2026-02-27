'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { User } from '@prisma/client';

export function UserActions({ user }: { user: User }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const updateRole = async (role: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) router.refresh();
      else alert('更新失敗');
    } catch (err) {
      console.error(err);
      alert('發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const toggleBan = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banned: !user.banned }),
      });
      if (res.ok) router.refresh();
      else alert('操作失敗');
    } catch (err) {
      console.error(err);
      alert('發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      {user.role === 'USER' && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => updateRole('KOL')}
          disabled={loading}
          className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
        >
          升級為 KOL
        </Button>
      )}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={toggleBan}
        disabled={loading}
        className={user.banned 
          ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100" 
          : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
        }
      >
        {user.banned ? '解除禁用' : '禁用'}
      </Button>
    </div>
  );
}
