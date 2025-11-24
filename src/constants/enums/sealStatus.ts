export enum SealStatus {
  ACTIVE = 'ACTIVE',
  IN_USE = 'IN_USE',
  REMOVED = 'REMOVED',
}

export const SealStatusLabel: Record<SealStatus, string> = {
  [SealStatus.ACTIVE]: 'Sẵn sàng',
  [SealStatus.IN_USE]: 'Đang sử dụng',
  [SealStatus.REMOVED]: 'Đã gỡ',
};

export const SealStatusColor: Record<SealStatus, string> = {
  [SealStatus.ACTIVE]: 'green',
  [SealStatus.IN_USE]: 'blue',
  [SealStatus.REMOVED]: 'orange',
};

export function getSealStatusLabel(status: string): string {
  return SealStatusLabel[status as SealStatus] || status || 'Không rõ';
}

export function getSealStatusColor(status: string): string {
  return SealStatusColor[status as SealStatus] || 'gray';
}
