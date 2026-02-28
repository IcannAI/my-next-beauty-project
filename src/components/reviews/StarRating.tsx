'use client';

import { useState, useCallback } from 'react';

interface Props {
    rating: number;
    onChange?: (rating: number) => void;
    readonly?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export default function StarRating({
    rating,
    onChange,
    readonly = false,
    size = 'md',
}: Props) {
    const [hoverRating, setHoverRating] = useState(0);

    const sizeClass = {
        sm: 'text-sm',
        md: 'text-xl',
        lg: 'text-3xl',
    }[size];

    const handleClick = useCallback(
        (star: number) => {
            if (!readonly && onChange) onChange(star);
        },
        [readonly, onChange]
    );

    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(star => {
                const filled = readonly
                    ? star <= Math.round(rating)
                    : star <= (hoverRating || rating);
                const isHalf = readonly && star === Math.ceil(rating) && rating % 1 >= 0.3;

                return (
                    <button
                        key={star}
                        type="button"
                        disabled={readonly}
                        onClick={() => handleClick(star)}
                        onMouseEnter={() => !readonly && setHoverRating(star)}
                        onMouseLeave={() => !readonly && setHoverRating(0)}
                        className={`${sizeClass} transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
                            } ${filled
                                ? 'text-yellow-400'
                                : isHalf
                                    ? 'text-yellow-200'
                                    : 'text-gray-300'
                            }`}
                    >
                        ★
                    </button>
                );
            })}
            {readonly && rating > 0 && (
                <span className="ml-1 text-sm text-gray-500">
                    {rating.toFixed(1)}
                </span>
            )}
        </div>
    );
}
