import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Empty, Spin, Badge } from 'antd';
import { SendOutlined, PaperClipOutlined, CloseOutlined } from '@ant-design/icons';
import { useChatContext } from '@/context/ChatContext';
import StaffChatMessage from './StaffChatMessage';
import StaffChatConversationItem from './StaffChatConversationItem';
import { useAuth } from '@/context/AuthContext';
import type { SupportRoom } from '@/context/ChatContext'; // Import the SupportRoom type

const StaffChatWindow: React.FC = () => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const {
    activeConversation,
    sendMessage,
    isMinimized,
    toggleChat,
    supportRooms,       // <-- Use supportRooms from context
    loadingRooms,       // <-- Use loading state
    fetchSupportRooms,  // <-- Use fetch function
    joinRoom,           // <-- Use join function
    uiMessages,         // <-- Use uiMessages for the active chat
  } = useChatContext();

  // Fetch support rooms when the component opens for the first time
  useEffect(() => {
    fetchSupportRooms();
  }, [fetchSupportRooms]);


  // Scroll to the bottom of the messages when they change
  useEffect(() => {
    if (messagesEndRef.current && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [uiMessages, isMinimized]);


  const handleSendMessage = () => {
    if (message.trim() && activeConversation) {
        const messageRequest = {
            roomId: activeConversation.roomId,
            senderId: user?.id || '',
            message: message.trim(),
            type: 'TEXT',
        };
        sendMessage(messageRequest);
        setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper to map a SupportRoom to the format needed by StaffChatConversationItem
  const mapRoomToConversation = (room: SupportRoom) => ({
      id: room.roomId,
      customerName: room.customerName || `Khách hàng #${room.roomId.slice(0, 5)}`,
      lastMessage: room.lastMessage || 'Yêu cầu hỗ trợ mới',
      lastMessageTime: room.lastMessageTime || '',
      unreadCount: room.unreadCount || 0,
      status: room.status.toLowerCase() as 'active' | 'pending' | 'closed',
      type: room.type
  });


  if (isMinimized) {
    // This part for minimized view is fine as is
    return null;
  }

  return (
    <div className="fixed inset-0 bg-white flex flex-col z-50 border border-gray-200">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
        <h3 className="font-medium">Hỗ trợ trực tuyến</h3>
        <div className="flex space-x-1">
          <Button
            type="text"
            icon={<CloseOutlined />}
            size="small"
            className="text-white hover:text-gray-200"
            onClick={toggleChat}
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversations/Rooms List - Left Column */}
        <div className="w-1/4 border-r overflow-y-auto flex flex-col">
            <div className="p-2 bg-gray-50 border-b">
                <h4 className="text-sm font-medium text-gray-700">Các phòng chờ hỗ trợ</h4>
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
                            onClick={() => joinRoom(room.roomId)} // Join room on click
                        />
                    ))}
                </div>
            ) : (
                <div className="p-4 text-center text-gray-500">
                    <Empty description="Không có yêu cầu hỗ trợ nào" />
                </div>
            )}
        </div>


        {/* Chat Content - Right Column */}
        <div className="w-3/4 flex flex-col">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-2 bg-gray-50 border-b">
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium mr-2">
                    {activeConversation.participants[0]?.userId.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-700">{`Khách hàng #${activeConversation.roomId.slice(0,5)}`}</h4>
                    <div className="text-xs text-gray-500">
                      {activeConversation.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã đóng'}
                    </div>
                  </div>
                  <Badge status={activeConversation.status === 'ACTIVE' ? 'success' : 'default'} />
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3">
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
              <div className="border-t p-2">
                <div className="flex">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập tin nhắn..."
                    disabled={activeConversation.status !== 'ACTIVE'}
                    suffix={<PaperClipOutlined className="text-gray-400 cursor-pointer" />}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    disabled={activeConversation.status !== 'ACTIVE'}
                    className="ml-2"
                  />
                </div>
                 {activeConversation.status !== 'ACTIVE' && (
                    <div className="text-center text-gray-500 mt-1 text-xs">
                        Cuộc hội thoại đã kết thúc.
                    </div>
                 )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4 text-gray-500">
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