import React from 'react';
import { Form, Input, Button, Checkbox } from 'antd';
import {
    UserOutlined,
    LockOutlined,
    EyeInvisibleOutlined,
    EyeTwoTone,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

interface LoginFormProps {
    loading: boolean;
    onFinish: (values: { username: string; password: string; remember: boolean }) => void;
    errorMessage: string | null;
    initialUsername?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({
    loading,
    onFinish,
    errorMessage,
    initialUsername,
}) => {
    const [form] = Form.useForm();

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            form.submit();
        }
    };

    return (
        <div>
            {errorMessage && (
                <div className="text-red-500 text-center mb-4">
                    {errorMessage}
                </div>
            )}

            <Form
                form={form}
                layout="vertical"
                requiredMark="optional"
                initialValues={{ remember: true, username: initialUsername }}
                onFinish={onFinish}
            >
                <Form.Item
                    name="username"
                    label={
                        <span className="flex items-center">
                            <span className="text-red-500 mr-1">*</span>Tên đăng nhập
                        </span>
                    }
                    rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập" }]}
                >
                    <Input
                        prefix={<UserOutlined className="text-gray-400" />}
                        placeholder="Nhập tên đăng nhập của bạn"
                        autoFocus
                        onKeyPress={handleKeyPress}
                        disabled={loading}
                    />
                </Form.Item>

                <Form.Item
                    name="password"
                    label={
                        <span className="flex items-center">
                            <span className="text-red-500 mr-1">*</span>Mật khẩu
                        </span>
                    }
                    rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
                >
                    <Input.Password
                        prefix={<LockOutlined className="text-gray-400" />}
                        placeholder="Nhập mật khẩu"
                        iconRender={(visible) =>
                            visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                        }
                        onKeyPress={handleKeyPress}
                        disabled={loading}
                    />
                </Form.Item>

                <div className="flex justify-between items-center mb-4">
                    <Form.Item name="remember" valuePropName="checked" noStyle>
                        <Checkbox disabled={loading}>Ghi nhớ đăng nhập 30 ngày</Checkbox>
                    </Form.Item>
                    <Link to="/auth/forgot-password" className="text-blue-600 text-sm">
                        Quên mật khẩu
                    </Link>
                </div>

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        className="w-full bg-blue-600 h-10"
                        loading={loading}
                        disabled={loading}
                    >
                        Đăng nhập
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default LoginForm; 