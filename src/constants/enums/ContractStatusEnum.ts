export enum ContractStatusEnum {
  CONTRACT_DRAFT = 'CONTRACT_DRAFT',
  CONTRACT_SIGNED = 'CONTRACT_SIGNED',
  DEPOSITED = 'DEPOSITED',
  PAID = 'PAID',
  UNPAID = 'UNPAID',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  REFUNDED = 'REFUNDED'
}

export const ContractStatusColors = {
  // Bản nháp
  [ContractStatusEnum.CONTRACT_DRAFT]: 'bg-blue-500 text-white',
  [ContractStatusEnum.CONTRACT_SIGNED]: 'bg-green-400 text-white',

  // Thanh toán
  [ContractStatusEnum.DEPOSITED]: 'bg-yellow-500 text-white',
  [ContractStatusEnum.PAID]: 'bg-emerald-500 text-white',
  [ContractStatusEnum.UNPAID]: 'bg-orange-500 text-white',

  // Hủy/Hết hạn
  [ContractStatusEnum.CANCELLED]: 'bg-red-500 text-white',
  [ContractStatusEnum.EXPIRED]: 'bg-gray-600 text-white',
  [ContractStatusEnum.REFUNDED]: 'bg-purple-500 text-white'
};

export const ContractStatusLabels = {
  [ContractStatusEnum.CONTRACT_DRAFT]: 'Bản nháp hợp đồng',
  [ContractStatusEnum.CONTRACT_SIGNED]: 'Hợp đồng đã ký',
  [ContractStatusEnum.DEPOSITED]: 'Đã đặt cọc',
  [ContractStatusEnum.PAID]: 'Đã thanh toán',
  [ContractStatusEnum.UNPAID]: 'Chưa thanh toán',
  [ContractStatusEnum.CANCELLED]: 'Đã hủy',
  [ContractStatusEnum.EXPIRED]: 'Hết hạn',
  [ContractStatusEnum.REFUNDED]: 'Đã hoàn tiền'
};

// Màu nền cho status cards (inline style objects)
export const ContractStatusCardColors = {
  // Bản nháp - Xanh dương
  [ContractStatusEnum.CONTRACT_DRAFT]: { backgroundColor: '#dbeafe', borderColor: '#93c5fd' },
  [ContractStatusEnum.CONTRACT_SIGNED]: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },

  // Thanh toán - Vàng/Xanh lá
  [ContractStatusEnum.DEPOSITED]: { backgroundColor: '#fef3c7', borderColor: '#fcd34d' },
  [ContractStatusEnum.PAID]: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  [ContractStatusEnum.UNPAID]: { backgroundColor: '#fff7ed', borderColor: '#fed7aa' },

  // Hủy/Hết hạn - Đỏ/Xám
  [ContractStatusEnum.CANCELLED]: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  [ContractStatusEnum.EXPIRED]: { backgroundColor: '#f3f4f6', borderColor: '#d1d5db' },
  [ContractStatusEnum.REFUNDED]: { backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }
};
