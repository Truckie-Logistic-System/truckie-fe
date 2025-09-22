import React from 'react';
import { Card, Descriptions, Button, Tag, Row, Col, Typography, Avatar, Divider, Timeline, Tooltip, Table, Empty, Badge } from 'antd';
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
    WomanOutlined,
    WarningOutlined,
    DollarOutlined,
    SafetyCertificateOutlined,
    CarOutlined
} from '@ant-design/icons';
import type { DriverModel } from '../../../../services/driver';
import { LicenseClassEnum, CommonStatusEnum } from '@/constants/enums';
import { LicenseClassTag, CommonStatusTag } from '@/components/common/tags';
import { PenaltyStatus, penaltyStatusColors } from '@/models/Penalty';
import { formatCurrency } from '@/utils/formatters';

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

    const getPenaltyStatusText = (status: string) => {
        switch (status.toUpperCase()) {
            case PenaltyStatus.PENDING:
                return 'Chờ xử lý';
            case PenaltyStatus.PAID:
                return 'Đã thanh toán';
            case PenaltyStatus.DISPUTED:
                return 'Đang khiếu nại';
            case PenaltyStatus.RESOLVED:
                return 'Đã giải quyết';
            case PenaltyStatus.CANCELLED:
                return 'Đã hủy';
            default:
                return status;
        }
    };

    const penaltyColumns = [
        {
            title: 'Loại vi phạm',
            dataIndex: 'violationType',
            key: 'violationType',
            render: (text: string) => <Text strong>{text}</Text>
        },
        {
            title: 'Mô tả',
            dataIndex: 'violationDescription',
            key: 'violationDescription',
            ellipsis: true,
        },
        {
            title: 'Số tiền phạt',
            dataIndex: 'penaltyAmount',
            key: 'penaltyAmount',
            render: (amount: number) => (
                <Text type="danger" strong>
                    <DollarOutlined className="mr-1" />
                    {formatCurrency(amount)}
                </Text>
            )
        },
        {
            title: 'Ngày vi phạm',
            dataIndex: 'penaltyDate',
            key: 'penaltyDate',
            render: (date: string) => formatDate(date)
        },
        {
            title: 'Địa điểm',
            dataIndex: 'location',
            key: 'location',
            ellipsis: true,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={penaltyStatusColors[status.toUpperCase() as keyof typeof penaltyStatusColors]}>
                    {getPenaltyStatusText(status)}
                </Tag>
            )
        },
    ];

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
                            <SafetyCertificateOutlined className="text-blue-600 mr-2" />
                            <span>Hạng giấy phép lái xe</span>
                        </div>
                    }
                    className="shadow-sm hover:shadow-md transition-shadow mb-6"
                    extra={
                        <Badge
                            count={driver.licenseClass}
                            style={{
                                backgroundColor: driver.licenseClass === LicenseClassEnum.C ? '#8B5CF6' : '#3B82F6',
                                fontSize: '16px',
                                padding: '0 10px'
                            }}
                        />
                    }
                >
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <Text strong className="text-lg block mb-1">
                                    {driver.licenseClass === LicenseClassEnum.B2 ? 'Hạng B2' : 'Hạng C'}
                                </Text>
                                <Text className="text-gray-500 block">
                                    {driver.licenseClass === LicenseClassEnum.B2
                                        ? 'Xe ô tô tải dưới 3.5 tấn hoặc chở dưới 9 người'
                                        : 'Xe ô tô tải trên 3.5 tấn hoặc xe khách lớn'}
                                </Text>
                            </div>
                            <div className="ml-4">
                                <div className={`flex items-center justify-center w-16 h-16 rounded-full ${driver.licenseClass === LicenseClassEnum.C ? 'bg-purple-500' : 'bg-blue-500'
                                    } text-white text-2xl font-bold shadow-md`}>
                                    <CarOutlined className="text-2xl" />
                                </div>
                            </div>
                        </div>

                        <Divider className="my-3" />

                        <div className="flex justify-between">
                            <div>
                                <Text type="secondary">Loại phương tiện:</Text>
                                <Text strong className="ml-2">
                                    {driver.licenseClass === LicenseClassEnum.B2 ? 'Xe tải nhẹ, xe khách nhỏ' : 'Xe tải nặng, xe khách lớn'}
                                </Text>
                            </div>
                            <Tag
                                color={driver.licenseClass === LicenseClassEnum.C ? 'purple' : 'blue'}
                                className="text-sm px-3 py-1"
                            >
                                {driver.licenseClass === LicenseClassEnum.B2 ? 'Dưới 3.5 tấn' : 'Trên 3.5 tấn'}
                            </Tag>
                        </div>
                    </div>
                </Card>

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
                    className="shadow-sm hover:shadow-md transition-shadow mb-6"
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
                </Card>

                <Card
                    title={
                        <div className="flex items-center">
                            <WarningOutlined className="text-red-500 mr-2" />
                            <span>Lịch sử vi phạm</span>
                        </div>
                    }
                    className="shadow-sm hover:shadow-md transition-shadow"
                    extra={
                        <Tag color="red" className="px-3 py-1">
                            {driver.penaltyHistories?.length || 0} vi phạm
                        </Tag>
                    }
                >
                    {driver.penaltyHistories && driver.penaltyHistories.length > 0 ? (
                        <Table
                            dataSource={driver.penaltyHistories}
                            columns={penaltyColumns}
                            rowKey="id"
                            pagination={{ pageSize: 5 }}
                            size="middle"
                            scroll={{ x: 'max-content' }}
                        />
                    ) : (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="Không có lịch sử vi phạm"
                            className="py-8"
                        />
                    )}
                </Card>
            </Col>
        </Row>
    );
};

export default DriverInfo; 