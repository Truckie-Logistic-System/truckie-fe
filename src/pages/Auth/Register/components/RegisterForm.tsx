import React from 'react';
import { Form, Input, Button, Checkbox, Radio, Row, Col, Upload } from 'antd';
import {
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    UploadOutlined,
    BankOutlined,
    IdcardOutlined,
    LockOutlined,
    EyeInvisibleOutlined,
    EyeTwoTone
} from '@ant-design/icons';
import { isStrongPassword } from '../../../../utils';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';
import { DateSelectGroup } from '../../../../components/common';
import type { FormEvent } from 'react';
import { authService } from '../../../../services';

interface RegisterFormProps {
    loading: boolean;
    onSubmit: () => void;
    form: any; // Form instance
}

const RegisterForm: React.FC<RegisterFormProps> = ({ loading, onSubmit, form }) => {
    const handleGoogleSignup = () => {
        // Implement Google signup logic here

    };

    const validatePassword = (_: any, value: string) => {
        if (!value) {
            return Promise.reject('Vui lòng nhập mật khẩu');
        }

        if (!isStrongPassword(value)) {
            return Promise.reject('Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số');
        }

        return Promise.resolve();
    };

    const validateConfirmPassword = (_: any, value: string) => {
        if (!value) {
            return Promise.reject('Vui lòng xác nhận mật khẩu');
        }

        if (value !== form.getFieldValue('password')) {
            return Promise.reject('Mật khẩu xác nhận không khớp');
        }

        return Promise.resolve();
    };

    const validateUsername = async (_: any, value: string) => {
        if (!value) {
            return Promise.reject('Vui lòng nhập tên đăng nhập');
        }

        // Check minimum length
        if (value.length < 3) {
            return Promise.reject('Tên đăng nhập phải có ít nhất 3 ký tự');
        }

        // Check if username is available
        try {
            const isAvailable = await authService.checkUsernameAvailability(value);
            if (!isAvailable) {
                return Promise.reject('Tên đăng nhập đã được sử dụng');
            }
            return Promise.resolve();
        } catch (error) {
            console.error('Error checking username:', error);
            // Don't block registration if check fails
            return Promise.resolve();
        }
    };

    const validateEmail = async (_: any, value: string) => {
        if (!value) {
            return Promise.reject('Vui lòng nhập email');
        }

        // Check email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return Promise.reject('Email không hợp lệ');
        }

        // Check if email is available
        try {
            const isAvailable = await authService.checkEmailAvailability(value);
            if (!isAvailable) {
                return Promise.reject('Email đã được sử dụng');
            }
            return Promise.resolve();
        } catch (error) {
            console.error('Error checking email:', error);
            // Don't block registration if check fails
            return Promise.resolve();
        }
    };

    const uploadProps: UploadProps = {
        name: 'file',
        action: 'https://run.mocky.io/v3/435e224c-44fb-4773-9faf-380c5e6a2188', // Thay thế bằng API upload thực tế
        headers: {
            authorization: 'authorization-text',
        },
        onChange(info) {
            if (info.file.status === 'done') {
                // Giả định API trả về URL ảnh trong response.url
                const imageUrl = info.file.response?.url || `https://example.com/images/${info.file.name}`;
                form.setFieldsValue({ imageUrl });
                // message.success(`${info.file.name} tải lên thành công`);
            } else if (info.file.status === 'error') {
                // message.error(`${info.file.name} tải lên thất bại.`);
            }
        },
        beforeUpload(file) {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                // message.error('Bạn chỉ có thể tải lên file hình ảnh!');
            }
            const isLt2M = file.size / 1024 / 1024 < 2;
            if (!isLt2M) {
                // message.error('Hình ảnh phải nhỏ hơn 2MB!');
            }
            return isImage && isLt2M;
        },
    };

    // Prevent any form submission
    const preventSubmit = (e: FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <form onSubmit={preventSubmit}>
            <Form
                form={form}
                layout="vertical"
                requiredMark={true}
                initialValues={{
                    gender: 'male',
                    dateOfBirth: dayjs().subtract(18, 'year')
                }}
                onFinish={() => { }} // Empty function to prevent default form submission
            >
                {/* Thông tin tài khoản */}
                <div className="mb-4 font-medium">Thông tin tài khoản</div>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="username"
                            label="Tên đăng nhập"
                            validateFirst
                            rules={[
                                { required: true, message: 'Vui lòng nhập tên đăng nhập' },
                                { validator: validateUsername }
                            ]}
                            hasFeedback
                        >
                            <Input
                                prefix={<UserOutlined />}
                                placeholder="Nhập tên đăng nhập"
                                disabled={loading}
                                onKeyPress={handleKeyPress}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="email"
                            label="Email"
                            validateFirst
                            rules={[
                                { required: true, message: 'Vui lòng nhập email' },
                                { validator: validateEmail }
                            ]}
                            hasFeedback
                        >
                            <Input
                                prefix={<MailOutlined />}
                                placeholder="Nhập email"
                                disabled={loading}
                                onKeyPress={handleKeyPress}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="password"
                            label="Mật khẩu"
                            validateFirst
                            rules={[
                                { required: true, message: 'Vui lòng nhập mật khẩu' },
                                { validator: validatePassword }
                            ]}
                            hasFeedback
                        >
                            <Input.Password
                                prefix={<LockOutlined />}
                                placeholder="Nhập mật khẩu"
                                iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                                disabled={loading}
                                onKeyPress={handleKeyPress}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="confirmPassword"
                            label="Xác nhận mật khẩu"
                            validateFirst
                            dependencies={['password']}
                            rules={[
                                { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                                { validator: validateConfirmPassword }
                            ]}
                            hasFeedback
                        >
                            <Input.Password
                                prefix={<LockOutlined />}
                                placeholder="Xác nhận mật khẩu"
                                iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                                disabled={loading}
                                onKeyPress={handleKeyPress}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                {/* Thông tin cá nhân */}
                <div className="mb-4 mt-6 font-medium">Thông tin cá nhân</div>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="fullName"
                            label="Họ và tên"
                            validateFirst
                            rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                            hasFeedback
                        >
                            <Input
                                prefix={<UserOutlined />}
                                placeholder="Nhập họ và tên"
                                disabled={loading}
                                onKeyPress={handleKeyPress}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="phoneNumber"
                            label="Số điện thoại"
                            validateFirst
                            rules={[
                                { required: true, message: 'Vui lòng nhập số điện thoại' },
                                { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có 10 chữ số' }
                            ]}
                            hasFeedback
                        >
                            <Input
                                prefix={<PhoneOutlined />}
                                placeholder="Nhập số điện thoại"
                                disabled={loading}
                                onKeyPress={handleKeyPress}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="gender"
                            label="Giới tính"
                            validateFirst
                            rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
                        >
                            <Radio.Group disabled={loading}>
                                <Radio value="male">Nam</Radio>
                                <Radio value="female">Nữ</Radio>
                            </Radio.Group>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="dateOfBirth"
                            label="Ngày sinh"
                            validateFirst
                            rules={[{ required: true, message: 'Vui lòng chọn ngày sinh' }]}
                        >
                            <DateSelectGroup mode="birthdate" />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    name="imageUrl"
                    label="Ảnh đại diện"
                    extra="Hỗ trợ định dạng: JPG, PNG. Kích thước tối đa: 2MB"
                >
                    <Upload {...uploadProps} disabled={loading}>
                        <Button icon={<UploadOutlined />} disabled={loading}>Tải ảnh lên</Button>
                    </Upload>
                </Form.Item>

                {/* Thông tin công ty */}
                <div className="mb-4 mt-6 font-medium">Thông tin công ty</div>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="companyName"
                            label="Tên công ty"
                            validateFirst
                            rules={[{ required: true, message: 'Vui lòng nhập tên công ty' }]}
                            hasFeedback
                        >
                            <Input
                                prefix={<BankOutlined />}
                                placeholder="Nhập tên công ty"
                                disabled={loading}
                                onKeyPress={handleKeyPress}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="businessLicenseNumber"
                            label="Mã số doanh nghiệp"
                            validateFirst
                            rules={[{ required: true, message: 'Vui lòng nhập mã số doanh nghiệp' }]}
                            hasFeedback
                        >
                            <Input
                                prefix={<IdcardOutlined />}
                                placeholder="Nhập mã số doanh nghiệp"
                                disabled={loading}
                                onKeyPress={handleKeyPress}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="representativeName"
                            label="Tên người đại diện"
                            validateFirst
                            rules={[{ required: true, message: 'Vui lòng nhập tên người đại diện' }]}
                            hasFeedback
                        >
                            <Input
                                prefix={<UserOutlined />}
                                placeholder="Nhập tên người đại diện"
                                disabled={loading}
                                onKeyPress={handleKeyPress}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="representativePhone"
                            label="Số điện thoại người đại diện"
                            validateFirst
                            rules={[
                                { required: true, message: 'Vui lòng nhập số điện thoại người đại diện' },
                                { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có 10 chữ số' }
                            ]}
                            hasFeedback
                        >
                            <Input
                                prefix={<PhoneOutlined />}
                                placeholder="Nhập số điện thoại người đại diện"
                                disabled={loading}
                                onKeyPress={handleKeyPress}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    name="businessAddress"
                    label="Địa chỉ doanh nghiệp"
                    validateFirst
                    rules={[{ required: true, message: 'Vui lòng nhập địa chỉ doanh nghiệp' }]}
                    hasFeedback
                >
                    <Input.TextArea
                        placeholder="Nhập địa chỉ doanh nghiệp"
                        rows={3}
                        disabled={loading}
                    />
                </Form.Item>

                <Form.Item>
                    <Button
                        type="primary"
                        className="w-full bg-blue-600 h-10"
                        loading={loading}
                        onClick={onSubmit}
                        disabled={loading}
                    >
                        Đăng ký
                    </Button>
                </Form.Item>
            </Form>
        </form>
    );
};

export default RegisterForm; 