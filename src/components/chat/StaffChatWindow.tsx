import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Empty, Spin, Badge } from 'antd';
import { SendOutlined, PaperClipOutlined, CloseOutlined } from '@ant-design/icons';
import { useChatContext } from '@/context/ChatContext';
import StaffChatMessage from './StaffChatMessage';
import StaffChatConversationItem from './StaffChatConversationItem';
import { useAuth } from '@/context/AuthContext';
import type { SupportRoom } from '@/context/ChatContext';

const StaffChatWindow: React.FC = () => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const {
    activeConversation,
    sendMessage,
    isMinimized,
    toggleChat,
    supportRooms,
    loadingRooms,
    fetchSupportRooms,
    joinRoom,
    uiMessages,
    loadMessagesForRoom,
  } = useChatContext();

  // Fetch messages for active room
  const fetchMessagesForActiveRoom = async (roomId: string) => {
    try {
      await loadMessagesForRoom(roomId);
    } catch (err) {
      console.error('Failed to load messages for room', err);
    }
  };

  // Fetch support rooms on open
  useEffect(() => {
    fetchSupportRooms();
  }, [fetchSupportRooms]);

  // Load messages when activeConversation changes
  useEffect(() => {
    if (activeConversation) {
      fetchMessagesForActiveRoom(activeConversation.roomId);
    }
  }, [activeConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [uiMessages, isMinimized]);

  const handleSendMessage = () => {
    if (message.trim() && activeConversation) {
      sendMessage({
        roomId: activeConversation.roomId,
        senderId: user?.id || '',
        message: message.trim(),
        type: 'TEXT',
      });
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const mapRoomToConversation = (room: SupportRoom) => ({
    id: room.roomId,
    customerName: room.customerName || `Khách hàng #${room.roomId.slice(0, 5)}`,
    lastMessage: room.lastMessage || 'Yêu cầu hỗ trợ mới',
    lastMessageTime: room.lastMessageTime || '',
    unreadCount: room.unreadCount || 0,
    status: room.status.toLowerCase() as 'active' | 'pending' | 'closed',
    type: room.type,
  });

  if (isMinimized) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 w-[700px] h-[800px] bg-white shadow-lg rounded-lg flex flex-col border border-gray-200">
      {/* Header */}
      <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center rounded-t-lg">
        <h3 className="font-medium text-lg">Hỗ trợ trực tuyến</h3>
        <Button
          type="text"
          icon={<CloseOutlined />}
          size="small"
          className="text-white hover:text-gray-200"
          onClick={toggleChat}
        />
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Conversation List */}
        <div className="w-1/3 border-r overflow-y-auto flex flex-col">
          <div className="p-4 bg-gray-50 border-b">
            <h4 className="text-lg font-medium text-gray-700">Các phòng chờ hỗ trợ</h4>
          </div>
          {loadingRooms ? (
            <div className="flex-1 flex items-center justify-center">
              <Spin />
            </div>
          ) : supportRooms.length > 0 ? (
            <div className="overflow-y-auto h-full">
              {supportRooms.map((room) => (
                <StaffChatConversationItem
                  key={room.roomId}
                  conversation={mapRoomToConversation(room)}
                  isActive={activeConversation?.roomId === room.roomId}
                  onClick={() => joinRoom(room.roomId)}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <Empty description="Không có yêu cầu hỗ trợ nào" />
            </div>
          )}
        </div>

        {/* Right: Chat Content */}
        <div className="w-2/3 flex flex-col">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-gray-50 border-b flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium mr-3">
                  {activeConversation.participants[0]?.userId.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-700">{`Khách hàng #${activeConversation.roomId.slice(0, 5)}`}</h4>
                  <div className="text-sm text-gray-500">
                    {activeConversation.status === 'active' ? 'Đang hoạt động' : 'Đã đóng'}
                  </div>
                </div>
                <Badge status={activeConversation.status === 'active' ? 'success' : 'default'} />
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5">
                {uiMessages.map((msg) => (
                  <StaffChatMessage
                    key={msg.id}
                    message={msg}
                    isOwnMessage={msg.senderId === user?.id}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t p-4 flex">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập tin nhắn..."
                  disabled={activeConversation.status !== 'active'}
                  suffix={<PaperClipOutlined className="text-gray-400 cursor-pointer" />}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  disabled={activeConversation.status !== 'active'}
                  className="ml-3"
                />
              </div>
              {activeConversation.status !== 'active' && (
                <div className="text-center text-gray-500 mt-2 text-sm">
                  Cuộc hội thoại đã kết thúc.
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-5 text-gray-500">
              <div className="text-center">
                <p>Chọn một yêu cầu hỗ trợ để bắt đầu chat</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffChatWindow;
