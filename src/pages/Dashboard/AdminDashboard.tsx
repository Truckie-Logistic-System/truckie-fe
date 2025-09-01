import React from 'react';
import { Row, Col, Card, Statistic, Typography, Table, Tag } from 'antd';
import { UserOutlined, ShoppingCartOutlined, CarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../../context';

const { Title } = Typography;

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();

    // Mock data for statistics
    const stats = [
        {
            title: 'Tổng người dùng',
            value: 1245,
            icon: <UserOutlined />,
            color: '#1890ff'
        },
        {
            title: 'Đơn hàng mới',
            value: 28,
            icon: <ShoppingCartOutlined />,
            color: '#52c41a'
        },
        {
            title: 'Tài xế hoạt động',
            value: 42,
            icon: <CarOutlined />,
            color: '#faad14'
        },
        {
            title: 'Đơn hàng hoàn thành',
            value: 187,
            icon: <CheckCircleOutlined />,
            color: '#13c2c2'
        }
    ];

    // Mock data for recent orders
    const recentOrders = [
        {
            key: '1',
            id: 'ORD-1234',
            customer: 'Nguyễn Văn A',
            status: 'Đang giao',
            amount: '1,200,000 ₫',
            date: '12/06/2023'
        },
        {
            key: '2',
            id: 'ORD-1235',
            customer: 'Trần Thị B',
            status: 'Đã hoàn thành',
            amount: '850,000 ₫',
            date: '12/06/2023'
        },
        {
            key: '3',
            id: 'ORD-1236',
            customer: 'Lê Văn C',
            status: 'Đang xử lý',
            amount: '2,100,000 ₫',
            date: '11/06/2023'
        },
        {
            key: '4',
            id: 'ORD-1237',
            customer: 'Phạm Thị D',
            status: 'Đã hoàn thành',
            amount: '750,000 ₫',
            date: '11/06/2023'
        },
        {
            key: '5',
            id: 'ORD-1238',
            customer: 'Hoàng Văn E',
            status: 'Đang giao',
            amount: '1,500,000 ₫',
            date: '10/06/2023'
        }
    ];

    const columns = [
        {
            title: 'Mã đơn hàng',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Khách hàng',
            dataIndex: 'customer',
            key: 'customer',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                let color = '';
                if (status === 'Đang giao') color = 'blue';
                else if (status === 'Đã hoàn thành') color = 'green';
                else if (status === 'Đang xử lý') color = 'orange';
                return <Tag color={color}>{status}</Tag>;
            }
        },
        {
            title: 'Số tiền',
            dataIndex: 'amount',
            key: 'amount',
        },
        {
            title: 'Ngày',
            dataIndex: 'date',
            key: 'date',
        }
    ];

    return (
        <div>
            <Title level={2}>Tổng quan hệ thống</Title>
            <p className="text-gray-500 mb-6">Chào mừng, {user?.username}! Đây là tổng quan về hệ thống của bạn.</p>

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

            <div className="mt-8">
                <Title level={4}>Đơn hàng gần đây</Title>
                <Card className="shadow-sm">
                    <Table
                        dataSource={recentOrders}
                        columns={columns}
                        pagination={false}
                        className="mt-4"
                    />
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard; 