export enum OrderStatusEnum {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    CANCELLED = 'CANCELLED',
    CONTRACT_DRAFT = 'CONTRACT_DRAFT',
    CONTRACT_DENIED = 'CONTRACT_DENIED',
    CONTRACT_SIGNED = 'CONTRACT_SIGNED',
    ON_PLANNING = 'ON_PLANNING',
    ASSIGNED_TO_DRIVER = 'ASSIGNED_TO_DRIVER',
    DRIVER_CONFIRM = 'DRIVER_CONFIRM',
    PICKED_UP = 'PICKED_UP',
    SEALED_COMPLETED = 'SEALED_COMPLETED',
    ON_DELIVERED = 'ON_DELIVERED',
    ONGOING_DELIVERED = 'ONGOING_DELIVERED',
    IN_DELIVERED = 'IN_DELIVERED',
    IN_TROUBLES = 'IN_TROUBLES',
    RESOLVED = 'RESOLVED',
    COMPENSATION = 'COMPENSATION',
    DELIVERED = 'DELIVERED',
    SUCCESSFUL = 'SUCCESSFUL',
    REJECT_ORDER = 'REJECT_ORDER',
    RETURNING = 'RETURNING',
    RETURNED = 'RETURNED'
}

export const OrderStatusColors = {
    // Khởi tạo
    [OrderStatusEnum.PENDING]: 'bg-gray-400 text-white',
    [OrderStatusEnum.PROCESSING]: 'bg-blue-400 text-white',
    [OrderStatusEnum.CANCELLED]: 'bg-red-500 text-white',

    // Hợp đồng
    [OrderStatusEnum.CONTRACT_DRAFT]: 'bg-gray-300 text-gray-800',
    [OrderStatusEnum.CONTRACT_DENIED]: 'bg-red-400 text-white',
    [OrderStatusEnum.CONTRACT_SIGNED]: 'bg-green-400 text-white',

    // Lập kế hoạch
    [OrderStatusEnum.ON_PLANNING]: 'bg-indigo-400 text-white',
    [OrderStatusEnum.ASSIGNED_TO_DRIVER]: 'bg-indigo-500 text-white',
    [OrderStatusEnum.DRIVER_CONFIRM]: 'bg-indigo-600 text-white',

    // Đang vận chuyển
    [OrderStatusEnum.PICKED_UP]: 'bg-blue-500 text-white',
    [OrderStatusEnum.SEALED_COMPLETED]: 'bg-blue-600 text-white',
    [OrderStatusEnum.ON_DELIVERED]: 'bg-blue-700 text-white',
    [OrderStatusEnum.ONGOING_DELIVERED]: 'bg-blue-800 text-white',
    [OrderStatusEnum.IN_DELIVERED]: 'bg-blue-900 text-white',

    // Sự cố
    [OrderStatusEnum.IN_TROUBLES]: 'bg-amber-500 text-white',
    [OrderStatusEnum.RESOLVED]: 'bg-amber-700 text-white',
    [OrderStatusEnum.COMPENSATION]: 'bg-amber-800 text-white',

    // Hoàn thành
    [OrderStatusEnum.DELIVERED]: 'bg-green-500 text-white',
    [OrderStatusEnum.SUCCESSFUL]: 'bg-green-600 text-white',

    // Từ chối/Trả lại
    [OrderStatusEnum.REJECT_ORDER]: 'bg-red-600 text-white',
    [OrderStatusEnum.RETURNING]: 'bg-orange-500 text-white',
    [OrderStatusEnum.RETURNED]: 'bg-orange-600 text-white'
};

export const OrderStatusLabels = {
    [OrderStatusEnum.PENDING]: 'Chờ xử lý',
    [OrderStatusEnum.PROCESSING]: 'Đang xử lý',
    [OrderStatusEnum.CANCELLED]: 'Đã hủy',
    [OrderStatusEnum.CONTRACT_DRAFT]: 'Bản nháp hợp đồng',
    [OrderStatusEnum.CONTRACT_DENIED]: 'Hợp đồng bị từ chối',
    [OrderStatusEnum.CONTRACT_SIGNED]: 'Hợp đồng đã ký',
    [OrderStatusEnum.ON_PLANNING]: 'Đang lập kế hoạch',
    [OrderStatusEnum.ASSIGNED_TO_DRIVER]: 'Đã giao cho tài xế',
    [OrderStatusEnum.DRIVER_CONFIRM]: 'Tài xế đã xác nhận',
    [OrderStatusEnum.PICKED_UP]: 'Đã lấy hàng',
    [OrderStatusEnum.SEALED_COMPLETED]: 'Đã niêm phong',
    [OrderStatusEnum.ON_DELIVERED]: 'Đang giao hàng',
    [OrderStatusEnum.ONGOING_DELIVERED]: 'Đang tiến hành giao hàng',
    [OrderStatusEnum.IN_DELIVERED]: 'Trong quá trình giao hàng',
    [OrderStatusEnum.IN_TROUBLES]: 'Gặp sự cố',
    [OrderStatusEnum.RESOLVED]: 'Đã giải quyết',
    [OrderStatusEnum.COMPENSATION]: 'Đền bù',
    [OrderStatusEnum.DELIVERED]: 'Đã giao hàng',
    [OrderStatusEnum.SUCCESSFUL]: 'Thành công',
    [OrderStatusEnum.REJECT_ORDER]: 'Từ chối đơn hàng',
    [OrderStatusEnum.RETURNING]: 'Đang trả lại',
    [OrderStatusEnum.RETURNED]: 'Đã trả lại'
}; 