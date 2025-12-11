import React from "react";
import { Layout, Menu } from "antd";
import type { MenuProps } from "antd";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context";
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  SettingOutlined,
  TeamOutlined,
  BellOutlined,
  ExclamationCircleOutlined,
  ToolOutlined,
  IdcardOutlined,
  DollarOutlined,
  TruckOutlined,
  HddOutlined,
  TruckFilled,
  UserOutlined,
  FileTextOutlined,
  SwapOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import { icons } from "lucide-react";

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

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
          key: "/admin/penalties",
          icon: <ExclamationCircleOutlined />,
          label: <Link to="/admin/penalties">Vi phạm giao thông</Link>,
        },
        {
          key: "admin-vehicle-management",
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
              label: <Link to="/admin/vehicle-maintenances">Đăng kiểm & Bảo trì</Link>,
            },
            {
              key: "/admin/devices",
              icon: <HddOutlined />,
              label: <Link to="/admin/devices">Thiết bị</Link>,
            },
            {
              key: "/admin/fuel-consumptions",
              icon: <DashboardOutlined />,
              label: <Link to="/admin/fuel-consumptions">Tiêu thụ nhiên liệu</Link>,
            },
            {
              key: "/admin/fuel-types",
              icon: <TagsOutlined />,
              label: <Link to="/admin/fuel-types">Loại nhiên liệu</Link>,
            },
          ],
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
          key: "/staff/customers",
          icon: <UserOutlined />,
          label: <Link to="/staff/customers">Khách hàng</Link>,
        },
        {
          key: "/staff/orders",
          icon: <ShoppingCartOutlined />,
          label: <Link to="/staff/orders">Đơn hàng</Link>,
        },
        {
          key: "staff-issue-management",
          icon: <ExclamationCircleOutlined />,
          label: "Quản lý sự cố",
          children: [
            {
              key: "/staff/issues",
              icon: <ExclamationCircleOutlined />,
              label: <Link to="/staff/issues">Danh sách sự cố</Link>,
            },
            {
              key: "/staff/issue-types",
              icon: <TagsOutlined />,
              label: <Link to="/staff/issue-types">Loại sự cố</Link>,
            },
            {
              key: "/staff/compensation-assessments",
              icon: <DollarOutlined />,
              label: <Link to="/staff/compensation-assessments">Thẩm định bồi thường</Link>,
            },
            // {
            //   key: "/staff/off-route-events",
            //   icon: <SwapOutlined />,
            //   label: <Link to="/staff/off-route-events">Cảnh báo lệch tuyến</Link>,
            // },
          ],
        },
        {
          key: "/staff/vehicle-assignments",
          icon: <SwapOutlined />,
          label: <Link to="/staff/vehicle-assignments">Chuyến xe</Link>,
        },
        {
          key: "staff-pricing-management",
          icon: <DollarOutlined />,
          label: "Bảng giá vận chuyển",
          children: [
            {
              key: "/staff/vehicle-rules",
              icon: <DollarOutlined />,
              label: <Link to="/staff/vehicle-rules">Bảng giá</Link>,
            },
            {
              key: "/staff/categories",
              icon: <TagsOutlined />,
              label: <Link to="/staff/categories">Danh mục hàng</Link>,
            },
          ],
        },
        {
          key: "staff-finance-management",
          icon: <DollarOutlined />,
          label: "Quản lý tài chính",
          children: [
            {
              key: "/staff/contracts",
              icon: <FileTextOutlined />,
              label: <Link to="/staff/contracts">Hợp đồng</Link>,
            },
            {
              key: "/staff/transactions",
              icon: <DollarOutlined />,
              label: <Link to="/staff/transactions">Giao dịch</Link>,
            },
            {
              key: "/staff/refunds",
              icon: <DollarOutlined />,
              label: <Link to="/staff/refunds">Hoàn tiền</Link>,
            },
          ],
        },
        {
          key: "/staff/stipulation-settings",
          icon: <FileTextOutlined />,
          label: <Link to="/staff/stipulation-settings">Điều khoản</Link>,
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
  const openKeys = menuItems.find((item: any) =>
    item?.children?.some((child: any) => child?.key === location.pathname)
  )?.key as string | undefined;

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
        paddingTop: 56,
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
      {/* Truckie brand */}
      <div
        style={{
          padding: collapsed ? "0 10px" : "0 16px",
          textAlign: "left",
          marginTop: -16,
          marginBottom: 0,
        }}
      >
        {!collapsed && (
          <div
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: "#1890ff",
            }}
          >
            truckie
          </div>
        )}
      </div>

      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        defaultOpenKeys={openKeys ? [String(openKeys)] : []}
        style={{
          height: "100%",
          borderRight: 0,
          paddingTop: 0,
          paddingBottom: 16,
        }}
        items={getMenuItems()}
      />
    </Sider>
  );
};

export default AdminSidebar;
