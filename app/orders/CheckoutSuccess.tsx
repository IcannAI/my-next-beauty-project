'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CheckoutSuccess() {
    const params = useSearchParams();
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (params.get('checkout') === 'success') {
            setShow(true);
            setTimeout(() => setShow(false), 5000);
        }
    }, [params]);

    if (!show) return null;

    return (
        <div className="mb-6 px-6 py-4 bg-green-500 text-white rounded-2xl font-bold text-sm flex items-center gap-2">
            ✓ 結帳成功！訂單已建立，請等待商家確認。
        </div>
    );
}
