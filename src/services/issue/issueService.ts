import httpClient from '../api/httpClient';
import type { Issue } from '@/models/Issue';
import type { 
    OffRouteEvent, 
    ContactConfirmationRequest, 
    GracePeriodExtensionRequest, 
    OffRouteEventResponse 
} from '@/models/OffRouteEvent';
import type {
    IssueResponse,
    IssuesResponse,
    PaginatedIssuesResponse,
    IssueCreateDto,
    IssueUpdateDto,
    IssueApiResponse
} from './types';
import type { PaginationParams } from '../api/types';
import type { IssueStatus, IssueCategory } from '@/models/Issue';

/**
 * Helper function to map API response to Issue model
 */
const mapApiResponseToIssue = (apiData: IssueApiResponse): Issue => {
    // Map vehicleAssignmentEntity to both fields for backward compatibility
    const vehicleAssignment = apiData.vehicleAssignmentEntity ? {
        id: apiData.vehicleAssignmentEntity.id,
        trackingCode: apiData.vehicleAssignmentEntity.trackingCode,
        status: apiData.vehicleAssignmentEntity.status,
        vehicle: apiData.vehicleAssignmentEntity.vehicle,
        driver1: apiData.vehicleAssignmentEntity.driver1,
        driver2: apiData.vehicleAssignmentEntity.driver2,
    } : undefined;
    
    return {
        id: apiData.id,
        description: apiData.description,
        locationLatitude: apiData.locationLatitude,
        locationLongitude: apiData.locationLongitude,
        status: apiData.status as IssueStatus,
        issueCategory: (apiData.issueCategory || 'GENERAL') as IssueCategory,
        reportedAt: apiData.reportedAt,
        resolvedAt: apiData.resolvedAt,
        vehicleAssignmentEntity: apiData.vehicleAssignmentEntity,
        vehicleAssignment: vehicleAssignment, // Alias for backward compatibility
        staff: apiData.staff,
        issueTypeEntity: apiData.issueTypeEntity,
        // Seal replacement fields
        oldSeal: apiData.oldSeal,
        newSeal: apiData.newSeal,
        sealRemovalImage: apiData.sealRemovalImage,
        newSealAttachedImage: apiData.newSealAttachedImage,
        newSealConfirmedAt: apiData.newSealConfirmedAt,
        // Damage issue fields
        issueImages: apiData.issueImages,
        orderDetail: apiData.orderDetail,
        // Customer/Sender information
        sender: apiData.sender,
        // REROUTE specific fields
        affectedSegment: apiData.affectedSegment,
        reroutedJourney: apiData.reroutedJourney,
        // DAMAGE compensation
        damageCompensation: apiData.damageCompensation as Issue['damageCompensation']
    };
};

/**
 * Service for handling issue-related API calls
 */
