'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FollowButtonProps {
    targetUserId: string;
    initialFollowing: boolean;
    isLoggedIn: boolean;
}

export default function FollowButton({
    targetUserId,
    initialFollowing,
    isLoggedIn,
}: FollowButtonProps) {
    const [following, setFollowing] = useState(initialFollowing);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleClick = async () => {
        if (!isLoggedIn) {
            router.push('/login');
            return;
        }
        setLoading(true);
        try {
            const method = following ? 'DELETE' : 'POST';
            const res = await fetch(`/api/follow/${targetUserId}`, { method });
            const data = await res.json();
            setFollowing(data.following);
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
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${following
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-rose-500 text-white hover:bg-rose-600'
                } disabled:opacity-50`}
        >
            {loading ? '處理中...' : following ? '已追蹤' : '追蹤'}
        </button>
    );
}
