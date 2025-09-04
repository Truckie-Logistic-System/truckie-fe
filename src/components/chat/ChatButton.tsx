import React from 'react';
import { Badge } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import { useChatContext } from '@/context/ChatContext';

const ChatButton: React.FC = () => {
    const { toggleChat, isOpen, unreadCount } = useChatContext();

    return (
        <div
            className={`fixed bottom-4 right-4 z-50 ${isOpen ? 'hidden' : 'block'}`}
        >
            <Badge count={unreadCount} overflowCount={99}>
                <button
                    onClick={toggleChat}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
                    aria-label="Mở chat hỗ trợ"
                >
                    <MessageOutlined style={{ fontSize: '24px' }} />
                </button>
            </Badge>
        </div>
    );
};

export default ChatButton; 