const issueService = {
    /**
     * Get all issues
     * @returns Promise with array of issues
     */
    getAllIssues: async (): Promise<Issue[]> => {
        try {
            const response = await httpClient.get<IssuesResponse>('/issues/get-all');
            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching issues:', error);
            throw new Error(error.response?.data?.message || 'Không thể tải danh sách sự cố');
        }
    },

    /**
     * Get paginated issues
     * @param params Pagination parameters
     * @returns Promise with paginated issues response
     */
    getPaginatedIssues: async (params: PaginationParams): Promise<PaginatedIssuesResponse> => {
        try {
            const response = await httpClient.get<PaginatedIssuesResponse>('/issues/paginated', {
                params
            });
            return response.data;
        } catch (error: any) {
            console.error('Error fetching paginated issues:', error);
            throw new Error(error.response?.data?.message || 'Không thể tải danh sách sự cố');
        }
    },

    /**
     * Get issue by ID
     * @param id Issue ID
     * @returns Promise with issue data
     */
    getIssueById: async (id: string): Promise<Issue> => {
        try {
            const response = await httpClient.get<IssueResponse>(`/issues/${id}`);
            const mappedIssue = mapApiResponseToIssue(response.data.data);
            return mappedIssue;
        } catch (error: any) {
            console.error(`Error fetching issue ${id}:`, error);
            throw new Error(error.response?.data?.message || 'Không thể tải thông tin sự cố');
        }
    },

    /**
     * Create new issue
     * @param issueData Issue data
     * @returns Promise with created issue
     */
    createIssue: async (issueData: IssueCreateDto): Promise<Issue> => {
        try {
            const response = await httpClient.post<IssueResponse>('/issues', issueData);
            return mapApiResponseToIssue(response.data.data);
        } catch (error: any) {
            console.error('Error creating issue:', error);
            throw new Error(error.response?.data?.message || 'Không thể tạo sự cố');
        }
    },

    /**
     * Update issue
     * @param id Issue ID
     * @param issueData Issue data to update
     * @returns Promise with updated issue
     */
    updateIssue: async (id: string, issueData: IssueUpdateDto): Promise<Issue> => {
        try {
            const response = await httpClient.put<IssueResponse>(`/issues/${id}`, issueData);
            return mapApiResponseToIssue(response.data.data);
        } catch (error: any) {
            console.error(`Error updating issue ${id}:`, error);
            throw new Error(error.response?.data?.message || 'Không thể cập nhật sự cố');
        }
    },

    /**
     * Delete issue
     * @param id Issue ID
     */
    deleteIssue: async (id: string): Promise<void> => {
        try {
            await httpClient.delete(`/issues/${id}`);
        } catch (error: any) {
            console.error(`Error deleting issue ${id}:`, error);
            throw new Error(error.response?.data?.message || 'Không thể xóa sự cố');
        }
    },

    /**
     * Get active issues (OPEN status)
     * @returns Promise with array of active issues
     */
    getActiveIssues: async (): Promise<Issue[]> => {
        try {
            const response = await httpClient.get<IssuesResponse>('/issues/active');
            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching active issues:', error);
            throw new Error(error.response?.data?.message || 'Không thể tải danh sách sự cố đang mở');
        }
    },

    /**
     * Get inactive issues (RESOLVED status)
     * @returns Promise with array of inactive issues
     */
    getInactiveIssues: async (): Promise<Issue[]> => {
        try {
            const response = await httpClient.get<IssuesResponse>('/issues/inactive');
            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching inactive issues:', error);
            throw new Error(error.response?.data?.message || 'Không thể tải danh sách sự cố đã giải quyết');
        }
    },

    /**
     * Assign staff to issue (changes status to IN_PROGRESS)
     * @param issueId Issue ID
     * @param staffId Staff ID
     * @returns Promise with updated issue
     */
    assignStaffToIssue: async (issueId: string, staffId: string): Promise<Issue> => {
        try {
            const response = await httpClient.put<IssueResponse>('/issues/assign-staff', {
                issueId,
                staffId
            });
            return mapApiResponseToIssue(response.data.data);
        } catch (error: any) {
            console.error('Error assigning staff to issue:', error);
            throw new Error(error.response?.data?.message || 'Không thể phân công nhân viên');
        }
    },

    /**
     * Resolve issue (changes status to RESOLVED and restores order detail statuses)
     * @param issueId Issue ID
     * @returns Promise with updated issue
     */
    resolveIssue: async (issueId: string): Promise<Issue> => {
        try {
            const response = await httpClient.put<IssueResponse>(`/issues/${issueId}/resolve`);
            return mapApiResponseToIssue(response.data.data);
        } catch (error: any) {
            console.error('Error resolving issue:', error);
            throw new Error(error.response?.data?.message || 'Không thể giải quyết sự cố');
        }
    },

    /**
     * Update issue status directly (for PENALTY and other simple issues)
     * @param issueId Issue ID
     * @param status New status (OPEN, IN_PROGRESS, RESOLVED)
     * @returns Promise with updated issue
     */
    updateIssueStatus: async (issueId: string, status: IssueStatus): Promise<Issue> => {
        try {
            const response = await httpClient.put<IssueResponse>(
                `/issues/${issueId}/status`,
                null,
                { params: { status } }
            );
            return mapApiResponseToIssue(response.data.data);
        } catch (error: any) {
            console.error('Error updating issue status:', error);
            throw new Error(error.response?.data?.message || 'Không thể cập nhật trạng thái sự cố');
        }
    },

    // ==================== SEAL REPLACEMENT METHODS ====================

    /**
     * Report seal removal issue (Driver)
     * @param data Seal issue data
     * @returns Promise with created issue
     */
    reportSealIssue: async (data: {
        vehicleAssignmentId: string;
        issueTypeId: string;
        sealId: string;
        description: string;
        locationLatitude?: number;
        locationLongitude?: number;
        sealRemovalImage: string;
    }): Promise<Issue> => {
        try {
            const response = await httpClient.post<IssueResponse>('/issues/seal-removal', data);
            return mapApiResponseToIssue(response.data.data);
        } catch (error: any) {
            console.error('Error reporting seal issue:', error);
            throw new Error(error.response?.data?.message || 'Không thể báo cáo sự cố seal');
        }
    },

    /**
     * Assign new seal to replace removed seal (Staff)
     * @param issueId Issue ID
     * @param newSealId New seal ID
     * @param staffId Staff ID
     * @returns Promise with updated issue
     */
    assignNewSeal: async (issueId: string, newSealId: string, staffId: string): Promise<Issue> => {
        try {
            const response = await httpClient.put<IssueResponse>('/issues/seal-replacement/assign', {
                issueId,
                newSealId,
                staffId
            });
            const mappedIssue = mapApiResponseToIssue(response.data.data);
            return mappedIssue;
        } catch (error: any) {
            console.error('[issueService] ❌ Error assigning new seal:', error);
            console.error('[issueService] 📋 Error details:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                config: error.config
            });
            throw new Error(error.response?.data?.message || 'Không thể gán seal mới');
        }
    },

    /**
     * Confirm new seal attachment (Driver)
     * @param issueId Issue ID
     * @param newSealAttachedImage New seal image URL
     * @returns Promise with updated issue
     */
    confirmNewSeal: async (issueId: string, newSealAttachedImage: string): Promise<Issue> => {
        try {
            const response = await httpClient.put<IssueResponse>('/issues/seal-replacement/confirm', {
                issueId,
                newSealAttachedImage
            });
            return mapApiResponseToIssue(response.data.data);
        } catch (error: any) {
            console.error('Error confirming new seal:', error);
            throw new Error(error.response?.data?.message || 'Không thể xác nhận seal mới');
        }
    },

    /**
     * Get active seals for a vehicle assignment (for staff to choose)
     * @param vehicleAssignmentId Vehicle assignment ID
     * @returns Promise with array of active seals
     */
    getActiveSeals: async (vehicleAssignmentId?: string, trackingCode?: string): Promise<any[]> => {
        try {
            if (vehicleAssignmentId) {
                const response = await httpClient.get(`/issues/vehicle-assignment/${vehicleAssignmentId}/active-seals`);
                return response.data.data || [];
            } else if (trackingCode) {
                const response = await httpClient.get(`/issues/vehicle-assignment/tracking-code/${trackingCode}/active-seals`);
                return response.data.data || [];
            } else {
                throw new Error('Either vehicleAssignmentId or trackingCode must be provided');
            }
        } catch (error: any) {
            console.error('Error fetching active seals:', error);
            throw new Error(error.response?.data?.message || 'Không thể tải danh sách seal');
        }
    },

    // ===== ORDER_REJECTION flow methods =====

    /**
     * Calculate return shipping fee for ORDER_REJECTION issue
     * @param issueId Issue ID
     * @returns Promise with fee calculation details
     */
    calculateReturnShippingFee: async (issueId: string, distanceKm?: number): Promise<any> => {
        try {
            let url = `/issues/order-rejection/${issueId}/return-fee`;
            
            // Use new endpoint with distance if provided
            if (distanceKm && distanceKm > 0) {
                url = `/issues/order-rejection/${issueId}/return-fee-with-distance?distanceKm=${distanceKm}`;
            } else {
                
            }
            
            const response = await httpClient.get(url);
            return response.data.data;
        } catch (error: any) {
            console.error('Error calculating return shipping fee:', error);
            throw new Error(error.response?.data?.message || 'Không thể tính cước phí trả hàng');
        }
    },

    /**
     * Get ORDER_REJECTION issue detail
     * @param issueId Issue ID
     * @returns Promise with rejection detail
     */
    getOrderRejectionDetail: async (issueId: string): Promise<any> => {
        try {
            const response = await httpClient.get(`/issues/order-rejection/${issueId}/detail`);
            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching order rejection detail:', error);
            throw new Error(error.response?.data?.message || 'Không thể tải chi tiết sự cố');
        }
    },

    /**
     * Process ORDER_REJECTION issue: create journey and notify customer for payment
     * @param request Process request data
     * @returns Promise with updated rejection detail
     */
    processOrderRejection: async (request: {
        issueId: string;
        adjustedReturnFee?: number;
        routeSegments: any[];
        totalTollFee: number;
        totalTollCount: number;
        totalDistance: number;
    }): Promise<any> => {
        try {
            const response = await httpClient.post('/issues/order-rejection/process', request);
            return response.data.data;
        } catch (error: any) {
            console.error('Error processing order rejection:', error);
            throw new Error(error.response?.data?.message || 'Không thể xử lý sự cố');
        }
    },

    // ===== REROUTE flow methods =====

    /**
     * Get REROUTE issue detail
     * @param issueId Issue ID
     * @returns Promise with reroute detail
     */
    getRerouteDetail: async (issueId: string): Promise<any> => {
        try {
            const response = await httpClient.get(`/issues/reroute/${issueId}/detail`);
            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching reroute detail:', error);
            throw new Error(error.response?.data?.message || 'Không thể tải chi tiết sự cố tái định tuyến');
        }
    },

    /**
     * Process REROUTE issue: create new journey with rerouted segments
     * @param request Process request data
     * @returns Promise with updated reroute detail
     */
    processReroute: async (request: {
        issueId: string;
        newRouteSegments: any[];
        totalTollFee: number;
        totalTollCount: number;
    }): Promise<any> => {
        try {
            const response = await httpClient.post('/issues/reroute/process', request);
            return response.data.data;
        } catch (error: any) {
            console.error('Error processing reroute:', error);
            throw new Error(error.response?.data?.message || 'Không thể xử lý tái định tuyến');
        }
    },
    
    /**
     * Get suggested alternative routes for reroute issue using Vietmap Route V3 API
     * @param issueId Issue ID
     * @returns Promise with suggested routes from Vietmap
     */
    getSuggestedRoutesForReroute: async (issueId: string): Promise<any> => {
        try {
            const response = await httpClient.get(`/issues/reroute/${issueId}/suggested-routes`);
            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching suggested routes:', error);
            throw new Error(error.response?.data?.message || 'Không thể tải các đề xuất lộ trình');
        }
    },

    // ===== OFF_ROUTE_RUNAWAY methods =====
    
    /**
     * Get OFF_ROUTE_RUNAWAY issue detail with packages
     * @param issueId Issue ID
     * @returns Promise with off-route runaway detail
     */
    getOffRouteRunawayDetail: async (issueId: string): Promise<OffRouteRunawayDetail> => {
        try {
            const response = await httpClient.get(`/issues/off-route-runaway/${issueId}/detail`);
            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching off-route runaway detail:', error);
            throw new Error(error.response?.data?.message || 'Không thể tải chi tiết sự cố lệch tuyến');
        }
    },

    // Off-route event management methods
    /**
     * Confirm contact with driver for off-route event
     * @param eventId Off-route event ID
     * @param staffId Staff ID confirming contact
     * @param contactNotes Optional notes about the contact
     * @returns Promise with updated off-route event
     */
    confirmContact: async (eventId: string, staffId: string, contactNotes?: string): Promise<any> => {
        try {
            const response = await httpClient.post(`/off-route-events/${eventId}/confirm-contact`, {
                contactNotes
            });
            return response.data;
        } catch (error: any) {
            console.error('Error confirming contact:', error);
            throw new Error(error.response?.data?.message || 'Không thể xác nhận liên hệ với tài xế');
        }
    },

    /**
     * Extend grace period for off-route event
     * @param eventId Off-route event ID
     * @param staffId Staff ID requesting extension
     * @param extensionReason Optional reason for extension
     * @returns Promise with updated off-route event
     */
    extendGracePeriod: async (eventId: string, staffId: string, extensionReason?: string): Promise<any> => {
        try {
            const response = await httpClient.post(`/off-route-events/${eventId}/extend-grace-period`, {
                extensionReason
            });
            return response.data;
        } catch (error: any) {
            console.error('Error extending grace period:', error);
            throw new Error(error.response?.data?.message || 'Không thể gia hạn thời gian chờ');
        }
    },

    /**
     * Get off-route event by ID
     * @param eventId Off-route event ID
     * @returns Promise with off-route event details
     */
    getOffRouteEventById: async (eventId: string): Promise<OffRouteEvent> => {
        try {
            const response = await httpClient.get(`/off-route-events/${eventId}/detail`);
            return response.data;
        } catch (error: any) {
            console.error('Error fetching off-route event:', error);
            throw new Error(error.response?.data?.message || 'Không thể tải thông tin sự kiện lệch tuyến');
        }
    },

    // ===== DAMAGE compensation methods =====
    
    /**
     * Update DAMAGE issue compensation information (Staff)
     * Calculates compensation based on insurance policy and saves assessment data.
     * @param request Update damage compensation request
     * @returns Promise with updated issue
     */
    updateDamageCompensation: async (request: UpdateDamageCompensationRequest): Promise<Issue> => {
        try {
            const response = await httpClient.put<IssueResponse>('/issues/damage/compensation', request);
            return mapApiResponseToIssue(response.data.data);
        } catch (error: any) {
            console.error('Error updating damage compensation:', error);
            throw new Error(error.response?.data?.message || 'Không thể cập nhật thông tin bồi thường');
        }
    },
    
    /**
     * Get DAMAGE issue compensation details including policy information
     * @param issueId Issue ID
     * @returns Promise with damage compensation details
     */
    getDamageCompensationDetail: async (issueId: string): Promise<DamageCompensationDetail> => {
        try {
            const response = await httpClient.get(`/issues/damage/${issueId}/compensation`);
            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching damage compensation detail:', error);
            throw new Error(error.response?.data?.message || 'Không thể tải chi tiết bồi thường');
        }
    },
    
    /**
     * Update OFF_ROUTE issue compensation information (Staff)
     * Calculates compensation based on policy (100% goods value + 100% transport fee, no 10x cap)
     * and saves assessment data.
     * @param request Update off-route compensation request
     * @returns Promise with updated assessment
     */
    updateOffRouteCompensation: async (request: OffRouteCompensationRequest): Promise<OffRouteAssessment> => {
        try {
            const response = await httpClient.put('/issues/off-route/compensation', request);
            return response.data.data;
        } catch (error: any) {
            console.error('Error updating off-route compensation:', error);
            throw new Error(error.response?.data?.message || 'Không thể cập nhật thông tin bồi thường');
        }
    }

};

