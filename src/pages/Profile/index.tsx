import { useParams } from 'react-router-dom';
import { Card, Spin, Alert, Tabs, Row, Col, Typography } from 'antd';
import { UserOutlined, TeamOutlined, LockOutlined } from '@ant-design/icons';
import customerService from '../../services/customer/customerService';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context';
import ProfileSummaryCard from './components/ProfileSummaryCard';
import CompanyInfoTab from './components/CompanyInfoTab';
import PersonalInfoTab from './components/PersonalInfoTab';
import PasswordChangeTab from './components/PasswordChangeTab';
import type { Customer } from '@/models/Customer';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

const ProfilePage = () => {
    const { userId } = useParams<{ userId: string }>();
    const { user: authUser } = useAuth();
    const currentUserId = userId || localStorage.getItem('userId') || authUser?.id || '';

    const { data: customerData, isLoading, error } = useQuery({
        queryKey: ['customerProfile', currentUserId],
        queryFn: () => customerService.getCustomerProfile(currentUserId),
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