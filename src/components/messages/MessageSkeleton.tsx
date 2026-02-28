export default function MessageSkeleton() {
    return (
        <div className="flex flex-col gap-3 p-4">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                    <div className="h-10 w-48 bg-gray-200 rounded-2xl animate-pulse" />
                </div>
            ))}
        </div>
    );
}
