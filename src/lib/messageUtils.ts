export function formatMessageTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateGroup(date: Date | string): string {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return '今天';
    if (d.toDateString() === yesterday.toDateString()) return '昨天';
    return d.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export function shouldShowDateDivider(
    curr: { createdAt: Date | string },
    prev?: { createdAt: Date | string }
): boolean {
    if (!prev) return true;
    const currDate = new Date(curr.createdAt).toDateString();
    const prevDate = new Date(prev.createdAt).toDateString();
    return currDate !== prevDate;
}

export function shouldShowTime(
    curr: { createdAt: Date | string },
    prev?: { createdAt: Date | string }
): boolean {
    if (!prev) return true;
    const diff =
        new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
    return diff > 5 * 60 * 1000; // 超過 5 分鐘才顯示時間
}
