export default function MessageSkeleton() {
    return (
        <div className="flex flex-col gap-4 p-4">
            {[1, 2, 3, 4, 5].map(i => (
                <div
                    key={i}
                    className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
                >
                    <div className={`flex flex-col gap-1 ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
                        <div
                            className="h-10 bg-gray-200 rounded-2xl animate-pulse"
                            style={{ width: `${120 + (i * 30)}px` }}
                        />
                        <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );
}
