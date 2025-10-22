import { useState } from 'react';
import roomService from '@/services/room/roomService';
import chatService from '@/services/chat/chatService';

export const useChatRoom = () => {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  const fetchChatMessages = async (userId: string, pageSize: number = 20): Promise<{ success: boolean; message?: string }> => {
    setLoading(true);
    try {
      // Get customer's supported room
      const room = await roomService.getCustomerHasRoomSupported(userId);
      if (room && room.roomId) {
        // Get messages from the room
        const chatPage = await chatService.getMessages(room.roomId, pageSize);
        if (chatPage && chatPage.messages) {
          setMessages(chatPage.messages);
          return { success: true };
        }
      }
      return { success: false, message: 'Không thể tải tin nhắn' };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Có lỗi xảy ra khi tải tin nhắn',
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    messages,
    setMessages,
    fetchChatMessages,
  };
};
