export enum ConversationStatusEnum {
    ACTIVE = 'active',
    CLOSED = 'closed',
    PENDING = 'pending'
}

export const ConversationStatusColors = {
    [ConversationStatusEnum.ACTIVE]: 'bg-green-500 text-white',
    [ConversationStatusEnum.CLOSED]: 'bg-gray-500 text-white',
    [ConversationStatusEnum.PENDING]: 'bg-yellow-500 text-white'
};

export const ConversationStatusLabels = {
    [ConversationStatusEnum.ACTIVE]: 'Đang hoạt động',
    [ConversationStatusEnum.CLOSED]: 'Đã đóng',
    [ConversationStatusEnum.PENDING]: 'Chờ xử lý'
}; 