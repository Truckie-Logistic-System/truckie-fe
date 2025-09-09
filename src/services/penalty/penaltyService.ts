import httpClient from '../api/httpClient';
import type { Penalty, PenaltyCreateDto, PenaltyUpdateDto } from '@/models/Penalty';
import type {
    GetPenaltiesResponse,
    GetPenaltyResponse,
    CreatePenaltyResponse,
    UpdatePenaltyResponse,
    DeletePenaltyResponse
} from './types';
import { handleApiError } from '../api/errorHandler';

/**
 * Service for handling penalty API calls
 */
const penaltyService = {
    /**
     * Get all penalties
     * @returns Promise with penalties response
     */
    getPenalties: async (): Promise<GetPenaltiesResponse> => {
        try {
            const response = await httpClient.get<GetPenaltiesResponse>('/penalties');
            return response.data;
        } catch (error) {
            console.error('Get penalties error:', error);
            throw handleApiError(error, 'Không thể lấy danh sách vi phạm');
        }
    },

    /**
     * Get penalty by ID
     * @param id Penalty ID
     * @returns Promise with penalty response
     */
    getPenaltyById: async (id: string): Promise<GetPenaltyResponse> => {
        try {
            const response = await httpClient.get<GetPenaltyResponse>(`/penalties/${id}`);
            return response.data;
        } catch (error) {
            console.error('Get penalty error:', error);
            throw handleApiError(error, 'Không thể lấy thông tin vi phạm');
        }
    },

    /**
     * Create a new penalty
     * @param penaltyData Penalty data to create
     * @returns Promise with created penalty response
     */
    createPenalty: async (penaltyData: PenaltyCreateDto): Promise<CreatePenaltyResponse> => {
        try {
            const response = await httpClient.post<CreatePenaltyResponse>('/penalties', penaltyData);
            return response.data;
        } catch (error) {
            console.error('Create penalty error:', error);
            throw handleApiError(error, 'Không thể tạo vi phạm mới');
        }
    },

    /**
     * Update an existing penalty
     * @param id Penalty ID
     * @param penaltyData Updated penalty data
     * @returns Promise with updated penalty response
     */
    updatePenalty: async (id: string, penaltyData: PenaltyUpdateDto): Promise<UpdatePenaltyResponse> => {
        try {
            const response = await httpClient.put<UpdatePenaltyResponse>(`/penalties/${id}`, penaltyData);
            return response.data;
        } catch (error) {
            console.error('Update penalty error:', error);
            throw handleApiError(error, 'Không thể cập nhật vi phạm');
        }
    },

    /**
     * Delete a penalty
     * @param id Penalty ID
     * @returns Promise with delete response
     */
    deletePenalty: async (id: string): Promise<DeletePenaltyResponse> => {
        try {
            const response = await httpClient.delete<DeletePenaltyResponse>(`/penalties/${id}`);
            return response.data;
        } catch (error) {
            console.error('Delete penalty error:', error);
            throw handleApiError(error, 'Không thể xóa vi phạm');
        }
    }
};

export default penaltyService; 