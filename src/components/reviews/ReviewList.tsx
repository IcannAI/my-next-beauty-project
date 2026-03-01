'use client';

import {
    useState,
    useEffect,
    useRef,
    useTransition,
    useMemo,
    useCallback,
} from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import ReviewCard from './ReviewCard';
import ReviewSkeleton from './ReviewSkeleton';
import RatingDistribution from './RatingDistribution';

interface Review {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: Date | string;
    user: { id: string; name: string | null };
}

interface DistributionItem {
    rating: number;
    count: number;
    percent: number;
}

interface Props {
    productId: string;
    initialReviews: Review[];
    totalCount: number;
    avgRating: number;
    currentUserId?: string;
}

export default function ReviewList({
    productId,
    initialReviews,
    totalCount,
    avgRating,
    currentUserId,
}: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // URL 狀態
    const sort = searchParams.get('sort') || 'latest';
    const filterRating = searchParams.get('rating')
        ? parseInt(searchParams.get('rating')!)
        : null;

    // 本地狀態
    const [reviews, setReviews] = useState<Review[]>(initialReviews);
    const [total, setTotal] = useState(totalCount);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(initialReviews.length < totalCount);
    const [distribution, setDistribution] = useState<DistributionItem[]>([]);
    const [currentAvgRating, setCurrentAvgRating] = useState(avgRating);

    // 無限捲動 ref
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // 取得評分分佈
    useEffect(() => {
        fetch(`/api/products/${productId}/reviews/stats`)
            .then(res => res.json())
            .then(data => {
                setDistribution(data.ratingDistribution || []);
                setCurrentAvgRating(data.avgRating || avgRating);
            })
            .catch(() => { });
    }, [productId, avgRating]);

    // URL 變更時重新取得評論
    useEffect(() => {
        setPage(0);
        const params = new URLSearchParams({
            sort,
            page: '0',
            ...(filterRating ? { rating: String(filterRating) } : {}),
        });
        fetch(`/api/products/${productId}/reviews?${params}`)
            .then(res => res.json())
            .then(data => {
                setReviews(data.reviews);
                setTotal(data.total);
                setHasMore(data.reviews.length < data.total);
            })
            .catch(() => { });
    }, [sort, filterRating, productId]);

    // 載入更多
    const loadMore = useCallback(async () => {
        if (isPending || !hasMore) return;
        const nextPage = page + 1;
        startTransition(async () => {
            const params = new URLSearchParams({
                sort,
                page: String(nextPage),
                ...(filterRating ? { rating: String(filterRating) } : {}),
            });
            const res = await fetch(
                `/api/products/${productId}/reviews?${params}`
            );
            const data = await res.json();
            setReviews(prev => {
                const updated = [...prev, ...data.reviews];
                setHasMore(updated.length < data.total);
                return updated;
            });
            setPage(nextPage);
        });
    }, [isPending, hasMore, page, sort, filterRating, productId, reviews.length]);

    // IntersectionObserver 無限捲動
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !isPending) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );
        const current = loadMoreRef.current;
        if (current) observer.observe(current);
        return () => {
            if (current) observer.unobserve(current);
        };
    }, [hasMore, isPending, loadMore]);

    // URL 更新函式
    const updateURL = useCallback(
        (newSort: string, newRating: number | null) => {
            const params = new URLSearchParams(searchParams);
            params.set('sort', newSort);
            if (newRating) {
                params.set('rating', String(newRating));
            } else {
                params.delete('rating');
            }
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [router, pathname, searchParams]
    );

    const handleSortChange = useCallback(
        (newSort: string) => updateURL(newSort, filterRating),
        [updateURL, filterRating]
    );

    const handleFilterChange = useCallback(
        (rating: number | null) => updateURL(sort, rating),
        [updateURL, sort]
    );

    const handleDelete = useCallback((reviewId: string) => {
        setReviews(prev => prev.filter(r => r.id !== reviewId));
        setTotal(prev => prev - 1);
    }, []);

    // 排序按鈕 memo
    const sortButtons = useMemo(
        () => [
            { value: 'latest', label: '最新' },
            { value: 'highest', label: '最高分' },
            { value: 'lowest', label: '最低分' },
        ],
        []
    );

    return (
        <div>
            {/* 評分分佈圖 */}
            {distribution.length > 0 && (
                <RatingDistribution
                    avgRating={currentAvgRating}
                    totalCount={total}
                    distribution={distribution}
                    onFilterChange={handleFilterChange}
                    activeFilter={filterRating}
                />
            )}

            {/* 排序按鈕 */}
            <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex gap-2">
                    {sortButtons.map(option => (
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

                {/* 星級篩選 */}
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

            {/* 目前篩選狀態提示 */}
            {filterRating && (
                <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
                    <span>篩選：{filterRating} 星評論</span>
                    <button
                        onClick={() => handleFilterChange(null)}
                        className="text-rose-500 hover:underline text-xs"
                    >
                        清除篩選
                    </button>
                </div>
            )}

            {/* 評論列表 */}
            {isPending && reviews.length === 0 ? (
                <ReviewSkeleton />
            ) : reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                    <p className="text-3xl mb-2">💬</p>
                    <p>
                        {filterRating
                            ? `還沒有 ${filterRating} 星評論`
                            : '還沒有評論，成為第一個評論的人吧！'}
                    </p>
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

                    {/* 無限捲動觸發點 */}
                    <div ref={loadMoreRef} className="py-2">
                        {isPending && hasMore && (
                            <div className="flex justify-center py-4">
                                <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                        {!hasMore && reviews.length > 0 && (
                            <p className="text-center text-xs text-gray-400 py-2">
                                已顯示全部 {total} 則評論
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
