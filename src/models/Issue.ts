// Issue model
export interface Issue {
    id: string;
    description: string;
    locationLatitude: number | null;
    locationLongitude: number | null;
    status: IssueStatus;
    issueCategory: IssueCategory; // NEW: Category to determine issue type
    reportedAt?: string;
    resolvedAt?: string;
    vehicleAssignment?: VehicleAssignment;
    staff?: IssueUser;
    issueTypeEntity?: IssueTypeEntity;
    
    // Seal replacement specific fields (only for SEAL_REPLACEMENT category)
    oldSeal?: Seal;
    newSeal?: Seal;
    sealRemovalImage?: string;
    newSealAttachedImage?: string;
    newSealConfirmedAt?: string;
}

export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export type IssueCategory = 
    | 'GENERAL' 
    | 'SEAL_REPLACEMENT' 
    | 'ACCIDENT' 
    | 'VEHICLE_BREAKDOWN' 
    | 'WEATHER' 
    | 'CARGO_ISSUE';

export interface Seal {
    id: string;
    sealCode: string;
    status: string;
    sealDate?: string;
    description?: string;
    sealAttachedImage?: string;
    sealRemovalTime?: string;
    sealRemovalReason?: string;
}

export interface IssueTypeEntity {
    id: string;
    createdAt?: string;
    modifiedAt?: string;
    createdBy?: string;
    modifiedBy?: string;
    issueTypeName: string;
    description?: string;
    issueCategory: string; // GENERAL, SEAL_REPLACEMENT, ACCIDENT, PENALTY, etc.
    isActive: boolean;
}

export interface VehicleAssignment {
    id: string;
    createdAt?: string;
    modifiedAt?: string;
    createdBy?: string;
    modifiedBy?: string;
    description?: string;
    status?: string;
    trackingCode?: string;
    vehicle?: VehicleInfo;
    driver1?: DriverInfo;
    driver2?: DriverInfo;
}

export interface VehicleInfo {
    id: string;
    licensePlateNumber: string;
    model?: string;
    manufacturer?: string;
    year?: number;
    vehicleType?: VehicleTypeInfo;
}

export interface VehicleTypeInfo {
    id: string;
    vehicleTypeName: string;
}

export interface DriverInfo {
    id: string;
    fullName: string;
    phoneNumber?: string;
    driverLicenseNumber?: string;
    licenseClass?: string;
    experienceYears?: string;
}

export interface Vehicle {
    id: string;
    licensePlateNumber: string;
    model?: string;
    manufacturer?: string;
    year?: number;
    capacity?: number;
    status: string;
    currentLatitude?: number;
    currentLongitude?: number;
    lastUpdated?: string;
    vehicleType?: VehicleType;
}

export interface VehicleType {
    id: string;
    vehicleTypeName: string;
    description?: string;
}

export interface Driver {
    id: string;
    identityNumber?: string;
    driverLicenseNumber?: string;
    cardSerialNumber?: string;
    placeOfIssue?: string;
    dateOfIssue?: string;
    dateOfExpiry?: string;
    licenseClass?: string;
    dateOfPassing?: string;
    status: string;
    user?: IssueUser;
}

export interface IssueUser {
    id: string;
    username: string;
    fullName: string;
    email?: string;
    phoneNumber?: string;
    gender?: boolean;
    dateOfBirth?: string;
    imageUrl?: string;
    status: string;
    role?: Role;
}

export interface Role {
    id: string;
    roleName: string;
    description?: string;
    isActive: boolean;
}

// Helpers for Issue
export const getIssueStatusColor = (status: IssueStatus): string => {
    switch (status) {
        case 'OPEN':
            return 'orange';
        case 'IN_PROGRESS':
            return 'blue';
        case 'RESOLVED':
            return 'green';
        default:
            return 'default';
    }
};

export const getIssueStatusLabel = (status: IssueStatus): string => {
    switch (status) {
        case 'OPEN':
            return 'Chờ xử lý';
        case 'IN_PROGRESS':
            return 'Đang xử lý';
        case 'RESOLVED':
            return 'Đã giải quyết';
        default:
            return status;
    }
};

export const getDriverFullName = (driver?: Driver): string => {
    return driver?.user?.fullName || 'Không có tài xế';
};

export const getVehicleInfo = (vehicle?: Vehicle): string => {
    if (!vehicle) return 'Không có phương tiện';
    return `${vehicle.licensePlateNumber} (${vehicle.model || 'Không rõ'})`;
};

export const getIssueCategoryLabel = (category: IssueCategory): string => {
    switch (category) {
        case 'GENERAL':
            return 'Sự cố chung';
        case 'SEAL_REPLACEMENT':
            return 'Thay thế seal';
        case 'ACCIDENT':
            return 'Tai nạn';
        case 'VEHICLE_BREAKDOWN':
            return 'Hỏng xe';
        case 'WEATHER':
            return 'Thời tiết xấu';
        case 'CARGO_ISSUE':
            return 'Vấn đề hàng hóa';
        default:
            return category;
    }
};

export const getIssueCategoryColor = (category: IssueCategory): string => {
    switch (category) {
        case 'GENERAL':
            return 'default';
        case 'SEAL_REPLACEMENT':
            return 'purple';
        case 'ACCIDENT':
            return 'red';
        case 'VEHICLE_BREAKDOWN':
            return 'orange';
        case 'WEATHER':
            return 'cyan';
        case 'CARGO_ISSUE':
            return 'gold';
        default:
            return 'default';
    }
}; 