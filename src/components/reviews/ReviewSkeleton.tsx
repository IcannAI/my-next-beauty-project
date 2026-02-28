export default function ReviewSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-16 bg-gray-100 rounded animate-pulse ml-auto" />
                    </div>
                    <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map(s => (
                            <div key={s} className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
                        ))}
                    </div>
                    <div className="space-y-2">
                        <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                        <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );
}
