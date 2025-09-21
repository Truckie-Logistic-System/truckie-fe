import React from 'react';
import { Layout, Typography } from 'antd';

const { Footer } = Layout;
const { Text } = Typography;

const AdminFooter: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <Footer className="bg-gray-100 text-center py-3">
            <Text type="secondary">
                © {currentYear} Hệ thống quản lý vận chuyển. Bản quyền thuộc về công ty.
            </Text>
        </Footer>
    );
};

export default AdminFooter; 