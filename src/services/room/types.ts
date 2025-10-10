// types.ts
import type { ApiResponse } from "../api/types";
import type { CreateRoomResponse } from "@/models/Room";

/**
 * Response types for Room APIs
 */
export type CreateRoomApiResponse = ApiResponse<CreateRoomResponse>;
export type GetAllRoomsByUserIdResponse = ApiResponse<CreateRoomResponse[]>;
export type ActiveRoomResponse = ApiResponse<boolean>;
export type InactiveRoomResponse = ApiResponse<boolean>;
export type IsCustomerHasRoomSupportedResponse = ApiResponse<boolean>;
export type GetCustomerHasRoomSupported = ApiResponse<CreateRoomResponse>;
export type JoinRoomResponse = ApiResponse<boolean>;
export type GetSupportRoomsForStaffResponse = ApiResponse<CreateRoomResponse[]>;
