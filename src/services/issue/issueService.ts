import httpClient from '../api/httpClient';
import type { Issue } from '@/models/Issue';
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
    return {
        id: apiData.id,
        description: apiData.description,
        locationLatitude: apiData.locationLatitude,
        locationLongitude: apiData.locationLongitude,
        status: apiData.status as IssueStatus,
        issueCategory: (apiData.issueCategory || 'GENERAL') as IssueCategory,
        reportedAt: apiData.reportedAt,
        resolvedAt: apiData.resolvedAt,
        vehicleAssignment: apiData.vehicleAssignmentEntity ? {
            id: apiData.vehicleAssignmentEntity.id,
            createdAt: apiData.vehicleAssignmentEntity.createdAt,
            modifiedAt: apiData.vehicleAssignmentEntity.modifiedAt,
            createdBy: apiData.vehicleAssignmentEntity.createdBy,
            modifiedBy: apiData.vehicleAssignmentEntity.modifiedBy,
            description: apiData.vehicleAssignmentEntity.description,
            status: apiData.vehicleAssignmentEntity.status,
            trackingCode: apiData.vehicleAssignmentEntity.trackingCode,
            vehicle: apiData.vehicleAssignmentEntity.vehicle,
            driver1: apiData.vehicleAssignmentEntity.driver1,
            driver2: apiData.vehicleAssignmentEntity.driver2
        } : undefined,
        staff: apiData.staff,
        issueTypeEntity: apiData.issueTypeEntity,
        // Seal replacement fields
        oldSeal: apiData.oldSeal,
        newSeal: apiData.newSeal,
        sealRemovalImage: apiData.sealRemovalImage,
        newSealAttachedImage: apiData.newSealAttachedImage,
        newSealConfirmedAt: apiData.newSealConfirmedAt
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
            return mapApiResponseToIssue(response.data.data);
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
        console.log('[issueService] 🚀 assignNewSeal called with:', {
            issueId,
            newSealId,
            staffId
        });
        
        try {
            console.log('[issueService] 📡 Making PUT request to /issues/seal-replacement/assign');
            const response = await httpClient.put<IssueResponse>('/issues/seal-replacement/assign', {
                issueId,
                newSealId,
                staffId
            });
            
            console.log('[issueService] ✅ API response received:', response);
            console.log('[issueService] 📊 Response data:', response.data);
            
            const mappedIssue = mapApiResponseToIssue(response.data.data);
            console.log('[issueService] 🔄 Mapped issue:', mappedIssue);
            
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
    getActiveSeals: async (vehicleAssignmentId: string): Promise<any[]> => {
        try {
            const response = await httpClient.get(`/issues/vehicle-assignment/${vehicleAssignmentId}/active-seals`);
            return response.data.data || [];
        } catch (error: any) {
            console.error('Error fetching active seals:', error);
            throw new Error(error.response?.data?.message || 'Không thể tải danh sách seal');
        }
    }
};

export default issueService;