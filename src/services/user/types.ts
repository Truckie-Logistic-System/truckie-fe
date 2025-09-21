import type { UserModel, UserResponse, UsersResponse, RegisterEmployeeRequest } from '../../models/User';

export interface UserUpdateRequest {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    gender?: boolean;
    dateOfBirth?: string;
    imageUrl?: string;
}

export type { UserModel, UserResponse, UsersResponse, RegisterEmployeeRequest }; 