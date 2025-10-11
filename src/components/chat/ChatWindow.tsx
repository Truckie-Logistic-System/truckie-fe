import React, { useRef, useEffect } from 'react';
import { useChatContext } from '@/context/ChatContext';

import MessageInput from './MessageInput';
import { Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import ChatMessage from './ChatMessage';

const ChatWindow: React.FC = () => {
    const { uiMessages, activeConversation, isOpen, toggleChat } = useChatContext();
    const currentUserId = sessionStorage.getItem('userId') || '';
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const prevMessagesLengthRef = useRef(0);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (!messagesEndRef.current || !messagesContainerRef.current) return;

        // Only auto-scroll if:
        // 1. New messages added (length increased)
        // 2. User was already near bottom (within 100px)
        const container = messagesContainerRef.current;
        const isNearBottom = 
            container.scrollHeight - container.scrollTop - container.clientHeight < 100;

        if (uiMessages.length > prevMessagesLengthRef.current && isNearBottom) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }

        prevMessagesLengthRef.current = uiMessages.length;
    }, [uiMessages]);

    // Scroll to bottom on initial load
    useEffect(() => {
        if (isOpen && messagesEndRef.current) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
            }, 100);
        }
    }, [isOpen, activeConversation?.roomId]);

    if (!isOpen || !activeConversation) {
        return null;
    }

    return (
        <div className="fixed bottom-20 right-4 w-96 h-[500px] bg-white border rounded-lg shadow-xl z-40 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b bg-blue-500 text-white rounded-t-lg flex justify-between items-center flex-shrink-0">
                <h3 className="font-semibold">Hỗ trợ khách hàng</h3>
                <Button
                    type="text"
                    icon={<CloseOutlined />}
                    size="small"
                    className="text-white hover:text-gray-200"
                    onClick={toggleChat}
                />
            </div>

            {/* Messages */}
            <div 
                ref={messagesContainerRef}
                className="flex-1 p-4 overflow-y-auto"
            >
                {uiMessages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                        Chưa có tin nhắn. Hãy bắt đầu cuộc hội thoại!
                    </div>
                ) : (
                    <>
                        {uiMessages.map((message) => (
                            <ChatMessage
                                key={message.id}
                                message={message}
                                isOwnMessage={message.senderId === currentUserId}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <MessageInput />
        </div>
    );
};

export default ChatWindow;