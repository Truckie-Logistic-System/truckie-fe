import httpClient from "../api/httpClient";
import type { CreateRoomRequest, CreateRoomResponse } from "@/models/Room";
import type {
  CreateRoomApiResponse,
  GetAllRoomsByUserIdResponse,
  ActiveRoomResponse,
  InactiveRoomResponse,
  JoinRoomResponse,
  GetSupportRoomsForStaffResponse,
  IsCustomerHasRoomSupportedResponse, // Thêm 'type' ở đây
} from "./types";
import { handleApiError } from "../api/errorHandler";

/**
 * Service for handling room-related API calls
 */
const roomService = {
  /**
   * Create a new room
   * @param roomData CreateRoomRequest
   * @returns Promise with created room response
   */
  createRoom: async (roomData: CreateRoomRequest): Promise<CreateRoomResponse> => {
    try {
      const response = await httpClient.post<CreateRoomApiResponse>(
        "/rooms",
        roomData
      );
      return response.data.data;
    } catch (error) {
      console.error("Error creating room:", error);
      throw handleApiError(error, "Không thể tạo phòng hỗ trợ");
    }
  },

  /**
   * Get all rooms by userId
   * @param userId User ID (UUID)
   * @returns Promise with list of rooms
   */
  getAllRoomsByUserId: async (userId: string): Promise<CreateRoomResponse[]> => {
    try {
      const response = await httpClient.get<GetAllRoomsByUserIdResponse>(
        `/rooms/${userId}`
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching rooms for user ${userId}:`, error);
      throw handleApiError(error, "Không thể tải danh sách phòng hỗ trợ");
    }
  },

  /**
   * Activate room by orderId
   * @param orderId Order ID (UUID)
   * @returns Promise with boolean result
   */
  activeRoomByOrderId: async (orderId: string): Promise<boolean> => {
    try {
      const response = await httpClient.put<ActiveRoomResponse>(
        `/rooms/active/${orderId}`
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error activating room for order ${orderId}:`, error);
      throw handleApiError(error, "Không thể kích hoạt phòng hỗ trợ");
    }
  },

  /**
   * Inactivate (cancel) room by orderId
   * @param orderId Order ID (UUID)
   * @returns Promise with boolean result
   */
  inactiveRoomByOrderId: async (orderId: string): Promise<boolean> => {
    try {
      const response = await httpClient.put<InactiveRoomResponse>(
        `/rooms/in-active/${orderId}`
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error inactivating room for order ${orderId}:`, error);
      throw handleApiError(error, "Không thể hủy phòng hỗ trợ");
    }
  },

  /**
   * Staff join a support room
   * @param roomId Room ID (string)
   * @param staffId Staff ID (UUID)
   * @returns Promise with boolean result
   */
  joinRoom: async (roomId: string, staffId: string): Promise<boolean> => {
    try {
      const response = await httpClient.put<JoinRoomResponse>(
        `/rooms/join/${roomId}/${staffId}`
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error staff join room ${roomId}:`, error);
      throw handleApiError(error, "Không thể tham gia phòng hỗ trợ");
    }
  },

  /**
   * Get list of support rooms for staff
   * @returns Promise with list of rooms
   */
  getListSupportRoomsForStaff: async (): Promise<CreateRoomResponse[]> => {
    try {
      const response = await httpClient.get<GetSupportRoomsForStaffResponse>(
        "/rooms/get-list-room-support-for-staff"
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching support rooms for staff:", error);
      throw handleApiError(error, "Không thể tải danh sách phòng hỗ trợ cho nhân viên");
    }
  },

  isCustomerHasRoomSupported: async (userId: string): Promise<boolean> => {
    try {
      const response = await httpClient.get<IsCustomerHasRoomSupportedResponse>(
        `/rooms/customer/${userId}/has-supported-room`
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error checking if customer ${userId} has supported room:`, error);
      throw handleApiError(error, "Không thể kiểm tra trạng thái phòng hỗ trợ");
    }
  },
};

export default roomService;
