'use client';

import { useState } from 'react';
import StarRating from './StarRating';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';

interface Review {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: Date | string;
    user: { id: string; name: string | null };
}

interface EligibilityData {
    eligible: boolean;
    hasReviewed: boolean;
    existingReview: { rating: number; comment: string | null } | null;
    reason?: string;
}

interface Props {
    productId: string;
    initialReviews: Review[];
    totalCount: number;
    avgRating: number;
    reviewCount: number;
    eligibility: EligibilityData;
    currentUserId?: string;
    isLoggedIn: boolean;
}

export default function ReviewSection({
    productId,
    initialReviews,
    totalCount,
    avgRating,
    reviewCount,
    eligibility,
    currentUserId,
    isLoggedIn,
}: Props) {
    const [currentAvg, setCurrentAvg] = useState(avgRating);
    const [currentCount, setCurrentCount] = useState(reviewCount);
    const [hasReviewed, setHasReviewed] = useState(eligibility.hasReviewed);
    const [existingReview, setExistingReview] = useState(
        eligibility.existingReview
    );
    const [showForm, setShowForm] = useState(false);

    const handleReviewSuccess = (review: Review) => {
        setHasReviewed(true);
        setExistingReview({ rating: review.rating, comment: review.comment });
        setShowForm(false);
        // 樂觀更新平均分
        if (!hasReviewed) {
            const newAvg =
                (currentAvg * currentCount + review.rating) / (currentCount + 1);
            setCurrentAvg(Math.round(newAvg * 10) / 10);
            setCurrentCount(prev => prev + 1);
        }
    };

    const getEligibilityMessage = () => {
        if (!isLoggedIn) return { text: '登入後才能評分', action: '/login' };
        if (eligibility.reason === 'own_product') return { text: '這是您的產品', action: null };
        if (eligibility.reason === 'no_purchase') return { text: '購買後才能評分', action: null };
        return null;
    };

    const message = getEligibilityMessage();

    return (
        <div className="mt-8">
            {/* 評分摘要 */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">
                        {currentAvg > 0 ? currentAvg.toFixed(1) : '-'}
                    </div>
                    <StarRating rating={currentAvg} readonly size="sm" />
                    <div className="text-xs text-gray-500 mt-1">
                        {currentCount} 則評論
                    </div>
                </div>
            </div>

            {/* 評分表單區塊 */}
            <div className="mb-6">
                {!isLoggedIn || !eligibility.eligible ? (
                    <div className="text-center py-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">{message?.text}</p>
                        {message?.action && (
                            <a
                                href={message.action}
                                className="text-rose-500 text-sm hover:underline mt-1 inline-block"
                            >
                                前往登入
                            </a>
                        )}
                    </div>
                ) : (
                    <div>
                        {hasReviewed && !showForm ? (
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                                <div className="flex items-center gap-2">
                                    <span className="text-green-600 text-sm">✓ 已評分</span>
                                    <StarRating rating={existingReview?.rating || 0} readonly size="sm" />
                                </div>
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="text-xs text-rose-500 hover:underline"
                                >
                                    修改評分
                                </button>
                            </div>
                        ) : (
                            <ReviewForm
                                productId={productId}
                                existingReview={existingReview}
                                onSuccess={handleReviewSuccess}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* 評論列表 */}
            <h3 className="font-semibold text-gray-900 mb-4">
                用戶評論（{currentCount}）
            </h3>
            <ReviewList
                productId={productId}
                initialReviews={initialReviews}
                totalCount={totalCount}
                avgRating={currentAvg}
                currentUserId={currentUserId}
            />
        </div>
    );
}
