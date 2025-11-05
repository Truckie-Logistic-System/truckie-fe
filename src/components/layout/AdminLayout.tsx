import React, { useState } from "react";
import { Layout } from "antd";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import AdminFooter from "./AdminFooter";
import IssuesWidget from "../issues/IssuesWidget";
import { useAuth } from "@/context";

const { Content } = Layout;

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();

  // Check if user is staff
  const isStaff = user?.role === 'staff';

  // Detect screen size
  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992; // lg breakpoint
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate margin based on collapsed state
  const getMarginLeft = () => {
    if (isMobile) return 0;
    return collapsed ? 80 : 260;
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AdminHeader />
      <Layout>
        <AdminSidebar collapsed={collapsed} onCollapse={setCollapsed} />
        <Layout
          style={{
            marginLeft: getMarginLeft(),
            transition: "margin-left 0.2s ease-in-out",
          }}
        >
          <Content
            className="p-4 md:p-6 m-2 md:m-4 bg-white rounded-lg shadow-sm"
            style={{ marginTop: 74, minHeight: "calc(100vh - 150px)" }}
          >
            {children}
          </Content>
          <AdminFooter />
        </Layout>
      </Layout>
      
      {/* Issues Widget - only for staff users */}
      {isStaff && <IssuesWidget />}
    </Layout>
  );
};

export default AdminLayout;
