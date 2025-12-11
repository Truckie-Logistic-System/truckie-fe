import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Card,
    Descriptions,
    Button,
    Divider,
    Typography,
    Tag,
    Table,
    Space,
    App,
    Breadcrumb,
    Row,
    Col,
    Avatar,
    Skeleton,
    Tabs,
    Empty,
    Statistic,
    Modal,
    Alert
} from 'antd';
import VehicleForm from './components/VehicleForm';
import {
    CarOutlined,
    ArrowLeftOutlined,
    HomeOutlined,
    UserAddOutlined,
    ToolOutlined,
    CheckCircleOutlined,
    StopOutlined,
    ShopOutlined,
    CarFilled,
    CalendarOutlined,
    TagOutlined,
    InboxOutlined,
    TrophyOutlined,
    ExclamationCircleOutlined,
    PhoneOutlined,
    UserOutlined,
    DollarOutlined
} from '@ant-design/icons';
import { vehicleService } from '../../../services';
import type { VehicleDetail, VehicleAssignment, VehicleMaintenance, Vehicle, TopDriver } from '../../../models';
import type { Penalty } from '../../../models/Penalty';
import type { VehicleServiceRecord } from '../../../models/VehicleServiceRecord';
import { VEHICLE_SERVICE_STATUS_LABELS, VEHICLE_SERVICE_STATUS_COLORS } from '../../../models/VehicleServiceRecord';
import AssignDriverModal from './components/AssignDriverModal';
import ScheduleMaintenanceModal from './components/ScheduleMaintenanceModal';
import VehicleDetailModal from '../VehicleMaintenance/components/VehicleDetailModal';
import PenaltyModal from '../../Staff/PenaltyHistory/components/PenaltyModal';
import StatusChangeModal from '../../../components/common/StatusChangeModal';
import type { StatusOption } from '../../../components/common/StatusChangeModal';
import type { ApiResponse } from '../../../services/api/types';
import { VehicleStatusTag } from '@/components/common';
import { VehicleStatusEnum } from '@/constants/enums';
import MaintenanceForm from '../VehicleMaintenance/components/MaintenanceForm';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Define a type that matches the structure of ApiResponse but allows null for data
interface VehicleDetailResponse extends Omit<ApiResponse<VehicleDetail>, 'data'> {
    data: VehicleDetail | null;
}

const VehicleDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { message } = App.useApp();
    const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [isAssignDriverModalOpen, setIsAssignDriverModalOpen] = useState<boolean>(false);
    const [isScheduleMaintenanceModalOpen, setIsScheduleMaintenanceModalOpen] = useState<boolean>(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
    const [statusModalLoading, setStatusModalLoading] = useState<boolean>(false);
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [activeTab, setActiveTab] = useState<string>('info');
    const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState<boolean>(false);
    const [selectedPenalty, setSelectedPenalty] = useState<Penalty | null>(null);
    const [assignmentPage, setAssignmentPage] = useState<number>(1);
    const [maintenancePage, setMaintenancePage] = useState<number>(1);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isMaintenanceDetailModalOpen, setIsMaintenanceDetailModalOpen] = useState<boolean>(false);
    const [selectedMaintenance, setSelectedMaintenance] = useState<VehicleServiceRecord | null>(null);
    const [isCreateMaintenanceModalOpen, setIsCreateMaintenanceModalOpen] = useState<boolean>(false);

    // Helper function to get vehicle details and handle type casting
    const getVehicleDetail = async (vehicleId: string): Promise<VehicleDetailResponse> => {
        const response = await vehicleService.getVehicleById(vehicleId);

        if (response.success && response.data) {
            // Cast the response data to VehicleDetail since backend returns the full structure
            const vehicleData = response.data as any as VehicleDetail;
            
            // Debug log to see what fields are actually available
            console.log('🔍 DEBUG: Vehicle API Response:', vehicleData);
            console.log('🔍 DEBUG: Available maintenance fields:', {
                lastInspectionDate: vehicleData.lastInspectionDate,
                inspectionExpiryDate: vehicleData.inspectionExpiryDate,
                insuranceExpiryDate: vehicleData.insuranceExpiryDate,
                nextMaintenanceDate: vehicleData.nextMaintenanceDate,
                isInspectionExpiringSoon: vehicleData.isInspectionExpiringSoon,
                isInsuranceExpiringSoon: vehicleData.isInsuranceExpiringSoon,
                isMaintenanceDueSoon: vehicleData.isMaintenanceDueSoon,
                vehicleMaintenanceResponse: vehicleData.vehicleMaintenanceResponse?.length || 0
            });

            // Ensure arrays are initialized if missing
            const vehicleDetail: VehicleDetail = {
                ...vehicleData,
                vehicleAssignmentResponse: vehicleData.vehicleAssignmentResponse || [],
                vehicleMaintenanceResponse: vehicleData.vehicleMaintenanceResponse || [],
                // Preserve the vehicleTypeResponse from backend
                vehicleTypeResponse: vehicleData.vehicleTypeResponse || {
                    id: '',
                    vehicleTypeName: '',
                    description: '',
                    vehicleCount: 0
                }
            };

            return {
                ...response,
                data: vehicleDetail
            };
        }

        return {
            ...response,
            data: null
        };
    };

    useEffect(() => {
        const fetchVehicleDetail = async () => {
            if (!id) return;

            try {
                setLoading(true);
                const response = await getVehicleDetail(id);
                if (response.success && response.data) {
                    setVehicle(response.data);
                } else {
                    // Không phải lỗi, chỉ là không tìm thấy phương tiện
                    message.warning(response.message || 'Không tìm thấy thông tin phương tiện');
                    navigate('/admin/vehicles');
                }
            } catch (error) {
                console.error(`Error fetching vehicle with ID ${id}:`, error);
                message.error('Không thể tải thông tin chi tiết phương tiện');
                navigate('/admin/vehicles');
            } finally {
                setLoading(false);
            }
        };

        fetchVehicleDetail();
    }, [id, message, navigate]);

    const getStatusTag = (status: string) => {
        let color = 'default';
        let text = status;

        switch (status.toLowerCase()) {
            case 'active':
            case 'hoạt động':
                color = 'green';
                text = 'Hoạt động';
                break;
            case 'inactive':
            case 'không hoạt động':
                color = 'red';
                text = 'Không hoạt động';
                break;
            case 'maintenance':
            case 'bảo trì':
                color = 'orange';
                text = 'Đang bảo trì';
                break;
            default:
                color = 'blue';
        }

        return <VehicleStatusTag status={text as VehicleStatusEnum} />;
    };

    const getStatusText = (status: string | boolean) => {
        if (typeof status === 'boolean') {
            return status ? 'Đang hoạt động' : 'Không hoạt động';
        }

        switch (status.toLowerCase()) {
            case 'active':
                return 'Đang hoạt động';
            case 'inactive':
                return 'Không hoạt động';
            default:
                return status;
        }
    };

    const getStatusColor = (status: string | boolean) => {
        if (typeof status === 'boolean') {
            return status ? 'green' : 'red';
        }

        switch (status.toLowerCase()) {
            case 'active':
                return 'green';
            case 'inactive':
                return 'red';
            default:
                return 'default';
        }
    };

    const statusOptions: StatusOption[] = [
        {
            value: 'active',
            label: 'Kích hoạt',
            description: 'Phương tiện có thể được sử dụng để vận chuyển',
            color: 'green',
            icon: <CheckCircleOutlined />
        },
        {
            value: 'inactive',
            label: 'Vô hiệu hóa',
            description: 'Phương tiện sẽ không thể được sử dụng',
            color: 'red',
            icon: <StopOutlined />
        }
    ];

    const handleOpenStatusModal = () => {
        if (!vehicle) return;
        setSelectedStatus(vehicle.status.toLowerCase() === 'active' ? 'inactive' : 'active');
        setIsStatusModalOpen(true);
    };

    const handleStatusChange = (status: string) => {
        setSelectedStatus(status);
    };

    const handleConfirmStatusChange = async () => {
        if (!vehicle || !id) return;

        try {
            setStatusModalLoading(true);

            // Lấy các trường cần thiết từ vehicle, loại bỏ id
            const {
                licensePlateNumber,
                model,
                manufacturer,
                year,
                vehicleTypeId,
                currentLatitude,
                currentLongitude
            } = vehicle;

            // Tạo object mới không có trường id
            const response = await vehicleService.updateVehicle(id, {
                licensePlateNumber,
                model,
                manufacturer,
                year,
                vehicleTypeId,
                status: selectedStatus,
                currentLatitude,
                currentLongitude
            });

            if (response.success) {
                message.success(`Phương tiện đã được ${selectedStatus === 'active' ? 'kích hoạt' : 'vô hiệu hóa'}`);
                const detailResponse = await getVehicleDetail(id);
                if (detailResponse.success && detailResponse.data) {
                    setVehicle(detailResponse.data);
                }
                setIsStatusModalOpen(false);
            } else {
                message.warning(response.message || 'Không thể thay đổi trạng thái phương tiện');
            }
        } catch (error) {
            console.error('Error updating vehicle status:', error);
            message.error('Có lỗi xảy ra khi thay đổi trạng thái phương tiện');
        } finally {
            setStatusModalLoading(false);
        }
    };

    const handleOpenAssignDriverModal = () => {
        setIsAssignDriverModalOpen(true);
    };

    const handleOpenScheduleMaintenanceModal = () => {
        setIsScheduleMaintenanceModalOpen(true);
    };

    const handleAssignDriverSuccess = async () => {
        setIsAssignDriverModalOpen(false);
        message.success('Phân công tài xế thành công');

        // Refresh vehicle data
        if (id) {
            const response = await getVehicleDetail(id);
            if (response.success && response.data) {
                setVehicle(response.data);
            }
        }
    };

    const handleScheduleMaintenanceSuccess = async () => {
        setIsScheduleMaintenanceModalOpen(false);
        message.success('Đặt lịch bảo trì thành công');

        // Refresh vehicle data
        if (id) {
            const response = await getVehicleDetail(id);
            if (response.success && response.data) {
                setVehicle(response.data);
            }
        }
    };

    // Handle maintenance detail modal using VehicleDetailModal
    const handleViewMaintenanceDetail = (maintenance: VehicleServiceRecord) => {
        setSelectedMaintenance(maintenance);
        setIsMaintenanceDetailModalOpen(true);
    };

    // Handle create maintenance schedule
    const handleCreateMaintenanceSchedule = (serviceType?: string) => {
        if (!vehicle) return;
        
        const initialValues = {
            vehicleId: vehicle.id,
            serviceType: serviceType || '',
            plannedDate: dayjs().add(1, 'day'),
            description: `Lịch ${serviceType || 'bảo trì'} cho xe ${vehicle.licensePlateNumber}`
        };
        
        setSelectedMaintenance(initialValues as any);
        setIsCreateMaintenanceModalOpen(true);
    };

    // Handle maintenance form submit
    const handleMaintenanceFormSubmit = async (values: any) => {
        try {
            if (selectedMaintenance && selectedMaintenance.id) {
                // Edit mode
                const response = await vehicleService.updateVehicleMaintenance(selectedMaintenance.id, values);
                if (response.success) {
                    message.success('Cập nhật lịch bảo trì thành công');
                    setIsMaintenanceDetailModalOpen(false);
                    setIsCreateMaintenanceModalOpen(false);
                    setSelectedMaintenance(null);
                    // Refresh data
                    if (id) {
                        const detailResponse = await getVehicleDetail(id);
                        if (detailResponse.success && detailResponse.data) {
                            setVehicle(detailResponse.data);
                        }
                    }
                } else {
                    message.warning(response.message || 'Không thể cập nhật lịch bảo trì');
                }
            } else {
                // Create mode
                const response = await vehicleService.createVehicleMaintenance(values);
                if (response.success) {
                    message.success('Tạo lịch bảo trì thành công');
                    setIsCreateMaintenanceModalOpen(false);
                    setSelectedMaintenance(null);
                    // Refresh data
                    if (id) {
                        const detailResponse = await getVehicleDetail(id);
                        if (detailResponse.success && detailResponse.data) {
                            setVehicle(detailResponse.data);
                        }
                    }
                } else {
                    message.warning(response.message || 'Không thể tạo lịch bảo trì');
                }
            }
        } catch (error) {
            console.error('Error submitting maintenance form:', error);
            message.error('Có lỗi xảy ra khi lưu lịch bảo trì');
        }
    };

    const getMaintenanceWarnings = () => {
        if (!vehicle) return [];
        
        const warnings: React.ReactNode[] = [];
        const now = dayjs();
        
        console.log('🔍 DEBUG: Generating maintenance warnings for vehicle:', vehicle.licensePlateNumber);
        console.log('🔍 DEBUG: Vehicle maintenance fields:', {
            inspectionExpiryDate: vehicle.inspectionExpiryDate,
            insuranceExpiryDate: vehicle.insuranceExpiryDate,
            nextMaintenanceDate: vehicle.nextMaintenanceDate,
            isInspectionExpiringSoon: vehicle.isInspectionExpiringSoon,
            isInsuranceExpiringSoon: vehicle.isInsuranceExpiringSoon,
            isMaintenanceDueSoon: vehicle.isMaintenanceDueSoon,
            maintenanceRecords: vehicle.vehicleMaintenanceResponse?.length || 0
        });

        // Check inspection expiry from vehicle fields
        if (vehicle.inspectionExpiryDate) {
            const expiryDate = dayjs(vehicle.inspectionExpiryDate);
            const daysUntil = expiryDate.diff(now, 'day');
            
            if (daysUntil < 0) {
                // Overdue inspection
                warnings.push(
                    <Alert
                        key="inspection-overdue"
                        message="Đăng kiểm quá hạn"
                        description={`Xe ${vehicle.licensePlateNumber} đã quá hạn đăng kiểm ${Math.abs(daysUntil)} ngày`}
                        type="error"
                        showIcon
                        action={
                            <Button 
                                size="small" 
                                type="primary" 
                                danger
                                onClick={() => handleCreateMaintenanceSchedule('INSPECTION')}
                            >
                                Đặt lịch đăng kiểm
                            </Button>
                        }
                        style={{ marginBottom: 8 }}
                    />
                );
            } else if (daysUntil <= 7) {
                // Critical inspection (gấp - ≤7 ngày)
                warnings.push(
                    <Alert
                        key="inspection-critical"
                        message="Đăng kiểm gấp"
                        description={`Xe ${vehicle.licensePlateNumber} sẽ đến hạn đăng kiểm trong ${daysUntil} ngày nữa`}
                        type="error"
                        showIcon
                        action={
                            <Button 
                                size="small" 
                                type="primary"
                                danger
                                onClick={() => handleCreateMaintenanceSchedule('INSPECTION')}
                            >
                                Đặt lịch đăng kiểm
                            </Button>
                        }
                        style={{ marginBottom: 8 }}
                    />
                );
            } else if (daysUntil <= 30) {
                // Warning inspection (cảnh báo - 8-30 ngày)
                warnings.push(
                    <Alert
                        key="inspection-warning"
                        message="Sắp đến hạn đăng kiểm"
                        description={`Xe ${vehicle.licensePlateNumber} sẽ đến hạn đăng kiểm trong ${daysUntil} ngày nữa`}
                        type="warning"
                        showIcon
                        action={
                            <Button 
                                size="small" 
                                type="primary"
                                onClick={() => handleCreateMaintenanceSchedule('INSPECTION')}
                            >
                                Đặt lịch đăng kiểm
                            </Button>
                        }
                        style={{ marginBottom: 8 }}
                    />
                );
            }
        }

        // Check insurance expiry from vehicle fields
        if (vehicle.insuranceExpiryDate) {
            const expiryDate = dayjs(vehicle.insuranceExpiryDate);
            const daysUntil = expiryDate.diff(now, 'day');
            
            if (daysUntil < 0) {
                // Overdue insurance
                warnings.push(
                    <Alert
                        key="insurance-overdue"
                        message="Bảo hiểm quá hạn"
                        description={`Xe ${vehicle.licensePlateNumber} đã quá hạn bảo hiểm ${Math.abs(daysUntil)} ngày`}
                        type="error"
                        showIcon
                        style={{ marginBottom: 8 }}
                    />
                );
            } else if (daysUntil <= 7) {
                // Critical insurance (gấp - ≤7 ngày)
                warnings.push(
                    <Alert
                        key="insurance-critical"
                        message="Bảo hiểm gấp"
                        description={`Xe ${vehicle.licensePlateNumber} sẽ đến hạn bảo hiểm trong ${daysUntil} ngày nữa`}
                        type="error"
                        showIcon
                        style={{ marginBottom: 8 }}
                    />
                );
            } else if (daysUntil <= 30) {
                // Warning insurance (cảnh báo - 8-30 ngày)
                warnings.push(
                    <Alert
                        key="insurance-warning"
                        message="Sắp đến hạn bảo hiểm"
                        description={`Xe ${vehicle.licensePlateNumber} sẽ đến hạn bảo hiểm trong ${daysUntil} ngày nữa`}
                        type="warning"
                        showIcon
                        style={{ marginBottom: 8 }}
                    />
                );
            }
        }
        
        // Check maintenance expiry from vehicle fields
        if (vehicle.nextMaintenanceDate) {
            const nextDate = dayjs(vehicle.nextMaintenanceDate);
            const daysUntil = nextDate.diff(now, 'day');
            
            if (daysUntil < 0) {
                // Overdue maintenance
                warnings.push(
                    <Alert
                        key="maintenance-overdue"
                        message="Bảo dưỡng quá hạn"
                        description={`Xe ${vehicle.licensePlateNumber} đã quá hạn bảo dưỡng ${Math.abs(daysUntil)} ngày`}
                        type="error"
                        showIcon
                        action={
                            <Button 
                                size="small" 
                                type="primary" 
                                danger
                                onClick={() => handleCreateMaintenanceSchedule('MAINTENANCE')}
                            >
                                Đặt lịch bảo dưỡng
                            </Button>
                        }
                        style={{ marginBottom: 8 }}
                    />
                );
            } else if (daysUntil <= 7) {
                // Critical maintenance (gấp - ≤7 ngày)
                warnings.push(
                    <Alert
                        key="maintenance-critical"
                        message="Bảo dưỡng gấp"
                        description={`Xe ${vehicle.licensePlateNumber} sẽ đến hạn bảo dưỡng trong ${daysUntil} ngày nữa`}
                        type="error"
                        showIcon
                        action={
                            <Button 
                                size="small" 
                                type="primary"
                                danger
                                onClick={() => handleCreateMaintenanceSchedule('MAINTENANCE')}
                            >
                                Đặt lịch bảo dưỡng
                            </Button>
                        }
                        style={{ marginBottom: 8 }}
                    />
                );
            } else if (daysUntil <= 30) {
                // Warning maintenance (cảnh báo - 8-30 ngày)
                warnings.push(
                    <Alert
                        key="maintenance-warning"
                        message="Sắp đến hạn bảo dưỡng"
                        description={`Xe ${vehicle.licensePlateNumber} sẽ đến hạn bảo dưỡng trong ${daysUntil} ngày nữa`}
                        type="warning"
                        showIcon
                        action={
                            <Button 
                                size="small" 
                                type="primary"
                                onClick={() => handleCreateMaintenanceSchedule('MAINTENANCE')}
                            >
                                Đặt lịch bảo dưỡng
                            </Button>
                        }
                        style={{ marginBottom: 8 }}
                    />
                );
            }
        }

        // Also check maintenance records for additional warnings
        if (vehicle.vehicleMaintenanceResponse && vehicle.vehicleMaintenanceResponse.length > 0) {
            const pendingMaintenances = vehicle.vehicleMaintenanceResponse.filter(m => 
                m.serviceStatus === 'PLANNED'
            );
            
            pendingMaintenances.forEach((maintenance, index) => {
                if (maintenance.plannedDate) {
                    const plannedDate = dayjs(maintenance.plannedDate);
                    const daysUntil = plannedDate.diff(now, 'day');
                    
                    if (daysUntil < 0) {
                        // Overdue scheduled maintenance
                        warnings.push(
                            <Alert
                                key={`scheduled-overdue-${index}`}
                                message="Lịch bảo trì quá hạn"
                                description={`${maintenance.serviceType || 'Bảo trì'} đã quá hạn ${Math.abs(daysUntil)} ngày`}
                                type="error"
                                showIcon
                                style={{ marginBottom: 8 }}
                            />
                        );
                    } else if (daysUntil <= 3) {
                        // Upcoming scheduled maintenance
                        warnings.push(
                            <Alert
                                key={`scheduled-upcoming-${index}`}
                                message="Sắp đến lịch bảo trì"
                                description={`${maintenance.serviceType || 'Bảo trì'} sẽ diễn ra trong ${daysUntil} ngày nữa`}
                                type="info"
                                showIcon
                                style={{ marginBottom: 8 }}
                            />
                        );
                    }
                }
            });
        }

        console.log('🔍 DEBUG: Generated warnings count:', warnings.length);
        return warnings;
    };

    const handleViewPenalty = (penalty: Penalty) => {
        setSelectedPenalty(penalty);
        setIsPenaltyModalOpen(true);
    };

    const handleOpenEditModal = () => {
        setIsEditModalOpen(true);
    };

