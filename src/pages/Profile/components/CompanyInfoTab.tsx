import React from 'react';
import { Card, Row, Col, Typography, Divider } from 'antd';
import { BankOutlined, IdcardOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { Customer } from '@/models/Customer';
import EditProfileModal from './EditProfileModal';

const { Title, Text } = Typography;

interface CompanyInfoTabProps {
    customerData: Customer | undefined;
    isOwnProfile: boolean;
    onRefresh?: () => void;
}

const CompanyInfoTab: React.FC<CompanyInfoTabProps> = ({ customerData, isOwnProfile, onRefresh }) => {
    if (!customerData) return null;

    return (
        <>
            <div className="flex justify-between items-start mb-6">
                <Title level={4} className="text-blue-700 m-0">Thông tin doanh nghiệp</Title>
                {isOwnProfile && customerData && (
                    <EditProfileModal customerData={customerData} onRefresh={onRefresh} />
                )}
            </div>

            <Row gutter={[24, 24]} className="mb-6">
                <Col xs={24} lg={12}>
                    <Card className="bg-blue-50 border-blue-200">
                        <div className="flex items-center gap-3 mb-2">
                            <BankOutlined className="text-2xl text-blue-600" />
                            <Text className="text-lg font-medium">Công ty</Text>
                        </div>
                        <Title level={4} className="m-0">{customerData.companyName || 'Chưa cập nhật'}</Title>
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card className="bg-blue-50 border-blue-200">
                        <div className="flex items-center gap-3 mb-2">
                            <IdcardOutlined className="text-2xl text-blue-600" />
                            <Text className="text-lg font-medium">Mã số doanh nghiệp</Text>
                        </div>
                        <Title level={4} className="m-0">{customerData.businessLicenseNumber || 'Chưa cập nhật'}</Title>
                    </Card>
                </Col>
            </Row>

            <Divider orientation="left">Chi tiết</Divider>

            <Row gutter={[16, 24]}>
                <Col xs={24} md={12}>
                    <div className="mb-4">
                        <Text className="text-gray-500 block mb-1">Người đại diện</Text>
                        <Text className="text-lg font-medium">{customerData.representativeName || 'Chưa cập nhật'}</Text>
                    </div>
                </Col>
                <Col xs={24} md={12}>
                    <div className="mb-4">
                        <Text className="text-gray-500 block mb-1">SĐT người đại diện</Text>
                        <Text className="text-lg font-medium">{customerData.representativePhone || 'Chưa cập nhật'}</Text>
                    </div>
                </Col>
                <Col xs={24}>
                    <div className="mb-4">
                        <Text className="text-gray-500 block mb-1">Địa chỉ kinh doanh</Text>
                        <div className="flex items-start gap-2">
                            <EnvironmentOutlined className="text-blue-600 mt-1" />
                            <Text className="text-lg font-medium">{customerData.businessAddress || 'Chưa cập nhật'}</Text>
                        </div>
                    </div>
                </Col>
                <Col xs={24}>
                    <div className="mb-4">
                        <Text className="text-gray-500 block mb-1">Trạng thái</Text>
                        <div className="mt-1">
                            <Text className={`px-3 py-1 rounded-full text-sm ${customerData.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                customerData.status === 'OTP_PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                {customerData.status || 'Chưa cập nhật'}
                            </Text>
                        </div>
                    </div>
                </Col>
            </Row>
        </>
    );
};

export default CompanyInfoTab; 