import type { UserResponse } from './User';
import type { Penalty } from './Penalty';

export interface DriverRoleResponse {
    id: string;
    roleName: string;
    description: string;
    isActive: boolean;
}

export interface DriverUserResponse {
    id: string;
    username: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    gender: boolean;
    dateOfBirth: string;
    imageUrl: string;
    status: string;
    role: DriverRoleResponse;
}

export interface DriverModel {
    id: string;
    identityNumber: string;
    driverLicenseNumber: string;
    cardSerialNumber: string;
    placeOfIssue: string;
    dateOfIssue: string;
    dateOfExpiry: string;
    licenseClass: string;
    dateOfPassing: string;
    status: string;
    userResponse: DriverUserResponse;
    penaltyHistories?: Penalty[];
}

export interface DriverRegisterRequest {
    username: string;
    email: string;
    password: string;
    gender: boolean;
    dateOfBirth: string;
    imageUrl: string;
    fullName: string;
    phoneNumber: string;
    identityNumber: string;
    driverLicenseNumber: string;
    cardSerialNumber: string;
    placeOfIssue: string;
    dateOfIssue: string;
    dateOfExpiry: string;
    licenseClass: string;
    dateOfPassing: string;
}

export interface DriverStatusUpdateRequest {
    status: string;
} 