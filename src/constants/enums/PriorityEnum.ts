export enum PriorityEnum {
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW'
}

export const PriorityColors = {
    [PriorityEnum.HIGH]: 'bg-red-500 text-white',
    [PriorityEnum.MEDIUM]: 'bg-yellow-500 text-white',
    [PriorityEnum.LOW]: 'bg-green-500 text-white'
};

export const PriorityLabels = {
    [PriorityEnum.HIGH]: 'Cao',
    [PriorityEnum.MEDIUM]: 'Trung bình',
    [PriorityEnum.LOW]: 'Thấp'
}; 