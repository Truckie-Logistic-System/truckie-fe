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
import type { IssueStatus } from '@/models/Issue';

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
            const response = await httpClient.get<IssuesResponse>('/issue/get-all');
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
            const response = await httpClient.get<PaginatedIssuesResponse>('/issue/paginated', {
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
            const response = await httpClient.get<IssueResponse>(`/issue/${id}`);

            // Map API response fields to our model
            const apiData: IssueApiResponse = response.data.data;

            // Tạo đối tượng Issue từ response
            const issue: Issue = {
                id: apiData.id,
                description: apiData.description,
                locationLatitude: apiData.locationLatitude,
                locationLongitude: apiData.locationLongitude,
                status: apiData.status as IssueStatus,
                // Map vehicleAssignmentEntity to vehicleAssignment
                vehicleAssignment: apiData.vehicleAssignmentEntity ? {
                    id: apiData.vehicleAssignmentEntity.id,
                    createdAt: apiData.vehicleAssignmentEntity.createdAt,
                    modifiedAt: apiData.vehicleAssignmentEntity.modifiedAt,
                    createdBy: apiData.vehicleAssignmentEntity.createdBy,
                    modifiedBy: apiData.vehicleAssignmentEntity.modifiedBy,
                    description: apiData.vehicleAssignmentEntity.description,
                    status: apiData.vehicleAssignmentEntity.status,
                    vehicle: apiData.vehicleAssignmentEntity.vehicleEntity,
                    driver1: apiData.vehicleAssignmentEntity.driver1,
                    driver2: apiData.vehicleAssignmentEntity.driver2
                } : undefined,
                staff: apiData.staff,
                issueType: apiData.issueTypeEntity
            };

            return issue;
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
            const response = await httpClient.post<IssueResponse>('/issue', issueData);
            // Type casting to ensure compatibility
            const apiData = response.data.data;
            const issue: Issue = {
                id: apiData.id,
                description: apiData.description,
                locationLatitude: apiData.locationLatitude,
                locationLongitude: apiData.locationLongitude,
                status: apiData.status as IssueStatus,
                vehicleAssignment: apiData.vehicleAssignmentEntity,
                issueType: apiData.issueTypeEntity,
                staff: apiData.staff
            };
            return issue;
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
            const response = await httpClient.put<IssueResponse>(`/issue/${id}`, issueData);
            // Type casting to ensure compatibility
            const apiData = response.data.data;
            const issue: Issue = {
                id: apiData.id,
                description: apiData.description,
                locationLatitude: apiData.locationLatitude,
                locationLongitude: apiData.locationLongitude,
                status: apiData.status as IssueStatus,
                vehicleAssignment: apiData.vehicleAssignmentEntity,
                issueType: apiData.issueTypeEntity,
                staff: apiData.staff
            };
            return issue;
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
            await httpClient.delete(`/issue/${id}`);
        } catch (error: any) {
            console.error(`Error deleting issue ${id}:`, error);
            throw new Error(error.response?.data?.message || 'Không thể xóa sự cố');
        }
    }
};

export default issueService;