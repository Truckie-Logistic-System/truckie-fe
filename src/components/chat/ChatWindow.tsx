import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Tabs, Empty, Badge, Spin } from 'antd';
import {
    SendOutlined,
    PaperClipOutlined,
    CloseOutlined
} from '@ant-design/icons';
import { useChatContext } from '@/context/ChatContext';
import ChatMessage from './ChatMessage';
import ChatConversationItem from './ChatConversationItem';
import { useAuth } from '@/context/AuthContext';

const ChatWindow: React.FC = () => {
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const {
        conversations,
        activeConversation,
        setActiveConversation,
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
                    {conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)}
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 bg-white flex flex-col z-50 border border-gray-200"
        >
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
                {/* Conversations List - Left Column */}
                <div className="w-1/4 border-r overflow-y-auto">
                    <div className="p-2 bg-gray-50 border-b">
                        <h4 className="text-sm font-medium text-gray-700">Cuộc hội thoại</h4>
                    </div>
                    <div className="overflow-y-auto h-full">
                        {conversations.length > 0 ? (
                            conversations.map((conversation) => (
                                <ChatConversationItem
                                    key={conversation.id}
                                    conversation={conversation}
                                    isActive={activeConversation?.id === conversation.id}
                                    onClick={() => setActiveConversation(conversation)}
                                />
                            ))
                        ) : (
                            <div className="p-4 text-center text-gray-500">
                                <Empty description="Không có cuộc hội thoại nào" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Content - Right Column */}
                <div className="w-3/4 flex flex-col">
                    {activeConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-2 bg-gray-50 border-b">
                                <div className="flex items-center">
                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium mr-2">
                                        {activeConversation.customerName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-gray-700">{activeConversation.customerName}</h4>
                                        <div className="text-xs text-gray-500">
                                            {activeConversation.status === 'active' ? 'Đang hoạt động' :
                                                activeConversation.status === 'pending' ? 'Đang chờ' : 'Đã đóng'}
                                        </div>
                                    </div>
                                    {activeConversation.status !== 'closed' && (
                                        <Badge status={activeConversation.status === 'active' ? 'success' : 'warning'} />
                                    )}
                                </div>
                            </div>

                            {/* Messages */}
                            <div
                                className="flex-1 overflow-y-auto p-3"
                            >
                                {activeConversation.messages.map((msg) => (
                                    <ChatMessage
                                        key={msg.id}
                                        message={msg}
                                        isOwnMessage={msg.senderId === user?.id || (msg.senderType === 'staff' && user?.role === 'staff')}
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
                            {user?.role === 'staff' ? (
                                <div className="text-center">
                                    <p>Chọn một cuộc hội thoại để bắt đầu chat</p>
                                </div>
                            ) : (
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
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatWindow; 