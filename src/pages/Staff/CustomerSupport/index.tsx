import React, { useState } from 'react';
import {
    Card,
    Typography,
    Input,
    Tabs,
    Select,
} from 'antd';
import {
    SearchOutlined,
    MessageOutlined,
    CheckCircleOutlined,
    QuestionCircleOutlined,
} from '@ant-design/icons';
import type { ChatConversation } from '@/models/Chat';
import { MOCK_CONVERSATIONS } from '@/models/Chat';
import { v4 as uuidv4 } from 'uuid';
import StatisticsCards from './components/StatisticsCards';
import ConversationTable from './components/ConversationTable';
import ChatDrawer from './components/ChatDrawer';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const CustomerSupport: React.FC = () => {
    const [conversations, setConversations] = useState<ChatConversation[]>(MOCK_CONVERSATIONS);
    const [searchText, setSearchText] = useState('');
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
    const [message, setMessage] = useState('');

    const handleSearch = (value: string) => {
        setSearchText(value);
    };

    const filteredConversations = conversations.filter(
        (conversation) =>
            conversation.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
            conversation.lastMessage.toLowerCase().includes(searchText.toLowerCase())
    );

    const openChat = (conversation: ChatConversation) => {
        // Mark all messages as read
        const updatedConversation = {
            ...conversation,
            unreadCount: 0,
            messages: conversation.messages.map((msg) => ({ ...msg, isRead: true })),
        };

        // Update conversations
        setConversations(
            conversations.map((c) => (c.id === conversation.id ? updatedConversation : c))
        );

        setActiveConversation(updatedConversation);
        setDrawerVisible(true);
    };

    const handleSendMessage = () => {
        if (!message.trim() || !activeConversation) return;

        const newMessage = {
            id: uuidv4(),
            senderId: '201',
            senderName: 'Nhân viên CSKH',
            senderType: 'staff' as const,
            content: message,
            timestamp: new Date().toISOString(),
            isRead: false,
        };

        const updatedConversation = {
            ...activeConversation,
            lastMessage: message,
            lastMessageTime: newMessage.timestamp,
            messages: [...activeConversation.messages, newMessage],
            status: 'active' as const,
        };

        setConversations(
            conversations.map((c) => (c.id === activeConversation.id ? updatedConversation : c))
        );
        setActiveConversation(updatedConversation);
        setMessage('');
    };

    const handleCloseConversation = () => {
        setDrawerVisible(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'green';
            case 'pending':
                return 'orange';
            case 'closed':
                return 'default';
            default:
                return 'default';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <CheckCircleOutlined />;
            case 'pending':
                return <QuestionCircleOutlined />;
            default:
                return <MessageOutlined />;
        }
    };

    return (
        <div className="p-6">
            <Title level={2}>Hỗ trợ khách hàng</Title>
            <Text className="text-gray-500 block mb-6">
                Quản lý và phản hồi các cuộc hội thoại với khách hàng
            </Text>

            <StatisticsCards conversations={conversations} />

            <Card className="mt-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                        <Input
                            placeholder="Tìm kiếm theo tên khách hàng hoặc nội dung tin nhắn"
                            prefix={<SearchOutlined />}
                            onChange={(e) => handleSearch(e.target.value)}
                            style={{ width: 350 }}
                            allowClear
                        />
                    </div>
                    <div>
                        <Select defaultValue="all" style={{ width: 150 }}>
                            <Option value="all">Tất cả trạng thái</Option>
                            <Option value="active">Đang hoạt động</Option>
                            <Option value="pending">Đang chờ</Option>
                            <Option value="closed">Đã đóng</Option>
                        </Select>
                    </div>
                </div>

                <Tabs defaultActiveKey="all">
                    <TabPane tab="Tất cả" key="all">
                        <ConversationTable
                            conversations={filteredConversations}
                            onOpenChat={openChat}
                            getStatusColor={getStatusColor}
                            getStatusIcon={getStatusIcon}
                        />
                    </TabPane>
                    <TabPane tab="Đang hoạt động" key="active">
                        <ConversationTable
                            conversations={filteredConversations.filter(c => c.status === 'active')}
                            onOpenChat={openChat}
                            getStatusColor={getStatusColor}
                            getStatusIcon={getStatusIcon}
                        />
                    </TabPane>
                    <TabPane tab="Đang chờ" key="pending">
                        <ConversationTable
                            conversations={filteredConversations.filter(c => c.status === 'pending')}
                            onOpenChat={openChat}
                            getStatusColor={getStatusColor}
                            getStatusIcon={getStatusIcon}
                        />
                    </TabPane>
                </Tabs>
            </Card>

            <ChatDrawer
                visible={drawerVisible}
                conversation={activeConversation}
                message={message}
                onClose={handleCloseConversation}
                onMessageChange={setMessage}
                onSendMessage={handleSendMessage}
            />
        </div>
    );
};

export default CustomerSupport; 