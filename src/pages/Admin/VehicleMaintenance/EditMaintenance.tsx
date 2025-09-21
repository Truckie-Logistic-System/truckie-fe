import React, { useState } from 'react';
import { Card, Button, App, Breadcrumb, Skeleton } from 'antd';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { HomeOutlined, ToolOutlined, ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';

import { vehicleService } from '../../../services';
import MaintenanceForm from './components/MaintenanceForm';
import type { VehicleMaintenance } from '../../../models';

const EditMaintenance: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { message } = App.useApp();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch maintenance details
    const { data: maintenanceResponse, isLoading: isLoadingMaintenance } = useQuery({
        queryKey: ['vehicleMaintenance', id],
        queryFn: () => id ? vehicleService.getVehicleMaintenanceById(id) : Promise.reject('ID không hợp lệ'),
        enabled: !!id,
    });

    // Fetch vehicles for the form
    const { data: vehiclesResponse, isLoading: isLoadingVehicles } = useQuery({
        queryKey: ['vehicles'],
        queryFn: vehicleService.getVehicles,
    });

    const maintenance = maintenanceResponse?.data;
    const vehicles = vehiclesResponse?.data || [];
    const isLoading = isLoadingMaintenance || isLoadingVehicles;

    const handleSubmit = async (values: any) => {
        if (!id) return;

        try {
            setIsSubmitting(true);
            const response = await vehicleService.updateVehicleMaintenance(id, {
                ...values,
                // Sử dụng định dạng ISO không có timezone để phù hợp với LocalDateTime của Java
                maintenanceDate: values.maintenanceDate.format('YYYY-MM-DDTHH:mm:ss'),
                nextMaintenanceDate: values.nextMaintenanceDate
                    ? values.nextMaintenanceDate.format('YYYY-MM-DDTHH:mm:ss')
                    : undefined
            });

            if (response.success) {
                message.success('Cập nhật lịch bảo trì thành công');
                navigate('/admin/vehicle-maintenances');
            } else {
                message.error(response.message || 'Không thể cập nhật lịch bảo trì');
            }
        } catch (error) {
            console.error('Error updating maintenance:', error);
            message.error('Có lỗi xảy ra khi cập nhật lịch bảo trì');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/admin/vehicle-maintenances');
    };

    if (isLoading) {
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

    if (!maintenance) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-red-500 mb-4">Không tìm thấy thông tin bảo trì</div>
                <Link to="/admin/vehicle-maintenances">
                    <Button type="primary" icon={<ArrowLeftOutlined />}>Quay lại danh sách</Button>
                </Link>
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
                    <span>Chỉnh sửa lịch bảo trì</span>
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
                    <h2 className="text-2xl font-bold m-0">Chỉnh sửa lịch bảo trì</h2>
                </div>
                <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={() => document.getElementById('maintenance-form')?.dispatchEvent(
                        new Event('submit', { cancelable: true, bubbles: true })
                    )}
                    loading={isSubmitting}
                >
                    Lưu thay đổi
                </Button>
            </div>

            {/* Form */}
            <Card>
                <MaintenanceForm
                    initialValues={maintenance}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    vehicles={vehicles}
                    formId="maintenance-form"
                />
            </Card>
        </div>
    );
};

export default EditMaintenance; 