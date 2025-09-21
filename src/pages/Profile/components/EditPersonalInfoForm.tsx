import React, { useState } from 'react';
import { Form, Input, Button, App, DatePicker, Radio, Upload, message } from 'antd';
import { SaveOutlined, UserOutlined, MailOutlined, PhoneOutlined, UploadOutlined } from '@ant-design/icons';
import type { UserModel } from '@/models/User';
import type { UserUpdateRequest } from '@/services/user/types';
import userService from '@/services/user/userService';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

interface EditPersonalInfoFormProps {
    userData: UserModel;
    onSuccess: () => void;
}

const EditPersonalInfoForm: React.FC<EditPersonalInfoFormProps> = ({ userData, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();
    const { message } = App.useApp();

    // Initialize form with current data
    React.useEffect(() => {
        form.setFieldsValue({
            fullName: userData.fullName,
            email: userData.email,
            phoneNumber: userData.phoneNumber,
            gender: userData.gender,
            dateOfBirth: userData.dateOfBirth ? dayjs(userData.dateOfBirth) : undefined,
        });
    }, [userData, form]);

    const handleSubmit = async (values: any) => {
        try {
            setLoading(true);

            const updateData: UserUpdateRequest = {
                fullName: values.fullName,
                email: values.email,
                phoneNumber: values.phoneNumber,
                gender: values.gender,
                dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : undefined,
                imageUrl: userData.imageUrl // Keep the existing image URL
            };

            await userService.updateUserProfile(userData.id, updateData);

            // Refresh cache data
            queryClient.invalidateQueries({ queryKey: ['customerProfile'] });

            onSuccess();
        } catch (error) {
            console.error('Error updating personal info:', error);
            message.error('Không thể cập nhật thông tin cá nhân. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="mt-4"
        >
            <Form.Item
                name="fullName"
                label="Họ và tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
            >
                <Input
                    placeholder="Nhập họ và tên"
                    prefix={<UserOutlined className="text-gray-400" />}
                    className="rounded-md"
                />
            </Form.Item>

            <Form.Item
                name="email"
                label="Email"
                rules={[
                    { required: true, message: 'Vui lòng nhập email' },
                    { type: 'email', message: 'Email không hợp lệ' }
                ]}
            >
                <Input
                    placeholder="Nhập email"
                    prefix={<MailOutlined className="text-gray-400" />}
                    className="rounded-md"
                />
            </Form.Item>

            <Form.Item
                name="phoneNumber"
                label="Số điện thoại"
                rules={[
                    { required: true, message: 'Vui lòng nhập số điện thoại' },
                    { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ' }
                ]}
            >
                <Input
                    placeholder="Nhập số điện thoại"
                    prefix={<PhoneOutlined className="text-gray-400" />}
                    className="rounded-md"
                />
            </Form.Item>

            <Form.Item
                name="gender"
                label="Giới tính"
                rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
            >
                <Radio.Group>
                    <Radio value={true}>Nam</Radio>
                    <Radio value={false}>Nữ</Radio>
                </Radio.Group>
            </Form.Item>

            <Form.Item
                name="dateOfBirth"
                label="Ngày sinh"
                rules={[{ required: true, message: 'Vui lòng chọn ngày sinh' }]}
            >
                <DatePicker
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày sinh"
                    className="w-full rounded-md"
                />
            </Form.Item>

            <Form.Item className="mt-6 flex justify-end">
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="bg-blue-600 hover:bg-blue-700 transition-colors duration-300 px-8"
                    size="large"
                    icon={<SaveOutlined />}
                >
                    Lưu thay đổi
                </Button>
            </Form.Item>
        </Form>
    );
};

export default EditPersonalInfoForm; 