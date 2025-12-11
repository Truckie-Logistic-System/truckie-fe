/**
 * Format a date to a readable string
 */
export const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
};

/**
 * Format a date with time
 */
export const formatDateTime = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Format a date with time including seconds
 */
export const formatDateTimeWithSeconds = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const dateStr = d.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    const timeStr = d.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
    return `${dateStr} ${timeStr}`;
};

/**
 * Format currency to VND
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
};

/**
 * Format a phone number to Vietnamese format
 */
export const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Check if it's a valid Vietnamese phone number
    if (cleaned.length !== 10) {
        return phone; // Return original if not valid
    }

    // Format as 0xxx xxx xxx
    return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7, 10)}`;
};

/**
 * Format distance in kilometers
 */
export const formatDistance = (distance: number): string => {
    return `${distance.toFixed(1)} km`;
};

/**
 * Safely format a number to Vietnamese locale string
 * Handles undefined, null, and NaN values by defaulting to 0
 */
export const safeFormatNumber = (value?: number | null): string => {
    const safeValue = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
    return safeValue.toLocaleString('vi-VN');
};