// ... (rest of the code remains the same)
    const handleEditVehicle = async (values: any) => {
        if (!id) return;

        try {
            setLoading(true);

            const response = await vehicleService.updateVehicle(id, {
                licensePlateNumber: values.licensePlateNumber,
                model: values.model,
                manufacturer: values.manufacturer,
                year: values.year,
                status: values.status,
                vehicleTypeId: values.vehicleTypeId,
                currentLatitude: vehicle?.currentLatitude,
                currentLongitude: vehicle?.currentLongitude
            });

            if (response.success) {
                message.success('Cập nhật phương tiện thành công');
                // Refresh vehicle data
                const detailResponse = await getVehicleDetail(id);
                if (detailResponse.success && detailResponse.data) {
                    setVehicle(detailResponse.data);
                }
                setIsEditModalOpen(false);
            } else {
                message.warning(response.message || 'Không thể cập nhật phương tiện');
            }
        } catch (error) {
            console.error('Error updating vehicle:', error);
            message.error('Có lỗi xảy ra khi cập nhật phương tiện');
        } finally {
            setLoading(false);
        }
    };

    const assignmentColumns = [
        {
            title: 'Tài xế 1',
            dataIndex: 'driver_id_1',
            key: 'driver_id_1',
        },
        {
            title: 'Tài xế 2',
            dataIndex: 'driver_id_2',
            key: 'driver_id_2',
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => getStatusTag(status),
        },
    ];

    const topDriverColumns = [
        {
            title: 'Hạng',
            key: 'rank',
            width: 80,
            render: (_: any, __: any, index: number) => (
                <Space>
                    {index === 0 && <TrophyOutlined style={{ color: '#ffd700', fontSize: 20 }} />}
                    {index === 1 && <TrophyOutlined style={{ color: '#c0c0c0', fontSize: 18 }} />}
                    {index === 2 && <TrophyOutlined style={{ color: '#cd7f32', fontSize: 16 }} />}
                    <Text strong>#{index + 1}</Text>
                </Space>
            ),
        },
        {
            title: 'Tài xế',
            dataIndex: 'driverName',
            key: 'driverName',
            render: (name: string) => <Text strong>{name}</Text>,
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'driverPhoneNumber',
            key: 'driverPhoneNumber',
            render: (phone: string) => (
                <Space>
                    <PhoneOutlined />
                    {phone}
                </Space>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'driverStatus',
            key: 'driverStatus',
            render: (status: string) => {
                const color = status?.toLowerCase() === 'active' ? 'green' : 'red';
                return <Tag color={color}>{status}</Tag>;
            },
        },
        {
            title: 'Số chuyến',
            dataIndex: 'tripCount',
            key: 'tripCount',
            render: (count: number) => (
                <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
                    {count}
                </Text>
            ),
        },
    ];

    const penaltyColumns = [
        {
            title: 'Ngày vi phạm',
            dataIndex: 'penaltyDate',
            key: 'penaltyDate',
            width: 150,
            render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
        },
        {
            title: 'Loại vi phạm',
            dataIndex: 'violationType',
            key: 'violationType',
            width: 200,
            render: (type: string) => <Text strong>{type}</Text>,
        },
        {
            title: 'Tài xế',
            key: 'driver',
            width: 180,
            render: (_: any, record: Penalty) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.driverSummary?.fullName || 'N/A'}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.driverSummary?.phoneNumber || ''}
                    </Text>
                </Space>
            ),
        },
        {
            title: 'Chuyến xe',
            key: 'trip',
            width: 150,
            render: (_: any, record: Penalty) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.vehicleAssignment?.trackingCode || 'N/A'}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.vehicleAssignment?.vehiclePlateNumber || ''}
                    </Text>
                </Space>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 120,
            render: (_: any, record: Penalty) => (
                <Button
                    type="link"
                    size="small"
                    onClick={() => handleViewPenalty(record)}
                >
                    Xem chi tiết
                </Button>
            ),
        },
    ];

    const maintenanceColumns = [
        {
            title: 'Loại dịch vụ',
            dataIndex: 'serviceType',
            key: 'serviceType',
            width: 120,
            render: (serviceType: string) => serviceType || 'Chưa xác định',
        },
        {
            title: 'Ngày lên lịch',
            dataIndex: 'plannedDate',
            key: 'plannedDate',
            width: 120,
            render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : 'Chưa xác định',
        },
        {
            title: 'Ngày thực hiện',
            dataIndex: 'actualDate',
            key: 'actualDate',
            width: 120,
            render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : 'Chưa thực hiện',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'serviceStatus',
            key: 'serviceStatus',
            width: 120,
            render: (status: string) => {
                if (!status) return <Tag color="default">Chưa xác định</Tag>;
                const color = VEHICLE_SERVICE_STATUS_COLORS[status as keyof typeof VEHICLE_SERVICE_STATUS_COLORS] || 'default';
                const label = VEHICLE_SERVICE_STATUS_LABELS[status as keyof typeof VEHICLE_SERVICE_STATUS_LABELS] || status;
                return <Tag color={color}>{label}</Tag>;
            },
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            width: 180,
            ellipsis: true,
            render: (description: string) => description || 'Không có mô tả',
        },
        {
            title: 'Ngày tiếp theo',
            dataIndex: 'nextServiceDate',
            key: 'nextServiceDate',
            width: 120,
            render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : 'Chưa xác định',
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 100,
            fixed: 'right' as const,
            render: (_: any, record: VehicleServiceRecord) => (
                <Button
                    type="link"
                    size="small"
                    onClick={() => handleViewMaintenanceDetail(record)}
                >
                    Xem chi tiết
                </Button>
            ),
        },
    ];

    const renderStatus = (text: string) => {
        return <VehicleStatusTag status={text as VehicleStatusEnum} />;
    };

    if (loading) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <Skeleton active paragraph={{ rows: 10 }} />
            </div>
        );
    }

    if (!vehicle) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <Title level={4}>Không tìm thấy thông tin phương tiện</Title>
                <Button type="primary" onClick={() => navigate('/admin/vehicles')}>
                    Quay lại danh sách
                </Button>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Breadcrumb */}
            <Breadcrumb className="mb-4">
                <Breadcrumb.Item href="/admin/dashboard">
                    <HomeOutlined className="mr-1" />
                    <span>Trang chủ</span>
                </Breadcrumb.Item>
                <Breadcrumb.Item href="/admin/vehicles">
                    <CarFilled className="mr-1" />
                    <span>Phương tiện</span>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <span>{vehicle.licensePlateNumber}</span>
                </Breadcrumb.Item>
            </Breadcrumb>

            {/* Header */}
            <div className="flex items-center mb-6">
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/admin/vehicles')}
                    className="mr-4"
                >
                    Quay lại
                </Button>
                <Title level={2} className="m-0 flex items-center">
                    <CarFilled className="mr-3 text-blue-500" />
                    Chi tiết phương tiện
                </Title>
            </div>

            <Row gutter={[24, 24]}>
                {/* Left Column - Vehicle Info */}
                <Col xs={24} lg={8}>
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col items-center text-center mb-6">
                            <Avatar
                                size={120}
                                className="mb-4 bg-blue-100 flex items-center justify-center"
                                icon={<CarOutlined style={{ fontSize: 64 }} />}
                            />
                            <Title level={3} className="m-0 mb-2">{vehicle.licensePlateNumber}</Title>
                            <VehicleStatusTag status={vehicle.status as VehicleStatusEnum} />
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center mb-3">
                                <ShopOutlined className="mr-3 text-gray-500" />
                                <div>
                                    <Text type="secondary" className="block text-xs">Nhà sản xuất</Text>
                                    <Text>{vehicle.manufacturer}</Text>
                                </div>
                            </div>
                            <div className="flex items-center mb-3">
                                <CarOutlined className="mr-3 text-gray-500" />
                                <div>
                                    <Text type="secondary" className="block text-xs">Mẫu xe</Text>
                                    <Text>{vehicle.model}</Text>
                                </div>
                            </div>
                            <div className="flex items-center mb-3">
                                <CalendarOutlined className="mr-3 text-gray-500" />
                                <div>
                                    <Text type="secondary" className="block text-xs">Năm sản xuất</Text>
                                    <Text>{vehicle.year}</Text>
                                </div>
                            </div>
                            <div className="flex items-center mb-3">
                                <TagOutlined className="mr-3 text-gray-500" />
                                <div>
                                    <Text type="secondary" className="block text-xs">Loại phương tiện</Text>
                                    <Text>{vehicle.vehicleTypeResponse?.description || 'Không có mô tả'}</Text>
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-4 mt-4">
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Button
                                    type={vehicle.status.toLowerCase() === 'active' ? 'default' : 'primary'}
                                    danger={vehicle.status.toLowerCase() === 'active'}
                                    block
                                    onClick={handleOpenStatusModal}
                                    icon={vehicle.status.toLowerCase() === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}
                                >
                                    {vehicle.status.toLowerCase() === 'active' ? 'Vô hiệu hóa phương tiện' : 'Kích hoạt phương tiện'}
                                </Button>
                                <Button type="default" block onClick={handleOpenEditModal}>Chỉnh sửa thông tin</Button>
                            </Space>
                        </div>
                    </Card>
                </Col>

                {/* Right Column - Details with Tabs */}
                <Col xs={24} lg={16}>
                    <Card className="shadow-sm">
                        <Tabs activeKey={activeTab} onChange={setActiveTab}>
                            {/* Tab 1: Vehicle Info */}
                            <TabPane tab="Thông tin xe" key="info">
                                <Descriptions bordered column={2} layout="horizontal">
                                    <Descriptions.Item label="Biển số xe">{vehicle.licensePlateNumber}</Descriptions.Item>
                                    <Descriptions.Item label="Mẫu xe">{vehicle.model}</Descriptions.Item>
                                    <Descriptions.Item label="Nhà sản xuất">{vehicle.manufacturer}</Descriptions.Item>
                                    <Descriptions.Item label="Năm sản xuất">{vehicle.year}</Descriptions.Item>
                                    <Descriptions.Item label="Loại phương tiện">
                                        {vehicle.vehicleTypeResponse?.description || vehicle.vehicleTypeResponse?.vehicleTypeName}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Trạng thái">
                                        <VehicleStatusTag status={vehicle.status as VehicleStatusEnum} />
                                    </Descriptions.Item>
                                    {vehicle.lastInspectionDate && (
                                        <Descriptions.Item label="Đăng kiểm gần nhất">
                                            {dayjs(vehicle.lastInspectionDate).format('DD/MM/YYYY')}
                                        </Descriptions.Item>
                                    )}
                                    {vehicle.inspectionExpiryDate && (
                                        <Descriptions.Item label="Hạn đăng kiểm">
                                            <span style={{ 
                                                color: vehicle.isInspectionExpiringSoon ? '#ff4d4f' : 'inherit',
                                                fontWeight: vehicle.isInspectionExpiringSoon ? 'bold' : 'normal'
                                            }}>
                                                {dayjs(vehicle.inspectionExpiryDate).format('DD/MM/YYYY')}
                                                {vehicle.isInspectionExpiringSoon && vehicle.daysUntilInspectionExpiry && 
                                                    ` (${vehicle.daysUntilInspectionExpiry} ngày)`
                                                }
                                            </span>
                                        </Descriptions.Item>
                                    )}
                                    {vehicle.insuranceExpiryDate && (
                                        <Descriptions.Item label="Hạn bảo hiểm">
                                            <span style={{ 
                                                color: vehicle.isInsuranceExpiringSoon ? '#ff4d4f' : 'inherit',
                                                fontWeight: vehicle.isInsuranceExpiringSoon ? 'bold' : 'normal'
                                            }}>
                                                {dayjs(vehicle.insuranceExpiryDate).format('DD/MM/YYYY')}
                                                {vehicle.isInsuranceExpiringSoon && vehicle.daysUntilInsuranceExpiry && 
                                                    ` (${vehicle.daysUntilInsuranceExpiry} ngày)`
                                                }
                                            </span>
                                        </Descriptions.Item>
                                    )}
                                    {vehicle.insurancePolicyNumber && (
                                        <Descriptions.Item label="Số bảo hiểm">
                                            {vehicle.insurancePolicyNumber}
                                        </Descriptions.Item>
                                    )}
                                    {vehicle.lastMaintenanceDate && (
                                        <Descriptions.Item label="Bảo trì gần nhất">
                                            {dayjs(vehicle.lastMaintenanceDate).format('DD/MM/YYYY')}
                                        </Descriptions.Item>
                                    )}
                                    {vehicle.nextMaintenanceDate && (
                                        <Descriptions.Item label="Bảo trì tiếp theo">
                                            <span style={{ 
                                                color: vehicle.isMaintenanceDueSoon ? '#ff4d4f' : 'inherit',
                                                fontWeight: vehicle.isMaintenanceDueSoon ? 'bold' : 'normal'
                                            }}>
                                                {dayjs(vehicle.nextMaintenanceDate).format('DD/MM/YYYY')}
                                                {vehicle.isMaintenanceDueSoon && vehicle.daysUntilNextMaintenance && 
                                                    ` (${vehicle.daysUntilNextMaintenance} ngày)`
                                                }
                                            </span>
                                        </Descriptions.Item>
                                    )}
                                    {/* {vehicle.currentLatitude && vehicle.currentLongitude && (
                                        <Descriptions.Item label="Vị trí hiện tại" span={2}>
                                            {`${vehicle.currentLatitude}, ${vehicle.currentLongitude}`}
                                        </Descriptions.Item>
                                    )} */}
                                </Descriptions>
                            </TabPane>

                            {/* Tab 2: Assignment History */}
                            <TabPane 
                                tab={
                                    <Space>
                                        <UserAddOutlined />
                                        <span>Lịch sử phân công ({vehicle.vehicleAssignmentResponse?.length || 0})</span>
                                    </Space>
                                } 
                                key="assignments"
                            >
                                <div className="mb-4">
                                    <Button
                                        type="primary"
                                        icon={<UserAddOutlined />}
                                        onClick={handleOpenAssignDriverModal}
                                    >
                                        Phân công tài xế
                                    </Button>
                                </div>
                                <Table
                                    dataSource={vehicle.vehicleAssignmentResponse || []}
                                    columns={assignmentColumns}
                                    rowKey="id"
                                    pagination={{ 
                                        pageSize: 10,
                                        current: assignmentPage,
                                        onChange: setAssignmentPage,
                                        showSizeChanger: false
                                    }}
                                    size="small"
                                    locale={{ emptyText: <Empty description="Chưa có lịch sử phân công" /> }}
                                />
                            </TabPane>

                            {/* Tab 3: Maintenance History */}
                            <TabPane 
                                tab={
                                    <Space>
                                        <ToolOutlined />
                                        <span>Lịch sử bảo trì ({vehicle.vehicleMaintenanceResponse?.length || 0})</span>
                                    </Space>
                                } 
                                key="maintenances"
                            >
                                {/* Maintenance Warnings */}
                                <div className="mb-4">
                                    {getMaintenanceWarnings()}
                                </div>
                                
                                <div className="mb-4">
                                    <Button
                                        type="primary"
                                        icon={<ToolOutlined />}
                                        onClick={() => handleCreateMaintenanceSchedule()}
                                    >
                                        Tạo lịch bảo trì/đăng kiểm
                                    </Button>
                                </div>
                                <Table
                                    dataSource={vehicle.vehicleMaintenanceResponse || []}
                                    columns={maintenanceColumns}
                                    rowKey="id"
                                    pagination={{ 
                                        pageSize: 10,
                                        current: maintenancePage,
                                        onChange: setMaintenancePage,
                                        showSizeChanger: false
                                    }}
                                    size="small"
                                    scroll={{ x: 900 }}
                                    locale={{ emptyText: <Empty description="Chưa có lịch sử bảo trì" /> }}
                                />
                            </TabPane>

                            {/* Tab 4: Top Drivers */}
                            <TabPane 
                                tab={
                                    <Space>
                                        <TrophyOutlined />
                                        <span>Top tài xế</span>
                                    </Space>
                                } 
                                key="topDrivers"
                            >
                                {vehicle.topDrivers && vehicle.topDrivers.length > 0 ? (
                                    <Table
                                        dataSource={vehicle.topDrivers}
                                        columns={topDriverColumns}
                                        rowKey="driverId"
                                        pagination={false}
                                        size="small"
                                    />
                                ) : (
                                    <Empty 
                                        description="Chưa có dữ liệu tài xế"
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    />
                                )}
                            </TabPane>

                            {/* Tab 5: Penalties */}
                            <TabPane 
                                tab={
                                    <Space>
                                        <ExclamationCircleOutlined />
                                        <span>Vi phạm giao thông ({vehicle.penalties?.length || 0})</span>
                                    </Space>
                                } 
                                key="penalties"
                            >
                                {vehicle.penalties && vehicle.penalties.length > 0 ? (
                                    <>
                                        <Row gutter={16} className="mb-4">
                                            <Col span={12}>
                                                <Card size="small">
                                                    <Statistic
                                                        title="Tổng vi phạm"
                                                        value={vehicle.penalties.length}
                                                        prefix={<ExclamationCircleOutlined />}
                                                        valueStyle={{ color: '#ff4d4f' }}
                                                    />
                                                </Card>
                                            </Col>
                                            <Col span={12}>
                                                <Card size="small">
                                                    <Statistic
                                                        title="Có hình ảnh"
                                                        value={vehicle.penalties.filter(p => p.trafficViolationRecordImageUrl).length}
                                                        prefix={<ExclamationCircleOutlined />}
                                                        valueStyle={{ color: '#faad14' }}
                                                    />
                                                </Card>
                                            </Col>
                                        </Row>
                                        <Table
                                            dataSource={vehicle.penalties}
                                            columns={penaltyColumns}
                                            rowKey="id"
                                            pagination={{ pageSize: 10, showSizeChanger: false }}
                                            size="small"
                                            scroll={{ x: 800 }}
                                        />
                                    </>
                                ) : (
                                    <Empty 
                                        description="Không có vi phạm giao thông"
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    />
                                )}
                            </TabPane>
                        </Tabs>
                    </Card>
                </Col>
            </Row>

            {/* Modals */}
            <AssignDriverModal
                visible={isAssignDriverModalOpen}
                vehicleId={vehicle.id}
                onCancel={() => setIsAssignDriverModalOpen(false)}
                onSuccess={handleAssignDriverSuccess}
            />

            <ScheduleMaintenanceModal
                visible={isScheduleMaintenanceModalOpen}
                vehicleId={vehicle.id}
                onCancel={() => setIsScheduleMaintenanceModalOpen(false)}
                onSuccess={handleScheduleMaintenanceSuccess}
            />

            <StatusChangeModal
                visible={isStatusModalOpen}
                loading={statusModalLoading}
                title="Thay đổi trạng thái phương tiện"
                icon={<CarFilled />}
                entityName={vehicle.licensePlateNumber}
                entityDescription={`${vehicle.manufacturer} ${vehicle.model} (${vehicle.year})`}
                avatarIcon={<CarFilled />}
                currentStatus={vehicle.status}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
                statusOptions={statusOptions}
                selectedStatus={selectedStatus}
                onStatusChange={handleStatusChange}
                onOk={handleConfirmStatusChange}
                onCancel={() => setIsStatusModalOpen(false)}
            />

            <PenaltyModal
                visible={isPenaltyModalOpen}
                penalty={selectedPenalty}
                onCancel={() => {
                    setIsPenaltyModalOpen(false);
                    setSelectedPenalty(null);
                }}
            />

            <Modal
                title="Chỉnh sửa thông tin phương tiện"
                open={isEditModalOpen}
                onCancel={() => setIsEditModalOpen(false)}
                footer={null}
                width={700}
            >
                <VehicleForm
                    mode="edit"
                    initialValues={{
                        ...vehicle,
                        vehicleTypeId: vehicle.vehicleTypeResponse?.id
                    }}
                    onSubmit={handleEditVehicle}
                    onCancel={() => setIsEditModalOpen(false)}
                />
            </Modal>

            {/* Maintenance Detail Modal - Using VehicleDetailModal */}
            <VehicleDetailModal
                visible={isMaintenanceDetailModalOpen}
                onClose={() => {
                    setIsMaintenanceDetailModalOpen(false);
                    setSelectedMaintenance(null);
                }}
                vehicle={vehicle as Vehicle}
                maintenances={selectedMaintenance ? [selectedMaintenance] : []}
                onRefresh={async () => {
                    if (id) {
                        const response = await getVehicleDetail(id);
                        if (response.success && response.data) {
                            setVehicle(response.data);
                        }
                    }
                }}
            />

            {/* Create Maintenance Schedule Modal */}
            <Modal
                title="Tạo lịch bảo trì mới"
                open={isCreateMaintenanceModalOpen}
                onCancel={() => {
                    setIsCreateMaintenanceModalOpen(false);
                    setSelectedMaintenance(null);
                }}
                footer={null}
                width={1200}
                styles={{ body: { maxHeight: '80vh', overflowY: 'auto' } }}
            >
                {selectedMaintenance && (
                    <MaintenanceForm
                        initialValues={selectedMaintenance}
                        isEditMode={false}
                        onSubmit={handleMaintenanceFormSubmit}
                        onCancel={() => {
                            setIsCreateMaintenanceModalOpen(false);
                            setSelectedMaintenance(null);
                        }}
                        vehicles={[vehicle]}
                    />
                )}
            </Modal>
        </div>
    );
};

export default VehicleDetailPage;