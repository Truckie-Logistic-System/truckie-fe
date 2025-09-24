import React from 'react';
import { useChatContext } from '@/context/ChatContext';
import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';

const ChatWindow: React.FC = () => {
    const { uiMessages, activeConversation, isOpen } = useChatContext();
    const currentUserId = localStorage.getItem('userId') || '';

    if (!isOpen || !activeConversation) {
        return null;
    }

    return (
        <div className="fixed bottom-20 right-4 w-96 h-96 bg-white border rounded-lg shadow-xl z-40">
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="p-4 border-b bg-blue-500 text-white rounded-t-lg">
                    <h3 className="font-semibold">Hỗ trợ khách hàng</h3>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto">
                    {uiMessages.length === 0 ? (
                        <div className="text-center text-gray-500">
                            Chưa có tin nhắn. Hãy bắt đầu cuộc hội thoại!
                        </div>
                    ) : (
                        uiMessages.map((message, index) => (
                            <ChatMessage
                                key={message.id || `${message.senderId}-${index}`}
                                message={message}
                                isOwnMessage={message.senderId === currentUserId}
                            />
                        ))

                    )}
                </div>

                {/* Input */}
                <MessageInput />
            </div>
        </div>
    );
};

export default ChatWindow;