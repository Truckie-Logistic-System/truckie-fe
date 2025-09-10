import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, DatePicker, Radio, Upload, message, Typography, App, Breadcrumb, Select } from 'antd';
import { ArrowLeftOutlined, UserAddOutlined, UploadOutlined, HomeOutlined, TeamOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import userService from '../../../services/user';
import type { RegisterEmployeeRequest } from '../../../services/user/types';
import { DateSelectGroup } from '../../../components/common';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const StaffRegister: React.FC = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const { message: messageApi } = App.useApp();
    const [imageUrl, setImageUrl] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();

    const registerMutation = useMutation({
        mutationFn: (data: RegisterEmployeeRequest) => userService.registerEmployee(data),
        onSuccess: () => {
            messageApi.success('Đăng ký nhân viên thành công');
            // Làm mới dữ liệu danh sách nhân viên
            queryClient.invalidateQueries({ queryKey: ['staff'] });
            navigate('/admin/staff');
        },
        onError: (error: any) => {
            messageApi.error(error.message || 'Đăng ký nhân viên thất bại');
        }
    });

    const handleSubmit = async (values: any) => {
        try {
            setLoading(true);
            const employeeData: RegisterEmployeeRequest = {
                username: values.username,
                email: values.email,
                password: values.password,
                fullName: values.fullName,
                phoneNumber: values.phoneNumber,
                gender: values.gender === 'male',
                dateOfBirth: dayjs(values.dateOfBirth).format('YYYY-MM-DD'),
                imageUrl: imageUrl || undefined
            };

            await registerMutation.mutateAsync(employeeData);
        } catch (error) {
            console.error('Error registering employee:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (info: any) => {
        if (info.file.status === 'done') {
            // Giả sử API trả về URL của ảnh đã upload
            setImageUrl(info.file.response.url);
            messageApi.success('Tải ảnh lên thành công');
        } else if (info.file.status === 'error') {
            messageApi.error('Tải ảnh lên thất bại');
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <Breadcrumb className="mb-4">
                <Breadcrumb.Item href="/">
                    <HomeOutlined />
                </Breadcrumb.Item>
                <Breadcrumb.Item href="/admin/staff">
                    <TeamOutlined />
                    <span>Quản lý nhân viên</span>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <UserAddOutlined />
                    <span>Đăng ký nhân viên mới</span>
                </Breadcrumb.Item>
            </Breadcrumb>

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/admin/staff')}
                        className="mr-4"
                    >
                        Quay lại
                    </Button>
                    <Title level={2} className="m-0 flex items-center">
                        <UserAddOutlined className="mr-3 text-blue-500" />
                        Đăng ký nhân viên mới
                    </Title>
                </div>
            </div>

            <Card className="shadow-sm">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{ gender: 'male' }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Title level={4}>Thông tin tài khoản</Title>
                            <Form.Item
                                name="username"
                                label="Tên đăng nhập"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập tên đăng nhập' },
                                    { min: 4, message: 'Tên đăng nhập phải có ít nhất 4 ký tự' }
                                ]}
                            >
                                <Input placeholder="Nhập tên đăng nhập" />
                            </Form.Item>

                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập email' },
                                    { type: 'email', message: 'Email không hợp lệ' }
                                ]}
                            >
                                <Input placeholder="Nhập email" />
                            </Form.Item>

                            <Form.Item
                                name="password"
                                label="Mật khẩu"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập mật khẩu' },
                                    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
                                ]}
                            >
                                <Input.Password placeholder="Nhập mật khẩu" />
                            </Form.Item>

                            <Form.Item
                                name="confirmPassword"
                                label="Xác nhận mật khẩu"
                                dependencies={['password']}
                                rules={[
                                    { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('password') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password placeholder="Xác nhận mật khẩu" />
                            </Form.Item>
                        </div>

                        <div>
                            <Title level={4}>Thông tin cá nhân</Title>
                            <Form.Item
                                name="fullName"
                                label="Họ và tên"
                                rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                            >
                                <Input placeholder="Nhập họ và tên" />
                            </Form.Item>

                            <Form.Item
                                name="phoneNumber"
                                label="Số điện thoại"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập số điện thoại' },
                                    { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có 10 chữ số' }
                                ]}
                            >
                                <Input placeholder="Nhập số điện thoại" />
                            </Form.Item>

                            <Form.Item
                                name="gender"
                                label="Giới tính"
                                rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
                            >
                                <Radio.Group>
                                    <Radio value="male">Nam</Radio>
                                    <Radio value="female">Nữ</Radio>
                                </Radio.Group>
                            </Form.Item>

                            <Form.Item
                                name="dateOfBirth"
                                label="Ngày sinh"
                                rules={[{ required: true, message: 'Vui lòng chọn ngày sinh' }]}
                            >
                                <DateSelectGroup />
                            </Form.Item>

                            <Form.Item
                                name="imageUrl"
                                label="Ảnh đại diện"
                            >
                                <Upload
                                    name="avatar"
                                    listType="picture-card"
                                    className="avatar-uploader"
                                    showUploadList={false}
                                    action="https://run.mocky.io/v3/435e224c-44fb-4773-9faf-380c5e6a2188"
                                    onChange={handleImageUpload}
                                >
                                    {imageUrl ? (
                                        <img src={imageUrl} alt="avatar" style={{ width: '100%' }} />
                                    ) : (
                                        <div>
                                            <UploadOutlined />
                                            <div style={{ marginTop: 8 }}>Tải lên</div>
                                        </div>
                                    )}
                                </Upload>
                                <Text type="secondary">Tải lên ảnh đại diện (không bắt buộc)</Text>
                            </Form.Item>
                        </div>
                    </div>

                    <div className="flex justify-end mt-6">
                        <Button
                            type="default"
                            onClick={() => navigate('/admin/staff')}
                            className="mr-4"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading || registerMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Đăng ký nhân viên
                        </Button>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default StaffRegister; 