import React, { useState, useRef } from 'react';
import { App, Tabs, Card, Typography, Input, Button } from 'antd';
import { MobileOutlined, PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { deviceService } from '../../../services/device';
import type { Device, DeviceType } from '../../../models';
import DeviceList from './components/DeviceList';
import DeviceTypeList from './components/DeviceTypeList';
import DeviceStatCards from './components/DeviceStatCards';
import type { DeviceListRef } from './components/DeviceList';
import type { DeviceTypeListRef } from './components/DeviceTypeList';
import EntityManagementLayout from '../../../components/features/admin/EntityManagementLayout';

const { Title, Text } = Typography;

const DeviceManagement: React.FC = () => {
    const navigate = useNavigate();
    const { message } = App.useApp();
    const [activeTab, setActiveTab] = useState<string>('devices');
    const [searchText, setSearchText] = useState('');

    // Create refs for child components
    const deviceListRef = useRef<DeviceListRef>(null);
    const deviceTypeListRef = useRef<DeviceTypeListRef>(null);

    // Fetch devices
    const {
        data: devicesData,
        isLoading: isDevicesLoading,
        error: devicesError,
        refetch: refetchDevices,
        isFetching: isDevicesFetching
    } = useQuery({
        queryKey: ['devices'],
        queryFn: deviceService.getDevices
    });

    // Fetch device types
    const {
        data: deviceTypesData,
        isLoading: isDeviceTypesLoading,
        refetch: refetchDeviceTypes
    } = useQuery({
        queryKey: ['deviceTypes'],
        queryFn: deviceService.getDeviceTypes
    });

    const handleTabChange = (key: string) => {
        setActiveTab(key);
    };

    const handleRefresh = () => {
        if (activeTab === 'devices') {
            refetchDevices();
        } else {
            refetchDeviceTypes();
        }
    };

    // Filter devices based on search text
    const filteredDevices = devicesData?.data?.filter(device => {
        if (!searchText) return true;
        const searchLower = searchText.toLowerCase();
        return (
            device.deviceCode?.toLowerCase().includes(searchLower) ||
            device.manufacturer?.toLowerCase().includes(searchLower) ||
            device.model?.toLowerCase().includes(searchLower) ||
            (device.ipAddress && device.ipAddress.toLowerCase().includes(searchLower))
        );
    }) || [];

    // Filter device types based on search text
    const filteredDeviceTypes = deviceTypesData?.data?.filter(deviceType => {
        if (!searchText) return true;
        const searchLower = searchText.toLowerCase();
        return (
            deviceType.deviceTypeName?.toLowerCase().includes(searchLower) ||
            (deviceType.description && deviceType.description.toLowerCase().includes(searchLower))
        );
    }) || [];

    // Count active and inactive devices
    const activeDevicesCount = devicesData?.data?.filter(device =>
        device.status?.toLowerCase() === 'active'
    )?.length || 0;

    const inactiveDevicesCount = devicesData?.data?.filter(device =>
        device.status?.toLowerCase() === 'inactive' || device.status?.toLowerCase() === 'maintenance'
    )?.length || 0;

    // Count active and inactive device types
    const activeDeviceTypesCount = deviceTypesData?.data?.filter(deviceType =>
        deviceType.isActive
    )?.length || 0;

    const inactiveDeviceTypesCount = deviceTypesData?.data?.filter(deviceType =>
        !deviceType.isActive
    )?.length || 0;

    if (devicesError) {
        return (
            <div className="p-6 flex flex-col items-center justify-center h-64">
                <p className="text-red-500 text-xl mb-4">Đã xảy ra lỗi khi tải dữ liệu</p>
                <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => refetchDevices()}
                >
                    Thử lại
                </button>
            </div>
        );
    }

    const renderDeviceTab = () => (
        <div>
            {/* Hiển thị card thống kê cho tất cả các trạng thái thiết bị */}
            <DeviceStatCards 
                devices={devicesData?.data || []} 
                loading={isDevicesLoading} 
                type="devices"
            />
            <DeviceList
                ref={deviceListRef}
                messageApi={message}
                devices={filteredDevices}
                loading={isDevicesLoading}
                deviceTypes={deviceTypesData?.data || []}
                onRefresh={refetchDevices}
            />
        </div>
    );

    const renderDeviceTypeTab = () => (
        <div>
            {/* Hiển thị card thống kê cho tất cả các trạng thái loại thiết bị */}
            <DeviceStatCards 
                devices={deviceTypesData?.data || []} 
                loading={isDeviceTypesLoading} 
                type="deviceTypes"
            />
            <DeviceTypeList
                ref={deviceTypeListRef}
                messageApi={message}
                deviceTypes={filteredDeviceTypes}
                loading={isDeviceTypesLoading}
                onRefresh={refetchDeviceTypes}
            />
        </div>
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="flex items-center m-0 text-blue-800">
                            <MobileOutlined className="mr-3 text-blue-600" /> {activeTab === 'devices' ? "Quản lý thiết bị" : "Quản lý loại thiết bị"}
                        </Title>
                        <Text type="secondary">{activeTab === 'devices'
                            ? "Quản lý thông tin và trạng thái của các thiết bị trong hệ thống"
                            : "Quản lý thông tin và trạng thái của các loại thiết bị trong hệ thống"
                        }</Text>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            if (activeTab === 'devices') {
                                deviceListRef.current?.showAddModal();
                            } else {
                                deviceTypeListRef.current?.showAddModal();
                            }
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="large"
                    >
                        {activeTab === 'devices' ? "Thêm thiết bị mới" : "Thêm loại thiết bị mới"}
                    </Button>
                </div>

                <Card className="shadow-sm mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                        <Title level={4} className="m-0 mb-4 md:mb-0">{activeTab === 'devices' ? "Danh sách thiết bị" : "Danh sách loại thiết bị"}</Title>
                        <div className="flex w-full md:w-auto gap-2">
                            <Input
                                placeholder={activeTab === 'devices' 
                                    ? "Tìm kiếm theo mã thiết bị, nhà sản xuất, mẫu thiết bị..."
                                    : "Tìm kiếm theo tên loại thiết bị, mô tả..."}
                                prefix={<SearchOutlined />}
                                className="w-full md:w-64"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                disabled={activeTab === 'devices' ? isDevicesLoading : isDeviceTypesLoading}
                            />
                            <Button
                                icon={<ReloadOutlined spin={activeTab === 'devices' ? isDevicesFetching : false} />}
                                onClick={handleRefresh}
                                title="Làm mới dữ liệu"
                                loading={activeTab === 'devices' ? isDevicesFetching : false}
                            />
                        </div>
                    </div>

                    <Tabs
                        activeKey={activeTab}
                        onChange={handleTabChange}
                        className="mb-4"
                        items={[
                            {
                                key: 'devices',
                                label: 'Thiết bị',
                                children: renderDeviceTab(),
                            },
                            {
                                key: 'deviceTypes',
                                label: 'Loại thiết bị',
                                children: renderDeviceTypeTab(),
                            },
                        ]}
                    />
                </Card>
            </div>
        </div>
    );
};

export default DeviceManagement;