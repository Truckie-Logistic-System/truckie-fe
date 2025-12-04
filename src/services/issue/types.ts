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
    issueCategory?: string; // GENERAL, SEAL_REPLACEMENT, ACCIDENT, etc.
    reportedAt?: string;
    resolvedAt?: string;
    vehicleAssignmentEntity?: {
        id: string;
        createdAt: string;
        modifiedAt: string;
        createdBy: string;
        modifiedBy: string;
        description: string;
        status: string;
        trackingCode: string;
        vehicle?: {
            id: string;
            licensePlateNumber: string;
            model?: string;
            manufacturer?: string;
            year?: number;
            vehicleType?: {
                id: string;
                vehicleTypeName: string;
            }
        };
        driver1?: {
            id: string;
            fullName: string;
            phoneNumber?: string;
            driverLicenseNumber?: string;
            licenseClass?: string;
            experienceYears?: string;
        };
        driver2?: {
            id: string;
            fullName: string;
            phoneNumber?: string;
            driverLicenseNumber?: string;
            licenseClass?: string;
            experienceYears?: string;
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
        issueCategory: string;
        isActive: boolean;
    };
    // Seal replacement specific fields (only for SEAL_REPLACEMENT category)
    oldSeal?: {
        id: string;
        sealCode: string;
        status: string;
        sealDate?: string;
        description?: string;
        sealAttachedImage?: string;
        sealRemovalTime?: string;
        sealRemovalReason?: string;
    };
    newSeal?: {
        id: string;
        sealCode: string;
        status: string;
        sealDate?: string;
        description?: string;
        sealAttachedImage?: string;
        sealRemovalTime?: string;
        sealRemovalReason?: string;
    };
    sealRemovalImage?: string;
    newSealAttachedImage?: string;
    newSealConfirmedAt?: string;
    // Damage issue specific fields (only for DAMAGE category)
    orderDetailEntity?: {
        id: string;
        trackingCode?: string;
        packageName?: string;
        status?: string;
    };
    issueImages?: string[]; // URLs of damage images
    orderDetail?: {
        trackingCode: string;
        description: string;
        weightBaseUnit: number;
        unit: string;
    };
    // Customer/Sender information (for damage and order rejection issues)
    sender?: {
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
    };
    // REROUTE specific fields (only for REROUTE category)
    affectedSegment?: {
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
    };
    reroutedJourney?: {
        id: string;
        journeyName: string;
        journeyType: string;
        status: string;
        vehicleAssignmentId?: string;
        totalDistance?: number;
        journeySegments?: Array<{
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
            status?: string;
        }>;
    };
    // DAMAGE compensation specific fields
    damageCompensation?: {
        damageAssessmentPercent?: number;
        hasInsurance?: boolean;
        damageHasDocuments?: boolean;
        damageDeclaredValue?: number;
        damageEstimatedMarketValue?: number;
        damageFreightFee?: number;
        damageLegalLimit?: number;
        damageEstimatedLoss?: number;
        damagePolicyCompensation?: number;
        damageFinalCompensation?: number;
        damageCompensationCase?: string;
        damageCompensationCaseLabel?: string;
        damageCompensationCaseDescription?: string;
        appliesLegalLimit?: boolean;
        damageAdjustReason?: string;
        damageHandlerNote?: string;
        damageCompensationStatus?: string;
        damageCompensationStatusLabel?: string;
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

// REROUTE issue specific types
export interface RerouteDetailResponse {
    issueId: string;
    status: string;
    description: string;
    reportedAt: string;
    resolvedAt?: string;
    locationLatitude?: number;
    locationLongitude?: number;
    affectedSegment: {
        id: string;
        segmentOrder: number;
        startPointName: string;
        endPointName: string;
        startLatitude: number;
        startLongitude: number;
        endLatitude: number;
        endLongitude: number;
        distanceKilometers: number;
        status: string;
        pathCoordinatesJson?: string;
    };
    vehicleAssignment: {
        id: string;
        trackingCode: string;
        status: string;
        vehicle: {
            id: string;
            licensePlateNumber: string;
            model?: string;
        };
        driver1: {
            id: string;
            fullName: string;
            phoneNumber?: string;
        };
    };
    activeJourney: {
        id: string;
        journeyName: string;
        journeyType: string;
        status: string;
        segments: Array<{
            id: string;
            segmentOrder: number;
            startPointName: string;
            endPointName: string;
            startLatitude: number;
            startLongitude: number;
            endLatitude: number;
            endLongitude: number;
            distanceKilometers: number;
            pathCoordinatesJson?: string;
        }>;
    };
    reroutedJourney?: {
        id: string;
        journeyName: string;
        journeyType: string;
        status: string;
    };
    issueImages?: string[];
}

export interface ProcessRerouteRequest {
    issueId: string;
    newRouteSegments: Array<{
        segmentOrder: number;
        startPointName: string;
        endPointName: string;
        startLatitude: number;
        startLongitude: number;
        endLatitude: number;
        endLongitude: number;
        distanceKilometers: number;
        estimatedTollFee?: number;
        pathCoordinatesJson?: string;
        tollDetailsJson?: string;
    }>;
    totalTollFee: number;
    totalTollCount: number;
} 