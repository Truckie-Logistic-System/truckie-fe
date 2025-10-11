import React from 'react';
import { Avatar, Image } from 'antd';
import { UserOutlined, CustomerServiceOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ChatMessage } from '@/models/Chat';

interface StaffChatMessageProps {
    message: ChatMessage;
    isOwnMessage: boolean;
}

const UserMessage: React.FC<StaffChatMessageProps> = ({ message, isOwnMessage }) => {
    const messageTime = dayjs(message.timestamp).format('HH:mm');
    const isSystemMessage =
        message.senderType === 'anonymous' && message.content.startsWith('SYSTEM:');

    // 🟡 Tin nhắn hệ thống
    if (isSystemMessage) {
        return (
            <div className="flex justify-center my-2">
                <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
                    {message.content.replace('SYSTEM:', '')} • {messageTime}
                </div>
            </div>
        );
    }

    // 🟢 Kiểm tra xem nội dung có phải ảnh không
    const isImageMessage =
        message.content &&
        /^https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp)$/i.test(message.content);

    return (
        <div className={`flex mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            {!isOwnMessage && (
                <Avatar
                    icon={<CustomerServiceOutlined />}
                    className="mr-2 bg-blue-500"
                />
            )}

            <div className="max-w-[70%]">
                {/* 💬 Nếu là ảnh */}
                {isImageMessage ? (
                    <div className="rounded-lg overflow-hidden">
                        <Image
                            src={message.content}
                            alt="image-message"
                            width={200}
                            className="rounded-lg"
                        />
                    </div>
                ) : (
                    // 💬 Nếu là text
                    <div
                        className={`px-4 py-2 rounded-lg ${isOwnMessage
                            ? 'bg-blue-500 text-white rounded-tr-none'
                            : 'bg-gray-100 text-gray-800 rounded-tl-none'
                            }`}
                    >
                        {message.content}
                    </div>
                )}

                <div
                    className={`text-xs mt-1 text-gray-500 ${isOwnMessage ? 'text-right' : 'text-left'}`}
                >
                    {messageTime}
                </div>
            </div>

            {isOwnMessage && (
                <Avatar
                    icon={<UserOutlined />}
                    className="ml-2 bg-gray-500"
                />
            )}
        </div>
    );
};

export default UserMessage;
