export enum OrderStatusEnum {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    CONTRACT_DRAFT = 'CONTRACT_DRAFT',
    CONTRACT_SIGNED = 'CONTRACT_SIGNED',
    ON_PLANNING = 'ON_PLANNING',
    ASSIGNED_TO_DRIVER = 'ASSIGNED_TO_DRIVER',
    FULLY_PAID = 'FULLY_PAID',
    PICKING_UP = 'PICKING_UP',
    ON_DELIVERED = 'ON_DELIVERED',
    ONGOING_DELIVERED = 'ONGOING_DELIVERED',
    DELIVERED = 'DELIVERED',
    IN_TROUBLES = 'IN_TROUBLES',
    RESOLVED = 'RESOLVED',
    COMPENSATION = 'COMPENSATION',
    SUCCESSFUL = 'SUCCESSFUL',
    REJECT_ORDER = 'REJECT_ORDER',
    RETURNING = 'RETURNING',
    RETURNED = 'RETURNED'
}

export const OrderStatusColors = {
    // Khởi tạo
    [OrderStatusEnum.PENDING]: 'bg-gray-400 text-white',
    [OrderStatusEnum.PROCESSING]: 'bg-blue-400 text-white',

    // Hợp đồng
    [OrderStatusEnum.CONTRACT_DRAFT]: 'bg-gray-300 text-gray-800',
    [OrderStatusEnum.CONTRACT_SIGNED]: 'bg-green-400 text-white',

    // Lập kế hoạch và thanh toán
    [OrderStatusEnum.ON_PLANNING]: 'bg-indigo-400 text-white',
    [OrderStatusEnum.ASSIGNED_TO_DRIVER]: 'bg-indigo-500 text-white',
    [OrderStatusEnum.FULLY_PAID]: 'bg-emerald-500 text-white',

    // Đang vận chuyển
    [OrderStatusEnum.PICKING_UP]: 'bg-blue-500 text-white',
    [OrderStatusEnum.ON_DELIVERED]: 'bg-blue-700 text-white',
    [OrderStatusEnum.ONGOING_DELIVERED]: 'bg-blue-800 text-white',

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
    [OrderStatusEnum.CONTRACT_DRAFT]: 'Bản nháp hợp đồng',
    [OrderStatusEnum.CONTRACT_SIGNED]: 'Hợp đồng đã ký',
    [OrderStatusEnum.ON_PLANNING]: 'Đang lập kế hoạch',
    [OrderStatusEnum.ASSIGNED_TO_DRIVER]: 'Đã giao cho tài xế',
    [OrderStatusEnum.FULLY_PAID]: 'Đã thanh toán đầy đủ',
    [OrderStatusEnum.PICKING_UP]: 'Đang lấy hàng',
    [OrderStatusEnum.ON_DELIVERED]: 'Đang giao hàng',
    [OrderStatusEnum.ONGOING_DELIVERED]: 'Sắp giao đến khách hàng',
    [OrderStatusEnum.DELIVERED]: 'Đã giao hàng',
    [OrderStatusEnum.IN_TROUBLES]: 'Gặp sự cố',
    [OrderStatusEnum.RESOLVED]: 'Đã giải quyết',
    [OrderStatusEnum.COMPENSATION]: 'Đền bù',
    [OrderStatusEnum.SUCCESSFUL]: 'Hoàn thành',
    [OrderStatusEnum.REJECT_ORDER]: 'Từ chối đơn hàng',
    [OrderStatusEnum.RETURNING]: 'Đang trả lại',
    [OrderStatusEnum.RETURNED]: 'Đã trả lại'
};

// Màu nền cho status cards (inline style objects)
export const OrderStatusCardColors = {
    // Khởi tạo - Vàng/Cam
    [OrderStatusEnum.PENDING]: { backgroundColor: '#fff7ed', borderColor: '#fed7aa' },
    [OrderStatusEnum.PROCESSING]: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },

    // Hợp đồng - Xanh lá/Xám
    [OrderStatusEnum.CONTRACT_DRAFT]: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' },
    [OrderStatusEnum.CONTRACT_SIGNED]: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },

    // Lập kế hoạch và thanh toán - Tím/Xanh dương
    [OrderStatusEnum.ON_PLANNING]: { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' },
    [OrderStatusEnum.ASSIGNED_TO_DRIVER]: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
    [OrderStatusEnum.FULLY_PAID]: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },

    // Đang vận chuyển - Xanh dương
    [OrderStatusEnum.PICKING_UP]: { backgroundColor: '#ecfeff', borderColor: '#a5f3fc' },
    [OrderStatusEnum.ON_DELIVERED]: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
    [OrderStatusEnum.ONGOING_DELIVERED]: { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' },

    // Sự cố - Vàng/Cam/Đỏ
    [OrderStatusEnum.IN_TROUBLES]: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
    [OrderStatusEnum.RESOLVED]: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
    [OrderStatusEnum.COMPENSATION]: { backgroundColor: '#fff7ed', borderColor: '#fed7aa' },

    // Hoàn thành - Xanh lá
    [OrderStatusEnum.DELIVERED]: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
    [OrderStatusEnum.SUCCESSFUL]: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },

    // Từ chối/Trả lại - Đỏ/Tím
    [OrderStatusEnum.REJECT_ORDER]: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
    [OrderStatusEnum.RETURNING]: { backgroundColor: '#faf5ff', borderColor: '#e9d5ff' },
    [OrderStatusEnum.RETURNED]: { backgroundColor: '#fdf2f8', borderColor: '#fbcfe8' }
}; 