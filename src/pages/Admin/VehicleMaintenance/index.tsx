import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Space, Modal, App, Typography, Tag, DatePicker, Select, Input, Row, Col, Tabs, Skeleton } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, ToolOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { vehicleService } from '../../../services';
import type { VehicleMaintenance, Vehicle } from '../../../models';
import EntityManagementLayout from '../../../components/features/admin/EntityManagementLayout';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import MaintenanceForm from './components/MaintenanceForm';
import MaintenanceTypeList from './components/MaintenanceTypeList';
import type { MaintenanceTypeListRef } from './components/MaintenanceTypeList';
import { useQueryClient } from '@tanstack/react-query';

dayjs.extend(isBetween);

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Search } = Input;
const { TabPane } = Tabs;

const VehicleMaintenancePage: React.FC = () => {
    const [maintenances, setMaintenances] = useState<VehicleMaintenance[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isFetching, setIsFetching] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedMaintenance, setSelectedMaintenance] = useState<VehicleMaintenance | null>(null);
    const [searchText, setSearchText] = useState<string>('');
    const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
    const [activeTab, setActiveTab] = useState<string>('maintenances');
    const { message } = App.useApp();
    const navigate = useNavigate();
    const maintenanceTypeListRef = useRef<MaintenanceTypeListRef>(null);
    const queryClient = useQueryClient();

    const fetchMaintenances = async () => {
        try {
            setIsFetching(true);
            const response = await vehicleService.getVehicleMaintenances();
            if (response.success) {
                setMaintenances(response.data || []);
            } else {
                // Không phải lỗi, chỉ là không có dữ liệu
                setMaintenances([]);
            }
        } catch (error) {
            console.error('Error fetching vehicle maintenances:', error);
            message.error('Không thể tải danh sách bảo trì phương tiện');
            setMaintenances([]);
        } finally {
            setLoading(false);
            setIsFetching(false);
        }
    };

    const fetchVehicles = async () => {
        try {
            const response = await vehicleService.getVehicles();
            if (response.success && Array.isArray(response.data)) {
                setVehicles(response.data);
            } else {
                // Không phải lỗi, chỉ là không có dữ liệu
                console.warn('Vehicles data is not an array or success is false:', response);
                setVehicles([]);
            }
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            setVehicles([]);
        }
    };

    useEffect(() => {
        fetchMaintenances();
        fetchVehicles();
    }, []);

    const handleOpenCreateModal = () => {
        // Chuyển hướng đến trang thêm mới thay vì mở modal
        navigate('/admin/vehicle-maintenances/create');
    };

    const handleOpenEditModal = (maintenance: VehicleMaintenance) => {
        // Chuyển hướng đến trang chỉnh sửa thay vì mở modal
        navigate(`/admin/vehicle-maintenances/edit/${maintenance.id}`);
    };

    const handleViewDetails = (id: string) => {
        navigate(`/admin/vehicle-maintenances/${id}`);
    };

    const handleFormSubmit = async (values: any) => {
        try {
            if (selectedMaintenance) {
                // Cập nhật bảo trì
                const response = await vehicleService.updateVehicleMaintenance(selectedMaintenance.id, {
                    ...values,
                    // Sử dụng định dạng ISO không có timezone để phù hợp với LocalDateTime của Java
                    maintenanceDate: values.maintenanceDate.format('YYYY-MM-DDTHH:mm:ss'),
                    nextMaintenanceDate: values.nextMaintenanceDate ? values.nextMaintenanceDate.format('YYYY-MM-DDTHH:mm:ss') : undefined
                });

                if (response.success) {
                    message.success('Cập nhật lịch bảo trì thành công');
                    setIsModalOpen(false);
                    fetchMaintenances();
                } else {
                    // Không phải lỗi, chỉ là không tìm thấy bản ghi để cập nhật
                    message.warning(response.message || 'Không tìm thấy lịch bảo trì để cập nhật');
                }
            } else {
                // Tạo mới bảo trì
                const response = await vehicleService.createVehicleMaintenance({
                    ...values,
                    // Sử dụng định dạng ISO không có timezone để phù hợp với LocalDateTime của Java
                    maintenanceDate: values.maintenanceDate.format('YYYY-MM-DDTHH:mm:ss'),
                    nextMaintenanceDate: values.nextMaintenanceDate ? values.nextMaintenanceDate.format('YYYY-MM-DDTHH:mm:ss') : undefined
                });

                if (response.success) {
                    message.success('Thêm lịch bảo trì thành công');
                    setIsModalOpen(false);
                    fetchMaintenances();
                } else {
                    message.warning(response.message || 'Không thể thêm lịch bảo trì');
                }
            }
        } catch (error) {
            console.error('Error submitting maintenance form:', error);
            message.error('Có lỗi xảy ra khi lưu thông tin bảo trì');
        }
    };

    const handleVehicleFilterChange = (value: string | null) => {
        setSelectedVehicle(value);
    };

    const handleDateRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
        setDateRange(dates);
    };

    const handleSearch = (value: string) => {
        setSearchText(value);
    };

    const handleRefresh = () => {
        fetchMaintenances();
    };

    const filteredMaintenances = maintenances.filter(maintenance => {
        // Lọc theo phương tiện
        if (selectedVehicle && maintenance.vehicleId !== selectedVehicle) {
            return false;
        }

        // Lọc theo khoảng thời gian
        if (dateRange && dateRange[0] && dateRange[1]) {
            const maintenanceDate = dayjs(maintenance.maintenanceDate);
            if (!maintenanceDate.isBetween(dateRange[0], dateRange[1], null, '[]')) {
                return false;
            }
        }

        // Lọc theo từ khóa tìm kiếm
        if (searchText) {
            const searchLower = searchText.toLowerCase();
            return (
                maintenance.description.toLowerCase().includes(searchLower) ||
                maintenance.serviceCenter.toLowerCase().includes(searchLower)
            );
        }

        return true;
    });

    const getVehicleInfo = (record: any) => {
        // Kiểm tra nếu có vehicleEntity (từ API) hoặc vehicle (từ model)
        if (record.vehicleEntity) {
            return `${record.vehicleEntity.licensePlateNumber || 'N/A'} - ${record.vehicleEntity.model || 'N/A'}`;
        } else if (record.vehicle) {
            return `${record.vehicle.licensePlateNumber || 'N/A'} - ${record.vehicle.model || 'N/A'}`;
        } else if (record.vehicleId) {
            // Tìm trong danh sách vehicles
            const vehicle = vehicles.find(v => v.id === record.vehicleId);
            if (vehicle) {
                return `${vehicle.licensePlateNumber || 'N/A'} - ${vehicle.model || 'N/A'}`;
            }
        }

        // Trường hợp không tìm thấy
        return 'Không xác định';
    };

    const columns = [
        {
            title: 'Phương tiện',
            key: 'vehicle',
            render: (record: any) => getVehicleInfo(record),
        },
        {
            title: 'Ngày bảo trì',
            dataIndex: 'maintenanceDate',
            key: 'maintenanceDate',
            render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
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
            render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : 'Chưa xác định',
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: VehicleMaintenance) => (
                <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewDetails(record.id)}
                >
                    Chi tiết
                </Button>
            ),
        },
    ];

    const renderFilters = () => (
        <Row gutter={16} className="mb-4">
            <Col xs={24} md={8} lg={6}>
                <Select
                    placeholder="Lọc theo phương tiện"
                    style={{ width: '100%' }}
                    allowClear
                    onChange={handleVehicleFilterChange}
                    options={vehicles.map(vehicle => ({
                        value: vehicle.id,
                        label: `${vehicle.licensePlateNumber} - ${vehicle.model}`
                    }))}
                />
            </Col>
            <Col xs={24} md={8} lg={8}>
                <RangePicker
                    style={{ width: '100%' }}
                    placeholder={['Từ ngày', 'Đến ngày']}
                    onChange={handleDateRangeChange}
                    format="DD/MM/YYYY"
                />
            </Col>
            <Col xs={24} md={8} lg={10}>
                <Search
                    placeholder="Tìm kiếm theo mô tả, trung tâm dịch vụ"
                    onSearch={handleSearch}
                    enterButton
                />
            </Col>
        </Row>
    );

    const renderModal = () => (
        <Modal
            title={selectedMaintenance ? 'Chỉnh sửa lịch bảo trì' : 'Thêm lịch bảo trì mới'}
            open={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
            footer={null}
            maskClosable={false}
            width={700}
        >
            <MaintenanceForm
                initialValues={selectedMaintenance}
                onSubmit={handleFormSubmit}
                onCancel={() => setIsModalOpen(false)}
                vehicles={vehicles}
            />
        </Modal>
    );

    const pastMaintenances = maintenances.filter(m => {
        const maintenanceDate = dayjs(m.maintenanceDate);
        return maintenanceDate.isBefore(dayjs());
    });

    const upcomingMaintenances = maintenances.filter(m => {
        const maintenanceDate = dayjs(m.maintenanceDate);
        return maintenanceDate.isAfter(dayjs());
    });

    const renderMaintenanceTable = () => (
        <>
            {renderFilters()}
            {loading ? (
                <div className="space-y-4">
                    <Skeleton active paragraph={{ rows: 1 }} />
                    <Skeleton.Button active block style={{ height: 40 }} />
                    <Skeleton active paragraph={{ rows: 8 }} />
                </div>
            ) : (
                <Table
                    dataSource={filteredMaintenances}
                    columns={columns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    loading={isFetching}
                />
            )}
        </>
    );

    const handleTabChange = (key: string) => {
        setActiveTab(key);
    };

    const renderContent = () => (
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
            <TabPane tab="Lịch bảo dưỡng" key="maintenances">
                {renderMaintenanceTable()}
            </TabPane>
            <TabPane tab="Loại bảo dưỡng" key="maintenanceTypes">
                <MaintenanceTypeList ref={maintenanceTypeListRef} />
            </TabPane>
        </Tabs>
    );

    const handleAddClick = () => {
        if (activeTab === 'maintenances') {
            // Chuyển hướng đến trang thêm mới lịch bảo trì
            navigate('/admin/vehicle-maintenances/create');
        } else {
            // Mở modal thêm loại bảo trì
            if (maintenanceTypeListRef.current) {
                maintenanceTypeListRef.current.showAddModal();
            }
        }
    };

    // Conditionally define props based on active tab
    const addButtonText = activeTab === 'maintenances' ? "Thêm lịch bảo trì" : "Thêm loại bảo dưỡng";
    const addButtonIcon = <PlusOutlined />;
    const onAddClick = handleAddClick;
    const onSearchChange = activeTab === 'maintenances' ? handleSearch : () => { };
    const onRefresh = activeTab === 'maintenances' ? handleRefresh : () => { };
    const tableTitle = activeTab === 'maintenances' ? "Danh sách lịch bảo trì" : "Quản lý loại bảo dưỡng";

    return (
        <EntityManagementLayout
            title="Quản lý bảo trì phương tiện"
            icon={<ToolOutlined />}
            description="Quản lý lịch bảo trì phương tiện trong hệ thống"
            addButtonText={addButtonText}
            addButtonIcon={addButtonIcon}
            onAddClick={onAddClick}
            searchText={searchText}
            onSearchChange={onSearchChange}
            onRefresh={onRefresh}
            isLoading={loading}
            isFetching={isFetching}
            totalCount={maintenances.length}
            activeCount={upcomingMaintenances.length}
            bannedCount={pastMaintenances.length}
            tableTitle={tableTitle}
            tableComponent={renderContent()}
            modalComponent={renderModal()}
        />
    );
};

export default VehicleMaintenancePage; 