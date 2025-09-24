export enum IssueEnum {
    OPEN = 'OPEN',
    IN_PROGRESS = 'IN_PROGRESS',
    RESOLVED = 'RESOLVED'
}

export const IssueStatusColors = {
    [IssueEnum.OPEN]: 'bg-yellow-500 text-white',
    [IssueEnum.IN_PROGRESS]: 'bg-blue-500 text-white',
    [IssueEnum.RESOLVED]: 'bg-green-500 text-white'
};

export const IssueStatusLabels = {
    [IssueEnum.OPEN]: 'Mở',
    [IssueEnum.IN_PROGRESS]: 'Đang xử lý',
    [IssueEnum.RESOLVED]: 'Đã giải quyết'
}; 