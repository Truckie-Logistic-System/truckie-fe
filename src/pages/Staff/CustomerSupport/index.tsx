import React, { useState } from 'react';
import {
    Table,
    Card,
    Typography,
    Tag,
    Space,
    Button,
    Input,
    Drawer,
    Tabs,
    Badge,
    Statistic,
    Row,
    Col,
    Select,
} from 'antd';
import {
    SearchOutlined,
    MessageOutlined,
    UserOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    QuestionCircleOutlined,
    SendOutlined,
    PaperClipOutlined,
} from '@ant-design/icons';
import type { ChatConversation, ChatMessage } from '@/models/Chat';
import { MOCK_CONVERSATIONS } from '@/models/Chat';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';

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

        const newMessage: ChatMessage = {
            id: uuidv4(),
            senderId: '201',
            senderName: 'Nhân viên CSKH',
            senderType: 'staff',
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
        if (!activeConversation) return;

        const updatedConversation = {
            ...activeConversation,
            status: 'closed' as const,
        };

        setConversations(
            conversations.map((c) => (c.id === activeConversation.id ? updatedConversation : c))
        );
        setActiveConversation(updatedConversation);
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
                return <MessageOutlined />;
            case 'pending':
                return <ClockCircleOutlined />;
            case 'closed':
                return <CheckCircleOutlined />;
            default:
                return <QuestionCircleOutlined />;
        }
    };

    const columns = [
        {
            title: 'Khách hàng',
            dataIndex: 'customerName',
            key: 'customerName',
            render: (text: string, record: ChatConversation) => (
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium mr-2">
                        {text.charAt(0).toUpperCase()}
                    </div>
                    <Text>{text}</Text>
                    {record.unreadCount > 0 && (
                        <Badge count={record.unreadCount} className="ml-2" />
                    )}
                </div>
            ),
        },
        {
            title: 'Tin nhắn gần nhất',
            dataIndex: 'lastMessage',
            key: 'lastMessage',
            render: (text: string) => (
                <Text ellipsis={{ tooltip: text }}>{text}</Text>
            ),
        },
        {
            title: 'Thời gian',
            dataIndex: 'lastMessageTime',
            key: 'lastMessageTime',
            render: (time: string) => (
                <Text>
                    {formatDistanceToNow(new Date(time), { addSuffix: true, locale: vi })}
                </Text>
            ),
            sorter: (a: ChatConversation, b: ChatConversation) =>
                new Date(a.lastMessageTime).getTime() - new Date(b.lastMessageTime).getTime(),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag icon={getStatusIcon(status)} color={getStatusColor(status)}>
                    {status === 'active'
                        ? 'Đang hoạt động'
                        : status === 'pending'
                            ? 'Đang chờ'
                            : 'Đã đóng'}
                </Tag>
            ),
            filters: [
                { text: 'Đang hoạt động', value: 'active' },
                { text: 'Đang chờ', value: 'pending' },
                { text: 'Đã đóng', value: 'closed' },
            ],
            onFilter: (value: any, record: ChatConversation) => record.status === value,
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: ChatConversation) => (
                <Space size="small">
                    <Button
                        type="primary"
                        icon={<MessageOutlined />}
                        onClick={() => openChat(record)}
                    >
                        Chat
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6">
            <Title level={2}>Hỗ trợ khách hàng</Title>

            <Row gutter={16} className="mb-6">
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Tổng số cuộc hội thoại"
                            value={conversations.length}
                            prefix={<MessageOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Đang hoạt động"
                            value={conversations.filter((c) => c.status === 'active').length}
                            valueStyle={{ color: '#52c41a' }}
                            prefix={<MessageOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Đang chờ"
                            value={conversations.filter((c) => c.status === 'pending').length}
                            valueStyle={{ color: '#faad14' }}
                            prefix={<ClockCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Tin nhắn chưa đọc"
                            value={conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
                            valueStyle={{ color: '#ff4d4f' }}
                            prefix={<MessageOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            <Card>
                <div className="mb-4 flex justify-between">
                    <Input
                        placeholder="Tìm kiếm theo tên khách hàng hoặc nội dung tin nhắn"
                        prefix={<SearchOutlined />}
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{ width: 400 }}
                    />
                    <Select defaultValue="all" style={{ width: 200 }}>
                        <Option value="all">Tất cả cuộc hội thoại</Option>
                        <Option value="active">Đang hoạt động</Option>
                        <Option value="pending">Đang chờ</Option>
                        <Option value="closed">Đã đóng</Option>
                    </Select>
                </div>

                <Table
                    columns={columns as any}
                    dataSource={filteredConversations}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Drawer
                title={
                    <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium mr-2">
                            {activeConversation?.customerName.charAt(0).toUpperCase()}
                        </div>
                        <span>{activeConversation?.customerName}</span>
                    </div>
                }
                placement="right"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                width={500}
                extra={
                    <Space>
                        <Button onClick={handleCloseConversation} disabled={activeConversation?.status === 'closed'}>
                            Đóng hội thoại
                        </Button>
                    </Space>
                }
            >
                {activeConversation && (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto mb-4">
                            {activeConversation.messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`mb-4 ${msg.senderType === 'staff' ? 'flex justify-end' : ''
                                        }`}
                                >
                                    <div
                                        className={`max-w-[80%] p-3 rounded-lg ${msg.senderType === 'staff'
                                            ? 'bg-blue-600 text-white ml-auto rounded-br-none'
                                            : 'bg-gray-100 rounded-bl-none'
                                            }`}
                                    >
                                        {msg.senderType !== 'staff' && (
                                            <div className="text-xs font-medium mb-1">
                                                {msg.senderName}
                                            </div>
                                        )}
                                        <div>{msg.content}</div>
                                        <div
                                            className={`text-xs mt-1 ${msg.senderType === 'staff' ? 'text-blue-200' : 'text-gray-500'
                                                }`}
                                        >
                                            {formatDistanceToNow(new Date(msg.timestamp), {
                                                addSuffix: true,
                                                locale: vi,
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto border-t pt-4">
                            <div className="flex">
                                <Input
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Nhập tin nhắn..."
                                    onPressEnter={handleSendMessage}
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
                                <div className="text-center text-gray-500 mt-2">
                                    Cuộc hội thoại đã kết thúc
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default CustomerSupport; 