import React from "react";
import { Layout, Menu } from "antd";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context";
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  CarOutlined,
  SettingOutlined,
  TeamOutlined,
  VideoCameraOutlined,
  BarChartOutlined,
  BellOutlined,
  ExclamationCircleOutlined,
  CustomerServiceOutlined,
  ToolOutlined,
  ShopOutlined,
  MobileOutlined,
  TagsOutlined,
  CarFilled,
  IdcardOutlined,
  SwapOutlined,
  DollarOutlined,
  TruckOutlined,
  HddOutlined,
  TruckFilled,
  UserOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { icons } from "lucide-react";

const { Sider } = Layout;

interface MenuItem {
  key: string;
  icon?: React.ReactNode;
  label: React.ReactNode;
  children?: MenuItem[];
}

interface AdminSidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  collapsed = false,
  onCollapse,
}) => {
  const { user } = useAuth();
  const location = useLocation();

  const getMenuItems = (): MenuItem[] => {
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
    if (user?.role === "admin") {
      return [
        ...baseItems,
        {
          key: "/admin/customers",
          icon: <UserOutlined />,
          label: <Link to="/admin/customers">Quản lý khách hàng</Link>,
        },
        {
          key: "hr-management",
          icon: <TeamOutlined />,
          label: "Quản lý nhân sự",
          children: [
            {
              key: "/admin/staff",
              icon: <TeamOutlined />,
              label: <Link to="/admin/staff">Nhân viên</Link>,
            },
            {
              key: "/admin/drivers",
              icon: <IdcardOutlined />,
              label: <Link to="/admin/drivers">Tài xế</Link>,
            },
          ],
        },
        {
          key: "vehicle-management",
          icon: <TruckOutlined />,
          label: "Quản lý phương tiện",
          children: [
            {
              key: "/admin/vehicles",
              icon: <TruckFilled />,
              label: <Link to="/admin/vehicles">Phương tiện</Link>,
            },
            {
              key: "/admin/vehicle-maintenances",
              icon: <ToolOutlined />,
              label: (
                <Link to="/admin/vehicle-maintenances">
                  Bảo trì phương tiện
                </Link>
              ),
            },
            {
              key: "/admin/devices",
              icon: <HddOutlined />,
              label: <Link to="/admin/devices">Thiết bị</Link>,
            },
          ],
        },

        {
          key: "/admin/vehicle-assignments",
          icon: <SwapOutlined />,
          label: <Link to="/admin/vehicle-assignments">Phân công xe</Link>,
        },

        {
          key: "/admin/vehicle-rules",
          icon: <DollarOutlined />,
          label: <Link to="/admin/vehicle-rules">Bảng giá vận chuyển</Link>,
        },
        {
          key: "/admin/categories",
          icon: <TagsOutlined />,
          label: <Link to="/admin/categories">Danh mục</Link>,
        },
        {
          key: "/admin/stipulation-settings",
          icon: <FileTextOutlined />,
          label: <Link to="/admin/stipulation-settings">Điều khoản</Link>,
        },
        {
          key: "/admin/settings",
          icon: <SettingOutlined />,
          label: <Link to="/admin/settings">Cài đặt</Link>,
        },
      ];
    }

    // Staff specific menu items
    if (user?.role === "staff") {
      return [
        ...baseItems,
        {
          key: "/staff/issues",
          icon: <ExclamationCircleOutlined />,
          label: <Link to="/staff/issues">Vấn đề</Link>,
        },
        {
          key: "/staff/vehicle-assignments",
          icon: <SwapOutlined />,
          label: <Link to="/staff/vehicle-assignments">Phân công xe</Link>,
        },
        {
          key: "/staff/contract-stipulation",
          icon: <FileTextOutlined />,
          label: (
            <Link to="/staff/contract-stipulation">Điều khoản hợp đồng</Link>
          ),
        },
        {
          key: "/staff/penalties",
          icon: <ToolOutlined />,
          label: <Link to="/staff/penalties">Phạt vi phạm</Link>,
        },
        {
          key: "/staff/customer-support",
          icon: <CustomerServiceOutlined />,
          label: <Link to="/staff/customer-support">Hỗ trợ khách hàng</Link>,
        },
        {
          key: "/staff/notifications",
          icon: <BellOutlined />,
          label: <Link to="/staff/notifications">Thông báo</Link>,
        },
      ];
    }

    // Default menu items for other roles
    return baseItems;
  };

  const menuItems = getMenuItems();
  const openKeys = menuItems.find((item) =>
    item.children?.some((child) => child.key === location.pathname)
  )?.key;

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      className="bg-white shadow-md"
      style={{
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        paddingTop: 64,
        zIndex: 100,
        overflow: "auto",
      }}
      theme="light"
      width={260}
      breakpoint="lg"
      collapsedWidth={80}
      onBreakpoint={(broken) => {
        if (onCollapse) {
          onCollapse(broken);
        }
      }}
    >
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        defaultOpenKeys={openKeys ? [openKeys] : []}
        style={{
          height: "100%",
          borderRight: 0,
          paddingTop: 16,
          paddingBottom: 16,
        }}
        items={getMenuItems()}
      />
    </Sider>
  );
};

export default AdminSidebar;
