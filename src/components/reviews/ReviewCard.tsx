import { memo } from 'react';
import StarRating from './StarRating';

interface Review {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: Date | string;
    user: { id: string; name: string | null };
}

interface Props {
    review: Review;
    currentUserId?: string;
    productId: string;
    onDelete?: (reviewId: string) => void;
}

const ReviewCard = memo(function ReviewCard({
    review,
    currentUserId,
    productId,
    onDelete,
}: Props) {
    const isOwner = currentUserId === review.user.id;

    const handleDelete = async () => {
        if (!confirm('確定要刪除這則評論嗎？')) return;
        try {
            await fetch(`/api/products/${productId}/reviews/${review.id}`, {
                method: 'DELETE',
            });
            onDelete?.(review.id);
        } catch {
            console.error('刪除失敗');
        }
    };

    return (
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white text-sm font-bold">
                        {review.user.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                        {review.user.name || '匿名用戶'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString('zh-TW')}
                    </span>
                    {isOwner && (
                        <button
                            onClick={handleDelete}
                            className="text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                            刪除
                        </button>
                    )}
                </div>
            </div>
            <StarRating rating={review.rating} readonly size="sm" />
            {review.comment && (
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {review.comment}
                </p>
            )}
        </div>
    );
});

export default ReviewCard;
