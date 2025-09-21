import React, { useState } from 'react';
import { Card, Button, App, Typography, Breadcrumb, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, HomeOutlined, IdcardOutlined, UserAddOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import driverService from '../../../services/driver';
import type { DriverRegisterRequest } from '../../../services/driver';
import DriverForm from './components/DriverForm';

const { Title, Text } = Typography;

const RegisterDriver: React.FC = () => {
    const navigate = useNavigate();
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const [isSuccess, setIsSuccess] = useState(false);

    const registerMutation = useMutation({
        mutationFn: (values: DriverRegisterRequest) => driverService.registerDriver(values),
        onSuccess: () => {
            message.success('Đăng ký tài xế thành công');
            // Invalidate drivers query to refresh the list
            queryClient.invalidateQueries({ queryKey: ['drivers'] });
            setIsSuccess(true);
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Đăng ký tài xế thất bại');
        }
    });

    const handleSubmit = (values: any) => {
        // Format dates to ISO string
        const formattedValues = {
            ...values,
            dateOfBirth: values.dateOfBirth.format('YYYY-MM-DD'),
            dateOfIssue: values.dateOfIssue.format('YYYY-MM-DD'),
            dateOfExpiry: values.dateOfExpiry.format('YYYY-MM-DD'),
            dateOfPassing: values.dateOfPassing.format('YYYY-MM-DD'),
        };

        registerMutation.mutate(formattedValues);
    };

    const handleGoToDriversList = () => {
        navigate('/admin/drivers');
    };

    if (isSuccess) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <Result
                    status="success"
                    title="Đăng ký tài xế thành công!"
                    subTitle="Tài xế mới đã được thêm vào hệ thống."
                    extra={[
                        <Button
                            type="primary"
                            key="console"
                            onClick={handleGoToDriversList}
                            icon={<IdcardOutlined />}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Xem danh sách tài xế
                        </Button>,
                        <Button
                            key="register-another"
                            onClick={() => setIsSuccess(false)}
                            icon={<UserAddOutlined />}
                        >
                            Đăng ký tài xế khác
                        </Button>,
                    ]}
                />
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <Breadcrumb className="mb-4">
                <Breadcrumb.Item href="/">
                    <HomeOutlined />
                </Breadcrumb.Item>
                <Breadcrumb.Item href="/admin/drivers">
                    <IdcardOutlined />
                    <span>Quản lý tài xế</span>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <UserAddOutlined />
                    <span>Đăng ký tài xế mới</span>
                </Breadcrumb.Item>
            </Breadcrumb>

            <div className="flex items-center mb-6">
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/admin/drivers')}
                    className="mr-4"
                    disabled={registerMutation.isPending}
                >
                    Quay lại
                </Button>
                <Title level={2} className="m-0 flex items-center">
                    <UserAddOutlined className="mr-3 text-blue-500" />
                    Đăng ký tài xế mới
                </Title>
            </div>

            <Text className="block mb-6 text-gray-500">
                Vui lòng điền đầy đủ thông tin để đăng ký tài xế mới vào hệ thống.
            </Text>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
                <DriverForm
                    loading={registerMutation.isPending}
                    onSubmit={handleSubmit}
                />
            </Card>
        </div>
    );
};

export default RegisterDriver; 