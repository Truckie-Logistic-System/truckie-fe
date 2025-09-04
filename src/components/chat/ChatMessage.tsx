import React from 'react';
import type { ChatMessage as ChatMessageType } from '@/models/Chat';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ChatMessageProps {
    message: ChatMessageType;
    isOwnMessage: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwnMessage }) => {
    const timeAgo = formatDistanceToNow(new Date(message.timestamp), {
        addSuffix: true,
        locale: vi
    });

    return (
        <div
            className={`flex mb-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
        >
            <div
                className={`max-w-[80%] px-3 py-2 rounded-lg ${isOwnMessage
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    }`}
            >
                {!isOwnMessage && (
                    <div className="text-xs font-medium mb-1">
                        {message.senderName}
                    </div>
                )}
                <div className="text-sm">{message.content}</div>
                <div
                    className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                        }`}
                >
                    {timeAgo}
                </div>
            </div>
        </div>
    );
};

export default ChatMessage; 