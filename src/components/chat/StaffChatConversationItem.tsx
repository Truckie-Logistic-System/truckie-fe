import React from 'react';
import { Badge } from 'antd';
import dayjs from 'dayjs';

// The Conversation interface remains the same
interface Conversation {
  id: string;
  customerName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'active' | 'pending' | 'closed';
  type?: 'SUPPORT' | 'SUPPORTED'; // Added type to distinguish rooms
}

interface StaffChatConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

const StaffChatConversationItem: React.FC<StaffChatConversationItemProps> = ({
  conversation,
  isActive,
  onClick
}) => {
  const { customerName, lastMessage, lastMessageTime, unreadCount, status, type } = conversation;
  const formattedTime = lastMessageTime ? dayjs(lastMessageTime).format('HH:mm') : '';

  // Determine status color based on conversation status
  let statusColor = '';
  if (status === 'active') statusColor = 'bg-green-500';
  else if (status === 'pending') statusColor = 'bg-yellow-500';
  else statusColor = 'bg-gray-400';

  // Determine if the room is a new support request for highlighting
  const isSupportRequest = type === 'SUPPORT';

  return (
    <div
      className={`flex items-center p-3 border-b cursor-pointer hover:bg-gray-100 transition-colors
        ${isActive ? 'bg-blue-50' : ''}
        ${isSupportRequest ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''}
      `}
      onClick={onClick}
    >
      <div className="relative mr-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
          {customerName.charAt(0).toUpperCase()}
        </div>
        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${statusColor} border-2 border-white`}></div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium text-gray-900 truncate">{customerName}</h4>
          <span className="text-xs text-gray-500">{formattedTime}</span>
        </div>
        <div className="flex justify-between items-center mt-1">
           <p className="text-xs text-gray-500 truncate">{isSupportRequest ? "Cần hỗ trợ..." : lastMessage}</p>
          {unreadCount > 0 && (
            <Badge count={unreadCount} size="small" />
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffChatConversationItem;