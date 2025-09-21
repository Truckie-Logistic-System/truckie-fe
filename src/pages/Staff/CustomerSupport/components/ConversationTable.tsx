import React from 'react';
import { Table, Button, Space, Avatar } from 'antd';
import { MessageOutlined, UserOutlined } from '@ant-design/icons';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { ChatConversation } from '@/models/Chat';
import { ConversationStatusEnum } from '@/constants/enums';
import { ConversationStatusTag } from '@/components/common/tags';

interface ConversationTableProps {
    conversations: ChatConversation[];
    onOpenChat: (conversation: ChatConversation) => void;
}

const ConversationTable: React.FC<ConversationTableProps> = ({
    conversations,
    onOpenChat
}) => {
    const columns = [
        {
            title: 'Khách hàng',
            key: 'customer',
            render: (record: ChatConversation) => (
                <div className="flex items-center">
                    <Avatar icon={<UserOutlined />} className="mr-2" />
                    <div>
                        <div className="font-medium">{record.customerName}</div>
                        <div className="text-xs text-gray-500">
                            {record.customerId ? `ID: ${record.customerId}` : 'Khách ẩn danh'}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Tin nhắn gần nhất',
            dataIndex: 'lastMessage',
            key: 'lastMessage',
            render: (text: string, record: ChatConversation) => (
                <div>
                    <div className="truncate max-w-xs">{text}</div>
                    <div className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(record.lastMessageTime), {
                            addSuffix: true,
                            locale: vi,
                        })}
                    </div>
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <ConversationStatusTag status={status as ConversationStatusEnum} />
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (record: ChatConversation) => (
                <Space size="middle">
                    <Button
                        type="primary"
                        icon={<MessageOutlined />}
                        onClick={() => onOpenChat(record)}
                    >
                        {record.unreadCount > 0 ? `Xem (${record.unreadCount})` : 'Xem'}
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={conversations}
            rowKey="id"
            pagination={{ pageSize: 10 }}
        />
    );
};

export default ConversationTable; 