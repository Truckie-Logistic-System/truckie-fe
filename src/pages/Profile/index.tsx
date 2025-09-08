import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Avatar, Descriptions, Spin, Alert, Tabs, Button, Space, Row, Col, Statistic, Divider, Typography } from 'antd';
import { UserOutlined, EditOutlined, EnvironmentOutlined, PhoneOutlined, MailOutlined, IdcardOutlined, BankOutlined, TeamOutlined } from '@ant-design/icons';
import type { CustomerResponse } from '../../services/customer';
import { getCustomerProfile } from '../../services/customer';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context';
import EditProfileModal from './components/EditProfileModal';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

const ProfilePage = () => {
    const { userId } = useParams<{ userId: string }>();
    const { user: authUser } = useAuth();
    const currentUserId = userId || localStorage.getItem('userId') || authUser?.id || '';

    const { data: customerData, isLoading, error } = useQuery({
        queryKey: ['customerProfile', currentUserId],
        queryFn: () => getCustomerProfile(currentUserId),
        enabled: !!currentUserId,
        retry: 2,
        refetchOnWindowFocus: false,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spin size="large" />
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

    const user = customerData?.userResponse;
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
                        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                            <div className="flex flex-col items-center text-center">
                                <Avatar
                                    size={120}
                                    src={user?.imageUrl}
                                    icon={<UserOutlined />}
                                    className="mb-4 border-4 border-blue-100"
                                />
                                <Title level={3} className="mb-1">{user?.fullName}</Title>
                                <Text className="text-blue-600 font-medium mb-4">{user?.role?.roleName}</Text>

                                <div className="w-full flex flex-col gap-3 text-left mt-4">
                                    <div className="flex items-center gap-2">
                                        <MailOutlined className="text-blue-600" />
                                        <Text>{user?.email || 'Chưa cập nhật'}</Text>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <PhoneOutlined className="text-blue-600" />
                                        <Text>{user?.phoneNumber || 'Chưa cập nhật'}</Text>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <IdcardOutlined className="text-blue-600" />
                                        <Text>ID: {user?.id.substring(0, 8)}...</Text>
                                    </div>
                                </div>

                                {isOwnProfile && (
                                    <Button
                                        type="primary"
                                        className="mt-6 bg-blue-600 w-full"
                                        icon={<EditOutlined />}
                                    >
                                        Chỉnh sửa thông tin cá nhân
                                    </Button>
                                )}
                            </div>
                        </Card>
                    </Col>

                    {/* Main Content */}
                    <Col xs={24} md={16}>
                        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                            <Tabs defaultActiveKey="company" className="profile-tabs">
                                <TabPane
                                    tab={<span className="flex items-center gap-2"><TeamOutlined />Thông tin công ty</span>}
                                    key="company"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <Title level={4} className="text-blue-700 m-0">Thông tin doanh nghiệp</Title>
                                        {isOwnProfile && customerData && (
                                            <EditProfileModal customerData={customerData} />
                                        )}
                                    </div>

                                    <Row gutter={[24, 24]} className="mb-6">
                                        <Col xs={24} lg={12}>
                                            <Card className="bg-blue-50 border-blue-200">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <BankOutlined className="text-2xl text-blue-600" />
                                                    <Text className="text-lg font-medium">Công ty</Text>
                                                </div>
                                                <Title level={4} className="m-0">{customerData?.companyName || 'Chưa cập nhật'}</Title>
                                            </Card>
                                        </Col>
                                        <Col xs={24} lg={12}>
                                            <Card className="bg-blue-50 border-blue-200">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <IdcardOutlined className="text-2xl text-blue-600" />
                                                    <Text className="text-lg font-medium">Mã số doanh nghiệp</Text>
                                                </div>
                                                <Title level={4} className="m-0">{customerData?.businessLicenseNumber || 'Chưa cập nhật'}</Title>
                                            </Card>
                                        </Col>
                                    </Row>

                                    <Divider orientation="left">Chi tiết</Divider>

                                    <Row gutter={[16, 24]}>
                                        <Col xs={24} md={12}>
                                            <div className="mb-4">
                                                <Text className="text-gray-500 block mb-1">Người đại diện</Text>
                                                <Text className="text-lg font-medium">{customerData?.representativeName || 'Chưa cập nhật'}</Text>
                                            </div>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <div className="mb-4">
                                                <Text className="text-gray-500 block mb-1">SĐT người đại diện</Text>
                                                <Text className="text-lg font-medium">{customerData?.representativePhone || 'Chưa cập nhật'}</Text>
                                            </div>
                                        </Col>
                                        <Col xs={24}>
                                            <div className="mb-4">
                                                <Text className="text-gray-500 block mb-1">Địa chỉ kinh doanh</Text>
                                                <div className="flex items-start gap-2">
                                                    <EnvironmentOutlined className="text-blue-600 mt-1" />
                                                    <Text className="text-lg font-medium">{customerData?.businessAddress || 'Chưa cập nhật'}</Text>
                                                </div>
                                            </div>
                                        </Col>
                                        <Col xs={24}>
                                            <div className="mb-4">
                                                <Text className="text-gray-500 block mb-1">Trạng thái</Text>
                                                <div className="mt-1">
                                                    <Text className={`px-3 py-1 rounded-full text-sm ${customerData?.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                                        customerData?.status === 'OTP_PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {customerData?.status || 'Chưa cập nhật'}
                                                    </Text>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </TabPane>

                                <TabPane
                                    tab={<span className="flex items-center gap-2"><UserOutlined />Thông tin cá nhân</span>}
                                    key="personal"
                                >
                                    <Row gutter={[16, 24]}>
                                        <Col xs={24} md={12}>
                                            <div className="mb-4">
                                                <Text className="text-gray-500 block mb-1">Họ và tên</Text>
                                                <Text className="text-lg font-medium">{user?.fullName || 'Chưa cập nhật'}</Text>
                                            </div>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <div className="mb-4">
                                                <Text className="text-gray-500 block mb-1">Email</Text>
                                                <Text className="text-lg font-medium">{user?.email || 'Chưa cập nhật'}</Text>
                                            </div>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <div className="mb-4">
                                                <Text className="text-gray-500 block mb-1">Số điện thoại</Text>
                                                <Text className="text-lg font-medium">{user?.phoneNumber || 'Chưa cập nhật'}</Text>
                                            </div>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <div className="mb-4">
                                                <Text className="text-gray-500 block mb-1">Giới tính</Text>
                                                <Text className="text-lg font-medium">{user?.gender ? 'Nam' : 'Nữ'}</Text>
                                            </div>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <div className="mb-4">
                                                <Text className="text-gray-500 block mb-1">Ngày sinh</Text>
                                                <Text className="text-lg font-medium">{user?.dateOfBirth || 'Chưa cập nhật'}</Text>
                                            </div>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <div className="mb-4">
                                                <Text className="text-gray-500 block mb-1">Trạng thái</Text>
                                                <div className="mt-1">
                                                    <Text className={`px-3 py-1 rounded-full text-sm ${user?.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                                        'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {user?.status || 'Chưa cập nhật'}
                                                    </Text>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
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