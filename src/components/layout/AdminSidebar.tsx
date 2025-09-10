import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context';
import {
    DashboardOutlined,
    ShoppingCartOutlined,
    CarOutlined,
    SettingOutlined,
    TeamOutlined,
    FileTextOutlined,
    BarChartOutlined,
    BellOutlined,
    ExclamationCircleOutlined,
    CustomerServiceOutlined,
    ToolOutlined,
    ShopOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

const AdminSidebar: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const { user } = useAuth();
    const location = useLocation();

    // Define menu items based on user role
    const getMenuItems = () => {
        const baseItems = [
            {
                key: `/${user?.role}/dashboard`,
                icon: <DashboardOutlined />,
                label: <Link to={`/${user?.role}/dashboard`}>Tổng quan</Link>,
            },
            {
                key: `/${user?.role}/orders`,
                icon: <ShoppingCartOutlined />,
                label: <Link to={`/${user?.role}/orders`}>Đơn hàng</Link>,
            },
        ];

        // Admin specific menu items
        if (user?.role === 'admin') {
            return [
                ...baseItems,
                {
                    key: '/admin/customers',
                    icon: <ShopOutlined />,
                    label: <Link to="/admin/customers">Khách hàng</Link>,
                },
                {
                    key: '/admin/drivers',
                    icon: <CarOutlined />,
                    label: <Link to="/admin/drivers">Tài xế</Link>,
                },
                {
                    key: '/admin/staff',
                    icon: <TeamOutlined />,
                    label: <Link to="/admin/staff">Nhân viên</Link>,
                },
                {
                    key: '/admin/reports',
                    icon: <BarChartOutlined />,
                    label: <Link to="/admin/reports">Thống kê</Link>,
                },
                {
                    key: '/admin/settings',
                    icon: <SettingOutlined />,
                    label: <Link to="/admin/settings">Cài đặt</Link>,
                },
            ];
        }

        // Staff specific menu items
        if (user?.role === 'staff') {
            return [
                ...baseItems,
                {
                    key: '/staff/issues',
                    icon: <ExclamationCircleOutlined />,
                    label: <Link to="/staff/issues">Vấn đề</Link>,
                },
                {
                    key: '/staff/penalties',
                    icon: <ToolOutlined />,
                    label: <Link to="/staff/penalties">Phạt vi phạm</Link>,
                },
                {
                    key: '/staff/customer-support',
                    icon: <CustomerServiceOutlined />,
                    label: <Link to="/staff/customer-support">Hỗ trợ khách hàng</Link>,
                },
                {
                    key: '/staff/notifications',
                    icon: <BellOutlined />,
                    label: <Link to="/staff/notifications">Thông báo</Link>,
                },
            ];
        }

        // Default menu items for other roles
        return baseItems;
    };

    return (
        <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            className="bg-white shadow-md"
            style={{ height: '100vh', position: 'fixed', left: 0, top: 0, paddingTop: 64 }}
            theme="light"
            width={220}
        >
            <Menu
                mode="inline"
                selectedKeys={[location.pathname]}
                style={{ height: '100%', borderRight: 0, paddingTop: 16 }}
                items={getMenuItems()}
            />
        </Sider>
    );
};

export default AdminSidebar; 