// MessageInput.tsx
import React, { useState } from 'react';
import { Input, Button, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useChatContext } from '@/context/ChatContext';
import type { MessageRequest } from '@/models/Chat';



const MessageInput: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const { activeConversation, sendMessage, connectionStatus } = useChatContext();
  
  const userId = localStorage.getItem('userId');

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    if (!activeConversation) {
      message.error('Không có cuộc hội thoại đang hoạt động');
      return;
    }
    if (!userId) {
      message.error('Bạn chưa đăng nhập');
      return;
    }
    if (connectionStatus !== 'connected') {
      message.error('Kết nối WebSocket chưa sẵn sàng');
      return;
    }

    setSending(true);
    
    try {
      const messageRequest: MessageRequest = {
        roomId: activeConversation.roomId,
        senderId: userId,
        message: inputValue.trim(),
        type: 'TEXT'
      };

      sendMessage(messageRequest);
      setInputValue(''); // Clear input after sending
      
    } catch (error) {
      console.error('Send message error:', error);
      message.error('Không thể gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t p-4">
      <div className="flex gap-2">
        <Input.TextArea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Nhập tin nhắn..."
          autoSize={{ minRows: 1, maxRows: 3 }}
          disabled={sending || connectionStatus !== 'connected'}
          className="flex-1"
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={sending}
          disabled={!inputValue.trim() || connectionStatus !== 'connected'}
          className="self-end"
        >
          Gửi
        </Button>
      </div>
      
      {/* Connection status indicator */}
      <div className="mt-2 text-xs text-gray-500">
        {connectionStatus === 'connected' && '🟢 Đã kết nối'}
        {connectionStatus === 'connecting' && '🟡 Đang kết nối...'}
        {connectionStatus === 'disconnected' && '🔴 Mất kết nối'}
        {connectionStatus === 'error' && '❌ Lỗi kết nối'}
      </div>
    </div>
  );
};

export default MessageInput;