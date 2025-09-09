import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import {
    MessageOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    QuestionCircleOutlined
} from '@ant-design/icons';
import type { ChatConversation } from '@/models/Chat';

interface StatisticsCardsProps {
    conversations: ChatConversation[];
}

const StatisticsCards: React.FC<StatisticsCardsProps> = ({ conversations }) => {
    // Calculate statistics
    const totalConversations = conversations.length;
    const activeConversations = conversations.filter(c => c.status === 'active').length;
    const pendingConversations = conversations.filter(c => c.status === 'pending').length;
    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    const stats = [
        {
            title: 'Tổng cuộc hội thoại',
            value: totalConversations,
            icon: <MessageOutlined />,
            color: '#1890ff'
        },
        {
            title: 'Đang hoạt động',
            value: activeConversations,
            icon: <CheckCircleOutlined />,
            color: '#52c41a'
        },
        {
            title: 'Đang chờ',
            value: pendingConversations,
            icon: <ClockCircleOutlined />,
            color: '#faad14'
        },
        {
            title: 'Chưa đọc',
            value: totalUnread,
            icon: <QuestionCircleOutlined />,
            color: '#f5222d'
        }
    ];

    return (
        <Row gutter={[16, 16]}>
            {stats.map((stat, index) => (
                <Col xs={24} sm={12} md={6} key={index}>
                    <Card bordered={false} className="shadow-sm">
                        <Statistic
                            title={stat.title}
                            value={stat.value}
                            valueStyle={{ color: stat.color }}
                            prefix={stat.icon}
                        />
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

export default StatisticsCards; 