// Types for DAMAGE compensation
export interface UpdateDamageCompensationRequest {
    issueId: string;
    damageAssessmentPercent: number;
    damageHasDocuments: boolean;
    damageDeclaredValue?: number;
    damageEstimatedMarketValue?: number;
    damageFinalCompensation?: number;
    damageAdjustReason?: string;
    damageHandlerNote?: string;
    damageCompensationStatus?: string;
}

export interface DamageCompensationDetail {
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
}

// Types for OFF_ROUTE_RUNAWAY
export interface OffRouteRunawayDetail {
    issueId: string;
    description: string;
    status: string;
    reportedAt: string;
    resolvedAt?: string;
    locationLatitude?: number;
    locationLongitude?: number;
    offRouteEventInfo?: OffRouteEventInfo;
    vehicleAssignment?: any;
    sender?: {
        id?: string;
        companyName?: string;
        representativeName?: string;
        representativePhone?: string;
        businessAddress?: string;
    };
    packages: PackageInfo[];
    totalDeclaredValue: number;
    transportFee?: number;
    legalLimit?: number;
    compensationPolicyNote?: string;
    suggestedCompensation?: number;
    refund?: any;
    assessment?: OffRouteAssessment;
    evidenceImages?: string[];
}

export interface PackageInfo {
    orderDetailId: string;
    trackingCode: string;
    description: string;
    weightBaseUnit: number;
    unit: string;
    declaredValue: number;
    status: string;
}

export interface OffRouteCompensationRequest {
    issueId: string;
    hasDocuments: boolean;
    documentValue?: number;
    estimatedMarketValue?: number;
    assessmentRate: number;
    finalCompensation: number;
    adjustReason?: string;
    handlerNotes?: string;
    fraudDetected?: boolean;
    fraudReason?: string;
    refund?: RefundRequest;
}

export interface RefundRequest {
    refundAmount?: number;
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
    transactionCode?: string;
    bankTransferImage?: string;
    notes?: string;
}

export interface OffRouteAssessment {
    id: string;
    hasDocuments: boolean;
    documentValue?: number;
    estimatedMarketValue?: number;
    assessmentRate: number;
    compensationByPolicy: number;
    finalCompensation: number;
    adjustReason?: string;
    handlerNotes?: string;
    fraudDetected?: boolean;
    fraudReason?: string;
}

export interface OffRouteEventInfo {
    eventId: string;
    offRouteDurationSeconds: number;
    distanceFromRouteMeters: number;
    warningStatus: string;
    canContactDriver: boolean;
    gracePeriodExpiresAt?: string;
    detectedAt?: string;
    contactedAt?: string;
    contactNotes?: string;
}

export default issueService;