import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spin, App, Typography, Breadcrumb, Skeleton, Card, Row, Col } from 'antd';
import { ArrowLeftOutlined, CarOutlined, HomeOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import driverService from '../../../services/driver';
import type { DriverModel } from '../../../services/driver';
import { format } from 'date-fns';
import DriverInfo from './components/DriverInfo';
import LicenseRenewalModal, { type LicenseRenewalFormValues } from './components/LicenseRenewalModal';

const { Title, Text } = Typography;

const DriverDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const [isRenewalModalVisible, setIsRenewalModalVisible] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ['driver', id],
        queryFn: () => driverService.getDriverById(id as string),
        enabled: !!id
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => driverService.updateDriverStatus(id, status),
        onSuccess: () => {
            message.success('Cập nhật trạng thái tài xế thành công');
            queryClient.invalidateQueries({ queryKey: ['driver', id] });
        },
        onError: () => {
            message.error('Cập nhật trạng thái tài xế thất bại');
        }
    });

    const handleStatusChange = (newStatus: string) => {
        if (id) {
            updateStatusMutation.mutate({ id, status: newStatus });
        }
    };

    const handleRenewLicense = () => {
        setIsRenewalModalVisible(true);
    };

    const handleRenewalSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['driver', id] });
        queryClient.invalidateQueries({ queryKey: ['drivers'] });
        setIsRenewalModalVisible(false);
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
                return 'green';
            case 'banned':
                return 'red';
            default:
                return 'default';
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'dd/MM/yyyy');
        } catch (error) {
            return dateString;
        }
    };

    const renderSkeletonLoading = () => (
        <div className="p-6 bg-gray-50 min-h-screen">
            <Breadcrumb className="mb-4">
                <Breadcrumb.Item href="/">
                    <HomeOutlined />
                </Breadcrumb.Item>
                <Breadcrumb.Item href="/admin/drivers">
                    <CarOutlined />
                    <span>Quản lý tài xế</span>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <Skeleton.Input style={{ width: 100 }} active size="small" />
                </Breadcrumb.Item>
            </Breadcrumb>

            <div className="flex items-center mb-6">
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/admin/drivers')}
                    className="mr-4"
                >
                    Quay lại
                </Button>
                <Title level={2} className="m-0 flex items-center">
                    <CarOutlined className="mr-3 text-blue-500" />
                    Chi tiết tài xế
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
                    <Card className="shadow-sm hover:shadow-md transition-shadow mb-6">
                        <Skeleton active paragraph={{ rows: 3 }} title={{ width: '40%' }} />
                    </Card>
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <Skeleton active paragraph={{ rows: 5 }} title={{ width: '40%' }} />
                    </Card>
                </Col>
            </Row>
        </div>
    );

    if (isLoading) return renderSkeletonLoading();

    if (error) return (
        <div className="p-6 flex flex-col items-center justify-center h-64">
            <Text type="danger" className="text-xl mb-4">Đã xảy ra lỗi khi tải dữ liệu</Text>
            <Button type="primary" onClick={() => navigate('/admin/drivers')}>
                Quay lại danh sách tài xế
            </Button>
        </div>
    );

    if (!data) return (
        <div className="p-6 flex flex-col items-center justify-center h-64">
            <Text className="text-xl mb-4">Không tìm thấy thông tin tài xế</Text>
            <Button type="primary" onClick={() => navigate('/admin/drivers')}>
                Quay lại danh sách tài xế
            </Button>
        </div>
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <Breadcrumb className="mb-4">
                <Breadcrumb.Item href="/">
                    <HomeOutlined />
                </Breadcrumb.Item>
                <Breadcrumb.Item href="/admin/drivers">
                    <CarOutlined />
                    <span>Quản lý tài xế</span>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    {data.userResponse.fullName}
                </Breadcrumb.Item>
            </Breadcrumb>

            <div className="flex items-center mb-6">
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/admin/drivers')}
                    className="mr-4"
                >
                    Quay lại
                </Button>
                <Title level={2} className="m-0 flex items-center">
                    <CarOutlined className="mr-3 text-blue-500" />
                    Chi tiết tài xế
                </Title>
            </div>

            <DriverInfo
                driver={data}
                formatDate={formatDate}
                getStatusColor={getStatusColor}
                onStatusChange={handleStatusChange}
                isStatusUpdating={updateStatusMutation.isPending}
                onRenewLicense={handleRenewLicense}
            />

            <LicenseRenewalModal
                visible={isRenewalModalVisible}
                driver={data}
                onSuccess={handleRenewalSuccess}
                onCancel={() => setIsRenewalModalVisible(false)}
            />
        </div>
    );
};

export default DriverDetail;