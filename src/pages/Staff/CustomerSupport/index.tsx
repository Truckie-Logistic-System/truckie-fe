import React, { useState, useEffect } from 'react';
import { Typography, Card, Input, Button, Skeleton } from 'antd';
import {
    MessageOutlined,
    SearchOutlined,
    ReloadOutlined,
    CheckCircleOutlined,
    QuestionCircleOutlined
} from '@ant-design/icons';
import type { ChatConversation, ChatMessage } from '@/models/Chat';
import { MOCK_CONVERSATIONS } from '@/models/Chat';
import ConversationTable from './components/ConversationTable';
import ChatDrawer from './components/ChatDrawer';
import StatisticsCards from './components/StatisticsCards';

const { Title, Text } = Typography;

const CustomerSupport: React.FC = () => {
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [filteredConversations, setFilteredConversations] = useState<ChatConversation[]>([]);
    const [searchText, setSearchText] = useState('');
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Fetch conversations
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Simulate API call
                await new Promise((resolve) => setTimeout(resolve, 800));
                setConversations(MOCK_CONVERSATIONS);
                setFilteredConversations(MOCK_CONVERSATIONS);
            } catch (error) {
                console.error('Error fetching conversations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [refreshTrigger]);

    // Handle search
    const handleSearch = (value: string) => {
        setSearchText(value);
        if (!value) {
            setFilteredConversations(conversations);
            return;
        }

        const filtered = conversations.filter(
            (conversation) =>
                conversation.customerName.toLowerCase().includes(value.toLowerCase()) ||
                conversation.lastMessage.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredConversations(filtered);
    };

    const openChat = (conversation: ChatConversation) => {
        // Mark messages as read
        const updatedConversation = {
            ...conversation,
            unreadCount: 0,
            messages: conversation.messages.map(msg => ({ ...msg, isRead: true })),
        };

        setActiveConversation(updatedConversation);
        setDrawerVisible(true);

        // Update in conversations list
        setConversations(
            conversations.map((c) => (c.id === conversation.id ? updatedConversation : c))
        );
        setFilteredConversations(
            filteredConversations.map((c) => (c.id === conversation.id ? updatedConversation : c))
        );
    };

    const handleSendMessage = () => {
        if (!message.trim() || !activeConversation) return;

        const newMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            content: message,
            senderId: '201',
            senderName: 'Nhân viên CSKH',
            senderType: 'staff',
            timestamp: new Date().toISOString(),
            isRead: true,
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