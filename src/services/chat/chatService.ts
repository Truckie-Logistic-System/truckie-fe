import httpClient from "../api/httpClient";
import type { MessageRequest, ChatPageResponse, ChatImageRequest } from '../../models';
import { handleApiError } from "../api/errorHandler";

/**
 * Service for handling chat-related API calls
 */
const chatService = {
  /**
   * Gửi tin nhắn qua websocket (dùng ở FE với SockJS/StompJS)
   * @param roomId Room ID
   * @param message MessageRequest
   */
  sendMessage: (stompClient: any, roomId: string, message: MessageRequest) => {
    if (stompClient && stompClient.connected) {
      stompClient.send(
        `/app/chat.sendMessage/${roomId}`,
        {},
        JSON.stringify(message)
      );
    }
  },

  /**
   * Lấy tin nhắn của một phòng
   * @param roomId Room ID
   * @param pageSize Số lượng tin nhắn mỗi trang
   * @param lastMessageId ID tin nhắn cuối cùng (nếu có, để phân trang)
   */
  getMessages: async (
    roomId: string,
    pageSize: number = 10,
    lastMessageId?: string
  ): Promise<ChatPageResponse> => {
    try {
      const response = await httpClient.get<ChatPageResponse>(
        `/chats/rooms/${roomId}/messages`,
        {
          params: {
            pageSize,
            lastMessageId,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error, "Không thể tải tin nhắn phòng chat");
    }
  },

  /**
   * Lấy tin nhắn phòng hỗ trợ cho khách hàng
   * @param userId User ID (UUID)
   * @param pageSize Số lượng tin nhắn mỗi trang
   * @param lastMessageId ID tin nhắn cuối cùng (nếu có, để phân trang)
   */
  getMessagesSupportedForCustomer: async (
    userId: string,
    pageSize: number = 10,
    lastMessageId?: string
  ): Promise<ChatPageResponse> => {
    try {
      const response = await httpClient.get<ChatPageResponse>(
        `/chats/${userId}/messages-supported`,
        {
          params: {
            pageSize,
            lastMessageId,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error, "Không thể tải tin nhắn hỗ trợ");
    }
  },

  //Upload image for chat
  uploadChatImage: async (req: ChatImageRequest): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("file", req.file);
      formData.append("senderId", req.senderId);
      formData.append("roomId", req.roomId);

      const response = await httpClient.post<string>(
        "/chats/upload-image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data", // 👈 BẮT BUỘC
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error uploading chat image:", error);
      throw error;
    }
  },

};

export default chatService;