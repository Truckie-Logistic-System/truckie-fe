/**
 * Utility functions for Order Status Breakdown
 * Provides detailed breakdown of order details by status
 */

export interface OrderStatusBreakdownItem {
    status: string;
    count: number;
    label: string;
    color: string;
    percentage: number;
}

export interface OrderStatusBreakdownResult {
    items: OrderStatusBreakdownItem[];
    total: number;
    summary: string;
    priorityStatus: string; // The status that determines Order status
    explanation: string; // Why this priority status was chosen
}

/**
 * Calculate order status breakdown from order details
 * @param orderDetails - Array of order details with status
 * @param currentOrderStatus - Current order status
 * @returns Detailed breakdown with explanation
 */
export const calculateOrderStatusBreakdown = (
    orderDetails: Array<{ status: string }>,
    currentOrderStatus: string
): OrderStatusBreakdownResult => {
    if (!orderDetails || orderDetails.length === 0) {
        return {
            items: [],
            total: 0,
            summary: 'Không có kiện hàng',
            priorityStatus: '',
            explanation: ''
        };
    }

    // Count statuses
    const statusCounts = new Map<string, number>();
    orderDetails.forEach(detail => {
        const status = detail.status;
        statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    });

    const total = orderDetails.length;

    // Map to readable labels and colors (from OrderDetailStatusMetadata)
    const statusMetadata: Record<string, { label: string; color: string }> = {
        'PENDING': { label: 'Chờ xử lý', color: 'bg-gray-100 text-gray-700' },
        'ON_PLANNING': { label: 'Đang lập kế hoạch', color: 'bg-blue-100 text-blue-700' },
        'ASSIGNED_TO_DRIVER': { label: 'Đã phân tài xế', color: 'bg-indigo-100 text-indigo-700' },
        'PICKING_UP': { label: 'Đang lấy hàng', color: 'bg-purple-100 text-purple-700' },
        'ON_DELIVERED': { label: 'Đang vận chuyển', color: 'bg-cyan-100 text-cyan-700' },
        'ONGOING_DELIVERED': { label: 'Đang giao hàng', color: 'bg-teal-100 text-teal-700' },
        'DELIVERED': { label: 'Đã giao', color: 'bg-green-100 text-green-700' },
        'SUCCESSFUL': { label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
        'IN_TROUBLES': { label: 'Có vấn đề', color: 'bg-yellow-100 text-yellow-700' },
        'COMPENSATION': { label: 'Đã đền bù', color: 'bg-purple-100 text-purple-700' },
        'RETURNING': { label: 'Đang trả hàng', color: 'bg-orange-100 text-orange-700' },
        'RETURNED': { label: 'Đã trả hàng', color: 'bg-orange-100 text-orange-700' },
        'CANCELLED': { label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
    };

    // Create breakdown items
    const items: OrderStatusBreakdownItem[] = Array.from(statusCounts.entries())
        .map(([status, count]) => ({
            status,
            count,
            label: statusMetadata[status]?.label || status,
            color: statusMetadata[status]?.color || 'bg-gray-100 text-gray-700',
            percentage: Math.round((count / total) * 100)
        }))
        .sort((a, b) => b.count - a.count); // Sort by count descending

    // Determine priority status and explanation based on backend logic
    const deliveredCount = statusCounts.get('DELIVERED') || 0;
    const successfulCount = statusCounts.get('SUCCESSFUL') || 0;
    const inTroublesCount = statusCounts.get('IN_TROUBLES') || 0;
    const compensationCount = statusCounts.get('COMPENSATION') || 0;
    const returnedCount = statusCounts.get('RETURNED') || 0;
    const returningCount = statusCounts.get('RETURNING') || 0;

    let priorityStatus = '';
    let explanation = '';

    // Apply same priority logic as backend
    if (deliveredCount > 0 || successfulCount > 0) {
        priorityStatus = 'SUCCESSFUL';
        if (inTroublesCount > 0 || compensationCount > 0 || returnedCount > 0) {
            explanation = `Đơn hàng thành công vì có ${deliveredCount + successfulCount} kiện giao được. Các kiện còn lại đã được xử lý riêng.`;
        } else {
            explanation = `Tất cả ${deliveredCount + successfulCount} kiện đã giao thành công.`;
        }
    } else if (inTroublesCount > 0) {
        priorityStatus = 'IN_TROUBLES';
        explanation = `Có ${inTroublesCount} kiện đang gặp vấn đề, cần nhân viên xử lý.`;
    } else if (compensationCount > 0) {
        priorityStatus = 'COMPENSATION';
        if (returnedCount > 0) {
            explanation = `${compensationCount} kiện đã được đền bù, ${returnedCount} kiện đã hoàn trả về điểm lấy hàng.`;
        } else {
            explanation = `Tất cả ${compensationCount} kiện đã được đền bù.`;
        }
    } else if (returnedCount > 0 || returningCount > 0) {
        priorityStatus = returnedCount === total ? 'RETURNED' : 'RETURNING';
        if (returnedCount === total) {
            explanation = `Tất cả ${returnedCount} kiện đã hoàn trả về điểm lấy hàng.`;
        } else {
            explanation = `${returningCount} kiện đang hoàn trả, ${returnedCount} kiện đã hoàn trả.`;
        }
    } else {
        priorityStatus = currentOrderStatus;
        explanation = 'Đơn hàng đang được xử lý.';
    }

    // Create summary
    const summary = items.map(item => `${item.count} ${item.label.toLowerCase()}`).join(', ');

    return {
        items,
        total,
        summary,
        priorityStatus,
        explanation
    };
};

/**
 * Check if order has mixed statuses that need detailed explanation
 */
export const hasMixedStatuses = (orderDetails: Array<{ status: string }>): boolean => {
    if (!orderDetails || orderDetails.length <= 1) return false;
    
    const uniqueStatuses = new Set(orderDetails.map(d => d.status));
    return uniqueStatuses.size > 1;
};

/**
 * Get warning message if order has concerning status combinations
 */
export const getStatusWarning = (
    orderDetails: Array<{ status: string }>
): string | null => {
    const statusCounts = new Map<string, number>();
    orderDetails.forEach(detail => {
        statusCounts.set(detail.status, (statusCounts.get(detail.status) || 0) + 1);
    });

    const inTroublesCount = statusCounts.get('IN_TROUBLES') || 0;
    const compensationCount = statusCounts.get('COMPENSATION') || 0;
    const returnedCount = statusCounts.get('RETURNED') || 0;

    if (inTroublesCount > 0) {
        return `⚠️ Có ${inTroublesCount} kiện đang gặp vấn đề, cần xử lý ngay`;
    }

    if (compensationCount > 0 && returnedCount > 0) {
        return `ℹ️ Đơn hàng có cả kiện đền bù và kiện hoàn trả`;
    }

    return null;
};
