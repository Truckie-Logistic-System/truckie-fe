import type { Issue } from '@/models/Issue';
import type { ApiResponse, PaginatedResponse } from '../api/types';

export type IssueResponse = ApiResponse<IssueApiResponse>;
export type IssuesResponse = ApiResponse<Issue[]>;
export type PaginatedIssuesResponse = ApiResponse<PaginatedResponse<Issue>>;

export interface IssueApiResponse {
    id: string;
    description: string;
    locationLatitude: number | null;
    locationLongitude: number | null;
    status: string;
    vehicleAssignmentEntity?: {
        id: string;
        createdAt: string;
        modifiedAt: string;
        createdBy: string;
        modifiedBy: string;
        description: string;
        status: string;
        vehicleEntity?: {
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
            vehicleTypeEntity?: {
                id: string;
                vehicleTypeName: string;
                description?: string;
            }
        };
        driver1?: {
            id: string;
            identityNumber?: string;
            driverLicenseNumber?: string;
            status: string;
            user?: {
                id: string;
                username: string;
                fullName: string;
                email?: string;
                phoneNumber?: string;
                status: string;
            }
        };
        driver2?: {
            id: string;
            identityNumber?: string;
            driverLicenseNumber?: string;
            status: string;
            user?: {
                id: string;
                username: string;
                fullName: string;
                email?: string;
                phoneNumber?: string;
                status: string;
            }
        }
    };
    staff?: {
        id: string;
        username: string;
        fullName: string;
        email?: string;
        phoneNumber?: string;
        status: string;
    };
    issueTypeEntity?: {
        id: string;
        issueTypeName: string;
        description?: string;
        isActive: boolean;
    };
}

export interface IssueCreateDto {
    description: string;
    locationLatitude?: number;
    locationLongitude?: number;
    vehicleAssignmentId?: string;
    issueTypeId: string;
}

export interface IssueUpdateDto {
    description?: string;
    status?: string;
    staffId?: string;
} 