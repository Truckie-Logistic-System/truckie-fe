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
    Skeleton
} from 'antd';
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
    InboxOutlined
} from '@ant-design/icons';
import { vehicleService } from '../../../services';
import type { VehicleDetail, VehicleAssignment, VehicleMaintenance, Vehicle } from '../../../models';
import AssignDriverModal from './components/AssignDriverModal';
import ScheduleMaintenanceModal from './components/ScheduleMaintenanceModal';
import StatusChangeModal from '../../../components/common/StatusChangeModal';
import type { StatusOption } from '../../../components/common/StatusChangeModal';
import type { ApiResponse } from '../../../services/api/types';
import { VehicleStatusTag } from '@/components/common';
import { VehicleStatusEnum } from '@/constants/enums';

const { Title, Text } = Typography;

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

    // Helper function to get vehicle details and handle type casting
    const getVehicleDetail = async (vehicleId: string): Promise<VehicleDetailResponse> => {
        const response = await vehicleService.getVehicleById(vehicleId);

        if (response.success && response.data) {
            // Create a default VehicleDetail structure if data is missing properties
            const vehicleData = response.data as Vehicle;

            const vehicleDetail: VehicleDetail = {
                ...vehicleData,
                vehicleAssignmentResponse: [],
                vehicleMaintenanceResponse: [],
                vehicleTypeResponse: {
                    id: vehicleData.vehicleTypeId,
                    vehicleTypeName: '',
                    description: ''
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
                capacity,
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
                capacity,
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

    const maintenanceColumns = [
        {
            title: 'Ngày bảo trì',
            dataIndex: 'maintenanceDate',
            key: 'maintenanceDate',
            render: (date: string) => date ? new Date(date).toLocaleDateString('vi-VN') : 'Chưa xác định',
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Chi phí',
            dataIndex: 'cost',
            key: 'cost',
            render: (cost: number) => `${cost.toLocaleString('vi-VN')} VND`,
        },
        {
            title: 'Trung tâm dịch vụ',
            dataIndex: 'serviceCenter',
            key: 'serviceCenter',
        },
        {
            title: 'Ngày bảo trì tiếp theo',
            dataIndex: 'nextMaintenanceDate',
            key: 'nextMaintenanceDate',
            render: (date: string) => date ? new Date(date).toLocaleDateString('vi-VN') : 'Chưa xác định',
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
                                <InboxOutlined className="mr-3 text-gray-500" />
                                <div>
                                    <Text type="secondary" className="block text-xs">Sức chứa</Text>
                                    <Text>{vehicle.capacity} kg</Text>
                                </div>
                            </div>
                            <div className="flex items-center mb-3">
                                <TagOutlined className="mr-3 text-gray-500" />
                                <div>
                                    <Text type="secondary" className="block text-xs">Loại phương tiện</Text>
                                    <Text>{vehicle.vehicleTypeResponse?.vehicleTypeName}</Text>
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
                                <Button type="default" block>Chỉnh sửa thông tin</Button>
                            </Space>
                        </div>
                    </Card>
                </Col>

                {/* Right Column - Details */}
                <Col xs={24} lg={16}>
                    {/* Vehicle Details */}
                    <Card title="Thông tin chi tiết" className="shadow-sm mb-6">
                        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
                            <Descriptions.Item label="Biển số xe">{vehicle.licensePlateNumber}</Descriptions.Item>
                            <Descriptions.Item label="Mẫu xe">{vehicle.model}</Descriptions.Item>
                            <Descriptions.Item label="Nhà sản xuất">{vehicle.manufacturer}</Descriptions.Item>
                            <Descriptions.Item label="Năm sản xuất">{vehicle.year}</Descriptions.Item>
                            <Descriptions.Item label="Sức chứa">{`${vehicle.capacity} kg`}</Descriptions.Item>
                            <Descriptions.Item label="Loại phương tiện">{vehicle.vehicleTypeResponse?.vehicleTypeName}</Descriptions.Item>
                            <Descriptions.Item label="Mô tả loại phương tiện" span={2}>
                                {vehicle.vehicleTypeResponse?.description}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>

                    {/* Assignment History */}
                    <Card
                        title="Lịch sử phân công"
                        className="shadow-sm mb-6"
                        extra={
                            <Button
                                type="primary"
                                icon={<UserAddOutlined />}
                                onClick={handleOpenAssignDriverModal}
                            >
                                Phân công tài xế
                            </Button>
                        }
                    >
                        <Table
                            dataSource={vehicle.vehicleAssignmentResponse || []}
                            columns={assignmentColumns}
                            rowKey="id"
                            pagination={{ pageSize: 5 }}
                            size="small"
                            locale={{ emptyText: 'Chưa có lịch sử phân công' }}
                        />
                    </Card>

                    {/* Maintenance History */}
                    <Card
                        title="Lịch sử bảo trì"
                        className="shadow-sm"
                        extra={
                            <Button
                                type="primary"
                                icon={<ToolOutlined />}
                                onClick={handleOpenScheduleMaintenanceModal}
                            >
                                Đặt lịch bảo trì
                            </Button>
                        }
                    >
                        <Table
                            dataSource={vehicle.vehicleMaintenanceResponse || []}
                            columns={maintenanceColumns}
                            rowKey="id"
                            pagination={{ pageSize: 5 }}
                            size="small"
                            locale={{ emptyText: 'Chưa có lịch sử bảo trì' }}
                        />
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
        </div>
    );
};

export default VehicleDetailPage; 