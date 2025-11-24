export enum IssueStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
}

export const IssueStatusLabel: Record<IssueStatus, string> = {
  [IssueStatus.OPEN]: 'Chờ xử lý',
  [IssueStatus.IN_PROGRESS]: 'Đang xử lý',
  [IssueStatus.RESOLVED]: 'Đã giải quyết',
};

export const IssueStatusColor: Record<IssueStatus, string> = {
  [IssueStatus.OPEN]: 'blue',
  [IssueStatus.IN_PROGRESS]: 'orange',
  [IssueStatus.RESOLVED]: 'green',
};

export function getIssueStatusLabel(status: string): string {
  return IssueStatusLabel[status as IssueStatus] || status || 'Không rõ';
}

export function getIssueStatusColor(status: string): string {
  return IssueStatusColor[status as IssueStatus] || 'blue';
}
