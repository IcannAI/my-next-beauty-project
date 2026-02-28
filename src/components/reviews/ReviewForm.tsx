'use client';

import { useState, useCallback } from 'react';
import StarRating from './StarRating';

interface Props {
    productId: string;
    existingReview?: { rating: number; comment: string | null } | null;
    onSuccess: (review: {
        id: string;
        rating: number;
        comment: string | null;
        createdAt: string;
        user: { id: string; name: string | null };
    }) => void;
}

export default function ReviewForm({
    productId,
    existingReview,
    onSuccess,
}: Props) {
    const [rating, setRating] = useState(existingReview?.rating || 0);
    const [comment, setComment] = useState(existingReview?.comment || '');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleRatingChange = useCallback((r: number) => {
        setRating(r);
        setError('');
    }, []);

    const handleSubmit = async () => {
        if (rating === 0) {
            setError('請選擇評分');
            return;
        }
        setSubmitting(true);
        setError('');

        try {
            const res = await fetch(`/api/products/${productId}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating, comment: comment.trim() || null }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || '提交失敗，請重試');
                return;
            }

            const { review } = await res.json();
            onSuccess(review);
        } catch {
            setError('提交失敗，請重試');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
            <h4 className="font-medium text-gray-900 mb-3">
                {existingReview ? '修改評分' : '寫下你的評分'}
            </h4>
            <div className="mb-3">
                <StarRating
                    rating={rating}
                    onChange={handleRatingChange}
                    size="lg"
                />
                {error && (
                    <p className="text-xs text-red-500 mt-1">{error}</p>
                )}
            </div>
            <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="分享你的使用心得（選填）"
                rows={3}
                maxLength={500}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
            />
            <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">
                    {comment.length}/500
                </span>
                <button
                    onClick={handleSubmit}
                    disabled={submitting || rating === 0}
                    className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors disabled:opacity-50"
                >
                    {submitting ? '提交中...' : existingReview ? '更新評分' : '提交評分'}
                </button>
            </div>
        </div>
    );
}
