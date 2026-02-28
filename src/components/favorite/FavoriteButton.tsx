'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FavoriteButtonProps {
  productId: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
}

export default function FavoriteButton({
  productId,
  initialFavorited,
  isLoggedIn,
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    setLoading(true);
    try {
      const method = favorited ? 'DELETE' : 'POST';
      const res = await fetch(`/api/favorite/${productId}`, { method });
      const data = await res.json();
      setFavorited(data.favorited);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`p-2 rounded-full transition-colors ${
        favorited
          ? 'text-rose-500 hover:text-rose-600'
          : 'text-gray-400 hover:text-rose-500'
      } disabled:opacity-50`}
      title={favorited ? '取消收藏' : '加入收藏'}
    >
      {favorited ? '❤️' : '🤍'}
    </button>
  );
}
