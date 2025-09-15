import React from 'react';
import type { ReactNode } from 'react';
import { Button, Typography, Breadcrumb, Card, Row, Col, Avatar, Skeleton } from 'antd';
import { ArrowLeftOutlined, HomeOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import { UserStatusEnum } from '@/constants/enums';
import { UserStatusTag } from '@/components/common/tags';

const { Title, Text } = Typography;

interface EntityDetailLayoutProps {
    id?: string;
    title: string;
    icon: ReactNode;
    breadcrumbItems: {
        title: ReactNode;
        href?: string;
        icon?: ReactNode;
    }[];
    onBackClick: () => void;
    isLoading: boolean;
    entityData: {
        fullName?: string;
        imageUrl?: string;
        status?: string;
        email?: string;
        phoneNumber?: string;
        username?: string;
        gender?: boolean;
        dateOfBirth?: string;
        [key: string]: any; // Cho phép thêm các trường khác
    } | null;
    leftSideExtra?: ReactNode;
    rightContent: ReactNode;
    statusUpdateButtons?: ReactNode;
}

const EntityDetailLayout: React.FC<EntityDetailLayoutProps> = ({
    id,
    title,
    icon,
    breadcrumbItems,
    onBackClick,
    isLoading,
    entityData,
    leftSideExtra,
    rightContent,
    statusUpdateButtons
}) => {
    const getStatusColor = (status?: string) => {
        if (!status) return 'default';
        switch (status.toLowerCase()) {
            case 'active':
                return 'green';
            case 'banned':
                return 'red';
            default:
                return 'default';
        }
    };

    const getStatusText = (status?: string) => {
        if (!status) return 'Không xác định';
        switch (status.toLowerCase()) {
            case 'active':
                return 'Đang hoạt động';
            case 'banned':
                return 'Bị cấm';
            default:
                return status;
        }
    };

    const renderSkeletonLoading = () => (
        <>
            <Breadcrumb className="mb-4">
                {breadcrumbItems.map((item, index) => (
                    <Breadcrumb.Item key={index} href={item.href}>
                        {item.icon}
                        {index === breadcrumbItems.length - 1 ? (
                            <Skeleton.Input style={{ width: 100 }} active size="small" />
                        ) : (
                            <span>{item.title}</span>
                        )}
                    </Breadcrumb.Item>
                ))}
            </Breadcrumb>

            <div className="flex items-center mb-6">
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={onBackClick}
                    className="mr-4"
                >
                    Quay lại
                </Button>
                <Title level={2} className="m-0 flex items-center">
                    <span className="mr-3 text-blue-500">{icon}</span>
                    Chi tiết {title.toLowerCase()}
                </Title>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={8}>
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col items-center text-center mb-6">
                            <Skeleton.Avatar active size={120} className="mb-4" />
                            <Skeleton.Input style={{ width: 200 }} active size="large" className="mb-2" />
                            <Skeleton.Input style={{ width: 100 }} active size="small" />
                        </div>

                        <Skeleton active paragraph={{ rows: 4 }} />
                    </Card>
                </Col>
                <Col xs={24} lg={16}>
                    <Skeleton active paragraph={{ rows: 10 }} />
                </Col>
            </Row>
        </>
    );

    const renderContent = () => (
        <>
            <Breadcrumb className="mb-4">
                {breadcrumbItems.map((item, index) => (
                    <Breadcrumb.Item key={index} href={item.href}>
                        {item.icon}
                        <span>{item.title}</span>
                    </Breadcrumb.Item>
                ))}
            </Breadcrumb>

            <div className="flex items-center mb-6">
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={onBackClick}
                    className="mr-4"
                >
                    Quay lại
                </Button>
                <Title level={2} className="m-0 flex items-center">
                    <span className="mr-3 text-blue-500">{icon}</span>
                    Chi tiết {title.toLowerCase()}
                </Title>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={8}>
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col items-center text-center mb-6">
                            <Avatar
                                src={entityData?.imageUrl}
                                size={120}
                                className="mb-4"
                                icon={<UserIcon gender={entityData?.gender} />}
                            />
                            <Title level={4} className="m-0 mb-2">{entityData?.fullName || 'Không có tên'}</Title>
                            <UserStatusTag status={entityData?.status as UserStatusEnum} />
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center mb-3">
                                <MailIcon className="mr-3 text-gray-500" />
                                <div>
                                    <Text type="secondary" className="block text-xs">Email</Text>
                                    <Text>{entityData?.email || 'Không có email'}</Text>
                                </div>
                            </div>
                            <div className="flex items-center mb-3">
                                <PhoneIcon className="mr-3 text-gray-500" />
                                <div>
                                    <Text type="secondary" className="block text-xs">Số điện thoại</Text>
                                    <Text>{entityData?.phoneNumber || 'Không có số điện thoại'}</Text>
                                </div>
                            </div>
                            <div className="flex items-center mb-3">
                                <UsernameIcon className="mr-3 text-gray-500" />
                                <div>
                                    <Text type="secondary" className="block text-xs">Tên đăng nhập</Text>
                                    <Text>{entityData?.username || 'Không có tên đăng nhập'}</Text>
                                </div>
                            </div>
                            {leftSideExtra}
                        </div>

                        {statusUpdateButtons && (
                            <div className="border-t pt-4 mt-4">
                                {statusUpdateButtons}
                            </div>
                        )}
                    </Card>
                </Col>
                <Col xs={24} lg={16}>
                    {rightContent}
                </Col>
            </Row>
        </>
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {isLoading ? renderSkeletonLoading() : renderContent()}
        </div>
    );
};

// Icons
const UserIcon: React.FC<{ gender?: boolean }> = ({ gender }) => {
    if (gender === undefined) return <span className="anticon">👤</span>;
    return gender ? <span className="anticon">👨</span> : <span className="anticon">👩</span>;
};

const MailIcon: React.FC<{ className?: string }> = ({ className }) => (
    <span className={`anticon ${className}`}>✉️</span>
);

const PhoneIcon: React.FC<{ className?: string }> = ({ className }) => (
    <span className={`anticon ${className}`}>📱</span>
);

const UsernameIcon: React.FC<{ className?: string }> = ({ className }) => (
    <span className={`anticon ${className}`}>🔑</span>
);

export default EntityDetailLayout; 