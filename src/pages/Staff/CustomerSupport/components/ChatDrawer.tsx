import React from 'react';
import {
    Drawer,
    Typography,
    Button,
    Input,
    Space,
    Tag,
    Avatar,
    Select
} from 'antd';
import {
    UserOutlined,
    SendOutlined,
    PaperClipOutlined
} from '@ant-design/icons';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { ChatConversation, ChatMessage } from '@/models/Chat';

const { Text } = Typography;
const { Option } = Select;

interface ChatDrawerProps {
    visible: boolean;
    conversation: ChatConversation | null;
    message: string;
    onClose: () => void;
    onMessageChange: (value: string) => void;
    onSendMessage: () => void;
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({
    visible,
    conversation,
    message,
    onClose,
    onMessageChange,
    onSendMessage
}) => {
    if (!conversation) return null;

    return (
        <Drawer
            title={
                <div className="flex items-center">
                    <Avatar icon={<UserOutlined />} className="mr-2" />
                    <div>
                        <div className="font-medium">{conversation.customerName}</div>
                        <div className="text-xs text-gray-500">
                            {conversation.customerId ? `Khách hàng ID: ${conversation.customerId}` : 'Khách hàng ẩn danh'}
                        </div>
                    </div>
                </div>
            }
            placement="right"
            onClose={onClose}
            open={visible}
            width={400}
            footer={
                <div className="flex">
                    <Input
                        placeholder="Nhập tin nhắn..."
                        value={message}
                        onChange={(e) => onMessageChange(e.target.value)}
                        onPressEnter={onSendMessage}
                        suffix={
                            <Space>
                                <Button
                                    type="text"
                                    icon={<PaperClipOutlined />}
                                    size="small"
                                />
                                <Button
                                    type="primary"
                                    icon={<SendOutlined />}
                                    onClick={onSendMessage}
                                    size="small"
                                />
                            </Space>
                        }
                    />
                </div>
            }
        >
            <div className="mb-4">
                <Space direction="vertical" className="w-full">
                    <div className="flex justify-between items-center">
                        <Text type="secondary">Trạng thái:</Text>
                        <Tag color={conversation.status === 'active' ? 'green' : 'orange'}>
                            {conversation.status === 'active' ? 'Đang hoạt động' : 'Đang chờ'}
                        </Tag>
                    </div>
                    <div className="flex justify-between items-center">
                        <Text type="secondary">Phân loại:</Text>
                        <Select defaultValue="support" style={{ width: 150 }} size="small">
                            <Option value="support">Hỗ trợ chung</Option>
                            <Option value="order">Vấn đề đơn hàng</Option>
                            <Option value="complaint">Khiếu nại</Option>
                            <Option value="feedback">Góp ý</Option>
                        </Select>
                    </div>
                </Space>
            </div>

            <div className="overflow-y-auto" style={{ height: 'calc(100vh - 300px)' }}>
                {conversation.messages.map((msg: ChatMessage) => (
                    <div
                        key={msg.id}
                        className={`mb-4 ${msg.senderType === 'staff' ? 'text-right' : ''}`}
                    >
                        <div
                            className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${msg.senderType === 'staff'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                        >
                            <div className="text-sm">{msg.content}</div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(msg.timestamp), {
                                addSuffix: true,
                                locale: vi
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </Drawer>
    );
};

export default ChatDrawer; 