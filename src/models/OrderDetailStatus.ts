/**
 * Order Detail Status Enum with Vietnamese labels and color codes
 * Used for displaying delivery progress in real-time tracking and order details
 */

export enum OrderDetailStatusEnum {
  PENDING = 'PENDING',
  ON_PLANNING = 'ON_PLANNING',
  ASSIGNED_TO_DRIVER = 'ASSIGNED_TO_DRIVER',
  PICKING_UP = 'PICKING_UP',
  ON_DELIVERED = 'ON_DELIVERED',
  ONGOING_DELIVERED = 'ONGOING_DELIVERED',
  DELIVERED = 'DELIVERED',
  SUCCESSFUL = 'SUCCESSFUL',
  IN_TROUBLES = 'IN_TROUBLES',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
  RETURNING = 'RETURNING',
  RETURNED = 'RETURNED',
}

/**
 * Status metadata with Vietnamese labels and Tailwind color classes
 */
export const OrderDetailStatusMetadata: Record<
  OrderDetailStatusEnum,
  {
    label: string;
    color: string; // Tailwind CSS classes
    bgColor: string;
    textColor: string;
  }
> = {
  [OrderDetailStatusEnum.PENDING]: {
    label: 'Chờ xử lý',
    color: 'bg-gray-100 text-gray-700',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
  },
  [OrderDetailStatusEnum.ON_PLANNING]: {
    label: 'Đang lên kế hoạch',
    color: 'bg-gray-100 text-gray-700',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
  },
  [OrderDetailStatusEnum.ASSIGNED_TO_DRIVER]: {
    label: 'Đã gán cho tài xế',
    color: 'bg-purple-100 text-purple-700',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
  },
  [OrderDetailStatusEnum.PICKING_UP]: {
    label: 'Đang lấy hàng',
    color: 'bg-blue-100 text-blue-700',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
  },
  [OrderDetailStatusEnum.ON_DELIVERED]: {
    label: 'Đang giao hàng',
    color: 'bg-blue-100 text-blue-700',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
  },
  [OrderDetailStatusEnum.ONGOING_DELIVERED]: {
    label: 'Sắp giao hàng',
    color: 'bg-blue-100 text-blue-700',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
  },
  [OrderDetailStatusEnum.DELIVERED]: {
    label: 'Đã giao hàng',
    color: 'bg-green-100 text-green-700',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
  },
  [OrderDetailStatusEnum.SUCCESSFUL]: {
    label: 'Hoàn thành',
    color: 'bg-green-100 text-green-700',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
  },
  [OrderDetailStatusEnum.IN_TROUBLES]: {
    label: 'Có sự cố',
    color: 'bg-red-100 text-red-700',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
  },
  [OrderDetailStatusEnum.RESOLVED]: {
    label: 'Đã giải quyết',
    color: 'bg-red-100 text-red-700',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
  },
  [OrderDetailStatusEnum.REJECTED]: {
    label: 'Từ chối',
    color: 'bg-red-100 text-red-700',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
  },
  [OrderDetailStatusEnum.RETURNING]: {
    label: 'Đang hoàn trả',
    color: 'bg-orange-100 text-orange-700',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
  },
  [OrderDetailStatusEnum.RETURNED]: {
    label: 'Đã hoàn trả',
    color: 'bg-orange-100 text-orange-700',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
  },
};

/**
 * Get Vietnamese label for a status
 */
export const getDetailStatusLabel = (status: string): string => {
  const metadata = OrderDetailStatusMetadata[status as OrderDetailStatusEnum];
  return metadata?.label || status;
};

/**
 * Get color classes for a status
 */
export const getDetailStatusColor = (status: string): string => {
  const metadata = OrderDetailStatusMetadata[status as OrderDetailStatusEnum];
  return metadata?.color || 'bg-gray-200 text-gray-600';
};