export function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    // Less than a minute ago
    if (diffInSeconds < 60) {
        return `${diffInSeconds} sec ago`;
    }

    // Less than an hour ago
    if (diffInMinutes < 60) {
        return diffInMinutes === 1 ? '1 min ago' : `${diffInMinutes} mins ago`;
    }

    // Less than 24 hours ago
    if (diffInHours < 24) {
        return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
    }

    // Yesterday
    if (diffInDays === 1) {
        return 'Yesterday';
    }

    // Less than 7 days ago
    if (diffInDays < 7) {
        return `${diffInDays} days ago`;
    }

    // More than 7 days ago - show actual date
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
