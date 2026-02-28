'use client';

import { useState, useTransition } from 'react';
import ReviewCard from './ReviewCard';
import ReviewSkeleton from './ReviewSkeleton';

interface Review {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: Date | string;
    user: { id: string; name: string | null };
}

interface Props {
    productId: string;
    initialReviews: Review[];
    totalCount: number;
    currentUserId?: string;
}

export default function ReviewList({
    productId,
    initialReviews,
    totalCount,
    currentUserId,
}: Props) {
    const [reviews, setReviews] = useState<Review[]>(initialReviews);
    const [sort, setSort] = useState('latest');
    const [filterRating, setFilterRating] = useState<number | null>(null);
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(totalCount);
    const [isPending, startTransition] = useTransition();

    const fetchReviews = async (
        newSort: string,
        newFilter: number | null,
        newPage: number
    ) => {
        const params = new URLSearchParams({
            sort: newSort,
            page: String(newPage),
            ...(newFilter ? { rating: String(newFilter) } : {}),
        });
        const res = await fetch(
            `/api/products/${productId}/reviews?${params}`
        );
        const data = await res.json();
        setReviews(data.reviews);
        setTotal(data.total);
    };

    const handleSortChange = (newSort: string) => {
        setSort(newSort);
        setPage(0);
        startTransition(() => {
            fetchReviews(newSort, filterRating, 0);
        });
    };

    const handleFilterChange = (rating: number | null) => {
        setFilterRating(rating);
        setPage(0);
        startTransition(() => {
            fetchReviews(sort, rating, 0);
        });
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        startTransition(() => {
            fetchReviews(sort, filterRating, newPage);
        });
    };

    const handleDelete = (reviewId: string) => {
        setReviews(prev => prev.filter(r => r.id !== reviewId));
        setTotal(prev => prev - 1);
    };

    const totalPages = Math.ceil(total / 10);

    return (
        <div>
            {/* 排序和篩選 */}
            <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex gap-2">
                    {[
                        { value: 'latest', label: '最新' },
                        { value: 'highest', label: '最高分' },
                        { value: 'lowest', label: '最低分' },
                    ].map(option => (
                        <button
                            key={option.value}
                            onClick={() => handleSortChange(option.value)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${sort === option.value
                                    ? 'bg-rose-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => handleFilterChange(null)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterRating === null
                                ? 'bg-rose-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        全部
                    </button>
                    {[5, 4, 3, 2, 1].map(r => (
                        <button
                            key={r}
                            onClick={() => handleFilterChange(r)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterRating === r
                                    ? 'bg-rose-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {r}★
                        </button>
                    ))}
                </div>
            </div>

            {/* 評論列表 */}
            {isPending ? (
                <ReviewSkeleton />
            ) : reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    <p>還沒有評論</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {reviews.map(review => (
                        <ReviewCard
                            key={review.id}
                            review={review}
                            currentUserId={currentUserId}
                            productId={productId}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {/* 分頁 */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 0}
                        className="px-3 py-1 rounded-lg text-sm border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
                    >
                        上一頁
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-600">
                        {page + 1} / {totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= totalPages - 1}
                        className="px-3 py-1 rounded-lg text-sm border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
                    >
                        下一頁
                    </button>
                </div>
            )}
        </div>
    );
}
