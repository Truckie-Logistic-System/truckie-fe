import type { ApiResponse, PaginatedResponse } from '../api/types';
import type { Penalty, PenaltyCreateDto, PenaltyUpdateDto } from '@/models/Penalty';

export type GetPenaltiesResponse = ApiResponse<Penalty[]>;
export type GetPenaltyResponse = ApiResponse<Penalty>;
export type CreatePenaltyResponse = ApiResponse<Penalty>;
export type UpdatePenaltyResponse = ApiResponse<Penalty>;
export type DeletePenaltyResponse = ApiResponse<void>; 