import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Space, Modal, App, Typography, Tag, DatePicker, Select, Input, Row, Col, Skeleton, Card, Badge } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, ToolOutlined, CheckCircleOutlined, StopOutlined, ExclamationCircleOutlined, ClockCircleOutlined, SearchOutlined, ReloadOutlined, CalendarOutlined, AlertOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { vehicleService } from '../../../services';
import type { VehicleServiceRecord, Vehicle } from '../../../models';
import EntityManagementLayout from '../../../components/features/admin/EntityManagementLayout';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import MaintenanceForm from './components/MaintenanceForm';
import VehicleDetailModal from './components/VehicleDetailModal';
import MaintenanceAlertBanner from '../../../components/MaintenanceAlertBanner';
import { useQueryClient } from '@tanstack/react-query';

dayjs.extend(isBetween);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Search } = Input;

const VehicleMaintenancePage: React.FC = () => {
    const [maintenances, setMaintenances] = useState<VehicleServiceRecord[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isFetching, setIsFetching] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedMaintenance, setSelectedMaintenance] = useState<VehicleServiceRecord | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [selectedVehicleMaintenances, setSelectedVehicleMaintenances] = useState<VehicleServiceRecord[]>([]);
    const [searchText, setSearchText] = useState<string>('');
    const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
    const [bannerRefreshCounter, setBannerRefreshCounter] = useState<number>(0);
    const { message } = App.useApp();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const fetchMaintenances = async () => {
        try {
            setIsFetching(true);
            const response = await vehicleService.getVehicleMaintenancesPaginated(0, 1000);
            if (response.success) {
                setMaintenances(response.data.content || []);
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
        // Mở modal thêm mới
        setSelectedMaintenance(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (maintenance: VehicleServiceRecord) => {
        // Mở modal chỉnh sửa
        setSelectedMaintenance(maintenance);
        setIsModalOpen(true);
    };

    const handleViewDetails = (id: string) => {
        navigate(`/admin/vehicle-maintenances/${id}`);
    };

    const handleViewVehicleDetails = (record: VehicleServiceRecord) => {
        // Find vehicle information
        let vehicle: Vehicle | null = null;
        
        if (record.vehicleEntity) {
            vehicle = record.vehicleEntity;
        }
        
        if (vehicle) {
            // Only pass the current maintenance record, not all maintenances
            setSelectedVehicle(vehicle);
            setSelectedVehicleMaintenances([record]);
            setIsDetailModalOpen(true);
        } else {
            message.error('Không tìm thấy thông tin phương tiện');
        }
    };

    const handleVehicleUpdate = async (vehicleId: string) => {
        try {
            // Fetch updated vehicle data
            const response = await vehicleService.getVehicleById(vehicleId);
            if (response.success && response.data) {
                setSelectedVehicle(response.data);
                console.log('Vehicle data updated:', response.data);
            }
        } catch (error) {
            console.error('Error fetching updated vehicle data:', error);
        }
    };

    const handleFormSubmit = async (values: any) => {
        try {
            // Chỉ update khi selectedMaintenance có id thật từ backend
            if (selectedMaintenance && (selectedMaintenance as any).id) {
                const maintenanceId = (selectedMaintenance as any).id as string;
                // Cập nhật bảo trì
                const response = await vehicleService.updateVehicleMaintenance(maintenanceId, {
                    ...values,
                    // Sử dụng định dạng ISO không có timezone để phù hợp với LocalDateTime của Java
                    plannedDate: values.plannedDate ? values.plannedDate.format('YYYY-MM-DDTHH:mm:ss') : undefined,
                    actualDate: values.actualDate ? values.actualDate.format('YYYY-MM-DDTHH:mm:ss') : undefined,
                    nextServiceDate: values.nextServiceDate ? values.nextServiceDate.format('YYYY-MM-DDTHH:mm:ss') : undefined
                });

                if (response.success) {
                    message.success('Cập nhật lịch bảo trì thành công');
                    setIsModalOpen(false);
                    fetchMaintenances();
                    fetchVehicles(); // Fetch lại vehicles để cập nhật banner
                    setBannerRefreshCounter(prev => prev + 1); // Force refresh banner
                } else {
                    // Không phải lỗi, chỉ là không tìm thấy bản ghi để cập nhật
                    message.warning(response.message || 'Không tìm thấy lịch bảo trì để cập nhật');
                }
            } else {
                // Tạo mới bảo trì
                const response = await vehicleService.createVehicleMaintenance({
                    ...values,
                    // Sử dụng định dạng ISO không có timezone để phù hợp với LocalDateTime của Java
                    plannedDate: values.plannedDate ? values.plannedDate.format('YYYY-MM-DDTHH:mm:ss') : undefined,
                    actualDate: values.actualDate ? values.actualDate.format('YYYY-MM-DDTHH:mm:ss') : undefined,
                    nextServiceDate: values.nextServiceDate ? values.nextServiceDate.format('YYYY-MM-DDTHH:mm:ss') : undefined
                });

                if (response.success) {
                    message.success('Thêm lịch bảo trì thành công');
                    setIsModalOpen(false);
                    fetchMaintenances();
                    fetchVehicles(); // Fetch lại vehicles để cập nhật banner
                    setBannerRefreshCounter(prev => prev + 1); // Force refresh banner
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
        setSelectedVehicleFilter(value);
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

    const handleCreateScheduleFromBanner = (vehicleId: string, serviceType: string) => {
        // Find the vehicle
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) {
            message.error('Không tìm thấy thông tin phương tiện');
            return;
        }

        // Tạo initial values để pre-fill form (create mode)
        const initialValues: any = {
            vehicleId,
            serviceType,
            plannedDate: dayjs().add(1, 'day'),
            description: `Lịch ${serviceType} cho xe ${vehicle.licensePlateNumber}`,
        };

        // Đảm bảo ở chế độ tạo mới
        setSelectedMaintenance(initialValues);
        setIsModalOpen(true);

        message.info(`Tạo lịch ${serviceType} cho xe ${vehicle.licensePlateNumber}`);
    };

    const filteredMaintenances = maintenances.filter(maintenance => {
        // Lọc theo phương tiện
        if (selectedVehicleFilter && maintenance.vehicleEntity?.id !== selectedVehicleFilter) {
            return false;
        }

        // Lọc theo khoảng thời gian
        if (dateRange && dateRange[0] && dateRange[1]) {
            const plannedDate = dayjs(maintenance.plannedDate);
            if (!plannedDate.isBetween(dateRange[0], dateRange[1], null, '[]')) {
                return false;
            }
        }

        // Lọc theo từ khóa tìm kiếm
        if (searchText) {
            const searchLower = searchText.toLowerCase();
            return (
                (maintenance.description?.toLowerCase() || '').includes(searchLower) ||
                (maintenance.serviceType?.toLowerCase() || '').includes(searchLower)
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

    const getStatusTag = (status: string | undefined) => {
        switch (status) {
            case 'PLANNED':
                return <Tag color="blue">Đã lên lịch</Tag>;
            case 'COMPLETED':
                return <Tag color="green">Đã hoàn thành</Tag>;
            case 'CANCELLED':
                return <Tag color="default">Đã hủy</Tag>;
            case 'OVERDUE':
                return <Tag color="red">Quá hạn</Tag>;
            default:
                return <Tag>Không xác định</Tag>;
        }
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

    const columns = [
        {
            title: 'Phương tiện',
            key: 'vehicle',
            render: (record: any) => getVehicleInfo(record),
        },
        {
            title: 'Loại dịch vụ',
            dataIndex: 'serviceType',
            key: 'serviceType',
            render: (type: string) => type || 'Không xác định',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'serviceStatus',
            key: 'serviceStatus',
            render: (status: string) => getStatusTag(status),
        },
        {
            title: 'Ngày dự kiến',
            dataIndex: 'plannedDate',
            key: 'plannedDate',
            render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
        },
        {
            title: 'Ngày thực tế',
            dataIndex: 'actualDate',
            key: 'actualDate',
            render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
        },
        {
            title: 'Ngày tiếp theo',
            dataIndex: 'nextServiceDate',
            key: 'nextServiceDate',
            render: (date: string) => {
                if (!date) return '-';
                const overdue = isOverdue(date);
                const expiringSoon = isExpiringSoon(date);
                return (
                    <span style={{ 
                        color: overdue ? '#ff4d4f' : expiringSoon ? '#faad14' : 'inherit',
                        fontWeight: overdue || expiringSoon ? 'bold' : 'normal'
                    }}>
                        {dayjs(date).format('DD/MM/YYYY')}
                        {overdue && ' (Quá hạn)'}
                        {expiringSoon && !overdue && ' (Sắp đến hạn)'}
                    </span>
                );
            },
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: VehicleServiceRecord) => (
                <Button
                    type="default"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewVehicleDetails(record)}
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
                    placeholder="Tìm kiếm theo mô tả, loại dịch vụ"
                    onSearch={handleSearch}
                    enterButton
                />
            </Col>
        </Row>
    );

    const renderModal = () => (
        <>
            <Modal
                title={selectedMaintenance ? 'Chỉnh sửa lịch bảo trì' : 'Thêm lịch bảo trì mới'}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                maskClosable={false}
                width={1200}
                styles={{ body: { maxHeight: '80vh', overflowY: 'auto' } }}
            >
                <MaintenanceForm
                    initialValues={selectedMaintenance}
                    // isEditMode chỉ bật khi có id (bản ghi thật từ backend)
                    isEditMode={!!(selectedMaintenance && (selectedMaintenance as any).id)}
                    onSubmit={handleFormSubmit}
                    onCancel={() => setIsModalOpen(false)}
                    vehicles={vehicles}
                />
            </Modal>
            
            <VehicleDetailModal
                visible={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                vehicle={selectedVehicle}
                maintenances={selectedVehicleMaintenances}
                onRefresh={() => {
                    // Refresh the maintenance data
                    fetchMaintenances();
                    // Clear selected data
                    setSelectedVehicle(null);
                    setSelectedVehicleMaintenances([]);
                }}
                onVehicleUpdate={handleVehicleUpdate}
            />
        </>
    );

    const completedMaintenances = maintenances.filter(m => m.serviceStatus === 'COMPLETED');
    const plannedMaintenances = maintenances.filter(m => m.serviceStatus === 'PLANNED');
    const cancelledMaintenances = maintenances.filter(m => m.serviceStatus === 'CANCELLED');
    const overdueMaintenances = maintenances.filter(m => m.serviceStatus === 'OVERDUE');

    // Removed duplicate renderMaintenanceTable function

    // Render statistics cards for all maintenance statuses
    const renderStatCards = () => (
        <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} md={6}>
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center">
                        <div>
                            <Text className="text-gray-600 block">Đã lên lịch</Text>
                            {loading ? (
                                <Skeleton.Input style={{ width: 60 }} active size="small" />
                            ) : (
                                <Title level={3} className="m-0 text-blue-800">{plannedMaintenances.length}</Title>
                            )}
                        </div>
                        <Badge count={loading ? 0 : plannedMaintenances.length} color="blue" showZero>
                            <div className="bg-blue-200 p-2 rounded-full">
                                <CalendarOutlined className="text-3xl text-blue-600" />
                            </div>
                        </Badge>
                    </div>
                </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
                <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center">
                        <div>
                            <Text className="text-gray-600 block">Đã hoàn thành</Text>
                            {loading ? (
                                <Skeleton.Input style={{ width: 60 }} active size="small" />
                            ) : (
                                <Title level={3} className="m-0 text-green-700">{completedMaintenances.length}</Title>
                            )}
                        </div>
                        <Badge count={loading ? 0 : completedMaintenances.length} color="green" showZero>
                            <div className="bg-green-200 p-2 rounded-full">
                                <CheckCircleOutlined className="text-3xl text-green-600" />
                            </div>
                        </Badge>
                    </div>
                </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
                <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center">
                        <div>
                            <Text className="text-gray-600 block">Đã hủy</Text>
                            {loading ? (
                                <Skeleton.Input style={{ width: 60 }} active size="small" />
                            ) : (
                                <Title level={3} className="m-0 text-gray-700">{cancelledMaintenances.length}</Title>
                            )}
                        </div>
                        <Badge count={loading ? 0 : cancelledMaintenances.length} color="#6B7280" showZero>
                            <div className="bg-gray-200 p-2 rounded-full">
                                <StopOutlined className="text-3xl text-gray-600" />
                            </div>
                        </Badge>
                    </div>
                </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
                <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center">
                        <div>
                            <Text className="text-gray-600 block">Quá hạn</Text>
                            {loading ? (
                                <Skeleton.Input style={{ width: 60 }} active size="small" />
                            ) : (
                                <Title level={3} className="m-0 text-red-700">{overdueMaintenances.length}</Title>
                            )}
                        </div>
                        <Badge count={loading ? 0 : overdueMaintenances.length} color="red" showZero>
                            <div className="bg-red-200 p-2 rounded-full">
                                <AlertOutlined className="text-3xl text-red-600" />
                            </div>
                        </Badge>
                    </div>
                </Card>
            </Col>
        </Row>
    );

    const renderContent = () => (
        <>
            <MaintenanceAlertBanner 
                onCreateSchedule={handleCreateScheduleFromBanner} 
                refreshBanner={bannerRefreshCounter}
                className="mb-4"
            />
            {renderFilters()}
            {renderStatCards()}
            <Table
                dataSource={filteredMaintenances}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                loading={isFetching}
            />
        </>
    );

    const handleAddClick = () => {
        // Mở modal thêm mới lịch bảo trì
        setSelectedMaintenance(null);
        setIsModalOpen(true);
    };

    // Fixed values since we only have maintenance tab
    const addButtonText = "Thêm lịch bảo trì";
    const addButtonIcon = <PlusOutlined />;
    const onAddClick = handleAddClick;
    const onSearchChange = handleSearch;
    const onRefresh = handleRefresh;
    const tableTitle = "Danh sách lịch bảo trì";

    // Create custom card stats component for 4 statuses
    const renderCustomStatCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                    <div>
                        <Text className="text-gray-600 block">Đã lên lịch</Text>
                        {loading ? (
                            <Skeleton.Input style={{ width: 60 }} active size="small" />
                        ) : (
                            <Title level={3} className="m-0 text-blue-800">{plannedMaintenances.length}</Title>
                        )}
                    </div>
                    <Badge count={loading ? 0 : plannedMaintenances.length} color="blue" showZero>
                        <div className="bg-blue-200 p-2 rounded-full">
                            <ToolOutlined className="text-3xl text-blue-600" />
                        </div>
                    </Badge>
                </div>
            </Card>
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                    <div>
                        <Text className="text-gray-600 block">Đã hoàn thành</Text>
                        {loading ? (
                            <Skeleton.Input style={{ width: 60 }} active size="small" />
                        ) : (
                            <Title level={3} className="m-0 text-green-700">{completedMaintenances.length}</Title>
                        )}
                    </div>
                    <Badge count={loading ? 0 : completedMaintenances.length} color="green" showZero>
                        <div className="bg-green-200 p-2 rounded-full">
                            <CheckCircleOutlined className="text-3xl text-green-600" />
                        </div>
                    </Badge>
                </div>
            </Card>
            <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                    <div>
                        <Text className="text-gray-600 block">Đã hủy</Text>
                        {loading ? (
                            <Skeleton.Input style={{ width: 60 }} active size="small" />
                        ) : (
                            <Title level={3} className="m-0 text-gray-700">{cancelledMaintenances.length}</Title>
                        )}
                    </div>
                    <Badge count={loading ? 0 : cancelledMaintenances.length} color="#6B7280" showZero>
                        <div className="bg-gray-200 p-2 rounded-full">
                            <StopOutlined className="text-3xl text-gray-600" />
                        </div>
                    </Badge>
                </div>
            </Card>
            <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                    <div>
                        <Text className="text-gray-600 block">Quá hạn</Text>
                        {loading ? (
                            <Skeleton.Input style={{ width: 60 }} active size="small" />
                        ) : (
                            <Title level={3} className="m-0 text-red-700">{overdueMaintenances.length}</Title>
                        )}
                    </div>
                    <Badge count={loading ? 0 : overdueMaintenances.length} color="red" showZero>
                        <div className="bg-red-200 p-2 rounded-full">
                            <ExclamationCircleOutlined className="text-3xl text-red-600" />
                        </div>
                    </Badge>
                </div>
            </Card>
        </div>
    );

    const renderMaintenanceTable = () => (
        <>
            {renderFilters()}
            {renderCustomStatCards()}
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

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="flex items-center m-0 text-blue-800">
                            <ToolOutlined className="mr-3 text-blue-600" /> Đăng kiểm & Bảo trì
                        </Title>
                        <Text type="secondary">Quản lý lịch đăng kiểm và bảo trì phương tiện</Text>
                    </div>
                    <Button
                        type="primary"
                        icon={addButtonIcon}
                        onClick={onAddClick}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="large"
                    >
                        {addButtonText}
                    </Button>
                </div>

                <Card className="shadow-sm mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                        <Title level={4} className="m-0 mb-4 md:mb-0">{tableTitle}</Title>
                        <div className="flex w-full md:w-auto gap-2">
                            <Input
                                placeholder="Tìm kiếm theo mô tả, loại dịch vụ..."
                                prefix={<SearchOutlined />}
                                className="w-full md:w-64"
                                value={searchText}
                                onChange={(e) => onSearchChange(e.target.value)}
                                disabled={loading}
                            />
                            <Button
                                icon={<ReloadOutlined spin={isFetching} />}
                                onClick={onRefresh}
                                title="Làm mới dữ liệu"
                                loading={isFetching}
                            />
                        </div>
                    </div>

                    {renderContent()}
                </Card>
            </div>

            {renderModal()}
        </div>
    );
};

export default VehicleMaintenancePage;
