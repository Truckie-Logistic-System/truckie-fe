import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, App, Typography, Tag, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, CarFilled, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { vehicleService } from '../../../services';
import type { Vehicle, CreateVehicleRequest, UpdateVehicleRequest, VehicleType } from '../../../models';
import VehicleSkeleton from './components/VehicleSkeleton';
import VehicleForm from './components/VehicleForm';
import VehicleTypeManagement from './components/VehicleTypeManagement';
import EntityManagementLayout from '../../../components/features/admin/EntityManagementLayout';
import VehicleTypeForm from './components/VehicleTypeForm';
import type { CreateVehicleTypeRequest, UpdateVehicleTypeRequest } from '../../../services/vehicle/types';
import StatusChangeModal from '../../../components/common/StatusChangeModal';
import type { StatusOption } from '../../../components/common/StatusChangeModal';
import { VehicleStatusEnum } from '@/constants/enums';
import { VehicleStatusTag } from '@/components/common/tags';

const { Title } = Typography;
const { TabPane } = Tabs;

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
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const { message } = App.useApp();
    const navigate = useNavigate();

    const fetchVehicles = async () => {
        try {
            setIsFetching(true);
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
            setLoading(false);
            setIsFetching(false);
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
        }
    };

    useEffect(() => {
        fetchVehicles();
        fetchVehicleTypes();
    }, []);

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
                capacity,
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
                capacity,
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
                    capacity: values.capacity,
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
        return <VehicleStatusTag status={status as VehicleStatusEnum} />;
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

    const columns = [
        {
            title: 'Biển số xe',
            dataIndex: 'licensePlateNumber',
            key: 'licensePlateNumber',
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
            title: 'Sức chứa',
            dataIndex: 'capacity',
            key: 'capacity',
            render: (capacity: number) => `${capacity} kg`,
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
                    {record.status.toLowerCase() === 'active' ? (
                        <Button
                            danger
                            icon={<StopOutlined />}
                            onClick={() => handleOpenStatusModal(record)}
                            title="Vô hiệu hóa"
                        />
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

    const activeVehicles = vehicles.filter(vehicle =>
        vehicle.status.toLowerCase() === 'active' ||
        vehicle.status.toLowerCase() === 'hoạt động'
    );

    const inactiveVehicles = vehicles.filter(vehicle =>
        vehicle.status.toLowerCase() === 'inactive' ||
        vehicle.status.toLowerCase() === 'không hoạt động' ||
        vehicle.status.toLowerCase() === 'banned' ||
        vehicle.status.toLowerCase() === 'bị cấm'
    );

    const renderVehicleTab = () => (
        loading ? (
            <VehicleSkeleton />
        ) : (
            <Table
                dataSource={filteredVehicles}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
            />
        )
    );

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
        </>
    );

    return (
        <EntityManagementLayout
            title="Quản lý phương tiện"
            icon={<CarFilled />}
            description="Quản lý thông tin phương tiện vận chuyển trong hệ thống"
            addButtonText={activeTab === 'vehicles' ? "Thêm phương tiện" : "Thêm loại phương tiện"}
            addButtonIcon={<PlusOutlined />}
            onAddClick={activeTab === 'vehicles' ? handleOpenCreateModal : handleOpenVehicleTypeCreateModal}
            searchText={searchText}
            onSearchChange={setSearchText}
            onRefresh={fetchVehicles}
            isLoading={loading}
            isFetching={isFetching}
            totalCount={vehicles.length}
            activeCount={activeVehicles.length}
            bannedCount={inactiveVehicles.length}
            tableTitle={activeTab === 'vehicles' ? "Danh sách phương tiện" : "Danh sách loại phương tiện"}
            tableComponent={renderTabs()}
            modalComponent={renderModal()}
        />
    );
};

export default VehiclePage; 