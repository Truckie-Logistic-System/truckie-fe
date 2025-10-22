import chatService from '@/services/chat/chatService';
import type { MessageRequest, ChatImageRequest } from '@/models/Chat';

export const useChatMessage = () => {
  const sendMessage = (stompClient: any, roomId: string, messageData: MessageRequest): { success: boolean; message?: string } => {
    try {
      chatService.sendMessage(stompClient, roomId, messageData);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Có lỗi xảy ra khi gửi tin nhắn',
      };
    }
  };

  const uploadChatImage = async (imageData: ChatImageRequest): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      const url = await chatService.uploadChatImage(imageData);
      return { success: true, url };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi upload ảnh',
      };
    }
  };

  return {
    sendMessage,
    uploadChatImage,
  };
};
