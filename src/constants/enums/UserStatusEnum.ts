export enum UserStatusEnum {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    DELETED = 'DELETED',
    OTP_PENDING = 'OTP_PENDING',
    BANNED = 'BANNED'
}

export const UserStatusColors = {
    [UserStatusEnum.ACTIVE]: 'bg-green-500 text-white',
    [UserStatusEnum.INACTIVE]: 'bg-gray-500 text-white',
    [UserStatusEnum.DELETED]: 'bg-gray-800 text-white',
    [UserStatusEnum.OTP_PENDING]: 'bg-yellow-500 text-white',
    [UserStatusEnum.BANNED]: 'bg-red-500 text-white'
};

export const UserStatusLabels = {
    [UserStatusEnum.ACTIVE]: 'Hoạt động',
    [UserStatusEnum.INACTIVE]: 'Không hoạt động',
    [UserStatusEnum.DELETED]: 'Đã xóa',
    [UserStatusEnum.OTP_PENDING]: 'Chờ OTP',
    [UserStatusEnum.BANNED]: 'Bị cấm'
}; 