import React, { useState } from 'react';
import { Card, Button, App, Breadcrumb, Skeleton } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { HomeOutlined, ToolOutlined, ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';

import { vehicleService } from '../../../services';
import MaintenanceForm from './components/MaintenanceForm';

const CreateMaintenance: React.FC = () => {
    const navigate = useNavigate();
    const { message } = App.useApp();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch vehicles for the form
    const { data: vehiclesResponse, isLoading: isLoadingVehicles } = useQuery({
        queryKey: ['vehicles'],
        queryFn: vehicleService.getVehicles,
    });

    const vehicles = vehiclesResponse?.data || [];

    const handleSubmit = async (values: any) => {
        try {
            setIsSubmitting(true);
            const response = await vehicleService.createVehicleMaintenance({
                ...values,
                // Sử dụng định dạng ISO không có timezone để phù hợp với LocalDateTime của Java
                maintenanceDate: values.maintenanceDate.format('YYYY-MM-DDTHH:mm:ss'),
                nextMaintenanceDate: values.nextMaintenanceDate
                    ? values.nextMaintenanceDate.format('YYYY-MM-DDTHH:mm:ss')
                    : undefined
            });

            if (response.success) {
                message.success('Thêm lịch bảo trì thành công');
                navigate('/admin/vehicle-maintenances');
            } else {
                message.error(response.message || 'Không thể thêm lịch bảo trì');
            }
        } catch (error) {
            console.error('Error creating maintenance:', error);
            message.error('Có lỗi xảy ra khi thêm lịch bảo trì');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/admin/vehicle-maintenances');
    };

    if (isLoadingVehicles) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                        <Skeleton.Button active size="default" className="mr-4" />
                        <Skeleton.Input active style={{ width: 300 }} />
                    </div>
                    <Skeleton.Button active size="default" />
                </div>
                <Card>
                    <Skeleton active paragraph={{ rows: 10 }} />
                </Card>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            {/* Breadcrumb */}
            <Breadcrumb className="mb-4">
                <Breadcrumb.Item href="/admin/dashboard">
                    <HomeOutlined className="mr-1" />
                    <span>Trang chủ</span>
                </Breadcrumb.Item>
                <Breadcrumb.Item href="/admin/vehicle-maintenances">
                    <ToolOutlined className="mr-1" />
                    <span>Quản lý bảo trì</span>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <span>Thêm lịch bảo trì mới</span>
                </Breadcrumb.Item>
            </Breadcrumb>

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                    <Link to="/admin/vehicle-maintenances">
                        <Button icon={<ArrowLeftOutlined />} className="mr-4">
                            Quay lại
                        </Button>
                    </Link>
                    <h2 className="text-2xl font-bold m-0">Thêm lịch bảo trì mới</h2>
                </div>
                <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={() => document.getElementById('maintenance-form')?.dispatchEvent(
                        new Event('submit', { cancelable: true, bubbles: true })
                    )}
                    loading={isSubmitting}
                >
                    Lưu lịch bảo trì
                </Button>
            </div>

            {/* Form */}
            <Card>
                <MaintenanceForm
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    vehicles={vehicles}
                    isLoading={isLoadingVehicles}
                    formId="maintenance-form"
                />
            </Card>
        </div>
    );
};

export default CreateMaintenance; 