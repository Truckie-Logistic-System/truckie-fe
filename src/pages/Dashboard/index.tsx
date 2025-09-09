import React from 'react';
import { Card, Typography, Button } from 'antd';
import { useAuth } from '../../context';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import StaffDashboard from './components/StaffDashboard';

const { Title, Paragraph, Text } = Typography;

// Define the valid role types
type UserRole = 'admin' | 'staff' | 'customer' | 'driver';

const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Render specific dashboard based on user role
    if (user?.role === 'admin') {
        return <AdminDashboard />;
    }

    if (user?.role === 'staff') {
        return <StaffDashboard />;
    }

    return (
        <div className="p-6">
            <Card className="shadow-md rounded-lg">
                <Title level={2}>Bảng điều khiển</Title>
                <Paragraph>
                    Xin chào, <Text strong>{user?.username}</Text>!
                </Paragraph>
                <Paragraph>
                    Email: <Text code>{user?.email}</Text>
                </Paragraph>
                <Paragraph>
                    Vai trò: <Text mark>{user?.role}</Text>
                </Paragraph>

                <div className="mt-6">
                    <Title level={4}>Các tính năng có sẵn cho vai trò của bạn:</Title>
                    {(user?.role as UserRole) === 'admin' && (
                        <ul className="list-disc pl-6 mt-2">
                            <li>Quản lý tất cả người dùng</li>
                            <li>Cấu hình hệ thống</li>
                            <li>Xem báo cáo và thống kê</li>
                            <li>Quản lý quyền</li>
                        </ul>
                    )}
                    {(user?.role as UserRole) === 'staff' && (
                        <ul className="list-disc pl-6 mt-2">
                            <li>Quản lý đơn hàng</li>
                            <li>Xử lý yêu cầu khách hàng</li>
                            <li>Theo dõi vận chuyển</li>
                        </ul>
                    )}
                    {user?.role === 'customer' && (
                        <ul className="list-disc pl-6 mt-2">
                            <li>Tạo đơn hàng mới</li>
                            <li>Theo dõi đơn hàng</li>
                            <li>Quản lý thông tin cá nhân</li>
                        </ul>
                    )}
                    {user?.role === 'driver' && (
                        <ul className="list-disc pl-6 mt-2">
                            <li>Xem các đơn hàng cần giao</li>
                            <li>Cập nhật trạng thái giao hàng</li>
                            <li>Quản lý lịch trình</li>
                        </ul>
                    )}
                </div>

                <Button
                    type="primary"
                    danger
                    onClick={handleLogout}
                    className="mt-6"
                >
                    Đăng xuất
                </Button>
            </Card>
        </div>
    );
};

export default Dashboard; 