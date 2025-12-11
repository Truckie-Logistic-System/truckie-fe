import type { Vehicle } from './Vehicle';

// Trạng thái dịch vụ - mirror backend VehicleServiceStatusEnum
export type VehicleServiceStatus =
    | 'PLANNED'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'OVERDUE';

// Nhãn hiển thị tiếng Việt cho từng trạng thái
export const VEHICLE_SERVICE_STATUS_LABELS: Record<VehicleServiceStatus, string> = {
    PLANNED: 'Đã lên lịch',
    COMPLETED: 'Đã hoàn thành',
    CANCELLED: 'Đã hủy',
    OVERDUE: 'Quá hạn',
};

// Màu chủ đạo để style card/badge cho từng trạng thái
// Có thể dùng trực tiếp với Ant Design (color token) hoặc Tailwind class map ngoài UI
export const VEHICLE_SERVICE_STATUS_COLORS: Record<VehicleServiceStatus, string> = {
    PLANNED: '#1677ff',      // xanh dương - đã lên lịch
    COMPLETED: '#52c41a',    // xanh lá - hoàn thành
    CANCELLED: '#8c8c8c',    // xám - đã hủy
    OVERDUE: '#ff4d4f',      // đỏ - quá hạn
};

export interface VehicleServiceRecord {
    id: string;
    // Loại dịch vụ - lấy từ API get service types
    serviceType?: string;
    // Trạng thái
    serviceStatus?: VehicleServiceStatus;
    // Ngày tháng
    plannedDate?: string;
    actualDate?: string;
    nextServiceDate?: string;  // Ngày bảo trì/kiểm định tiếp theo
    // Chi tiết
    description?: string;
    odometerReading?: number;
    // Thông tin xe
    vehicleEntity?: Vehicle;
    // Metadata
    createdAt?: string;
    updatedAt?: string;
}

// Alias for backward compatibility
export type VehicleMaintenance = VehicleServiceRecord;

export interface PaginatedServiceRecordsResponse {
    content: VehicleServiceRecord[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

// Alias for backward compatibility
export type PaginatedMaintenancesResponse = PaginatedServiceRecordsResponse;

export interface CreateVehicleServiceRecordRequest {
    serviceType: string;
    plannedDate?: string;
    actualDate?: string;
    nextServiceDate?: string;
    description?: string;
    odometerReading?: number;
    vehicleId: string;
}

// Alias for backward compatibility
export type CreateVehicleMaintenanceRequest = CreateVehicleServiceRecordRequest;

export interface UpdateVehicleServiceRecordRequest {
    serviceType?: string;
    serviceStatus?: VehicleServiceStatus;
    plannedDate?: string;
    actualDate?: string;
    nextServiceDate?: string;
    description?: string;
    odometerReading?: number;
    vehicleId?: string;
}

// Alias for backward compatibility
export type UpdateVehicleMaintenanceRequest = UpdateVehicleServiceRecordRequest;
