import React, { useState, useEffect } from 'react';
import {
    Card,
    Typography,
    Input,
    Tabs,
    Select,
    Skeleton,
    Button,
} from 'antd';
import {
    SearchOutlined,
    MessageOutlined,
    CheckCircleOutlined,
    QuestionCircleOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import type { ChatConversation, ChatMessage } from '@/models/Chat';
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
    const [loading, setLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

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

            <Card
                title="Hội thoại hỗ trợ khách hàng"
                className="mt-6"
                extra={
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => setRefreshTrigger(prev => prev + 1)}
                        loading={loading}
                    >
                        Làm mới
                    </Button>
                }
            >
                <div className="mb-4">
                    <Input
                        placeholder="Tìm kiếm theo tên khách hàng, email hoặc nội dung"
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{ width: 300 }}
                        disabled={loading}
                    />
                </div>

                {loading ? (
                    <div className="py-4">
                        <Skeleton active paragraph={{ rows: 10 }} />
                    </div>
                ) : (
                    <ConversationTable
                        conversations={filteredConversations}
                        onOpenChat={openChat}
                        getStatusColor={getStatusColor}
                        getStatusIcon={getStatusIcon}
                    />
                )}
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