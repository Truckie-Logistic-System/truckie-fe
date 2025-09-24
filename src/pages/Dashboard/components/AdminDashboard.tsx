import React from 'react';
import { Row, Col, Card, Statistic, Typography, Table } from 'antd';
import {
    UserOutlined,
    CarOutlined,
    DollarCircleOutlined,
    FileTextOutlined
} from '@ant-design/icons';
import { useAuth } from '@/context';
import { OrderStatusEnum } from '@/constants/enums';
import { OrderStatusTag } from '@/components/common/tags';

const { Title } = Typography;

// Map trạng thái tiếng Việt sang OrderStatusEnum
const mapStatusToEnum = (status: string): OrderStatusEnum => {
    switch (status) {
        case 'Đang giao': return OrderStatusEnum.ON_DELIVERED;
        case 'Đã hoàn thành': return OrderStatusEnum.SUCCESSFUL;
        case 'Đang xử lý': return OrderStatusEnum.PROCESSING;
        default: return OrderStatusEnum.PENDING;
    }
};

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();

    const stats = [
        {
            title: 'Tổng khách hàng',
            value: 128,
            icon: <UserOutlined />,
            color: '#1890ff'
        },
        {
            title: 'Phương tiện hoạt động',
            value: 42,
            icon: <CarOutlined />,
            color: '#52c41a'
        },
        {
            title: 'Đơn hàng trong ngày',
            value: 18,
            icon: <FileTextOutlined />,
            color: '#722ed1'
        },
        {
            title: 'Doanh thu trong ngày',
            value: '12,500,000 ₫',
            icon: <DollarCircleOutlined />,
            color: '#fa8c16'
        }
    ];

    const recentOrders = [
        {
            key: '1',
            id: 'ORD-1234',
            customer: 'Nguyễn Văn A',
            status: 'Đã hoàn thành',
            amount: '1,200,000 ₫',
            date: '12/06/2023'
        },
        {
            key: '2',
            id: 'ORD-1235',
            customer: 'Trần Thị B',
            status: 'Đang giao',
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
                const orderStatus = mapStatusToEnum(status);
                return <OrderStatusTag status={orderStatus} />;
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