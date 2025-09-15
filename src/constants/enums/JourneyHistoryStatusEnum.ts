export enum JourneyHistoryStatusEnum {
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    DELAYED = 'DELAYED'
}

export const JourneyHistoryStatusColors = {
    [JourneyHistoryStatusEnum.IN_PROGRESS]: 'bg-blue-500 text-white',
    [JourneyHistoryStatusEnum.COMPLETED]: 'bg-green-500 text-white',
    [JourneyHistoryStatusEnum.DELAYED]: 'bg-red-500 text-white'
};

export const JourneyHistoryStatusLabels = {
    [JourneyHistoryStatusEnum.IN_PROGRESS]: 'Đang tiến hành',
    [JourneyHistoryStatusEnum.COMPLETED]: 'Hoàn thành',
    [JourneyHistoryStatusEnum.DELAYED]: 'Bị trễ'
}; 