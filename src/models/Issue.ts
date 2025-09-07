// Issue model
export interface Issue {
    id: string;
    description: string;
    locationLatitude: number | null;
    locationLongitude: number | null;
    status: IssueStatus;
    vehicleAssignment?: VehicleAssignment;
    staff?: IssueUser;
    issueType?: IssueType;
}

export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export interface IssueType {
    id: string;
    createdAt?: string;
    modifiedAt?: string;
    createdBy?: string;
    modifiedBy?: string;
    issueTypeName: string;
    description?: string;
    isActive: boolean;
}

export interface VehicleAssignment {
    id: string;
    createdAt?: string;
    modifiedAt?: string;
    createdBy?: string;
    modifiedBy?: string;
    description?: string;
    status: string;
    vehicle?: Vehicle;
    driver1?: Driver;
    driver2?: Driver;
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