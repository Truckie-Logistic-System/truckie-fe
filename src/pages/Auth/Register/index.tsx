import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { Form, Input, Button, Checkbox, Card, Alert, DatePicker, Radio, Row, Col, Upload, message } from 'antd';
import { GoogleOutlined, EyeInvisibleOutlined, EyeTwoTone, UserOutlined, MailOutlined, PhoneOutlined, UploadOutlined, BankOutlined, IdcardOutlined, LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { AuthPageLayout } from '../components';
import { isStrongPassword } from '../../../utils';
import { authService } from '../../../services';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';
import axios from 'axios';

const RegisterPage: React.FC = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleRegister = async () => {
        try {
            // Validate form fields first
            const values = await form.validateFields();

            setLoading(true);
            setError(null);
            setSuccess(null);

            // Chuyển đổi định dạng ngày sinh
            const formattedDateOfBirth = values.dateOfBirth.format('YYYY-MM-DD');

            // Chuẩn bị dữ liệu đăng ký
            const registerData = {
                username: values.username,
                email: values.email,
                password: values.password,
                fullName: values.fullName,
                phoneNumber: values.phoneNumber,
                gender: values.gender === 'male',
                dateOfBirth: formattedDateOfBirth,
                imageUrl: values.imageUrl || 'string', // Đảm bảo luôn có giá trị
                // Thông tin công ty
                companyName: values.companyName,
                representativeName: values.representativeName,
                representativePhone: values.representativePhone,
                businessLicenseNumber: values.businessLicenseNumber,
                businessAddress: values.businessAddress || 'string', // Đảm bảo luôn có giá trị
            };

            try {
                // Gọi API đăng ký
                const response = await authService.register(registerData);

                if (response.success) {
                    message.success(`Đăng ký thành công! Tài khoản ${response.data.userResponse.username} đã được tạo.`);

                    // Hiển thị thông báo thành công
                    let successMessage = `Tài khoản ${response.data.userResponse.username} đã được tạo thành công!`;

                    // Nếu status là OTP_PENDING, thông báo cho người dùng
                    if (response.data.status === 'OTP_PENDING') {
                        successMessage += ' Vui lòng kiểm tra email để xác thực tài khoản.';
                        message.info('Vui lòng kiểm tra email để xác thực tài khoản.');
                    }

                    setSuccess(successMessage);

                    // Chuyển hướng đến trang đăng nhập sau 3 giây
                    setTimeout(() => {
                        navigate('/auth/login', { state: { registered: true, username: values.username } });
                    }, 3000);
                } else {
                    // Xử lý trường hợp API trả về success: false
                    message.error(response.message || 'Đăng ký thất bại');
                    setError(response.message || 'Đăng ký thất bại. Vui lòng thử lại sau.');
                }
            } catch (error) {
                // Extract error message
                let errorMsg = 'Đăng ký thất bại. Vui lòng thử lại sau.';

                if (axios.isAxiosError(error)) {
                    if (error.response?.data?.message) {
                        errorMsg = error.response.data.message;
                    } else if (error.response?.status) {
                        errorMsg = `Lỗi ${error.response.status}: Đăng ký thất bại`;
                    } else if (error.message) {
                        errorMsg = error.message;
                    }
                } else if (error instanceof Error) {
                    errorMsg = error.message;
                }

                message.error(errorMsg);
                setError(errorMsg);
            }
        } catch (error) {
            // Form validation failed, do nothing
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = () => {
        // Implement Google signup logic here
        console.log('Đăng ký với Google được nhấp');
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
                message.success(`${info.file.name} tải lên thành công`);
            } else if (info.file.status === 'error') {
                message.error(`${info.file.name} tải lên thất bại.`);
            }
        },
        beforeUpload(file) {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error('Bạn chỉ có thể tải lên file hình ảnh!');
            }
            const isLt2M = file.size / 1024 / 1024 < 2;
            if (!isLt2M) {
                message.error('Hình ảnh phải nhỏ hơn 2MB!');
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
            handleRegister();
        }
    };

    return (
        <AuthPageLayout maxWidth="max-w-7xl">
            <div className="text-center mb-4">
                <Link to="/">
                    <span className="text-blue-600 font-bold text-3xl">truckie</span>
                </Link>
            </div>

            <Card className="shadow-lg border-0 w-full" bodyStyle={{ padding: '32px' }}>
                <div className="text-center mb-6">
                    <h1 className="text-xl font-bold mb-1">Tạo tài khoản doanh nghiệp</h1>
                    <p className="text-gray-500 text-sm">Chào mừng bạn đến với Truckie! Vui lòng điền đầy đủ thông tin để đăng ký tài khoản doanh nghiệp.</p>
                </div>

                {error && (
                    <Alert
                        message="Đăng ký thất bại"
                        description={error}
                        type="error"
                        showIcon
                        closable
                        className="mb-4"
                        onClose={() => setError(null)}
                    />
                )}

                {success && (
                    <Alert
                        message="Đăng ký thành công"
                        description={success}
                        type="success"
                        showIcon
                        icon={<CheckCircleOutlined />}
                        className="mb-4"
                    />
                )}

                <form onSubmit={preventSubmit}>
                    <Form
                        form={form}
                        layout="vertical"
                        requiredMark="optional"
                        initialValues={{
                            gender: 'male',
                            dateOfBirth: dayjs().subtract(18, 'year')
                        }}
                        onFinish={() => { }} // Empty function to prevent default form submission
                    >
                        {/* Form content remains the same, just add disabled={loading} to inputs */}

                        <Form.Item>
                            <Button
                                type="primary"
                                className="w-full bg-blue-600 h-10"
                                loading={loading}
                                onClick={handleRegister}
                                disabled={loading}
                            >
                                Đăng ký
                            </Button>
                        </Form.Item>
                    </Form>
                </form>

                <div className="text-center my-4">hoặc</div>

                <Button
                    icon={<GoogleOutlined />}
                    className="w-full flex items-center justify-center h-10"
                    onClick={handleGoogleSignup}
                    disabled={loading}
                >
                    Đăng ký với Google
                </Button>

                <div className="text-center mt-4">
                    <span className="text-gray-500">Đã có tài khoản? </span>
                    <Link to="/auth/login" className="text-blue-600">
                        Đăng nhập ngay
                    </Link>
                </div>
            </Card>
        </AuthPageLayout>
    );
};

export default RegisterPage; 