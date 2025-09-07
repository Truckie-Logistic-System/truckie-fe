// Order model
export interface Order {
    id: string;
    totalPrice: number;
    notes?: string;
    totalQuantity: number;
    totalWeight: number;
    orderCode: string;
    receiverName: string;
    receiverPhone: string;
    status: OrderStatus;
    packageDescription?: string;
    createdAt: string;
    updatedAt: string;
    senderId?: string;
    deliveryId?: string;
    pickupAddressId?: string;
    categoryId?: string;
    orderDetails?: OrderDetail[];
}

export interface OrderDetail {
    weight: number;
    description?: string;
    status: string;
    startTime?: string;
    estimatedStartTime?: string;
    endTime?: string;
    estimatedEndTime?: string;
    createdAt: string;
    updatedAt: string;
    trackingCode: string;
    orderId: string;
    orderSizeId?: string;
    vehicleAssignmentId?: string;
}

export type OrderStatus =
    | 'PENDING'
    | 'PROCESSING'
    | 'CANCELLED'
    | 'CONTRACT_DRAFT'
    | 'CONTRACT_DENIED'
    | 'CONTRACT_SIGNED'
    | 'ON_PLANNING'
    | 'ASSIGNED_TO_DRIVER'
    | 'DRIVER_CONFIRM'
    | 'PICKED_UP'
    | 'SEALED_COMPLETED'
    | 'ON_DELIVERED'
    | 'ONGOING_DELIVERED'
    | 'IN_DELIVERED'
    | 'IN_TROUBLES'
    | 'RESOLVED'
    | 'COMPENSATION'
    | 'DELIVERED'
    | 'SUCCESSFUL'
    | 'REJECT_ORDER'
    | 'RETURNING'
    | 'RETURNED';

export interface OrderCreateRequest {
    orderRequest: {
        notes: string;
        totalWeight: number;
        receiverName: string;
        receiverPhone: string;
        packageDescription: string;
        estimateStartTime: string;
        deliveryAddressId: string;
        pickupAddressId: string;
        senderId: string;
        categoryId: string;
    };
    orderDetails: {
        weight: number;
        description: string;
        orderSizeId: string;
    }[];
}

export interface OrderUpdateRequest {
    status?: OrderStatus;
    notes?: string;
}

export interface OrderResponse {
    id: string;
    totalPrice: number;
    notes?: string;
    totalQuantity: number;
    totalWeight: number;
    orderCode: string;
    receiverName: string;
    receiverPhone: string;
    status: string;
    packageDescription?: string;
    createdAt: string;
    updatedAt: string;
    senderId?: string;
    deliveryId?: string;
    pickupAddressId?: string;
    categoryId?: string;
    orderDetails?: OrderDetail[];
}

// Chuyển đổi từ API response sang model
export const mapOrderResponseToModel = (apiOrder: OrderResponse): Order => {
    return {
        ...apiOrder,
        status: apiOrder.status as OrderStatus
    };
};

// Lọc orders theo status
export const filterOrdersByStatus = (orders: Order[], status: OrderStatus | 'all'): Order[] => {
    if (status === 'all') return orders;
    return orders.filter(order => order.status === status);
};

// Tính tổng doanh thu từ danh sách orders
export const calculateTotalRevenue = (orders: Order[]): number => {
    return orders.reduce((total, order) => total + (order.totalPrice || 0), 0);
};

// Kiểm tra xem order có thể hủy không
export const canCancelOrder = (order: Order): boolean => {
    const cancellableStatuses: OrderStatus[] = ['PENDING', 'PROCESSING', 'CONTRACT_DRAFT'];
    return cancellableStatuses.includes(order.status);
}; 