// Issue model - matches backend GetBasicIssueResponse
export interface Issue {
    id: string;
    description: string;
    locationLatitude: number | null;
    locationLongitude: number | null;
    status: IssueStatus;
    issueCategory: IssueCategory;
    reportedAt?: string;
    resolvedAt?: string;
    vehicleAssignmentEntity?: VehicleAssignment; // Full vehicle assignment with tracking code, vehicle, drivers
    staff?: IssueUser;
    issueTypeEntity?: IssueTypeEntity;
    
    // Seal replacement specific fields
    oldSeal?: Seal;
    newSeal?: Seal;
    sealRemovalImage?: string;
    newSealAttachedImage?: string;
    newSealConfirmedAt?: string;

    // Damage issue specific fields
    issueImages?: string[];
    orderDetail?: OrderDetailForIssue;
    sender?: CustomerInfo;
    
    // ORDER_REJECTION specific fields
    paymentDeadline?: string;
    calculatedFee?: number;
    adjustedFee?: number;
    finalFee?: number;
    affectedOrderDetails?: OrderDetailForIssue[];
    transactions?: any[];
    
    // REROUTE specific fields
    affectedSegment?: JourneySegment;
    reroutedJourney?: JourneyHistory;
    
    // DAMAGE compensation specific fields
    damageCompensation?: DamageCompensation;
}

// DAMAGE compensation details
export interface DamageCompensation {
    // Input data
    damageAssessmentPercent?: number;
    hasInsurance?: boolean;
    damageHasDocuments?: boolean;
    damageDeclaredValue?: number;
    damageEstimatedMarketValue?: number;
    
    // Calculated values
    damageFreightFee?: number;
    damageLegalLimit?: number;
    damageEstimatedLoss?: number;
    damagePolicyCompensation?: number;
    damageFinalCompensation?: number;
    
    // Policy info
    damageCompensationCase?: DamageCompensationCase;
    damageCompensationCaseLabel?: string;
    damageCompensationCaseDescription?: string;
    appliesLegalLimit?: boolean;
    
    // Processing info
    damageAdjustReason?: string;
    damageHandlerNote?: string;
    damageCompensationStatus?: DamageCompensationStatus;
    damageCompensationStatusLabel?: string;
}

// Damage compensation case enum
export type DamageCompensationCase = 
    | 'CASE1_HAS_INS_HAS_DOC'
    | 'CASE2_HAS_INS_NO_DOC'
    | 'CASE3_NO_INS_HAS_DOC'
    | 'CASE4_NO_INS_NO_DOC';

// Damage compensation status enum
export type DamageCompensationStatus = 
    | 'PENDING_ASSESSMENT'
    | 'PROPOSED'
    | 'APPROVED'
    | 'REJECTED';

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
    | 'REROUTE'
    | 'OFF_ROUTE_RUNAWAY';

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
    trackingCode?: string; // Trip code - Mã chuyến xe
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
    description?: string;
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
        case 'OFF_ROUTE_RUNAWAY':
            return 'Lệch tuyến bỏ trốn';
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
        case 'OFF_ROUTE_RUNAWAY':
            return 'red';
        default:
            return 'default';
    }
};

// Damage compensation helpers
export const getDamageCompensationCaseLabel = (caseType: DamageCompensationCase): string => {
    switch (caseType) {
        case 'CASE1_HAS_INS_HAS_DOC':
            return 'Có bảo hiểm + Có chứng từ';
        case 'CASE2_HAS_INS_NO_DOC':
            return 'Có bảo hiểm + Không chứng từ';
        case 'CASE3_NO_INS_HAS_DOC':
            return 'Không bảo hiểm + Có chứng từ';
        case 'CASE4_NO_INS_NO_DOC':
            return 'Không bảo hiểm + Không chứng từ';
        default:
            return caseType;
    }
};

export const getDamageCompensationCaseColor = (caseType: DamageCompensationCase): string => {
    switch (caseType) {
        case 'CASE1_HAS_INS_HAS_DOC':
            return 'green';
        case 'CASE2_HAS_INS_NO_DOC':
            return 'orange';
        case 'CASE3_NO_INS_HAS_DOC':
            return 'orange';
        case 'CASE4_NO_INS_NO_DOC':
            return 'red';
        default:
            return 'default';
    }
};

export const getDamageCompensationStatusLabel = (status: DamageCompensationStatus): string => {
    switch (status) {
        case 'PENDING_ASSESSMENT':
            return 'Chờ thẩm định';
        case 'PROPOSED':
            return 'Đã đề xuất bồi thường';
        case 'APPROVED':
            return 'Đã phê duyệt';
        case 'REJECTED':
            return 'Từ chối bồi thường';
        default:
            return status;
    }
};

export const getDamageCompensationStatusColor = (status: DamageCompensationStatus): string => {
    switch (status) {
        case 'PENDING_ASSESSMENT':
            return 'orange';
        case 'PROPOSED':
            return 'blue';
        case 'APPROVED':
            return 'green';
        case 'REJECTED':
            return 'red';
        default:
            return 'default';
    }
};

// Format currency VND
export const formatCurrency = (value?: number): string => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(value);
};