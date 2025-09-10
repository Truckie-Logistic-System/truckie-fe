import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Switch, Space, Skeleton, Tag } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import { PlusOutlined, EditOutlined, SwapOutlined, CheckCircleOutlined, StopOutlined, AppstoreOutlined } from '@ant-design/icons';
import { deviceService } from '../../../../services/device';
import type { DeviceType, CreateDeviceTypeRequest, UpdateDeviceTypeRequest } from '../../../../models';
import StatusChangeModal from '../../../../components/common/StatusChangeModal';
import type { StatusOption } from '../../../../components/common/StatusChangeModal';

export interface DeviceTypeListRef {
    showAddModal: () => void;
}

interface DeviceTypeListProps {
    messageApi: MessageInstance;
    deviceTypes?: DeviceType[];
    loading?: boolean;
    onRefresh?: () => void;
}

const DeviceTypeList = forwardRef<DeviceTypeListRef, DeviceTypeListProps>((props, ref) => {
    const {
        messageApi,
        deviceTypes: propDeviceTypes,
        loading: propLoading,
        onRefresh
    } = props;

    const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [currentDeviceType, setCurrentDeviceType] = useState<DeviceType | null>(null);
    const [form] = Form.useForm();

    // Status change modal state
    const [isStatusModalVisible, setIsStatusModalVisible] = useState<boolean>(false);
    const [selectedDeviceType, setSelectedDeviceType] = useState<DeviceType | null>(null);
    const [newStatus, setNewStatus] = useState<boolean>(true);
    const [statusUpdateLoading, setStatusUpdateLoading] = useState<boolean>(false);

    // Expose the showModal function to parent component
    useImperativeHandle(ref, () => ({
        showAddModal: () => showModal()
    }));

    // Use props if provided, otherwise fetch data
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

    const fetchDeviceTypes = async () => {
        try {
            setLoading(true);
            const response = await deviceService.getDeviceTypes();
            console.log('Device types response:', response);

            // Check if the response has the expected structure
            if (response && response.data) {
                // Make sure response.data is an array
                const deviceTypeData = Array.isArray(response.data) ? response.data : [];
                setDeviceTypes(deviceTypeData);
            } else {
                setDeviceTypes([]);
            }
        } catch (error) {
            messageApi.error('Không thể tải danh sách loại thiết bị');
            console.error('Error fetching device types:', error);
            setDeviceTypes([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!propDeviceTypes) {
            fetchDeviceTypes();
        }
    }, []);

    const showModal = (deviceType?: DeviceType) => {
        if (deviceType) {
            setIsEditing(true);
            setCurrentDeviceType(deviceType);
            form.setFieldsValue({
                ...deviceType,
            });
        } else {
            setIsEditing(false);
            setCurrentDeviceType(null);
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

            if (isEditing && currentDeviceType) {
                // Ensure we're only sending the fields defined in UpdateDeviceTypeRequest
                const updateData: UpdateDeviceTypeRequest = {
                    deviceTypeName: values.deviceTypeName,
                    description: values.description || '',
                    isActive: currentDeviceType.isActive, // Giữ nguyên trạng thái hiện tại
                    vehicleCapacity: values.vehicleCapacity
                };

                await deviceService.updateDeviceType(currentDeviceType.id, updateData);
                messageApi.success('Cập nhật loại thiết bị thành công');
            } else {
                // For creation, use only the fields defined in CreateDeviceTypeRequest
                const createData: CreateDeviceTypeRequest = {
                    deviceTypeName: values.deviceTypeName,
                    description: values.description || '',
                    vehicleCapacity: values.vehicleCapacity
                };

                await deviceService.createDeviceType(createData);
                messageApi.success('Thêm loại thiết bị mới thành công');
            }

            setIsModalVisible(false);
            if (onRefresh) {
                onRefresh();
            } else {
                fetchDeviceTypes();
            }
        } catch (error) {
            messageApi.error('Đã xảy ra lỗi khi lưu loại thiết bị');
            console.error('Error saving device type:', error);
        }
    };

    // Handle status change
    const handleStatusChange = (deviceType: DeviceType) => {
        setSelectedDeviceType(deviceType);
        setNewStatus(deviceType.isActive);
        setIsStatusModalVisible(true);
    };

    const handleStatusUpdate = async () => {
        if (selectedDeviceType) {
            setStatusUpdateLoading(true);
            try {
                // Create update data with only the necessary fields
                const updateData: UpdateDeviceTypeRequest = {
                    deviceTypeName: selectedDeviceType.deviceTypeName,
                    description: selectedDeviceType.description || '',
                    isActive: newStatus,
                    vehicleCapacity: selectedDeviceType.vehicleCapacity
                };

                await deviceService.updateDeviceType(selectedDeviceType.id, updateData);
                messageApi.success('Cập nhật trạng thái loại thiết bị thành công');

                // Refresh the device type list
                if (onRefresh) {
                    onRefresh();
                } else {
                    fetchDeviceTypes();
                }

                setIsStatusModalVisible(false);
            } catch (error) {
                messageApi.error('Cập nhật trạng thái loại thiết bị thất bại');
                console.error('Error updating device type status:', error);
            } finally {
                setStatusUpdateLoading(false);
            }
        }
    };

    const getStatusColor = (status: string | boolean) => {
        if (typeof status === 'boolean') {
            return status ? 'green' : 'red';
        }
        return 'default';
    };

    const getStatusText = (status: string | boolean) => {
        if (typeof status === 'boolean') {
            return status ? 'Đang hoạt động' : 'Không hoạt động';
        }
        return 'Không xác định';
    };

    // Status options for the modal
    const statusOptions: StatusOption[] = [
        {
            value: true,
            label: 'Hoạt động',
            description: 'Loại thiết bị có thể được sử dụng',
            color: 'green',
            icon: <CheckCircleOutlined />
        },
        {
            value: false,
            label: 'Không hoạt động',
            description: 'Loại thiết bị không thể được sử dụng',
            color: 'red',
            icon: <StopOutlined />
        }
    ];

    const columns = [
        {
            title: 'Tên loại thiết bị',
            dataIndex: 'deviceTypeName',
            key: 'deviceTypeName',
        },
        {
            title: 'Tải trọng xe (kg)',
            dataIndex: 'vehicleCapacity',
            key: 'vehicleCapacity',
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive: boolean) => (
                <Tag
                    color={getStatusColor(isActive)}
                    icon={isActive ? <CheckCircleOutlined /> : <StopOutlined />}
                    className="px-3 py-1"
                >
                    {getStatusText(isActive)}
                </Tag>
            ),
        },
        {
            title: 'Thao tác',
            key: 'actions',
            render: (_: any, record: DeviceType) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => showModal(record)}
                    />
                    <Button
                        icon={<SwapOutlined />}
                        onClick={() => handleStatusChange(record)}
                        className={record.isActive ? 'border-red-400 text-red-500 hover:text-red-600 hover:border-red-500' : 'border-green-400 text-green-500 hover:text-green-600 hover:border-green-500'}
                    >
                        {record.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
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
                dataSource={deviceTypes}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
            />

            {/* Edit/Create Modal */}
            <Modal
                title={isEditing ? 'Chỉnh sửa loại thiết bị' : 'Thêm loại thiết bị mới'}
                open={isModalVisible}
                onCancel={handleCancel}
                onOk={handleSubmit}
                okText={isEditing ? 'Cập nhật' : 'Thêm mới'}
                cancelText="Hủy"
                confirmLoading={loading}
                width={600}
                bodyStyle={{ padding: '20px' }}
            >
                <Form
                    form={form}
                    layout="vertical"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Form.Item
                                name="deviceTypeName"
                                label="Tên loại thiết bị"
                                rules={[{ required: true, message: 'Vui lòng nhập tên loại thiết bị' }]}
                            >
                                <Input placeholder="Nhập tên loại thiết bị" />
                            </Form.Item>

                            <Form.Item
                                name="vehicleCapacity"
                                label="Tải trọng xe (kg)"
                                rules={[{ required: true, message: 'Vui lòng nhập tải trọng xe' }]}
                            >
                                <InputNumber min={0} className="w-full" placeholder="Nhập tải trọng xe" />
                            </Form.Item>
                        </div>
                        <div>
                            <Form.Item
                                name="description"
                                label="Mô tả"
                            >
                                <Input.TextArea
                                    rows={4}
                                    placeholder="Nhập mô tả về loại thiết bị (không bắt buộc)"
                                />
                            </Form.Item>
                        </div>
                    </div>
                </Form>
            </Modal>

            {/* Status Change Modal */}
            <StatusChangeModal
                visible={isStatusModalVisible}
                loading={statusUpdateLoading}
                title="Cập nhật trạng thái loại thiết bị"
                icon={<AppstoreOutlined />}
                entityName={selectedDeviceType?.deviceTypeName || ''}
                entityDescription={`Tải trọng: ${selectedDeviceType?.vehicleCapacity} kg`}
                avatarIcon={<AppstoreOutlined />}
                currentStatus={selectedDeviceType?.isActive ?? false}
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

export default DeviceTypeList; 