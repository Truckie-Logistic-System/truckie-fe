import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Empty, Badge } from 'antd';
import {
    SendOutlined,
    PaperClipOutlined,
    CloseOutlined
} from '@ant-design/icons';
import { useChatContext } from '@/context/ChatContext';
import ChatMessage from './ChatMessage';
import { useAuth } from '@/context/AuthContext';

const ChatWindow: React.FC = () => {
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const {
        activeConversation,
        sendMessage,
        markAsRead,
        isMinimized,
        toggleChat,
    } = useChatContext();

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current && !isMinimized) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeConversation?.messages, isMinimized]);

    // Mark messages as read when conversation becomes active
    useEffect(() => {
        if (activeConversation?.id && activeConversation.unreadCount > 0) {
            markAsRead(activeConversation.id);
        }
    }, [activeConversation?.id, markAsRead]);

    const handleSendMessage = () => {
        if (message.trim()) {
            sendMessage(message, activeConversation?.id);
            setMessage('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (isMinimized) {
        return (
            <div
                className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg cursor-pointer flex items-center z-50"
                onClick={toggleChat}
            >
                <div className="mr-2">Chat</div>
                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-xs">
                    {activeConversation?.unreadCount || 0}
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-lg shadow-xl flex flex-col z-50 border border-gray-200"
        >
            {/* Header */}
            <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
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

            {/* Chat Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {activeConversation ? (
                    <>
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-3">
                            {activeConversation.messages.map((msg) => (
                                <ChatMessage
                                    key={msg.id}
                                    message={msg}
                                    isOwnMessage={msg.senderId === user?.id || (msg.senderType === 'customer')}
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
                                    disabled={activeConversation.status === 'closed'}
                                    suffix={
                                        <PaperClipOutlined className="text-gray-400 cursor-pointer" />
                                    }
                                />
                                <Button
                                    type="primary"
                                    icon={<SendOutlined />}
                                    onClick={handleSendMessage}
                                    disabled={activeConversation.status === 'closed'}
                                    className="ml-2"
                                />
                            </div>
                            {activeConversation.status === 'closed' && (
                                <div className="text-center text-gray-500 mt-1 text-xs">
                                    Cuộc hội thoại đã kết thúc
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center p-4 text-gray-500">
                        <div className="text-center">
                            <p>Bắt đầu cuộc hội thoại mới</p>
                            <Button
                                type="primary"
                                onClick={() => sendMessage('Xin chào, tôi cần hỗ trợ')}
                                className="mt-2"
                            >
                                Bắt đầu chat
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatWindow; 