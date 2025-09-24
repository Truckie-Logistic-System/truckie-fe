export enum CommonStatusEnum {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    DELETED = 'DELETED',
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED'
}

export const CommonStatusColors = {
    [CommonStatusEnum.ACTIVE]: 'bg-green-500 text-white',
    [CommonStatusEnum.INACTIVE]: 'bg-gray-500 text-white',
    [CommonStatusEnum.DELETED]: 'bg-red-500 text-white',
    [CommonStatusEnum.PENDING]: 'bg-yellow-500 text-white',
    [CommonStatusEnum.PROCESSING]: 'bg-blue-500 text-white',
    [CommonStatusEnum.COMPLETED]: 'bg-purple-500 text-white'
};

export const CommonStatusLabels = {
    [CommonStatusEnum.ACTIVE]: 'Hoạt động',
    [CommonStatusEnum.INACTIVE]: 'Không hoạt động',
    [CommonStatusEnum.DELETED]: 'Đã xóa',
    [CommonStatusEnum.PENDING]: 'Chờ xử lý',
    [CommonStatusEnum.PROCESSING]: 'Đang xử lý',
    [CommonStatusEnum.COMPLETED]: 'Hoàn thành'
}; 