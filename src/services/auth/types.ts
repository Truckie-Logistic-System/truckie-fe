import type { ApiResponse } from '../api/types';
import type { User } from '@/models/User';

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    gender: boolean;
    dateOfBirth: string;
    imageUrl: string;
    fullName: string;
    phoneNumber: string;
    companyName: string;
    representativeName: string;
    representativePhone: string;
    businessLicenseNumber: string;
    businessAddress: string;
}

export interface UserApiResponse {
    id: string;
    username: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    gender: boolean | null;
    dateOfBirth: string;
    imageUrl: string | null;
    status: string;
    role: {
        id: string;
        roleName: string;
        description: string;
        isActive: boolean;
    };
}

export interface LoginResponseData {
    authToken: string;
    user: UserApiResponse;
}

export type LoginResponse = ApiResponse<LoginResponseData>;

export interface RefreshTokenResponseData {
    authToken: string;
}

export type RefreshTokenResponse = ApiResponse<RefreshTokenResponseData>;

export interface RegisterResponseData {
    id: string;
    companyName: string;
    representativeName: string;
    representativePhone: string;
    businessLicenseNumber: string;
    businessAddress: string;
    status: string;
    userResponse: UserApiResponse;
}

export type RegisterResponse = ApiResponse<RegisterResponseData>;

export interface ChangePasswordRequest {
    username: string;
    oldPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}

export interface ChangePasswordResponse {
    success: boolean;
    message: string;
    statusCode: number;
    data: null;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
} 