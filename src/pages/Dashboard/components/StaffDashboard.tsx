import React from 'react';
import { Row, Col, Card, Statistic, Typography, List, Space, Badge } from 'antd';
import {
    FileTextOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    CarOutlined,
    UserOutlined,
    ToolOutlined,
    BellOutlined
} from '@ant-design/icons';
import { useAuth } from '@/context';
import { OrderStatusEnum, PriorityEnum } from '@/constants/enums';
import { OrderStatusTag, PriorityTag } from '@/components/common/tags';

const { Title } = Typography;

// Map trạng thái tiếng Việt sang OrderStatusEnum
const mapStatusToEnum = (status: string): OrderStatusEnum => {
    switch (status) {
        case 'Đang giao': return OrderStatusEnum.ON_DELIVERED;
        case 'Đã giao': return OrderStatusEnum.DELIVERED;
        case 'Chậm trễ': return OrderStatusEnum.IN_TROUBLES;
        default: return OrderStatusEnum.PENDING;
    }
};

const StaffDashboard: React.FC = () => {
    const { user } = useAuth();

    // Mock data for statistics
    const stats = [
        {
            title: 'Đơn hàng mới',
            value: 12,
            icon: <FileTextOutlined />,
            color: '#1890ff'
        },
        {
            title: 'Đang xử lý',
            value: 18,
            icon: <ClockCircleOutlined />,
            color: '#faad14'
        },
        {
            title: 'Hoàn thành hôm nay',
            value: 24,
            icon: <CheckCircleOutlined />,
            color: '#52c41a'
        },
        {
            title: 'Cần xử lý gấp',
            value: 5,
            icon: <ExclamationCircleOutlined />,
            color: '#f5222d'
        }
    ];

    // Mock data for tasks
    const tasks = [
        {
            title: 'Xác nhận đơn hàng #ORD-1234',
            priority: 'Cao',
            deadline: '12:00 PM',
            status: 'Đang chờ'
        },
        {
            title: 'Liên hệ khách hàng Nguyễn Văn A về đơn hàng #ORD-1235',
            priority: 'Trung bình',
            deadline: '14:30 PM',
            status: 'Đang chờ'
        },
        {
            title: 'Xử lý khiếu nại từ khách hàng Trần Thị B',
            priority: 'Cao',
            deadline: '15:00 PM',
            status: 'Đang chờ'
        },
        {
            title: 'Cập nhật thông tin vận chuyển cho đơn hàng #ORD-1236',
            priority: 'Thấp',
            deadline: '16:30 PM',
            status: 'Đang chờ'
        },
        {
            title: 'Kiểm tra tình trạng giao hàng của tài xế Lê Văn C',
            priority: 'Trung bình',
            deadline: '17:00 PM',
            status: 'Đang chờ'
        }
    ];

    // Mock data for recent deliveries
    const recentDeliveries = [
        {
            id: 'DEL-1234',
            driver: 'Nguyễn Văn X',
            status: 'Đang giao',
            address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
            estimatedTime: '10:30 AM'
        },
        {
            id: 'DEL-1235',
            driver: 'Trần Văn Y',
            status: 'Đã giao',
            address: '456 Lê Lợi, Quận 5, TP.HCM',
            estimatedTime: '11:45 AM'
        },
        {
            id: 'DEL-1236',
            driver: 'Phạm Thị Z',
            status: 'Đang giao',
            address: '789 Điện Biên Phủ, Quận 3, TP.HCM',
            estimatedTime: '13:15 PM'
        }
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Đang giao': return 'blue';
            case 'Đã giao': return 'green';
            case 'Chậm trễ': return 'red';
            default: return 'default';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Cao': return 'red';
            case 'Trung bình': return 'orange';
            case 'Thấp': return 'green';
            default: return 'blue';
        }
    };

    return (
        <div>
            <Title level={2}>Tổng quan công việc</Title>
            <p className="text-gray-500 mb-6">Chào mừng, {user?.username}! Đây là tổng quan công việc của bạn hôm nay.</p>

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

            <Row gutter={[16, 16]} className="mt-6">
                <Col xs={24} lg={16}>
                    <Card
                        title="Nhiệm vụ cần xử lý"
                        className="shadow-sm"
                    >
                        <List
                            itemLayout="horizontal"
                            dataSource={tasks}
                            renderItem={(item) => (
                                <List.Item
                                    actions={[
                                        <a key="list-edit">Xử lý</a>,
                                        <a key="list-more">Chi tiết</a>
                                    ]}
                                >
                                    <List.Item.Meta
                                        title={<span>{item.title}</span>}
                                        description={
                                            <Space>
                                                <PriorityTag priority={item.priority} />
                                                <span>
                                                    <ClockCircleOutlined /> Hạn: {item.deadline}
                                                </span>
                                            </Space>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card
                        title="Vận chuyển gần đây"
                        className="shadow-sm"
                    >
                        <List
                            itemLayout="vertical"
                            dataSource={recentDeliveries}
                            renderItem={(item) => (
                                <List.Item>
                                    <Space direction="vertical" size={1} style={{ width: '100%' }}>
                                        <div className="flex justify-between">
                                            <span className="font-medium">{item.id}</span>
                                            <OrderStatusTag status={mapStatusToEnum(item.status)} />
                                        </div>
                                        <div>Tài xế: {item.driver}</div>
                                        <div className="text-xs text-gray-500">{item.address}</div>
                                        <div className="text-xs">
                                            <ClockCircleOutlined /> Dự kiến: {item.estimatedTime}
                                        </div>
                                    </Space>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default StaffDashboard; 