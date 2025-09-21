import React from 'react';
import { Badge } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import { useChatContext } from '@/context/ChatContext';

interface StaffChatButtonProps {
    onClick: () => void;
}

const StaffChatButton: React.FC<StaffChatButtonProps> = ({ onClick }) => {
    const { unreadCount } = useChatContext();

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <Badge count={unreadCount} overflowCount={99}>
                <div
                    onClick={onClick}
                    className="w-16 h-16 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center shadow-lg cursor-pointer transition-colors duration-200"
                >
                    <MessageOutlined style={{ fontSize: '24px', color: 'white' }} />
                </div>
            </Badge>
        </div>
    );
};

export default StaffChatButton; 