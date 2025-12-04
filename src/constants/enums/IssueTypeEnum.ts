export enum IssueType {
  SEAL_REPLACEMENT = 'SEAL_REPLACEMENT',
  DAMAGE = 'DAMAGE',
  PENALTY = 'PENALTY',
  ORDER_REJECTION = 'ORDER_REJECTION',
  REROUTE = 'REROUTE',
  OFF_ROUTE_RUNAWAY = 'OFF_ROUTE_RUNAWAY'
}

export const IssueTypeLabels: Record<IssueType, string> = {
  [IssueType.SEAL_REPLACEMENT]: 'Thay thế seal',
  [IssueType.DAMAGE]: 'Hư hỏng hàng hóa',
  [IssueType.PENALTY]: 'Vi phạm giao thông',
  [IssueType.ORDER_REJECTION]: 'Từ chối đơn hàng',
  [IssueType.REROUTE]: 'Điều hướng lại',
  [IssueType.OFF_ROUTE_RUNAWAY]: 'Lệch tuyến bỏ trốn'
};

export function getIssueTypeLabel(type: string): string {
  return IssueTypeLabels[type as IssueType] || type || 'Không xác định';
}
