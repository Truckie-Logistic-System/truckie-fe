import React, { useState } from 'react';
import { Button, App, Card, Input, Typography, Badge } from 'antd';
import { UserAddOutlined, IdcardOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import driverService from '../../../services/driver';
import type { DriverModel } from '../../../services/driver';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DriverTable from './components/DriverTable';
import StatusChangeModal from './components/StatusChangeModal';

const { Title, Text } = Typography;

const DriverPage: React.FC = () => {
    const navigate = useNavigate();
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<DriverModel | null>(null);
    const [newStatus, setNewStatus] = useState<string>('');
    const [searchText, setSearchText] = useState('');

    const { data: driversData, isLoading, error, refetch } = useQuery({
        queryKey: ['drivers'],
        queryFn: driverService.getAllDrivers
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => driverService.updateDriverStatus(id, status),
        onSuccess: () => {
            message.success('Cập nhật trạng thái tài xế thành công');
            queryClient.invalidateQueries({ queryKey: ['drivers'] });
            setIsStatusModalVisible(false);
        },
        onError: () => {
            message.error('Cập nhật trạng thái tài xế thất bại');
        }
    });

    const handleViewDetails = (driverId: string) => {
        navigate(`/admin/drivers/${driverId}`);
    };

    const handleStatusChange = (driver: DriverModel) => {
        setSelectedDriver(driver);
        setNewStatus(driver.status);
        setIsStatusModalVisible(true);
    };

    const handleStatusUpdate = () => {
        if (selectedDriver && newStatus) {
            updateStatusMutation.mutate({ id: selectedDriver.id, status: newStatus });
        }
    };

    const filteredDrivers = driversData?.filter(driver => {
        if (!searchText) return true;
        const searchLower = searchText.toLowerCase();
        return (
            driver.userResponse.fullName.toLowerCase().includes(searchLower) ||
            driver.userResponse.email.toLowerCase().includes(searchLower) ||
            driver.userResponse.phoneNumber.toLowerCase().includes(searchLower) ||
            driver.identityNumber.toLowerCase().includes(searchLower) ||
            driver.driverLicenseNumber.toLowerCase().includes(searchLower)
        );
    });

    const activeCount = driversData?.filter(driver => driver.status.toLowerCase() === 'active').length || 0;
    const bannedCount = driversData?.filter(driver => driver.status.toLowerCase() === 'banned').length || 0;

    if (isLoading) return <div className="p-6">Đang tải...</div>;
    if (error) return <div className="p-6 text-red-500">Đã xảy ra lỗi khi tải dữ liệu</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="flex items-center m-0 text-blue-800">
                            <IdcardOutlined className="mr-3 text-blue-600" /> Quản lý tài xế
                        </Title>
                        <Text type="secondary">Quản lý thông tin và trạng thái của các tài xế trong hệ thống</Text>
                    </div>
                    <Button
                        type="primary"
                        icon={<UserAddOutlined />}
                        onClick={() => navigate('/admin/drivers/register')}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="large"
                    >
                        Thêm tài xế mới
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center">
                            <div>
                                <Text className="text-gray-600 block">Tổng số tài xế</Text>
                                <Title level={3} className="m-0 text-blue-800">{driversData?.length || 0}</Title>
                            </div>
                            <IdcardOutlined className="text-4xl text-blue-500 opacity-80" />
                        </div>
                    </Card>
                    <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center">
                            <div>
                                <Text className="text-gray-600 block">Tài xế hoạt động</Text>
                                <Title level={3} className="m-0 text-green-700">{activeCount}</Title>
                            </div>
                            <Badge count={activeCount} color="green" showZero>
                                <div className="bg-green-200 p-2 rounded-full">
                                    <IdcardOutlined className="text-3xl text-green-600" />
                                </div>
                            </Badge>
                        </div>
                    </Card>
                    <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center">
                            <div>
                                <Text className="text-gray-600 block">Tài xế bị cấm</Text>
                                <Title level={3} className="m-0 text-red-700">{bannedCount}</Title>
                            </div>
                            <Badge count={bannedCount} color="red" showZero>
                                <div className="bg-red-200 p-2 rounded-full">
                                    <IdcardOutlined className="text-3xl text-red-600" />
                                </div>
                            </Badge>
                        </div>
                    </Card>
                </div>

                <Card className="shadow-sm mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                        <Title level={4} className="m-0 mb-4 md:mb-0">Danh sách tài xế</Title>
                        <div className="flex w-full md:w-auto gap-2">
                            <Input
                                placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                                prefix={<SearchOutlined />}
                                className="w-full md:w-64"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => refetch()}
                                title="Làm mới dữ liệu"
                            />
                        </div>
                    </div>

                    <DriverTable
                        data={filteredDrivers || []}
                        loading={isLoading}
                        onViewDetails={handleViewDetails}
                        onStatusChange={handleStatusChange}
                    />
                </Card>
            </div>

            <StatusChangeModal
                visible={isStatusModalVisible}
                loading={updateStatusMutation.isPending}
                driver={selectedDriver}
                status={newStatus}
                onStatusChange={setNewStatus}
                onOk={handleStatusUpdate}
                onCancel={() => setIsStatusModalVisible(false)}
            />
        </div>
    );
};

export default DriverPage; 