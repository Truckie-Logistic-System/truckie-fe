export enum VehicleServiceStatusEnum {
  PLANNED = 'PLANNED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE',
}

export interface VehicleServiceStatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon?: string;
}

export const VEHICLE_SERVICE_STATUS_CONFIG: Record<VehicleServiceStatusEnum, VehicleServiceStatusConfig> = {
  [VehicleServiceStatusEnum.PLANNED]: {
    label: 'Đã lên lịch',
    color: '#3B82F6', // blue-600
    bgColor: '#EFF6FF', // blue-50
    borderColor: '#BFDBFE', // blue-200
    icon: 'Calendar',
  },
  [VehicleServiceStatusEnum.COMPLETED]: {
    label: 'Đã hoàn thành',
    color: '#10B981', // emerald-600
    bgColor: '#D1FAE5', // emerald-50
    borderColor: '#A7F3D0', // emerald-200
    icon: 'CheckCircle',
  },
  [VehicleServiceStatusEnum.CANCELLED]: {
    label: 'Đã hủy',
    color: '#6B7280', // gray-600
    bgColor: '#F3F4F6', // gray-50
    borderColor: '#D1D5DB', // gray-200
    icon: 'XCircle',
  },
  [VehicleServiceStatusEnum.OVERDUE]: {
    label: 'Quá hạn',
    color: '#EF4444', // red-600
    bgColor: '#FEE2E2', // red-50
    borderColor: '#FCA5A5', // red-200
    icon: 'AlertCircle',
  },
};

// Helper function để lấy config dựa trên status
export const getVehicleServiceStatusConfig = (status: VehicleServiceStatusEnum): VehicleServiceStatusConfig => {
  return VEHICLE_SERVICE_STATUS_CONFIG[status] || VEHICLE_SERVICE_STATUS_CONFIG[VehicleServiceStatusEnum.PLANNED];
};

// Helper function để lấy tất cả các status options cho dropdown/filter
export const getVehicleServiceStatusOptions = () => {
  return Object.entries(VEHICLE_SERVICE_STATUS_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
    color: config.color,
  }));
};
