import React from 'react';
import { Card, Descriptions, Button, Tag, Row, Col, Typography, Avatar, Divider, Timeline, Tooltip } from 'antd';
import {
    IdcardOutlined,
    CalendarOutlined,
    EnvironmentOutlined,
    CheckCircleOutlined,
    StopOutlined,
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    ManOutlined,
    WomanOutlined
} from '@ant-design/icons';
import type { DriverModel } from '../../../../services/driver';
import { LicenseClassEnum, CommonStatusEnum } from '@/constants/enums';
import { LicenseClassTag, CommonStatusTag } from '@/components/common/tags';

const { Title, Text } = Typography;

interface DriverInfoProps {
    driver: DriverModel;
    formatDate: (dateString: string) => string;
    getStatusColor: (status: string) => string;
    onStatusChange: (status: string) => void;
    isStatusUpdating?: boolean;
}

const DriverInfo: React.FC<DriverInfoProps> = ({
    driver,
    formatDate,
    getStatusColor,
    onStatusChange,
    isStatusUpdating = false
}) => {
    const getStatusText = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
                return 'Hoạt động';
            case 'banned':
                return 'Bị cấm';
            default:
                return status;
        }
    };

    return (
        <Row gutter={[24, 24]}>
            <Col xs={24} lg={8}>
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col items-center text-center mb-6">
                        <Avatar
                            src={driver.userResponse.imageUrl}
                            size={120}
                            icon={<UserOutlined />}
                            className="mb-4 border-4 border-blue-100"
                        />
                        <Title level={3} className="mb-1">{driver.userResponse.fullName}</Title>
                        <Tag
                            color={getStatusColor(driver.status)}
                            className="px-3 py-1"
                            icon={driver.status.toLowerCase() === 'active' ? <CheckCircleOutlined /> : <StopOutlined />}
                        >
                            {getStatusText(driver.status)}
                        </Tag>
                    </div>

                    <Divider className="my-4" />

                    <div className="space-y-4">
                        <div className="flex items-center">
                            <MailOutlined className="text-blue-500 mr-3" />
                            <div>
                                <Text type="secondary" className="block text-sm">Email</Text>
                                <Text>{driver.userResponse.email}</Text>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <PhoneOutlined className="text-blue-500 mr-3" />
                            <div>
                                <Text type="secondary" className="block text-sm">Số điện thoại</Text>
                                <Text>{driver.userResponse.phoneNumber}</Text>
                            </div>
                        </div>

                        <div className="flex items-center">
                            {driver.userResponse.gender ? (
                                <ManOutlined className="text-blue-500 mr-3" />
                            ) : (
                                <WomanOutlined className="text-pink-500 mr-3" />
                            )}
                            <div>
                                <Text type="secondary" className="block text-sm">Giới tính</Text>
                                <Text>{driver.userResponse.gender ? 'Nam' : 'Nữ'}</Text>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <CalendarOutlined className="text-blue-500 mr-3" />
                            <div>
                                <Text type="secondary" className="block text-sm">Ngày sinh</Text>
                                <Text>{formatDate(driver.userResponse.dateOfBirth)}</Text>
                            </div>
                        </div>
                    </div>

                    <Divider className="my-4" />

                    <div className="flex justify-center">
                        {driver.status.toLowerCase() === 'active' ? (
                            <Button
                                danger
                                icon={<StopOutlined />}
                                onClick={() => onStatusChange('BANNED')}
                                size="large"
                                className="w-full"
                                loading={isStatusUpdating}
                                disabled={isStatusUpdating}
                            >
                                {isStatusUpdating ? 'Đang cập nhật...' : 'Cấm hoạt động'}
                            </Button>
                        ) : (
                            <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                onClick={() => onStatusChange('ACTIVE')}
                                size="large"
                                className="w-full bg-green-500 hover:bg-green-600"
                                loading={isStatusUpdating}
                                disabled={isStatusUpdating}
                            >
                                {isStatusUpdating ? 'Đang cập nhật...' : 'Kích hoạt'}
                            </Button>
                        )}
                    </div>
                </Card>
            </Col>

            <Col xs={24} lg={16}>
                <Card
                    title={
                        <div className="flex items-center">
                            <IdcardOutlined className="text-blue-500 mr-2" />
                            <span>Thông tin giấy tờ</span>
                        </div>
                    }
                    className="shadow-sm hover:shadow-md transition-shadow mb-6"
                >
                    <Row gutter={[24, 16]}>
                        <Col xs={24} md={12}>
                            <Card className="bg-gray-50 border-0" size="small">
                                <div className="flex items-center mb-2">
                                    <IdcardOutlined className="text-blue-500 mr-2" />
                                    <Text strong>CMND/CCCD</Text>
                                </div>
                                <Text className="text-lg">{driver.identityNumber}</Text>
                            </Card>
                        </Col>
                        <Col xs={24} md={12}>
                            <Card className="bg-gray-50 border-0" size="small">
                                <div className="flex items-center mb-2">
                                    <IdcardOutlined className="text-blue-500 mr-2" />
                                    <Text strong>Giấy phép lái xe</Text>
                                </div>
                                <Text className="text-lg">{driver.driverLicenseNumber}</Text>
                            </Card>
                        </Col>
                        <Col xs={24} md={12}>
                            <Card className="bg-gray-50 border-0" size="small">
                                <div className="flex items-center mb-2">
                                    <IdcardOutlined className="text-blue-500 mr-2" />
                                    <Text strong>Số seri thẻ</Text>
                                </div>
                                <Text className="text-lg">{driver.cardSerialNumber}</Text>
                            </Card>
                        </Col>
                        <Col xs={24} md={12}>
                            <Card className="bg-gray-50 border-0" size="small">
                                <div className="flex items-center mb-2">
                                    <EnvironmentOutlined className="text-blue-500 mr-2" />
                                    <Text strong>Nơi cấp</Text>
                                </div>
                                <Text className="text-lg">{driver.placeOfIssue}</Text>
                            </Card>
                        </Col>
                    </Row>
                </Card>

                <Card
                    title={
                        <div className="flex items-center">
                            <CalendarOutlined className="text-blue-500 mr-2" />
                            <span>Thông tin thời gian</span>
                        </div>
                    }
                    className="shadow-sm hover:shadow-md transition-shadow"
                >
                    <Timeline
                        mode="left"
                        items={[
                            {
                                color: 'blue',
                                label: <Text strong>{formatDate(driver.dateOfPassing)}</Text>,
                                children: (
                                    <div>
                                        <Text strong>Ngày sát hạch</Text>
                                        <div className="text-gray-500">Ngày thi và đạt giấy phép lái xe</div>
                                    </div>
                                ),
                                dot: <CalendarOutlined className="text-blue-500" />
                            },
                            {
                                color: 'green',
                                label: <Text strong>{formatDate(driver.dateOfIssue)}</Text>,
                                children: (
                                    <div>
                                        <Text strong>Ngày cấp</Text>
                                        <div className="text-gray-500">Ngày cấp giấy phép lái xe</div>
                                    </div>
                                ),
                                dot: <CalendarOutlined className="text-green-500" />
                            },
                            {
                                color: 'red',
                                label: <Text strong>{formatDate(driver.dateOfExpiry)}</Text>,
                                children: (
                                    <div>
                                        <Text strong>Ngày hết hạn</Text>
                                        <div className="text-gray-500">Ngày hết hạn giấy phép lái xe</div>
                                        {new Date(driver.dateOfExpiry) < new Date() && (
                                            <CommonStatusTag status={CommonStatusEnum.INACTIVE} className="mt-1" />
                                        )}
                                    </div>
                                ),
                                dot: <CalendarOutlined className="text-red-500" />
                            },
                        ]}
                    />

                    <div className="mt-4 p-3 bg-blue-50 rounded-md">
                        <div className="flex items-center mb-2">
                            <IdcardOutlined className="text-blue-500 mr-2" />
                            <Text strong>Hạng giấy phép</Text>
                        </div>
                        <Tooltip title="Hạng giấy phép lái xe">
                            <LicenseClassTag licenseClass={driver.licenseClass as LicenseClassEnum} className="px-3 py-1 text-lg" />
                        </Tooltip>
                    </div>
                </Card>
            </Col>
        </Row>
    );
};

export default DriverInfo; 