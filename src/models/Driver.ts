import type { UserResponse } from './User';

export interface DriverRoleResponse {
    id: string;
    roleName: string;
    description: string;
    isActive: boolean;
}

export interface DriverUserResponse extends UserResponse {
    fullName: string;
    phoneNumber: string;
    gender: boolean;
    dateOfBirth: string;
    imageUrl: string;
    status: string;
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