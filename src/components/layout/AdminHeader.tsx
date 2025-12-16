import React from 'react';
import { Layout, Menu, Button, Typography, Dropdown, Avatar } from 'antd';
import { UserOutlined, LogoutOutlined, BellOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context';
import NotificationBell from '../notifications/NotificationBell';
import NotificationQueueBadge from '../notifications/NotificationQueueBadge';
import { mapToNotificationRole } from '../../utils/roleMapper';

const { Header } = Layout;
const { Title, Text } = Typography;

const AdminHeader: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/auth/login');
    };

    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Hồ sơ',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            danger: true,
            onClick: handleLogout,
        },
    ];

    return (
        <Header className="bg-white flex items-center justify-between px-6 shadow-md z-10 fixed w-full">
            <div className="flex items-center">
                <Link to={user?.role === 'admin' ? '/admin/dashboard' : '/staff/dashboard'}>
                    <div className="flex items-center">
                        <span className="text-blue-600 font-bold text-xl">
                            truckie
                        </span>
                        <Text className="ml-2 text-gray-500 hidden md:inline">
                            {user?.role === 'admin' ? '| Quản trị hệ thống' : '| Quản lý vận chuyển'}
                        </Text>
                    </div>
                </Link>
            </div>

            <div className="flex items-center gap-4">
                {user && (() => {
                    // console.log('🔍 DEBUG: AdminHeader rendering - user role:', user.role);
                    return (
                        <>
                            {/* Staff Issue Queue Badge */}
                            {user.role === 'staff' && (() => {
                                // console.log('🔍 DEBUG: Rendering NotificationQueueBadge for staff');
                                return <NotificationQueueBadge />;
                            })()}
                            {/* General Notification Bell */}
                            <NotificationBell 
                                userId={user.id} 
                                userRole={mapToNotificationRole(user.role)} 
                            />
                        </>
                    );
                })()}

                {user && (user.role === 'staff' || user.role === 'admin') ? (
                    <div className="flex items-center gap-3">
                        <Avatar icon={<UserOutlined />} />
                        <span className="hidden sm:inline">{user.fullName || user.username}</span>
                        <Button
                            type="text"
                            icon={<LogoutOutlined />}
                            danger
                            onClick={handleLogout}
                        >
                            Đăng xuất
                        </Button>
                    </div>
                ) : (
                    <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                        <div className="flex items-center cursor-pointer">
                            <Avatar icon={<UserOutlined />} />
                            <span className="ml-2 hidden sm:inline">{user?.fullName || user?.username}</span>
                        </div>
                    </Dropdown>
                )}
            </div>
        </Header>
    );
};

export default AdminHeader;