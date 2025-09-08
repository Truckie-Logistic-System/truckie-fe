import type { AxiosResponse } from 'axios';
import httpClient from '../api';
import type { ApiResponse } from '../api/types';

export interface UserRole {
    id: string;
    roleName: string;
    description: string;
    isActive: boolean;
}

export interface UserResponse {
    id: string;
    username: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    gender: boolean;
    dateOfBirth: string;
    imageUrl: string;
    status: string;
    role: UserRole;
}

export interface CustomerResponse {
    id: string;
    companyName: string;
    representativeName: string;
    representativePhone: string;
    businessLicenseNumber: string;
    businessAddress: string;
    status: string;
    userResponse: UserResponse;
}

export interface CustomerUpdateRequest {
    companyName: string;
    representativeName: string;
    representativePhone: string;
    businessLicenseNumber: string;
    businessAddress: string;
}

export const getCustomerProfile = async (userId: string): Promise<CustomerResponse> => {
    try {
        const response: AxiosResponse<ApiResponse<CustomerResponse>> = await httpClient.get(
            `/customers/${userId}/user`
        );
        return response.data.data;
    } catch (error) {
        console.error('Error fetching customer profile:', error);
        throw error;
    }
};

export const updateCustomerProfile = async (customerId: string, updateData: CustomerUpdateRequest): Promise<CustomerResponse> => {
    try {
        const response: AxiosResponse<ApiResponse<CustomerResponse>> = await httpClient.put(
            `/customers/${customerId}`,
            updateData
        );
        return response.data.data;
    } catch (error) {
        console.error('Error updating customer profile:', error);
        throw error;
    }
}; 