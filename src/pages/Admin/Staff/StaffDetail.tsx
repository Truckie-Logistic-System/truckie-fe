import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { App, Typography, Card, Button, Descriptions, Row, Col, Avatar, Divider, Tag, Skeleton } from 'antd';
import {
    TeamOutlined,
    HomeOutlined,
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    ManOutlined,
    WomanOutlined,
    CalendarOutlined,
    IdcardOutlined,
    CheckCircleOutlined,
    StopOutlined,
    ArrowLeftOutlined,
    CopyOutlined,
    CheckOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import userService from '../../../services/user';
import type { UserModel } from '../../../services/user/types';
import { format } from 'date-fns';

const { Title, Text } = Typography;

const StaffDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { message } = App.useApp();
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['staff', id],
        queryFn: () => userService.getUserById(id as string),
        enabled: !!id
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => userService.updateUserStatus(id, status),
        onSuccess: () => {
            message.success('Cập nhật trạng thái nhân viên thành công');
            queryClient.invalidateQueries({ queryKey: ['staff', id] });
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
        onError: () => {
            message.error('Cập nhật trạng thái nhân viên thất bại');
        }
    });

    const handleStatusChange = (newStatus: string) => {
        if (id) {
            updateStatusMutation.mutate({ id, status: newStatus });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'green';
            case 'banned':
                return 'red';
            default:
                return 'default';
        }
    };

    const getStatusText = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'Hoạt động';
            case 'banned': return 'Bị cấm';
            default: return status;
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'dd/MM/yyyy');
        } catch (error) {
            return dateString;
        }
    };

    // Render skeleton loading
    const renderSkeletonLoading = () => {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                {/* Breadcrumb skeleton */}
                <div className="mb-4">
                    <Skeleton.Input style={{ width: 300 }} active size="small" />
                </div>

                {/* Header skeleton */}
                <div className="flex items-center mb-6">
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/admin/staff')}
                        className="mr-4"
                    >
                        Quay lại
                    </Button>
                    <Skeleton.Input style={{ width: 300 }} active size="large" />
                </div>

                {/* Content skeleton */}
                <Row gutter={24}>
                    {/* Left card skeleton */}
                    <Col xs={24} lg={8}>
                        <Card className="shadow-sm mb-6">
                            <div className="flex flex-col items-center mb-4">
                                <Skeleton.Avatar active size={80} className="mb-4" />
                                <Skeleton.Input style={{ width: 150 }} active size="default" className="mb-2" />
                                <Skeleton.Input style={{ width: 100 }} active size="small" />
                            </div>
                            <Divider />
                            <Skeleton active paragraph={{ rows: 6 }} />
                        </Card>
                    </Col>

                    {/* Right card skeleton */}
                    <Col xs={24} lg={16}>
                        <Card className="shadow-sm">
                            <Skeleton active paragraph={{ rows: 10 }} />
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    };

    if (isLoading) {
        return renderSkeletonLoading();
    }

    if (error) {
        return (
            <div className="p-6 flex flex-col items-center justify-center h-64">
                <Text type="danger" className="text-xl mb-4">Đã xảy ra lỗi khi tải dữ liệu</Text>
                <Button type="primary" onClick={() => navigate('/admin/staff')} className="bg-blue-600 hover:bg-blue-700">
                    Quay lại danh sách nhân viên
                </Button>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-6 flex flex-col items-center justify-center h-64">
                <Text className="text-xl mb-4">Không tìm thấy thông tin nhân viên</Text>
                <Button type="primary" onClick={() => navigate('/admin/staff')}>
                    Quay lại danh sách nhân viên
                </Button>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-4">
                <div className="flex items-center mb-1">
                    <Button
                        icon={<HomeOutlined />}
                        type="link"
                        onClick={() => navigate('/')}
                        className="p-0 mr-1"
                    />
                    <span className="text-gray-400 mx-1">/</span>
                    <Button
                        icon={<TeamOutlined />}
                        type="link"
                        onClick={() => navigate('/admin/staff')}
                        className="p-0 mr-1"
                    >
                        Quản lý nhân viên
                    </Button>
                    <span className="text-gray-400 mx-1">/</span>
                    <span className="text-gray-600">{data.fullName}</span>
                </div>
            </div>

            <div className="flex items-center mb-6">
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/admin/staff')}
                    className="mr-4"
                >
                    Quay lại
                </Button>
                <Title level={2} className="m-0 flex items-center">
                    <TeamOutlined className="mr-3 text-blue-500" />
                    Chi tiết nhân viên
                </Title>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={8}>
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col items-center text-center mb-6">
                            <Avatar
                                src={data.imageUrl}
                                size={120}
                                icon={<TeamOutlined />}
                                className="mb-4 border-4 border-blue-100"
                            />
                            <Title level={3} className="mb-1">{data.fullName}</Title>
                            <Tag
                                color={getStatusColor(data.status)}
                                className="px-3 py-1"
                                icon={data.status?.toLowerCase() === 'active' ? <CheckCircleOutlined /> : <StopOutlined />}
                            >
                                {getStatusText(data.status)}
                            </Tag>
                        </div>

                        <Divider className="my-4" />

                        <div className="space-y-4">
                            <div className="flex items-center">
                                <MailOutlined className="text-blue-500 mr-3" />
                                <div>
                                    <Text type="secondary" className="block text-sm">Email</Text>
                                    <Text>{data.email}</Text>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <PhoneOutlined className="text-blue-500 mr-3" />
                                <div>
                                    <Text type="secondary" className="block text-sm">Số điện thoại</Text>
                                    <Text>{data.phoneNumber}</Text>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <UserOutlined className="text-blue-500 mr-3" />
                                <div>
                                    <Text type="secondary" className="block text-sm">Tên đăng nhập</Text>
                                    <Text>{data.username}</Text>
                                </div>
                            </div>

                            <div className="flex items-center">
                                {data.gender ? (
                                    <ManOutlined className="text-blue-500 mr-3" />
                                ) : (
                                    <WomanOutlined className="text-pink-500 mr-3" />
                                )}
                                <div>
                                    <Text type="secondary" className="block text-sm">Giới tính</Text>
                                    <Text>{data.gender ? 'Nam' : 'Nữ'}</Text>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <CalendarOutlined className="text-blue-500 mr-3" />
                                <div>
                                    <Text type="secondary" className="block text-sm">Ngày sinh</Text>
                                    <Text>{formatDate(data.dateOfBirth)}</Text>
                                </div>
                            </div>
                        </div>

                        <Divider className="my-4" />

                        <div className="flex justify-center">
                            {data.status?.toLowerCase() === 'active' ? (
                                <Button
                                    danger
                                    icon={<StopOutlined />}
                                    onClick={() => handleStatusChange('BANNED')}
                                    size="large"
                                    className="w-full"
                                    loading={updateStatusMutation.isPending}
                                    disabled={updateStatusMutation.isPending}
                                >
                                    {updateStatusMutation.isPending ? 'Đang cập nhật...' : 'Cấm hoạt động'}
                                </Button>
                            ) : (
                                <Button
                                    type="primary"
                                    icon={<CheckCircleOutlined />}
                                    onClick={() => handleStatusChange('ACTIVE')}
                                    size="large"
                                    className="w-full bg-green-500 hover:bg-green-600"
                                    loading={updateStatusMutation.isPending}
                                    disabled={updateStatusMutation.isPending}
                                >
                                    {updateStatusMutation.isPending ? 'Đang cập nhật...' : 'Kích hoạt'}
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
                                <span>Thông tin chi tiết</span>
                            </div>
                        }
                        className="shadow-sm hover:shadow-md transition-shadow"
                    >
                        <Row gutter={[24, 16]}>
                            <Col xs={24} md={12}>
                                <Card className="bg-gray-50 border-0" size="small">
                                    <div className="flex items-center mb-2">
                                        <UserOutlined className="text-blue-500 mr-2" />
                                        <Text strong>Họ và tên</Text>
                                    </div>
                                    <Text className="text-lg">{data.fullName}</Text>
                                </Card>
                            </Col>
                            <Col xs={24} md={12}>
                                <Card className="bg-gray-50 border-0" size="small">
                                    <div className="flex items-center mb-2">
                                        <MailOutlined className="text-blue-500 mr-2" />
                                        <Text strong>Email</Text>
                                    </div>
                                    <Text className="text-lg">{data.email}</Text>
                                </Card>
                            </Col>
                            <Col xs={24} md={12}>
                                <Card className="bg-gray-50 border-0" size="small">
                                    <div className="flex items-center mb-2">
                                        <PhoneOutlined className="text-blue-500 mr-2" />
                                        <Text strong>Số điện thoại</Text>
                                    </div>
                                    <Text className="text-lg">{data.phoneNumber}</Text>
                                </Card>
                            </Col>
                            <Col xs={24} md={12}>
                                <Card className="bg-gray-50 border-0" size="small">
                                    <div className="flex items-center mb-2">
                                        <UserOutlined className="text-blue-500 mr-2" />
                                        <Text strong>Tên đăng nhập</Text>
                                    </div>
                                    <Text className="text-lg">{data.username}</Text>
                                </Card>
                            </Col>
                            <Col xs={24} md={12}>
                                <Card className="bg-gray-50 border-0" size="small">
                                    <div className="flex items-center mb-2">
                                        {data.gender ? (
                                            <ManOutlined className="text-blue-500 mr-2" />
                                        ) : (
                                            <WomanOutlined className="text-pink-500 mr-2" />
                                        )}
                                        <Text strong>Giới tính</Text>
                                    </div>
                                    <Text className="text-lg">{data.gender ? 'Nam' : 'Nữ'}</Text>
                                </Card>
                            </Col>
                            <Col xs={24} md={12}>
                                <Card className="bg-gray-50 border-0" size="small">
                                    <div className="flex items-center mb-2">
                                        <CalendarOutlined className="text-blue-500 mr-2" />
                                        <Text strong>Ngày sinh</Text>
                                    </div>
                                    <Text className="text-lg">{formatDate(data.dateOfBirth)}</Text>
                                </Card>
                            </Col>
                            <Col xs={24}>
                                <Card className="bg-gray-50 border-0" size="small">
                                    <div className="flex items-center mb-2">
                                        <IdcardOutlined className="text-blue-500 mr-2" />
                                        <Text strong>ID nhân viên</Text>
                                    </div>
                                    <div className="flex items-center">
                                        <Text className="text-lg">{data.id}</Text>
                                        <Button
                                            type="text"
                                            icon={<CopyOutlined />}
                                            className="text-blue-500 ml-2 p-0 flex items-center"
                                            onClick={() => {
                                                navigator.clipboard.writeText(data.id);
                                                message.success('Đã sao chép ID');
                                            }}
                                        />
                                    </div>
                                </Card>
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default StaffDetail; 