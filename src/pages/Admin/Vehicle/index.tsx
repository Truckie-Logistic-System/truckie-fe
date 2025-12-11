import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, App, Typography, Tag, Tabs, Collapse, Badge, Card, Row, Col, Empty, Input, Form, Select, DatePicker, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, CarFilled, CheckCircleOutlined, StopOutlined, CarOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { vehicleService } from '../../../services';
import type { Vehicle, CreateVehicleRequest, UpdateVehicleRequest, VehicleType } from '../../../models';
import VehicleSkeleton from './components/VehicleSkeleton';
import VehicleForm from './components/VehicleForm';
import VehicleTypeManagement from './components/VehicleTypeManagement';
import EntityManagementLayout from '../../../components/features/admin/EntityManagementLayout';
import VehicleTypeForm from './components/VehicleTypeForm';
import StatusChangeModal from '../../../components/common/StatusChangeModal';
import type { StatusOption } from '../../../components/common/StatusChangeModal';
import { VehicleStatusEnum } from '@/constants/enums';
import { VehicleStatusTag } from '@/components/common/tags';
import VehicleStatCards from './components/VehicleStatCards';
import MaintenanceAlertBanner from '../../../components/MaintenanceAlertBanner';
import MaintenanceForm from '../VehicleMaintenance/components/MaintenanceForm';
import dayjs from 'dayjs';
import './styles/VehiclePage.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const VehiclePage: React.FC = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [typesLoading, setTypesLoading] = useState<boolean>(true);
    const [isFetching, setIsFetching] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isVehicleTypeModalOpen, setIsVehicleTypeModalOpen] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [vehicleTypeModalMode, setVehicleTypeModalMode] = useState<'create' | 'edit'>('create');
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType | null>(null);
    const [searchText, setSearchText] = useState<string>('');
    const [activeTab, setActiveTab] = useState<string>('vehicles');
    const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
    const [statusModalLoading, setStatusModalLoading] = useState<boolean>(false);
    const [selectedStatus, setSelectedStatus] = useState<string>('active');
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState<boolean>(false);
    const [selectedMaintenance, setSelectedMaintenance] = useState<any>(null);
    const [maintenanceFormData, setMaintenanceFormData] = useState<{vehicleId: string, serviceType: string} | null>(null);
    const [groupedView, setGroupedView] = useState<boolean>(true);
    const [bannerRefreshCounter, setBannerRefreshCounter] = useState<number>(0);
    const { message } = App.useApp();
    const navigate = useNavigate();

    const fetchVehicles = async () => {
        try {
            setIsFetching(true);
            setLoading(true); // Đảm bảo loading được bật khi bắt đầu fetch
            const response = await vehicleService.getVehicles();
            if (response.success) {
                setVehicles(response.data || []);
            } else {
                // Không phải lỗi, chỉ là không có dữ liệu
                setVehicles([]);
            }
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            message.error('Không thể tải danh sách phương tiện');
            setVehicles([]);
        } finally {
            setIsFetching(false);
            // Không tắt loading ở đây, sẽ tắt sau khi cả vehicles và vehicleTypes đều được tải xong
        }
    };

    const fetchVehicleTypes = async () => {
        try {
            setTypesLoading(true);
            const response = await vehicleService.getVehicleTypes();
            if (response.success) {
                setVehicleTypes(response.data || []);
            } else {
                // Không phải lỗi, chỉ là không có dữ liệu
                setVehicleTypes([]);
            }
        } catch (error) {
            console.error('Error fetching vehicle types:', error);
            message.error('Không thể tải danh sách loại phương tiện');
            setVehicleTypes([]);
        } finally {
            setTypesLoading(false);
            // Không tắt loading ở đây, sẽ tắt sau khi cả vehicles và vehicleTypes đều được tải xong
        }
    };

    useEffect(() => {
        // Gọi cả hai API để lấy dữ liệu
        fetchVehicles();
        fetchVehicleTypes();
    }, []);

    // Sử dụng useEffect để theo dõi khi cả hai API đều hoàn thành
    useEffect(() => {
        // Chỉ tắt loading khi cả hai API đều hoàn thành (không còn trong trạng thái loading)
        if (!isFetching && !typesLoading) {

            setLoading(false);
        }
    }, [isFetching, typesLoading]);

    const handleOpenCreateModal = () => {
        setModalMode('create');
        setSelectedVehicle(null);
        setIsModalOpen(true);
    };

    const handleOpenVehicleTypeCreateModal = () => {
        setVehicleTypeModalMode('create');
        setSelectedVehicleType(null);
        setIsVehicleTypeModalOpen(true);
    };

    const handleOpenEditModal = (vehicle: Vehicle) => {
        setModalMode('edit');
        setSelectedVehicle(vehicle);
        setIsModalOpen(true);
    };

    const handleOpenVehicleTypeEditModal = (vehicleType: VehicleType) => {
        setVehicleTypeModalMode('edit');
        setSelectedVehicleType(vehicleType);
        setIsVehicleTypeModalOpen(true);
    };

    const handleViewDetails = (id: string) => {
        navigate(`/admin/vehicles/${id}`);
    };

    const handleOpenStatusModal = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setSelectedStatus(vehicle.status.toLowerCase() === 'active' ? 'inactive' : 'active');
        setIsStatusModalOpen(true);
    };

    const handleStatusChange = (status: string) => {
        setSelectedStatus(status);
    };

    const handleConfirmStatusChange = async () => {
        if (!selectedVehicle) return;

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
            } = selectedVehicle;

            // Tạo object mới không có trường id
            const response = await vehicleService.updateVehicle(selectedVehicle.id, {
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
                setIsStatusModalOpen(false);
                fetchVehicles();
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

    const handleFormSubmit = async (values: CreateVehicleRequest | UpdateVehicleRequest) => {
        try {
            if (selectedVehicle) {
                // Cập nhật phương tiện
                const response = await vehicleService.updateVehicle(selectedVehicle.id, {
                    licensePlateNumber: values.licensePlateNumber,
                    model: values.model,
                    manufacturer: values.manufacturer,
                    year: values.year,
                    status: values.status,
                    vehicleTypeId: values.vehicleTypeId,
                    currentLatitude: values.currentLatitude,
                    currentLongitude: values.currentLongitude
                });

                if (response.success) {
                    message.success('Cập nhật phương tiện thành công');
                    setIsModalOpen(false);
                    fetchVehicles();
                } else {
                    // Không phải lỗi, chỉ là không tìm thấy phương tiện để cập nhật
                    message.warning(response.message || 'Không tìm thấy phương tiện để cập nhật');
                }
            } else {
                // Tạo mới phương tiện
                const response = await vehicleService.createVehicle(values as CreateVehicleRequest);

                if (response.success) {
                    message.success('Thêm phương tiện thành công');
                    setIsModalOpen(false);
                    fetchVehicles();
                } else {
                    message.warning(response.message || 'Không thể thêm phương tiện');
                }
            }
        } catch (error) {
            console.error('Error submitting vehicle form:', error);
            message.error('Có lỗi xảy ra khi lưu thông tin phương tiện');
        }
    };

    const handleVehicleTypeFormSubmit = async (values: any) => {
        try {
            if (selectedVehicleType) {
                // Cập nhật loại phương tiện
                const response = await vehicleService.updateVehicleType(selectedVehicleType.id, values);

                if (response.success) {
                    message.success('Cập nhật loại phương tiện thành công');
                    setIsVehicleTypeModalOpen(false);
                    fetchVehicleTypes();
                } else {
                    // Không phải lỗi, chỉ là không tìm thấy loại phương tiện để cập nhật
                    message.warning(response.message || 'Không tìm thấy loại phương tiện để cập nhật');
                }
            } else {
                // Tạo mới loại phương tiện
                const response = await vehicleService.createVehicleType(values);

                if (response.success) {
                    message.success('Thêm loại phương tiện thành công');
                    setIsVehicleTypeModalOpen(false);
                    fetchVehicleTypes();
                } else {
                    message.warning(response.message || 'Không thể thêm loại phương tiện');
                }
            }
        } catch (error) {
            console.error('Error submitting vehicle type form:', error);
            message.error('Có lỗi xảy ra khi lưu thông tin loại phương tiện');
        }
    };

    const getStatusTag = (status: string) => {
        return <VehicleStatusTag status={status as VehicleStatusEnum} size="small" />;
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

    const handleCreateScheduleFromBanner = (vehicleId: string, serviceType: string) => {
        // Find the vehicle
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) {
            message.error('Không tìm thấy thông tin phương tiện');
            return;
        }

        // Clear selected maintenance to ensure create mode
        setSelectedMaintenance(null);
        
        // Create initial values for pre-filling the form
        const initialValues = {
            vehicleId: vehicleId,
            serviceType: serviceType,
            plannedDate: dayjs().add(1, 'day'),
            description: `Lịch ${serviceType} cho xe ${vehicle.licensePlateNumber}`
        };
        
        // Open modal in create mode with pre-filled data
        setSelectedMaintenance(initialValues);
        setIsMaintenanceModalOpen(true);
        
        message.info(`Tạo lịch ${serviceType} cho xe ${vehicle.licensePlateNumber}`);
    };

    const handleMaintenanceFormSubmit = async (values: any) => {
        try {
            if (selectedMaintenance && selectedMaintenance.id) {
                // Edit mode - not used in Vehicle page but kept for consistency
                const response = await vehicleService.updateVehicleMaintenance(selectedMaintenance.id, values);
                if (response.success) {
                    message.success('Cập nhật lịch bảo trì thành công');
                    setIsMaintenanceModalOpen(false);
                    setSelectedMaintenance(null);
                    setMaintenanceFormData(null);
                    // Fetch lại data để cập nhật banner
                    fetchVehicles();
                } else {
                    message.warning(response.message || 'Không thể cập nhật lịch bảo trì');
                }
            } else {
                // Create mode
                const response = await vehicleService.createVehicleMaintenance(values);
                if (response.success) {
                    message.success('Tạo lịch bảo trì thành công');
                    setIsMaintenanceModalOpen(false);
                    setSelectedMaintenance(null);
                    setMaintenanceFormData(null);
                    // Fetch lại data để cập nhật banner
                    fetchVehicles();
                    setBannerRefreshCounter(bannerRefreshCounter + 1);
                } else {
                    message.warning(response.message || 'Không thể tạo lịch bảo trì');
                }
            }
        } catch (error) {
            console.error('Error submitting maintenance form:', error);
            message.error('Có lỗi xảy ra khi lưu lịch bảo trì');
        }
    };

    const getExpiryWarnings = (vehicle: Vehicle) => {
        const warnings: React.ReactNode[] = [];
        
        if (vehicle.isInspectionExpiringSoon) {
            warnings.push(
                <Tag key="inspection" color="warning" style={{ marginBottom: 2 }}>
                    Đăng kiểm: {vehicle.daysUntilInspectionExpiry} ngày
                </Tag>
            );
        }
        if (vehicle.isInsuranceExpiringSoon) {
            warnings.push(
                <Tag key="insurance" color="warning" style={{ marginBottom: 2 }}>
                    Bảo hiểm: {vehicle.daysUntilInsuranceExpiry} ngày
                </Tag>
            );
        }
        if (vehicle.isMaintenanceDueSoon) {
            warnings.push(
                <Tag key="maintenance" color="warning" style={{ marginBottom: 2 }}>
                    Bảo trì: {vehicle.daysUntilNextMaintenance} ngày
                </Tag>
            );
        }
        
        // Check for expired status
        if (vehicle.status === 'INSPECTION_EXPIRED') {
            warnings.push(
                <Tag key="inspection-expired" color="error" style={{ marginBottom: 2 }}>
                    Hết hạn đăng kiểm
                </Tag>
            );
        }
        if (vehicle.status === 'INSURANCE_EXPIRED') {
            warnings.push(
                <Tag key="insurance-expired" color="error" style={{ marginBottom: 2 }}>
                    Hết hạn bảo hiểm
                </Tag>
            );
        }
        
        return warnings.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {warnings}
            </div>
        ) : <Tag color="success">Bình thường</Tag>;
    };

    const columns = [
        {
            title: 'Biển số xe',
            dataIndex: 'licensePlateNumber',
            key: 'licensePlateNumber',
            render: (text: string) => (
                <div className="max-w-[150px]" title={text}>
                    <Text ellipsis>{text}</Text>
                </div>
            )
        },
        {
            title: 'Mẫu xe',
            dataIndex: 'model',
            key: 'model',
        },
        {
            title: 'Nhà sản xuất',
            dataIndex: 'manufacturer',
            key: 'manufacturer',
        },
        {
            title: 'Năm sản xuất',
            dataIndex: 'year',
            key: 'year',
        },
        {
            title: 'Cảnh báo',
            key: 'warnings',
            render: (_: any, record: Vehicle) => getExpiryWarnings(record),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => getStatusTag(status),
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: Vehicle) => (
                <Space size="middle">
                    <Button
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetails(record.id)}
                        title="Xem chi tiết"
                    />
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => handleOpenEditModal(record)}
                        title="Chỉnh sửa"
                    />
                    {record.status.toLowerCase() === 'active' ? (
                        <Button
                            danger
                            icon={<StopOutlined />}
                            onClick={() => handleOpenStatusModal(record)}
                            title="Vô hiệu hóa"
                        />
                    ) : record.status.toLowerCase() === 'in_transit' ? (
                        <Button
                            disabled
                            icon={<StopOutlined />}
                            title="Không thể vô hiệu hóa xe đang di chuyển"
                        >
                            Đang di chuyển
                        </Button>
                    ) : (
                        <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={() => handleOpenStatusModal(record)}
                            title="Kích hoạt"
                        />
                    )}
                </Space>
            ),
        },
    ];

    const handleVehicleTypesChange = () => {
        // Refresh vehicles list to get updated vehicle type information
        fetchVehicleTypes();
        if (activeTab === 'vehicles') {
            fetchVehicles();
        }
    };

    const filteredVehicles = vehicles.filter(vehicle =>
        vehicle.licensePlateNumber.toLowerCase().includes(searchText.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchText.toLowerCase()) ||
        vehicle.manufacturer.toLowerCase().includes(searchText.toLowerCase())
    );

    // Lọc xe theo từng trạng thái trong VehicleStatusEnum
    const activeVehicles = vehicles.filter(vehicle => vehicle.status.toLowerCase() === 'active');
    const inactiveVehicles = vehicles.filter(vehicle => vehicle.status.toLowerCase() === 'inactive');
    const maintenanceVehicles = vehicles.filter(vehicle => vehicle.status.toLowerCase() === 'maintenance');
    const inTransitVehicles = vehicles.filter(vehicle => vehicle.status.toLowerCase() === 'in_transit');
    const breakdownVehicles = vehicles.filter(vehicle => vehicle.status.toLowerCase() === 'breakdown');
    const accidentVehicles = vehicles.filter(vehicle => vehicle.status.toLowerCase() === 'accident');

    // Nhóm phương tiện theo loại
    const groupedVehicles = vehicleTypes.map(type => {
        const vehiclesOfType = filteredVehicles.filter(vehicle => vehicle.vehicleTypeId === type.id);
        return {
            typeId: type.id,
            typeName: type.vehicleTypeName,
            description: type.description,
            vehicleTypeDescription: type.vehicleTypeDescription || type.vehicleTypeName,
            vehicles: vehiclesOfType,
            activeCount: vehiclesOfType.filter(v => v.status.toLowerCase() === 'active').length,
            transitCount: vehiclesOfType.filter(v => v.status.toLowerCase() === 'in_transit').length,
            inactiveCount: vehiclesOfType.filter(v => v.status.toLowerCase() === 'inactive').length
        };
    });

    // Lọc ra các nhóm có xe (để hiển thị)
    const nonEmptyGroups = groupedVehicles.filter(group => group.vehicles.length > 0);

    const renderVehicleCard = (vehicle: Vehicle) => (
        <Card
            key={vehicle.id}
            className="h-full hover:shadow-md transition-shadow"
            size="small"
            title={
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center truncate mr-2" style={{ maxWidth: 'calc(100% - 100px)' }}>
                        <CarOutlined className="mr-2 flex-shrink-0 text-blue-500 text-lg" />
                        <Text strong className="truncate text-blue-600" title={vehicle.licensePlateNumber}>
                            {vehicle.licensePlateNumber}
                        </Text>
                    </div>
                    <div className="flex-shrink-0">
                        {getStatusTag(vehicle.status)}
                    </div>
                </div>
            }
            headStyle={{
                backgroundColor: '#f0f5ff',
                borderBottom: '1px solid #d6e4ff'
            }}
            extra={null}
            bodyStyle={{
                padding: '12px',
                height: '100%'
            }}
        >
            <div className="flex flex-col h-full">
                <div className="grid grid-cols-2 gap-2">
                    <div className="vehicle-info-item">
                        <span className="vehicle-info-label">Mẫu xe:</span>
                        <span className="vehicle-info-value" title={vehicle.model}>{vehicle.model}</span>
                    </div>
                    <div className="vehicle-info-item">
                        <span className="vehicle-info-label">Nhà sản xuất:</span>
                        <span className="vehicle-info-value" title={vehicle.manufacturer}>{vehicle.manufacturer}</span>
                    </div>
                    <div className="vehicle-info-item">
                        <span className="vehicle-info-label">Năm sản xuất:</span>
                        <span className="vehicle-info-value">{vehicle.year}</span>
                    </div>
                </div>
                <div className="vehicle-card-actions">
                    <Space>
                        <Button
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetails(vehicle.id)}
                        >
                            Chi tiết
                        </Button>
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleOpenEditModal(vehicle)}
                        >
                            Sửa
                        </Button>
                        {vehicle.status.toLowerCase() === 'active' ? (
                            <Button
                                size="small"
                                danger
                                icon={<StopOutlined />}
                                onClick={() => handleOpenStatusModal(vehicle)}
                            >
                                Vô hiệu
                            </Button>
                        ) : vehicle.status.toLowerCase() === 'in_transit' ? (
                            <Button
                                size="small"
                                disabled
                                icon={<StopOutlined />}
                                title="Không thể vô hiệu hóa xe đang di chuyển"
                            >
                                Đang chạy
                            </Button>
                        ) : (
                            <Button
                                size="small"
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                onClick={() => handleOpenStatusModal(vehicle)}
                            >
                                Kích hoạt
                            </Button>
                        )}
                    </Space>
                </div>
            </div>
        </Card>
    );

    const renderGroupedVehicles = () => (
        <div>
            {nonEmptyGroups.length === 0 && !loading && !isFetching ? (
                <Empty description="Không tìm thấy phương tiện nào" />
            ) : (
                <Collapse defaultActiveKey={nonEmptyGroups.map(g => g.typeId)}>
                    {nonEmptyGroups.map(group => (
                        <Panel
                            key={group.typeId}
                            header={
                                <div className="flex items-center">
                                    <Title level={5} className="m-0 text-blue-700">
                                        {group.description || group.typeName}
                                    </Title>
                                </div>
                            }
                            extra={
                                <Space>
                                    <Badge count={group.activeCount} color="#22c55e" overflowCount={999} title="Đang hoạt động" />
                                    <Badge count={group.transitCount} color="#eab308" overflowCount={999} title="Đang di chuyển" />
                                    <Badge count={group.inactiveCount} color="#6b7280" overflowCount={999} title="Không hoạt động" />
                                </Space>
                            }
                            className="vehicle-type-panel"
                        >
                            <Row gutter={[16, 16]} className="equal-height-cards">
                                {group.vehicles.map(vehicle => (
                                    <Col xs={24} sm={24} md={8} lg={8} xl={8} key={vehicle.id} className="h-full">
                                        {renderVehicleCard(vehicle)}
                                    </Col>
                                ))}
                            </Row>
                        </Panel>
                    ))}
                </Collapse>
            )}
        </div>
    );

    const renderVehicleTab = () => {
        if (loading || isFetching) {
            return <VehicleSkeleton />;
        }

        return (
            <div>
                {/* Hiển thị card thống kê cho tất cả các trạng thái xe */}
                <VehicleStatCards vehicles={vehicles} loading={loading} />
                
                <div className="mb-4 flex justify-end">
                    <Button
                        type={groupedView ? "primary" : "default"}
                        onClick={() => setGroupedView(!groupedView)}
                    >
                        {groupedView ? "Xem dạng bảng" : "Xem theo nhóm"}
                    </Button>
                </div>
                
                {groupedView ? (
                    renderGroupedVehicles()
                ) : (
                    <Table
                        dataSource={filteredVehicles}
                        columns={columns}
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                        locale={{
                            emptyText: <Empty description="Không tìm thấy phương tiện nào" />
                        }}
                    />
                )}
            </div>
        );
    };

    const renderVehicleTypeTab = () => (
        <VehicleTypeManagement
            onEdit={handleOpenVehicleTypeEditModal}
        />
    );

    const renderTabs = () => (
        <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
        >
            <TabPane tab="Phương tiện" key="vehicles">
                {renderVehicleTab()}
            </TabPane>
            <TabPane tab="Loại phương tiện" key="vehicleTypes">
                {renderVehicleTypeTab()}
            </TabPane>
        </Tabs>
    );

    const renderModal = () => (
        <>
            <Modal
                title={modalMode === 'create' ? 'Thêm phương tiện mới' : 'Chỉnh sửa phương tiện'}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                maskClosable={false}
                width={700}
            >
                <VehicleForm
                    mode={modalMode}
                    initialValues={selectedVehicle || undefined}
                    onSubmit={(values: CreateVehicleRequest | UpdateVehicleRequest) => handleFormSubmit(values)}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>

            <Modal
                title={vehicleTypeModalMode === 'create' ? 'Thêm loại phương tiện mới' : 'Chỉnh sửa loại phương tiện'}
                open={isVehicleTypeModalOpen}
                onCancel={() => setIsVehicleTypeModalOpen(false)}
                footer={null}
                maskClosable={false}
            >
                <VehicleTypeForm
                    mode={vehicleTypeModalMode}
                    initialValues={selectedVehicleType || undefined}
                    onSubmit={handleVehicleTypeFormSubmit}
                    onCancel={() => setIsVehicleTypeModalOpen(false)}
                />
            </Modal>

            {selectedVehicle && (
                <StatusChangeModal
                    visible={isStatusModalOpen}
                    loading={statusModalLoading}
                    title="Thay đổi trạng thái phương tiện"
                    icon={<CarFilled />}
                    entityName={selectedVehicle.licensePlateNumber}
                    entityDescription={`${selectedVehicle.manufacturer} ${selectedVehicle.model} (${selectedVehicle.year})`}
                    avatarIcon={<CarFilled />}
                    currentStatus={selectedVehicle.status}
                    getStatusColor={getStatusColor}
                    getStatusText={getStatusText}
                    statusOptions={statusOptions}
                    selectedStatus={selectedStatus}
                    onStatusChange={handleStatusChange}
                    onOk={handleConfirmStatusChange}
                    onCancel={() => setIsStatusModalOpen(false)}
                />
            )}

            {/* Maintenance Modal - luôn ở chế độ tạo mới khi mở từ banner */}
            <Modal
                title="Tạo lịch bảo trì"
                open={isMaintenanceModalOpen}
                onCancel={() => {
                    setIsMaintenanceModalOpen(false);
                    setSelectedMaintenance(null);
                    setMaintenanceFormData(null);
                }}
                footer={null}
                maskClosable={false}
                width={1200}
                styles={{ body: { maxHeight: '80vh', overflowY: 'auto' } }}
            >
                <MaintenanceForm
                    initialValues={selectedMaintenance}
                    isEditMode={false}
                    onSubmit={handleMaintenanceFormSubmit}
                    onCancel={() => {
                        setIsMaintenanceModalOpen(false);
                        setSelectedMaintenance(null);
                        setMaintenanceFormData(null);
                    }}
                    vehicles={vehicles}
                />
            </Modal>
        </>
    );

    const renderContent = () => (
        <div>
            {renderModal()}
        </div>
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="flex items-center m-0 text-blue-800">
                            <CarFilled className="mr-3 text-blue-600" /> Quản lý phương tiện
                        </Title>
                        <Text type="secondary">Quản lý Thông tin phương tiện trong hệ thống</Text>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={activeTab === 'vehicles' ? handleOpenCreateModal : handleOpenVehicleTypeCreateModal}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="large"
                    >
                        {activeTab === 'vehicles' ? "Thêm phương tiện" : "Thêm loại phương tiện"}
                    </Button>
                </div>

                {/* Maintenance Alert Banner - only show on vehicles tab */}
                {activeTab === 'vehicles' && (
                    <MaintenanceAlertBanner 
                        onCreateSchedule={handleCreateScheduleFromBanner} 
                        refreshBanner={bannerRefreshCounter} 
                        className="mb-4"
                    />
                )}

                <Card className="shadow-sm mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                        <Title level={4} className="m-0 mb-4 md:mb-0">{activeTab === 'vehicles' ? "Danh sách phương tiện" : "Danh sách loại phương tiện"}</Title>
                        <div className="flex w-full md:w-auto gap-2">
                            <Input
                                placeholder="Tìm kiếm theo biển số, mẫu xe, nhà sản xuất..."
                                prefix={<SearchOutlined />}
                                className="w-full md:w-64"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                disabled={loading}
                            />
                            <Button
                                icon={<ReloadOutlined spin={isFetching} />}
                                onClick={fetchVehicles}
                                title="Làm mới dữ liệu"
                                loading={isFetching}
                            />
                        </div>
                    </div>

                    {renderTabs()}
                </Card>
            </div>

            {renderModal()}
        </div>
    );
};

export default VehiclePage;