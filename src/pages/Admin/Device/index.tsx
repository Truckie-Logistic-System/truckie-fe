import React, { useState, useRef } from 'react';
import { App, Tabs } from 'antd';
import { MobileOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { deviceService } from '../../../services/device';
import { useQuery } from '@tanstack/react-query';
import type { Device, DeviceType } from '../../../models';
import DeviceList from './components/DeviceList';
import DeviceTypeList from './components/DeviceTypeList';
import type { DeviceListRef } from './components/DeviceList';
import type { DeviceTypeListRef } from './components/DeviceTypeList';
import EntityManagementLayout from '../../../components/features/admin/EntityManagementLayout';

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

    return (
        <EntityManagementLayout
            title={activeTab === 'devices' ? "Quản lý thiết bị" : "Quản lý loại thiết bị"}
            icon={<MobileOutlined />}
            description={activeTab === 'devices'
                ? "Quản lý thông tin và trạng thái của các thiết bị trong hệ thống"
                : "Quản lý thông tin và trạng thái của các loại thiết bị trong hệ thống"
            }
            addButtonText={activeTab === 'devices' ? "Thêm thiết bị mới" : "Thêm loại thiết bị mới"}
            addButtonIcon={<PlusOutlined />}
            onAddClick={() => {
                // Handle add button click based on active tab using refs
                if (activeTab === 'devices') {
                    deviceListRef.current?.showAddModal();
                } else {
                    deviceTypeListRef.current?.showAddModal();
                }
            }}
            searchText={searchText}
            onSearchChange={setSearchText}
            onRefresh={handleRefresh}
            isLoading={activeTab === 'devices' ? isDevicesLoading : isDeviceTypesLoading}
            isFetching={activeTab === 'devices' ? isDevicesFetching : false}
            totalCount={activeTab === 'devices'
                ? (devicesData?.data?.length || 0)
                : (deviceTypesData?.data?.length || 0)
            }
            activeCount={activeTab === 'devices' ? activeDevicesCount : activeDeviceTypesCount}
            bannedCount={activeTab === 'devices' ? inactiveDevicesCount : inactiveDeviceTypesCount}
            tableTitle={activeTab === 'devices' ? "Danh sách thiết bị" : "Danh sách loại thiết bị"}
            tableComponent={
                <div>
                    <Tabs
                        activeKey={activeTab}
                        onChange={handleTabChange}
                        className="mb-4"
                        items={[
                            {
                                key: 'devices',
                                label: 'Thiết bị',
                                children: null,
                            },
                            {
                                key: 'deviceTypes',
                                label: 'Loại thiết bị',
                                children: null,
                            },
                        ]}
                    />

                    {activeTab === 'devices' ? (
                        <DeviceList
                            ref={deviceListRef}
                            messageApi={message}
                            devices={filteredDevices}
                            loading={isDevicesLoading}
                            deviceTypes={deviceTypesData?.data || []}
                            onRefresh={refetchDevices}
                        />
                    ) : (
                        <DeviceTypeList
                            ref={deviceTypeListRef}
                            messageApi={message}
                            deviceTypes={filteredDeviceTypes}
                            loading={isDeviceTypesLoading}
                            onRefresh={refetchDeviceTypes}
                        />
                    )}
                </div>
            }
            modalComponent={null}
        />
    );
};

export default DeviceManagement; 