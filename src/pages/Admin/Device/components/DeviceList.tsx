import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Skeleton, Descriptions } from 'antd';

import type { MessageInstance } from 'antd/es/message/interface';
import { PlusOutlined, EditOutlined, SwapOutlined, CheckCircleOutlined, StopOutlined, MobileOutlined } from '@ant-design/icons';
import { deviceService } from '../../../../services/device';
import vehicleService from '../../../../services/vehicle';
import type { Device, DeviceType, CreateDeviceRequest, UpdateDeviceRequest } from '../../../../models';
import dayjs from 'dayjs';
import StatusChangeModal from '../../../../components/common/StatusChangeModal';
import type { StatusOption } from '../../../../components/common/StatusChangeModal';
import DateSelectGroup from '../../../../components/common/DateSelectGroup';
import { DeviceStatusEnum } from '@/constants/enums';
import { DeviceStatusTag } from '@/components/common/tags';

export interface DeviceListRef {
    showAddModal: () => void;
}

interface DeviceListProps {
    messageApi: MessageInstance;
    devices?: Device[];
    deviceTypes?: DeviceType[];
    loading?: boolean;
    onRefresh?: () => void;
}

const DeviceList = forwardRef<DeviceListRef, DeviceListProps>((props, ref) => {
    const {
        messageApi,
        devices: propDevices,
        deviceTypes: propDeviceTypes,
        loading: propLoading,
        onRefresh
    } = props;
    const [devices, setDevices] = useState<Device[]>([]);
    const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState<boolean>(false);
    const [detailDevice, setDetailDevice] = useState<Device | null>(null);

    const [form] = Form.useForm();

    // Status change modal state
    const [isStatusModalVisible, setIsStatusModalVisible] = useState<boolean>(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [newStatus, setNewStatus] = useState<string>('');
    const [statusUpdateLoading, setStatusUpdateLoading] = useState<boolean>(false);

    // Expose the showModal function to parent component
    useImperativeHandle(ref, () => ({
        showAddModal: () => showModal()
    }));

    // Use props if provided, otherwise fetch data
    useEffect(() => {
        if (propDevices) {
            setDevices(propDevices);
        } else {
            fetchDevices();
        }
    }, [propDevices]);

    useEffect(() => {
        if (propDeviceTypes) {
            setDeviceTypes(propDeviceTypes);
        } else {
            fetchDeviceTypes();
        }
    }, [propDeviceTypes]);

    useEffect(() => {
        if (propLoading !== undefined) {
            setLoading(propLoading);
        }
    }, [propLoading]);

    // Fetch devices and device types
    const fetchDevices = async () => {
        try {
            setLoading(true);
            const response = await deviceService.getDevices();
            // Check if the response has the expected structure
            if (response && response.data) {
                // Make sure response.data is an array
                const deviceData = Array.isArray(response.data) ? response.data : [];
                setDevices(deviceData);
            } else {
                setDevices([]);
            }
        } catch (error) {
            messageApi.error('Không thể tải danh sách thiết bị');
            console.error('Error fetching devices:', error);
            setDevices([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchDeviceTypes = async () => {
        try {
            const response = await deviceService.getDeviceTypes();
            // Check if the response has the expected structure
            if (response && response.data) {
                // Make sure response.data is an array
                const deviceTypeData = Array.isArray(response.data) ? response.data : [];
                setDeviceTypes(deviceTypeData);
            } else {
                setDeviceTypes([]);
            }
        } catch (error) {
            console.error('Error fetching device types:', error);
            setDeviceTypes([]);
        }
    };

    // Fetch vehicles from API
    const fetchVehicles = async () => {
        try {
            const response = await vehicleService.getVehicles();
            if (response && response.data) {
                const vehicleData = Array.isArray(response.data) ? response.data : [];
                setVehicles(vehicleData);
            } else {
                setVehicles([]);
            }
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            setVehicles([]);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    const showModal = (device?: Device) => {
        if (device) {
            setIsEditing(true);
            setCurrentDevice(device);
            form.setFieldsValue({
                ...device,
                installedAt: device.installedAt ? dayjs(device.installedAt) : null,
                deviceTypeId: device.deviceTypeEntity?.id || device.deviceTypeId,
                vehicleId: device.vehicleEntity?.id || device.vehicleId,
            });
        } else {
            setIsEditing(false);
            setCurrentDevice(null);
            form.resetFields();
        }
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            if (isEditing && currentDevice) {
                // Ensure we're only sending the fields defined in UpdateDeviceRequest
                const updateData: UpdateDeviceRequest = {
                    deviceCode: values.deviceCode,
                    manufacturer: values.manufacturer,
                    model: values.model,
                    status: currentDevice.status, // Giữ nguyên trạng thái hiện tại
                    ipAddress: values.ipAddress || '',
                    firmwareVersion: values.firmwareVersion || '',
                    installedAt: values.installedAt ? values.installedAt.format('YYYY-MM-DD') : new Date().toISOString(),
                    deviceTypeId: values.deviceTypeId,
                    vehicleId: values.vehicleId || ''
                };

                await deviceService.updateDevice(currentDevice.id, updateData);
                messageApi.success('Cập nhật thiết bị thành công');
            } else {
                // For creation, use only the fields defined in CreateDeviceRequest
                const createData: CreateDeviceRequest = {
                    deviceCode: values.deviceCode,
                    manufacturer: values.manufacturer,
                    model: values.model,
                    ipAddress: values.ipAddress || '',
                    firmwareVersion: values.firmwareVersion || '',
                    installedAt: values.installedAt ? values.installedAt.format('YYYY-MM-DD') : new Date().toISOString(),
                    deviceTypeId: values.deviceTypeId,
                    vehicleId: values.vehicleId || ''
                };

                await deviceService.createDevice(createData);
                messageApi.success('Thêm thiết bị mới thành công');
            }

            setIsModalVisible(false);
            if (onRefresh) {
                onRefresh();
            } else {
                fetchDevices();
            }
        } catch (error) {
            messageApi.error('Đã xảy ra lỗi khi lưu thiết bị');
            console.error('Error saving device:', error);
        }
    };

    // Handle status change
    const handleStatusChange = (device: Device) => {
        setSelectedDevice(device);
        setNewStatus(device.status || 'ACTIVE');
        setIsStatusModalVisible(true);
    };

    const handleViewDetail = (device: Device) => {
        setDetailDevice(device);
        setIsDetailModalVisible(true);
    };

    const handleStatusUpdate = async () => {
        if (selectedDevice && newStatus) {
            setStatusUpdateLoading(true);
            try {
                // Create update data with only the necessary fields
                const updateData: UpdateDeviceRequest = {
                    deviceCode: selectedDevice.deviceCode,
                    manufacturer: selectedDevice.manufacturer,
                    model: selectedDevice.model,
                    status: newStatus,
                    ipAddress: selectedDevice.ipAddress || '',
                    firmwareVersion: selectedDevice.firmwareVersion || '',
                    installedAt: selectedDevice.installedAt || new Date().toISOString(),
                    deviceTypeId: selectedDevice.deviceTypeId || selectedDevice.deviceTypeEntity?.id || '',
                    vehicleId: selectedDevice.vehicleId || selectedDevice.vehicleEntity?.id || ''
                };

                await deviceService.updateDevice(selectedDevice.id, updateData);
                messageApi.success('Cập nhật trạng thái thiết bị thành công');

                // Refresh the device list
                if (onRefresh) {
                    onRefresh();
                } else {
                    fetchDevices();
                }

                setIsStatusModalVisible(false);
            } catch (error) {
                messageApi.error('Cập nhật trạng thái thiết bị thất bại');
                console.error('Error updating device status:', error);
            } finally {
                setStatusUpdateLoading(false);
            }
        }
    };

    const getStatusColor = (status: string | boolean) => {
        if (typeof status === 'string') {
            switch (status?.toLowerCase()) {
                case 'active': return 'green';
                case 'inactive': return 'red';
                case 'maintenance': return 'orange';
                default: return 'default';
            }
        }
        return 'default';
    };

    const getStatusText = (status: string | boolean) => {
        if (typeof status === 'string') {
            switch (status?.toLowerCase()) {
                case 'active': return 'Hoạt động';
                case 'inactive': return 'Không hoạt động';
                case 'maintenance': return 'Bảo trì';
                default: return status || 'Không xác định';
            }
        }
        return 'Không xác định';
    };

    // Status options for the modal
    const statusOptions: StatusOption[] = [
        {
            value: 'ACTIVE',
            label: 'Hoạt động',
            description: 'Thiết bị đang hoạt động bình thường',
            color: 'green',
            icon: <CheckCircleOutlined />
        },
        {
            value: 'INACTIVE',
            label: 'Không hoạt động',
            description: 'Thiết bị đã bị vô hiệu hóa',
            color: 'red',
            icon: <StopOutlined />
        }
    ];

    const columns = [
        {
            title: 'Mã thiết bị',
            dataIndex: 'deviceCode',
            key: 'deviceCode',
        },
        {
            title: 'Nhà sản xuất',
            dataIndex: 'manufacturer',
            key: 'manufacturer',
        },
        {
            title: 'Model',
            dataIndex: 'model',
            key: 'model',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <DeviceStatusTag status={status as DeviceStatusEnum} />
            ),
        },
        {
            title: 'Phương tiện',
            dataIndex: 'vehicleEntity',
            key: 'vehicle',
            render: (vehicle: any) => vehicle?.licensePlateNumber || 'N/A',
        },
        {
            title: 'Thao tác',
            key: 'actions',
            render: (_: any, record: Device) => (
                <Space>
                    <Button
                        size="small"
                        onClick={() => handleViewDetail(record)}
                    >
                        Chi tiết
                    </Button>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => showModal(record)}
                        size="small"
                    />
                    <Button
                        icon={<SwapOutlined />}
                        onClick={() => handleStatusChange(record)}
                        className={record.status?.toLowerCase() === 'active' ? 'border-red-400 text-red-500 hover:text-red-600 hover:border-red-500' : 'border-green-400 text-green-500 hover:text-green-600 hover:border-green-500'}
                        size="small"
                    >
                        {record.status?.toLowerCase() === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                    </Button>
                </Space>
            ),
        },
    ];

    if (loading) {
        return <Skeleton active />;
    }

    return (
        <div>
            <Table
                dataSource={devices}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 'max-content' }}
            />

            {/* Edit/Create Modal */}
            <Modal
                title={isEditing ? 'Chỉnh sửa thiết bị' : 'Thêm thiết bị mới'}
                open={isModalVisible}
                onCancel={handleCancel}
                onOk={handleSubmit}
                okText={isEditing ? 'Cập nhật' : 'Thêm mới'}
                cancelText="Hủy"
                confirmLoading={loading}
                width={700}
                bodyStyle={{ padding: '20px' }}
            >
                <Form
                    form={form}
                    layout="vertical"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Form.Item
                                name="deviceCode"
                                label="Mã thiết bị"
                                rules={[{ required: true, message: 'Vui lòng nhập mã thiết bị' }]}
                            >
                                <Input placeholder="Nhập mã thiết bị" />
                            </Form.Item>

                            <Form.Item
                                name="manufacturer"
                                label="Nhà sản xuất"
                                rules={[{ required: true, message: 'Vui lòng nhập nhà sản xuất' }]}
                            >
                                <Input placeholder="Nhập tên nhà sản xuất" />
                            </Form.Item>

                            <Form.Item
                                name="model"
                                label="Model"
                                rules={[{ required: true, message: 'Vui lòng nhập model' }]}
                            >
                                <Input placeholder="Nhập model thiết bị" />
                            </Form.Item>
                        </div>
                        <div>
                            <Form.Item
                                name="ipAddress"
                                label="Địa chỉ IP"
                            >
                                <Input placeholder="Nhập địa chỉ IP" />
                            </Form.Item>

                            <Form.Item
                                name="firmwareVersion"
                                label="Phiên bản firmware"
                            >
                                <Input placeholder="Nhập phiên bản firmware" />
                            </Form.Item>

                            <Form.Item
                                name="installedAt"
                                label="Ngày lắp đặt"
                            >
                                <DateSelectGroup mode="birthdate" />
                            </Form.Item>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="deviceTypeId"
                            label="Loại thiết bị"
                            rules={[{ required: true, message: 'Vui lòng chọn loại thiết bị' }]}
                        >
                            <Select placeholder="Chọn loại thiết bị">
                                {deviceTypes.map(type => (
                                    <Select.Option key={type.id} value={type.id}>
                                        {type.deviceTypeName}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="vehicleId"
                            label="Phương tiện"
                        >
                            <Select 
                                placeholder="Chọn phương tiện (không bắt buộc)"
                                showSearch
                                filterOption={(input, option) =>
                                    String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                                }
                                allowClear
                            >
                                <Select.Option value="">Không gắn với phương tiện</Select.Option>
                                {vehicles.map(vehicle => (
                                    <Select.Option key={vehicle.id} value={vehicle.id}>
                                        {vehicle.licensePlateNumber}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>
                </Form>
            </Modal>

            {/* Detail Modal */}
            <Modal
                title="Chi tiết thiết bị"
                open={isDetailModalVisible}
                onCancel={() => setIsDetailModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
                        Đóng
                    </Button>,
                ]}
                width={720}
            >
                {detailDevice && (
                    <Descriptions column={2} bordered size="small">
                        <Descriptions.Item label="Mã thiết bị">{detailDevice.deviceCode}</Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            <DeviceStatusTag status={detailDevice.status as DeviceStatusEnum} />
                        </Descriptions.Item>
                        <Descriptions.Item label="Nhà sản xuất">{detailDevice.manufacturer}</Descriptions.Item>
                        <Descriptions.Item label="Model">{detailDevice.model}</Descriptions.Item>
                        <Descriptions.Item label="Ngày lắp đặt" span={2}>
                            {detailDevice.installedAt ? dayjs(detailDevice.installedAt).format('DD/MM/YYYY') : 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Địa chỉ IP">{detailDevice.ipAddress || 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Phiên bản firmware">{detailDevice.firmwareVersion || 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Loại thiết bị">
                            {detailDevice.deviceTypeEntity?.deviceTypeName || 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Phương tiện">
                            {detailDevice.vehicleEntity?.licensePlateNumber || 'Không gắn với phương tiện'}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>

            {/* Status Change Modal */}
            <StatusChangeModal
                visible={isStatusModalVisible}
                loading={statusUpdateLoading}
                title="Cập nhật trạng thái thiết bị"
                icon={<MobileOutlined />}
                entityName={selectedDevice?.deviceCode || ''}
                entityDescription={`${selectedDevice?.model || ''} - ${selectedDevice?.manufacturer || ''}`}
                avatarIcon={<MobileOutlined />}
                currentStatus={selectedDevice?.status || ''}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
                statusOptions={statusOptions}
                selectedStatus={newStatus}
                onStatusChange={setNewStatus}
                onOk={handleStatusUpdate}
                onCancel={() => setIsStatusModalVisible(false)}
            />
        </div>
    );
});

export default DeviceList;