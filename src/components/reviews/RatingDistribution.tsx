import { useMemo } from 'react';
import StarRating from './StarRating';

interface DistributionItem {
    rating: number;
    count: number;
    percent: number;
}

interface Props {
    avgRating: number;
    totalCount: number;
    distribution: DistributionItem[];
    onFilterChange: (rating: number | null) => void;
    activeFilter: number | null;
}

export default function RatingDistribution({
    avgRating,
    totalCount,
    distribution,
    onFilterChange,
    activeFilter,
}: Props) {
    const maxCount = useMemo(
        () => Math.max(...distribution.map(d => d.count), 1),
        [distribution]
    );

    return (
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex gap-6">
                {/* 左側：總平均 */}
                <div className="flex flex-col items-center justify-center min-w-[80px]">
                    <div className="text-4xl font-bold text-gray-900">
                        {avgRating > 0 ? avgRating.toFixed(1) : '-'}
                    </div>
                    <StarRating rating={avgRating} readonly size="sm" />
                    <div className="text-xs text-gray-500 mt-1">
                        {totalCount} 則評論
                    </div>
                </div>

                {/* 右側：分佈條 */}
                <div className="flex-1 space-y-1.5">
                    {distribution.map(item => (
                        <button
                            key={item.rating}
                            onClick={() =>
                                onFilterChange(
                                    activeFilter === item.rating ? null : item.rating
                                )
                            }
                            className={`w-full flex items-center gap-2 group transition-opacity ${activeFilter !== null && activeFilter !== item.rating
                                    ? 'opacity-40'
                                    : ''
                                }`}
                        >
                            <span className="text-xs text-gray-500 w-4 text-right">
                                {item.rating}
                            </span>
                            <span className="text-yellow-400 text-xs">★</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-300 ${activeFilter === item.rating
                                            ? 'bg-rose-500'
                                            : 'bg-yellow-400 group-hover:bg-rose-400'
                                        }`}
                                    style={{
                                        width: `${(item.count / maxCount) * 100}%`,
                                    }}
                                />
                            </div>
                            <span className="text-xs text-gray-400 w-8 text-left">
                                {item.percent}%
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
