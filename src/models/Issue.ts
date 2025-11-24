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
    vehicleAssignment?: VehicleAssignment; // For compatibility with old code
    vehicleAssignmentEntity?: VehicleAssignment; // Backend returns this field name
    staff?: IssueUser;
    issueTypeEntity?: IssueTypeEntity;
    
    // Seal replacement specific fields (only for SEAL_REPLACEMENT category)
    oldSeal?: Seal;
    newSeal?: Seal;
    sealRemovalImage?: string;
    newSealAttachedImage?: string;
    newSealConfirmedAt?: string;

    // Damage issue specific fields (only for DAMAGE category)
    orderDetailEntity?: OrderDetailInfo; // The specific package that is damaged
    issueImages?: string[]; // URLs of damage images
    orderDetail?: OrderDetailForIssue; // Order detail info (tracking code, description, weight, unit)
    
    // Sender/Customer information (for damage and order rejection issues)
    sender?: CustomerInfo; // Customer contact information for staff
    
    // REROUTE specific fields (only for REROUTE category)
    affectedSegment?: JourneySegment; // The segment where the issue occurred
    reroutedJourney?: JourneyHistory; // The new journey after rerouting
}

// Order detail information for issue
export interface OrderDetailForIssue {
    trackingCode: string;
    description: string;
    weightBaseUnit: number;
    unit: string;
    orderId?: string; // Order ID for grouping issues
}

export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'PAYMENT_OVERDUE';

export type IssueCategory = 
    | 'GENERAL' 
    | 'SEAL_REPLACEMENT' 
    | 'ACCIDENT' 
    | 'VEHICLE_BREAKDOWN' 
    | 'WEATHER' 
    | 'CARGO_ISSUE'
    | 'DAMAGE'
    | 'MISSING_ITEMS'
    | 'WRONG_ITEMS'
    | 'ORDER_REJECTION'
    | 'PENALTY'
    | 'REROUTE';

export interface Seal {
    id: string;
    sealCode: string;
    status: string;
    sealDate?: string;
    description?: string;
    sealAttachedImage?: string;
    sealRemovalTime?: string;
    sealRemovalReason?: string;
    vehicleAssignment?: {
        id: string;
    };
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

export interface OrderDetailInfo {
    id: string;
    trackingCode?: string;
    packageName?: string;
    status?: string;
    orderId?: string; // Order ID for grouping issues
}

export interface CustomerInfo {
    id: string;
    companyName?: string;
    representativeName?: string;
    representativePhone?: string;
    businessLicenseNumber?: string;
    businessAddress?: string;
    status?: string;
    userResponse?: {
        id: string;
        fullName?: string;
        email?: string;
        phoneNumber?: string;
    };
}

// Journey segment for REROUTE issues
export interface JourneySegment {
    id: string;
    segmentOrder: number;
    startPointName: string;
    endPointName: string;
    startLatitude: number;
    startLongitude: number;
    endLatitude: number;
    endLongitude: number;
    distanceKilometers?: number;
    pathCoordinatesJson?: string;
    tollDetailsJson?: string;
    status?: string;
    createdAt?: string;
    modifiedAt?: string;
}

// Journey history for REROUTE issues
export interface JourneyHistory {
    id: string;
    journeyName: string;
    journeyType: string;
    status: string;
    vehicleAssignmentId?: string;
    totalDistance?: number;
    journeySegments?: JourneySegment[];
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
        case 'PAYMENT_OVERDUE':
            return 'red';
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
        case 'PAYMENT_OVERDUE':
            return 'Quá hạn thanh toán';
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
        case 'DAMAGE':
            return 'Hàng hóa hư hại';
        case 'PENALTY':
            return 'Vi phạm giao thông';
        case 'REROUTE':
            return 'Tái định tuyến';
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
        case 'DAMAGE':
            return 'volcano';
        case 'PENALTY':
            return 'magenta';
        case 'REROUTE':
            return 'blue';
        default:
            return 'default';
    }
}; 