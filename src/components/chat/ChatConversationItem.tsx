import React from 'react';
import type { ChatConversation } from '@/models/Chat';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Badge } from 'antd';

interface ChatConversationItemProps {
    conversation: ChatConversation;
    isActive: boolean;
    onClick: () => void;
}

const ChatConversationItem: React.FC<ChatConversationItemProps> = ({
    conversation,
    isActive,
    onClick,
}) => {
    const timeAgo = formatDistanceToNow(new Date(conversation.lastMessageTime), {
        addSuffix: true,
        locale: vi,
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-500';
            case 'pending':
                return 'bg-yellow-500';
            case 'closed':
                return 'bg-gray-500';
            default:
                return 'bg-gray-500';
        }
    };

    return (
        <div
            className={`flex items-center p-3 cursor-pointer border-b hover:bg-gray-50 ${isActive ? 'bg-blue-50' : ''
                }`}
            onClick={onClick}
        >
            <div className="relative mr-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                    {conversation.customerName.charAt(0).toUpperCase()}
                </div>
                <div
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(
                        conversation.status
                    )}`}
                />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                        {conversation.customerName}
                    </h4>
                    <span className="text-xs text-gray-500">{timeAgo}</span>
                </div>
                <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500 truncate">
                        {conversation.lastMessage}
                    </p>
                    {conversation.unreadCount > 0 && (
                        <Badge count={conversation.unreadCount} size="small" />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatConversationItem; 