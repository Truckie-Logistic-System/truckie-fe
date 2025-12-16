import React, { useState } from 'react';
import { Modal, Descriptions, Tag, Divider, Typography, Row, Col, Card, Space, Button, message, Alert } from 'antd';
import { CarOutlined, ToolOutlined, CalendarOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { VehicleServiceRecord, Vehicle } from '../../../../models';
import vehicleService from '../../../../services/vehicle/vehicleService';
import { VehicleStatusTag } from '../../../../components/common';
import { VehicleServiceStatusEnum, VEHICLE_SERVICE_STATUS_CONFIG } from '../../../../constants/enums';

const { Title, Text } = Typography;
const { confirm } = Modal;

interface VehicleDetailModalProps {
    visible: boolean;
    onClose: () => void;
    vehicle: Vehicle | null;
    maintenances: VehicleServiceRecord[];
    onRefresh?: () => void;
    onVehicleUpdate?: (vehicleId: string) => void;
}

const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
    visible,
    onClose,
    vehicle,
    maintenances,
    onRefresh,
    onVehicleUpdate,
}) => {
    const [isCompleting, setIsCompleting] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isStarting, setIsStarting] = useState(false);

    // Debug log to check vehicle data
    React.useEffect(() => {
        if (visible && vehicle) {
            console.log('VehicleDetailModal - Vehicle data:', vehicle);
            console.log('VehicleDetailModal - vehicleTypeId:', vehicle.vehicleTypeId);
            console.log('VehicleDetailModal - vehicleTypeDescription:', vehicle.vehicleTypeDescription);
        }
    }, [visible, vehicle]);

    const getServiceStatusTag = (status: string | undefined) => {
        if (!status) return <Tag>Không xác định</Tag>;
        
        const config = VEHICLE_SERVICE_STATUS_CONFIG[status as VehicleServiceStatusEnum];
        if (config) {
            return (
                <Tag 
                    style={{ 
                        color: config.color, 
                        backgroundColor: config.bgColor, 
                        borderColor: config.borderColor 
                    }}
                >
                    {config.label}
                </Tag>
            );
        }
        return <Tag>{status}</Tag>;
    };

    const getVehicleStatusTag = (status: string | undefined) => {
        if (!status) return <Tag color="default">Không xác định</Tag>;
        return <VehicleStatusTag status={status} size="small" />;
    };

    const isExpiringSoon = (nextServiceDate: string | undefined) => {
        if (!nextServiceDate) return false;
        const nextDate = dayjs(nextServiceDate);
        const today = dayjs();
        const daysUntilNext = nextDate.diff(today, 'day');
        return daysUntilNext >= 0 && daysUntilNext <= 30;
    };

    const isOverdue = (nextServiceDate: string | undefined) => {
        if (!nextServiceDate) return false;
        return dayjs(nextServiceDate).isBefore(dayjs());
    };

    const sortedMaintenances = maintenances.sort((a, b) => 
        dayjs(b.plannedDate).valueOf() - dayjs(a.plannedDate).valueOf()
    );

    // Get the current maintenance record (should be only one)
    const currentMaintenance = sortedMaintenances[0];

    // Handle complete maintenance
    const handleComplete = () => {
        if (!currentMaintenance) return;

        confirm({
            title: 'Xác nhận hoàn thành',
            icon: <ExclamationCircleOutlined />,
            content: `Bạn có chắc chắn muốn đánh dấu "${currentMaintenance.serviceType}" là đã hoàn thành?`,
            okText: 'Hoàn thành',
            cancelText: 'Hủy',
            onOk: async () => {
                setIsCompleting(true);
                try {
                    const response = await vehicleService.completeMaintenance(currentMaintenance.id);
                    if (response.success) {
                        message.success('Đã hoàn thành bảo trì/đăng kiểm thành công');
                        onRefresh?.(); // Refresh parent data
                        // Refresh vehicle data since backend updated vehicle fields
                        if (vehicle?.id && onVehicleUpdate) {
                            onVehicleUpdate(vehicle.id);
                        }
                        onClose(); // Close modal
                    } else {
                        message.error(response.message || 'Có lỗi xảy ra khi hoàn thành');
                    }
                } catch (error) {
                    console.error('Error completing maintenance:', error);
                    message.error('Có lỗi xảy ra khi hoàn thành bảo trì/đăng kiểm');
                } finally {
                    setIsCompleting(false);
                }
            }
        });
    };

    // Handle cancel maintenance
    const handleCancel = () => {
        if (!currentMaintenance) return;

        confirm({
            title: 'Xác nhận hủy',
            icon: <ExclamationCircleOutlined />,
            content: `Bạn có chắc chắn muốn hủy "${currentMaintenance.serviceType}"?`,
            okText: 'Hủy bỏ',
            cancelText: 'Không',
            okType: 'danger',
            onOk: async () => {
                setIsCancelling(true);
                try {
                    const response = await vehicleService.cancelMaintenance(currentMaintenance.id);
                    if (response.success) {
                        message.success('Đã hủy bảo trì/đăng kiểm thành công');
                        onRefresh?.(); // Refresh parent data
                        onClose(); // Close modal
                    } else {
                        message.error(response.message || 'Có lỗi xảy ra khi hủy');
                    }
                } catch (error) {
                    console.error('Error cancelling maintenance:', error);
                    message.error('Có lỗi xảy ra khi hủy bảo trì/đăng kiểm');
                } finally {
                    setIsCancelling(false);
                }
            }
        });
    };
    
    // Handle start maintenance
    const handleStart = () => {
        if (!currentMaintenance) return;

        confirm({
            title: 'Xác nhận bắt đầu bảo trì',
            icon: <ExclamationCircleOutlined />,
            content: `Bạn có chắc chắn muốn bắt đầu "${currentMaintenance.serviceType}"? Xe sẽ chuyển sang trạng thái "Đang bảo trì" và không thể được phân công cho chuyến xe.`,
            okText: 'Bắt đầu',
            cancelText: 'Hủy',
            onOk: async () => {
                setIsStarting(true);
                try {
                    const response = await vehicleService.startMaintenance(currentMaintenance.id);
                    if (response.success) {
                        message.success('Đã bắt đầu bảo trì/đăng kiểm thành công');
                        onRefresh?.(); // Refresh parent data
                        // Refresh vehicle data since backend updated vehicle status
                        if (vehicle?.id && onVehicleUpdate) {
                            onVehicleUpdate(vehicle.id);
                        }
                        onClose(); // Close modal
                    } else {
                        message.error(response.message || 'Có lỗi xảy ra khi bắt đầu bảo trì');
                    }
                } catch (error) {
                    console.error('Error starting maintenance:', error);
                    message.error('Có lỗi xảy ra khi bắt đầu bảo trì/đăng kiểm');
                } finally {
                    setIsStarting(false);
                }
            }
        });
    };

    // Hiển thị cảnh báo khi xe đang ở trạng thái MAINTENANCE
    const renderMaintenanceWarning = () => {
        if (vehicle?.status === 'MAINTENANCE') {
            return (
                <div style={{ marginBottom: 16 }}>
                    <Alert
                        message="Xe đang trong trạng thái bảo trì"
                        description="Xe này hiện đang trong quá trình bảo trì/đăng kiểm và không thể được phân công cho chuyến xe."
                        type="warning"
                        showIcon
                    />
                </div>
            );
        }
        return null;
    };

    return (
        <Modal
            title={
                <Space>
                    <ToolOutlined />
                    <span>Chi tiết Bảo trì/Đăng kiểm</span>
                </Space>
            }
            open={visible}
            onCancel={onClose}
            footer={
                currentMaintenance && ['PLANNED', 'IN_PROGRESS'].includes(currentMaintenance.serviceStatus || '') ? (
                    <div style={{ textAlign: 'right' }}>
                        <Space>
                            <Button 
                                danger
                                loading={isCancelling}
                                onClick={handleCancel}
                                disabled={isCompleting || isStarting}
                            >
                                Hủy bỏ
                            </Button>
                            {currentMaintenance.serviceStatus === 'PLANNED' && (
                                <Button
                                    type="default"
                                    loading={isStarting}
                                    onClick={handleStart}
                                    disabled={isCompleting || isCancelling}
                                    icon={<ToolOutlined />}
                                >
                                    Bắt đầu bảo trì
                                </Button>
                            )}
                            <Button 
                                type="primary"
                                loading={isCompleting}
                                onClick={handleComplete}
                                disabled={isCancelling || isStarting}
                            >
                                Hoàn thành
                            </Button>
                        </Space>
                    </div>
                ) : null
            }
            width={900}
            destroyOnClose
        >
            {vehicle && (
                <>
                    {/* Hiển thị cảnh báo khi xe đang ở trạng thái MAINTENANCE */}
                    {renderMaintenanceWarning()}
                    
                    {/* Thông tin xe */}
                    <Card style={{ backgroundColor: '#f0f5ff', borderColor: '#1976d2' }}>
                        <Title level={4} style={{ color: '#1976d2', marginBottom: 16 }}>
                            <CarOutlined /> Thông tin phương tiện
                        </Title>
                        <Descriptions column={2} bordered size="small">
                            <Descriptions.Item label="Biển số xe">
                                <Text strong style={{ color: '#1976d2' }}>{vehicle.licensePlateNumber || 'N/A'}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Model">
                                {vehicle.model || 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Hãng sản xuất">
                                {vehicle.manufacturer || 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Năm sản xuất">
                                {vehicle.year || 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Loại xe">
                                {vehicle.vehicleTypeDescription || vehicle.vehicleTypeId || 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                {getVehicleStatusTag(vehicle.status)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Đăng kiểm gần nhất">
                                {vehicle.lastInspectionDate ? dayjs(vehicle.lastInspectionDate).format('DD/MM/YYYY') : 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Hạn đăng kiểm">
                                {vehicle.inspectionExpiryDate ? (
                                    <span style={{ 
                                        color: vehicle.isInspectionExpiringSoon ? '#ff4d4f' : 'inherit',
                                        fontWeight: vehicle.isInspectionExpiringSoon ? 'bold' : 'normal'
                                    }}>
                                        {dayjs(vehicle.inspectionExpiryDate).format('DD/MM/YYYY')}
                                        {vehicle.isInspectionExpiringSoon && ` (${vehicle.daysUntilInspectionExpiry} ngày)`}
                                    </span>
                                ) : 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Hạn bảo hiểm">
                                {vehicle.insuranceExpiryDate ? (
                                    <span style={{ 
                                        color: vehicle.isInsuranceExpiringSoon ? '#ff4d4f' : 'inherit',
                                        fontWeight: vehicle.isInsuranceExpiringSoon ? 'bold' : 'normal'
                                    }}>
                                        {dayjs(vehicle.insuranceExpiryDate).format('DD/MM/YYYY')}
                                        {vehicle.isInsuranceExpiringSoon && ` (${vehicle.daysUntilInsuranceExpiry} ngày)`}
                                    </span>
                                ) : 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Bảo trì tiếp theo">
                                {vehicle.nextMaintenanceDate ? (
                                    <span style={{ 
                                        color: vehicle.isMaintenanceDueSoon ? '#ff4d4f' : 'inherit',
                                        fontWeight: vehicle.isMaintenanceDueSoon ? 'bold' : 'normal'
                                    }}>
                                        {dayjs(vehicle.nextMaintenanceDate).format('DD/MM/YYYY')}
                                        {vehicle.isMaintenanceDueSoon && ` (${vehicle.daysUntilNextMaintenance} ngày)`}
                                    </span>
                                ) : 'N/A'}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>

                    <Divider />

                    {/* Chi tiết bảo trì/đăng kiểm */}
                    <Card>
                        <Title level={4} style={{ color: '#1976d2', marginBottom: 16 }}>
                            <Space>
                                <ToolOutlined />
                                <span>Thông tin Bảo trì/Đăng kiểm</span>
                            </Space>
                        </Title>
                        
                        {sortedMaintenances.length > 0 ? (
                            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                {sortedMaintenances.map((maintenance) => (
                                    <Descriptions key={maintenance.id} bordered column={2} size="small">
                                        <Descriptions.Item label="Loại dịch vụ" span={2}>
                                            <Text strong style={{ fontSize: '14px' }}>
                                                {maintenance.serviceType || 'N/A'}
                                            </Text>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Trạng thái">
                                            {getServiceStatusTag(maintenance.serviceStatus)}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Ngày dự kiến">
                                            {maintenance.plannedDate ? dayjs(maintenance.plannedDate).format('DD/MM/YYYY HH:mm') : 'N/A'}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Ngày thực tế">
                                            {maintenance.actualDate ? dayjs(maintenance.actualDate).format('DD/MM/YYYY HH:mm') : 'Chưa thực hiện'}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Ngày bảo trì/kiểm định tiếp theo">
                                            {maintenance.nextServiceDate ? (
                                                <span style={{ 
                                                    color: isOverdue(maintenance.nextServiceDate) 
                                                        ? '#ff4d4f' 
                                                        : isExpiringSoon(maintenance.nextServiceDate) 
                                                            ? '#faad14' 
                                                            : 'inherit',
                                                    fontWeight: isOverdue(maintenance.nextServiceDate) || 
                                                                isExpiringSoon(maintenance.nextServiceDate) 
                                                        ? 'bold' 
                                                        : 'normal'
                                                }}>
                                                    {dayjs(maintenance.nextServiceDate).format('DD/MM/YYYY')}
                                                    {isOverdue(maintenance.nextServiceDate) && ' (Quá hạn)'}
                                                    {isExpiringSoon(maintenance.nextServiceDate) && !isOverdue(maintenance.nextServiceDate) && ' (Sắp đến hạn)'}
                                                </span>
                                            ) : 'N/A'}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Số đồng hồ (Odometer)">
                                            {maintenance.odometerReading ? `${maintenance.odometerReading.toLocaleString()} km` : 'N/A'}
                                        </Descriptions.Item>
                                        {maintenance.description && (
                                            <Descriptions.Item label="Mô tả" span={2}>
                                                <Text>{maintenance.description}</Text>
                                            </Descriptions.Item>
                                        )}
                                    </Descriptions>
                                ))}
                            </Space>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                <ToolOutlined style={{ fontSize: '24px', color: '#d9d9d9' }} />
                                <div style={{ marginTop: '8px' }}>
                                    <Text type="secondary">Không có thông tin bảo trì</Text>
                                </div>
                            </div>
                        )}
                    </Card>
                </>
            )}
        </Modal>
    );
};

export default VehicleDetailModal;
