import React from 'react';
import { Layout, Menu, Button, Typography, Dropdown, Avatar } from 'antd';
import { UserOutlined, LogoutOutlined, BellOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context';

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
                <Button
                    type="text"
                    icon={<BellOutlined />}
                    className="flex items-center justify-center"
                />

                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                    <div className="flex items-center cursor-pointer">
                        <Avatar icon={<UserOutlined />} />
                        <span className="ml-2 hidden sm:inline">{user?.username}</span>
                    </div>
                </Dropdown>
            </div>
        </Header>
    );
};

export default AdminHeader; 