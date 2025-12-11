/**
 * Penalty model representing a traffic violation record
 */

export interface DriverSummary {
    // User info
    userId: string;
    username?: string;
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    gender?: boolean;
    dateOfBirth?: string;
    imageUrl?: string;
    userStatus?: string;
    roleName?: string;

    // Driver info
    driverId: string;
    identityNumber?: string;
    driverLicenseNumber?: string;
    cardSerialNumber?: string;
    placeOfIssue?: string;
    dateOfIssue?: string;
    dateOfExpiry?: string;
    licenseClass?: string;
    dateOfPassing?: string;
    driverStatus?: string;
}

export interface VehicleAssignmentSummary {
    id: string;
    trackingCode: string;
    description?: string;
    status?: string;
    vehiclePlateNumber?: string;
    vehicleTypeDescription?: string;
    vehicleName?: string;
    vehicleBrand?: string;
    vehicleModel?: string;
    
    driver1Id?: string;
    driver1Name?: string;
    driver1Phone?: string;
    driver1LicenseNumber?: string;
    
    driver2Id?: string;
    driver2Name?: string;
    driver2Phone?: string;
    driver2LicenseNumber?: string;
}

export interface Penalty {
    id: string;
    violationType: string;
    penaltyDate: string;
    trafficViolationRecordImageUrl?: string;
    driverId?: string;
    driverSummary?: DriverSummary;
    vehicleAssignmentId?: string;
    vehicleAssignment?: VehicleAssignmentSummary;
    // Location from related Issue (issueCategory = PENALTY)
    violationLatitude?: number;
    violationLongitude?: number;
}

export interface PenaltyCreateDto {
    violationType: string;
    penaltyDate: string;
    trafficViolationRecordImageUrl?: string;
    driverId: string;
    vehicleAssignmentId: string;
}

export interface PenaltyUpdateDto {
    violationType: string;
    penaltyDate: string;
    trafficViolationRecordImageUrl?: string;
    driverId: string;
    vehicleAssignmentId: string;
}

export const violationTypes = [
    'Vượt tốc độ',
    'Đỗ sai quy định',
    'Vi phạm tín hiệu giao thông',
    'Không đủ giấy tờ xe',
    'Quá tải',
    'Đi sai tuyến đường',
    'Vi phạm thời gian lái xe',
    'Vi phạm điều kiện phương tiện',
    'Khác'
];