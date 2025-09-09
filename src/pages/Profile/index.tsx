import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Tabs, Skeleton, Alert, Row, Col, Typography } from 'antd';
import { UserOutlined, TeamOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../context';
import ProfileSummaryCard from './components/ProfileSummaryCard';
import PersonalInfoTab from './components/PersonalInfoTab';
import CompanyInfoTab from './components/CompanyInfoTab';
import PasswordChangeTab from './components/PasswordChangeTab';
import customerService from '../../services/customer/customerService';
import type { Customer } from '../../models/Customer';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

const ProfilePage = () => {
    const { userId } = useParams<{ userId: string }>();
    const { user: authUser } = useAuth();
    const currentUserId = userId || localStorage.getItem('userId') || authUser?.id || '';

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);
    const [customerData, setCustomerData] = useState<Customer | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await customerService.getCustomerProfile(currentUserId);
                setCustomerData(data);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUserId]);

    if (loading) {
        return (
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Profile summary skeleton */}
                    <div className="md:col-span-1">
                        <Card>
                            <div className="flex flex-col items-center">
                                <Skeleton.Avatar active size={80} className="mb-4" />
                                <Skeleton.Input active size="large" style={{ width: 150 }} className="mb-2" />
                                <Skeleton.Input active size="small" style={{ width: 100 }} className="mb-4" />
                                <Skeleton.Button active size="default" shape="round" />
                            </div>
                        </Card>
                    </div>

                    {/* Profile details skeleton */}
                    <div className="md:col-span-3">
                        <Card>
                            <Skeleton.Input active size="large" style={{ width: 150 }} className="mb-4" />
                            <Skeleton active paragraph={{ rows: 8 }} />
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <Alert
                    message="Lỗi"
                    description="Không thể tải thông tin người dùng. Vui lòng thử lại sau."
                    type="error"
                    showIcon
                />
            </div>
        );
    }

    const userResponse = customerData?.userResponse;
    const isOwnProfile = !userId || userId === authUser?.id;

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Title level={2} className="text-blue-600 mb-2">Thông tin tài khoản</Title>
                    <Text className="text-gray-500">Quản lý thông tin cá nhân và công ty của bạn</Text>
                </div>

                <Row gutter={[24, 24]}>
                    {/* Profile Summary Card */}
                    <Col xs={24} md={8}>
                        <ProfileSummaryCard user={userResponse} />
                    </Col>

                    {/* Main Content */}
                    <Col xs={24} md={16}>
                        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                            <Tabs defaultActiveKey="company" className="profile-tabs">
                                <TabPane
                                    tab={<span className="flex items-center gap-2"><TeamOutlined />Thông tin công ty</span>}
                                    key="company"
                                >
                                    <CompanyInfoTab
                                        customerData={customerData}
                                        isOwnProfile={isOwnProfile}
                                    />
                                </TabPane>

                                <TabPane
                                    tab={<span className="flex items-center gap-2"><UserOutlined />Thông tin cá nhân</span>}
                                    key="personal"
                                >
                                    <PersonalInfoTab user={userResponse} />
                                </TabPane>

                                <TabPane
                                    tab={<span className="flex items-center gap-2"><LockOutlined />Đổi mật khẩu</span>}
                                    key="security"
                                >
                                    <PasswordChangeTab
                                        user={userResponse}
                                        isOwnProfile={isOwnProfile}
                                    />
                                </TabPane>
                            </Tabs>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default ProfilePage; 