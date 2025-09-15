export enum RoleTypeEnum {
    ADMIN = 'ADMIN',
    CUSTOMER = 'CUSTOMER',
    PARTNER = 'PARTNER',
    STAFF = 'STAFF',
    DRIVER = 'DRIVER'
}

export const RoleTypeColors = {
    [RoleTypeEnum.ADMIN]: 'bg-red-600 text-white',
    [RoleTypeEnum.CUSTOMER]: 'bg-blue-500 text-white',
    [RoleTypeEnum.PARTNER]: 'bg-purple-500 text-white',
    [RoleTypeEnum.STAFF]: 'bg-green-500 text-white',
    [RoleTypeEnum.DRIVER]: 'bg-amber-500 text-white'
};

export const RoleTypeLabels = {
    [RoleTypeEnum.ADMIN]: 'Quản trị viên',
    [RoleTypeEnum.CUSTOMER]: 'Khách hàng',
    [RoleTypeEnum.PARTNER]: 'Đối tác',
    [RoleTypeEnum.STAFF]: 'Nhân viên',
    [RoleTypeEnum.DRIVER]: 'Tài xế'
}; 