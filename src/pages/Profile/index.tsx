import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Tabs, Skeleton, Alert, Row, Col, Typography } from 'antd';
import { UserOutlined, TeamOutlined, LockOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useAuth } from '../../context';
import { useQuery } from '@tanstack/react-query';
import ProfileSummaryCard from './components/ProfileSummaryCard';
import PersonalInfoTab from './components/PersonalInfoTab';
import CompanyInfoTab from './components/CompanyInfoTab';
import PasswordChangeTab from './components/PasswordChangeTab';
import AddressTab from './components/AddressTab';
import customerService from '../../services/customer/customerService';
import type { Customer } from '../../models/Customer';
import type { UserModel } from '../../models/User';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

const ProfilePage = () => {
    const { userId } = useParams<{ userId: string }>();
    const { user: authUser } = useAuth();
    const isOwnProfile = !userId || userId === authUser?.id;
    const currentUserId = userId || sessionStorage.getItem('userId') || authUser?.id || '';

    // Use React Query for data fetching - use getMyProfile for current user, getCustomerProfile for others
    const {
        data: customerData,
        isLoading,
        isError,
        error,
        refetch
    } = useQuery({
        queryKey: ['customerProfile', isOwnProfile ? 'me' : currentUserId],
        queryFn: async () => {
            const result = isOwnProfile
                ? await customerService.getMyProfile()
                : await customerService.getCustomerProfile(currentUserId);
            return result;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Function to refresh data after updates
    const refreshData = useCallback(() => {
        refetch();
    }, [refetch]);

    if (isLoading) {
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

    if (isError) {
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
    // Trích xuất dữ liệu người dùng từ userResponse
    const userData: UserModel | undefined = userResponse;

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
                                        onRefresh={refreshData}
                                    />
                                </TabPane>

                                <TabPane
                                    tab={<span className="flex items-center gap-2"><UserOutlined />Thông tin cá nhân</span>}
                                    key="personal"
                                >
                                    <PersonalInfoTab
                                        user={userData}
                                        isOwnProfile={isOwnProfile}
                                        onRefresh={refreshData}
                                    />
                                </TabPane>

                                <TabPane
                                    tab={<span className="flex items-center gap-2"><EnvironmentOutlined />Địa chỉ của tôi</span>}
                                    key="addresses"
                                >
                                    <AddressTab customerId={customerData?.id || ''} />
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