import React from 'react';
import { Layout } from 'antd';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import AdminFooter from './AdminFooter';

const { Content } = Layout;

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    return (
        <Layout style={{ minHeight: '100vh' }}>
            <AdminHeader />
            <Layout>
                <AdminSidebar />
                <Layout style={{ marginLeft: 220, transition: 'all 0.2s' }}>
                    <Content
                        className="p-6 m-4 bg-white rounded-lg shadow-sm"
                        style={{ marginTop: 74 }}
                    >
                        {children}
                    </Content>
                    <AdminFooter />
                </Layout>
            </Layout>
        </Layout>
    );
};

export default AdminLayout; 