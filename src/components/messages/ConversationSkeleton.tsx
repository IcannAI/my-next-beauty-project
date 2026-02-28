export default function ConversationSkeleton() {
    return (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-4 p-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between">
                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                            <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
                        </div>
                        <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );
}
