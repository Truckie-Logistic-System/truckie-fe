import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, Drawer, Space, Dropdown, Avatar, Skeleton } from "antd";
import {
  MenuOutlined,
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
  LogoutOutlined,
  DownOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "../../config";
import { useAuth } from "../../context";
import NotificationBell from "../notifications/NotificationBell";
import NotificationQueueBadge from "../notifications/NotificationQueueBadge";
import { mapToNotificationRole } from "../../utils/roleMapper";

const { Header: AntHeader } = Layout;

const Header: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [selectedKey, setSelectedKey] = useState("trangchu");

  // Cập nhật selectedKey dựa trên đường dẫn hiện tại
  useEffect(() => {
    const pathname = location.pathname;
    if (pathname === "/") {
      setSelectedKey("trangchu");
    } else if (pathname.startsWith("/orders")) {
      setSelectedKey("orders");
    } else if (pathname.startsWith("/tracking")) {
      setSelectedKey("tracking");
    } else if (pathname.includes("/profile")) {
      // Không chọn tab nào khi ở trang profile
      setSelectedKey("");
    }
  }, [location]);

  const showDrawer = () => {
    setVisible(true);
  };

  const onClose = () => {
    setVisible(false);
  };

  const handleLogin = () => {
    navigate("/auth/login");
    if (visible) onClose();
  };

  const handleRegister = () => {
    navigate("/auth/register");
    if (visible) onClose();
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
    if (visible) onClose();
  };

  const userMenuItems = [
    {
      key: "profile",
      label: "Thông tin tài khoản",
      icon: <UserOutlined />,
      onClick: () => navigate(user?.role === "customer" ? "/profile" :
        user?.role === "staff" ? "/staff/profile" :
          user?.role === "admin" ? "/admin/profile" : "/"),
    },
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  // Menu items - hiển thị khác nhau cho authenticated và guest
  const menuItems = isAuthenticated
    ? [
        { key: "trangchu", label: <Link to="/">Trang chủ</Link> },
        { key: "orders", label: <Link to="/orders">Đơn hàng</Link> },
        { 
          key: "tracking", 
          label: (
            <Link to="/tracking">
              <SearchOutlined className="mr-1" />
              Tra cứu đơn hàng
            </Link>
          ) 
        },
      ]
    : [
        { key: "trangchu", label: <Link to="/">Trang chủ</Link> },
        { 
          key: "tracking", 
          label: (
            <Link to="/tracking">
              <SearchOutlined className="mr-1" />
              Tra cứu đơn hàng
            </Link>
          ) 
        },
      ];

  return (
    <div className="fixed w-full z-10">
      {/* Contact Info Bar */}
      <div className="w-full bg-blue-600 text-white py-2 px-4">
        <div className="container mx-auto flex flex-wrap justify-between items-center">
          <div className="flex-1"></div>{" "}
          {/* Empty div to push content to right */}
          <div className="flex items-center justify-end space-x-6">
            <span className="flex items-center">
              <EnvironmentOutlined className="mr-2" />
              <span className="text-sm">
                7 D1 St, Long Thanh My, Thu Duc, Ho Chi Minh
              </span>
            </span>
            <span className="flex items-center">
              <MailOutlined className="mr-2" />
              <span className="text-sm">{SUPPORT_EMAIL}</span>
            </span>
            <span className="flex items-center">
              <PhoneOutlined className="mr-2" />
              <span className="text-sm">{SUPPORT_PHONE}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <AntHeader className="bg-white shadow-sm px-4 md:px-6 h-16">
        <div className="container mx-auto h-full flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-blue-600 font-bold text-xl">
              truckie
            </Link>
          </div>

          {/* Desktop Menu - Centered */}
          <div className="hidden lg:flex flex-1 justify-center">
            <Menu
              mode="horizontal"
              className="border-0"
              selectedKeys={[selectedKey]}
              items={menuItems}
              style={{
                minWidth: '300px',
                display: 'flex',
                justifyContent: 'center',
                gap: '40px'
              }}
            />
          </div>

          {/* Auth Buttons - Desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            {isLoading ? (
              <div className="flex items-center h-8">
                <Skeleton.Avatar active size="small" className="mr-2" />
                <Skeleton.Input active size="small" style={{ width: 120 }} />
              </div>
            ) : isAuthenticated ? (
              <>
                {user && (() => {
                  console.log('🔍 DEBUG: Header rendering - user role:', user.role);
                  return (
                    <div className="flex items-center h-10 space-x-3">
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
                    </div>
                  );
                })()}
                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                  <div className="flex items-center cursor-pointer h-10">
                    <Avatar icon={<UserOutlined />} className="mr-2 bg-blue-600" size="default" />
                    <span className="mr-2 text-blue-600 font-medium">
                      Hello {user?.username}
                    </span>
                    <DownOutlined style={{ fontSize: "12px" }} />
                  </div>
                </Dropdown>
              </>
            ) : (
              <>
                <Button type="text" onClick={handleLogin}>
                  Đăng nhập
                </Button>
                <Button
                  type="primary"
                  className="bg-blue-600"
                  onClick={handleRegister}
                >
                  Đăng ký
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={showDrawer}
              className="flex items-center justify-center"
            />
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        <Drawer title="Menu" placement="right" onClose={onClose} open={visible}>
          <Menu
            mode="vertical"
            selectedKeys={[selectedKey]}
            items={menuItems}
            className="border-0"
          />
          <div className="mt-4 flex flex-col space-y-2">
            {isLoading ? (
              <div className="py-4">
                <Skeleton.Avatar active size="small" className="mb-2" />
                <Skeleton.Input active size="small" style={{ width: 180 }} />
              </div>
            ) : isAuthenticated ? (
              <>
                <div className="flex items-center py-2">
                  <Avatar
                    icon={<UserOutlined />}
                    className="mr-2 bg-blue-600"
                  />
                  <span className="text-blue-600 font-medium">
                    Hello {user?.username}
                  </span>
                </div>
                {/* Staff Issue Queue Badge - Mobile */}
                {user?.role === 'staff' && (
                  <div className="py-2">
                    <NotificationQueueBadge />
                  </div>
                )}
                <Button
                  type="text"
                  icon={<UserOutlined />}
                  onClick={() => {
                    navigate(user?.role === "staff" ? "/staff/profile" : "/profile");
                    onClose();
                  }}
                >
                  Thông tin tài khoản
                </Button>
                <Button
                  type="primary"
                  danger
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                >
                  Đăng xuất
                </Button>
              </>
            ) : (
              <>
                <Button type="text" onClick={handleLogin}>
                  Đăng nhập
                </Button>
                <Button
                  type="primary"
                  className="bg-blue-600"
                  onClick={handleRegister}
                >
                  Đăng ký
                </Button>
              </>
            )}
          </div>
        </Drawer>
      </AntHeader>
    </div>
  );
};

export default Header;
