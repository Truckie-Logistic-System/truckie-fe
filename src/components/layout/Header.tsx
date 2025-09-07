import React, { useState } from "react";
import { Layout, Menu, Button, Drawer, Space, Dropdown, Avatar } from "antd";
import {
  MenuOutlined,
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
  LogoutOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "../../config";
import { useAuth } from "../../context";

const { Header: AntHeader } = Layout;

const Header: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

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

  const handleLogout = () => {
    logout();
    navigate("/");
    if (visible) onClose();
  };

  const userMenuItems = [
    {
      key: "profile",
      label: "Thông tin tài khoản",
      icon: <UserOutlined />,
      onClick: () => navigate("/profile"),
    },
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    { key: "trangchu", label: <Link to="/">Trang chủ</Link> },
    { key: "orders", label: <Link to="/customer/orders">Đơn hàng</Link> },
    { key: "giaithuong", label: "Giải thưởng" },
    { key: "hoatdong", label: "Hoạt động & Thành tựu" },
    { key: "tuyendung", label: "Tuyển dụng" },
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
      <AntHeader className="bg-white shadow-sm px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="text-blue-600 font-bold text-xl">
            truckie
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center">
          <Menu
            mode="horizontal"
            className="border-0"
            selectedKeys={["trangchu"]}
            items={[
              { key: "trangchu", label: "Trang chủ" },
              { key: "orders", label: "Đơn hàng" },
              { key: "giaithuong", label: "Giải thưởng" },
              { key: "hoatdong", label: "Hoạt động & Thành tựu" },
              { key: "tuyendung", label: "Tuyển dụng" },
            ]}
          />
        </div>

        {/* Auth Buttons - Desktop */}
        <div className="hidden md:flex items-center space-x-4">
          {isAuthenticated ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="flex items-center cursor-pointer">
                <Avatar icon={<UserOutlined />} className="mr-2 bg-blue-600" />
                <span className="mr-2 text-blue-600 font-medium">
                  Hello {user?.username}
                </span>
                <DownOutlined style={{ fontSize: "12px" }} />
              </div>
            </Dropdown>
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
        <div className="md:hidden">
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={showDrawer}
            className="flex items-center justify-center"
          />
        </div>

        {/* Mobile Menu Drawer */}
        <Drawer title="Menu" placement="right" onClose={onClose} open={visible}>
          <Menu
            mode="vertical"
            selectedKeys={["trangchu"]}
            items={menuItems}
            className="border-0"
          />
          <div className="mt-4 flex flex-col space-y-2">
            {isAuthenticated ? (
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
                <Button
                  type="text"
                  icon={<UserOutlined />}
                  onClick={() => {
                    navigate("/profile");
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
