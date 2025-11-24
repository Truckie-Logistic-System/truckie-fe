import React, { useState } from 'react';
import { Form, Input, Button, message, App } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import authService from '@/services/auth';
import type { ChangePasswordRequest } from '@/services/auth/types';

interface ChangePasswordFormProps {
    username: string;
    onSuccess?: () => void;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ username, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const { message: messageApi } = App.useApp();

    const { mutate: changePassword } = useMutation({
        mutationFn: (data: ChangePasswordRequest) => authService.changePassword(data),
        onSuccess: () => {
            const successMessage = 'Đổi mật khẩu thành công';
            setErrorMessage(null);

            // Hiển thị thông báo thành công dạng toast
            messageApi.success({
                content: successMessage,
                duration: 5,
                className: 'custom-message-success'
            });
            form.resetFields();
            if (onSuccess) {
                // Đợi một chút để người dùng thấy thông báo trước khi đóng modal
                setTimeout(() => {
                    onSuccess();
                }, 1000);
            }
        },
        onError: (error: Error) => {
            const errorMsg = error.message || 'Đổi mật khẩu thất bại';
            setErrorMessage(errorMsg);

            // Hiển thị thông báo lỗi dạng toast
            messageApi.error({
                content: errorMsg,
                duration: 5,
                className: 'custom-message-error'
            });
        },
        onSettled: () => {
            setLoading(false);
        }
    });

    const handleSubmit = (values: any) => {
        setLoading(true);
        setErrorMessage(null);

        const data: ChangePasswordRequest = {
            username,
            oldPassword: values.oldPassword,
            newPassword: values.newPassword,
            confirmNewPassword: values.confirmNewPassword
        };
        changePassword(data);
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="change-password-form"
        >
            {errorMessage && (
                <Form.Item>
                    <div className="text-red-500 mb-2">{errorMessage}</div>
                </Form.Item>
            )}

            <Form.Item
                name="oldPassword"
                label="Mật khẩu hiện tại"
                rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }
                ]}
            >
                <Input.Password
                    prefix={<LockOutlined className="text-gray-400" />}
                    placeholder="Nhập mật khẩu hiện tại"
                />
            </Form.Item>

            <Form.Item
                name="newPassword"
                label="Mật khẩu mới"
                rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                ]}
                hasFeedback
            >
                <Input.Password
                    prefix={<LockOutlined className="text-gray-400" />}
                    placeholder="Nhập mật khẩu mới"
                />
            </Form.Item>

            <Form.Item
                name="confirmNewPassword"
                label="Xác nhận mật khẩu mới"
                dependencies={['newPassword']}
                hasFeedback
                rules={[
                    { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                                return Promise.resolve();
                            }
                            return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                        },
                    }),
                ]}
            >
                <Input.Password
                    prefix={<LockOutlined className="text-gray-400" />}
                    placeholder="Xác nhận mật khẩu mới"
                />
            </Form.Item>

            <Form.Item className="mb-0">
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="w-full bg-blue-600"
                >
                    Đổi mật khẩu
                </Button>
            </Form.Item>
        </Form>
    );
};

export default ChangePasswordForm; 