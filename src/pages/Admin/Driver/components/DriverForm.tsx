import React, { useState } from 'react';
import { Form, Input, Button, Select, Divider, Typography, Alert, Space, Tooltip } from 'antd';
import { IdcardOutlined, CalendarOutlined, UserOutlined, MailOutlined, PhoneOutlined, LockOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { DriverRegisterRequest } from '../../../../services/driver';
import dayjs from 'dayjs';
import DateSelectGroup from '../../../../components/common/DateSelectGroup';

const { Option } = Select;
const { Text } = Typography;

interface DriverFormProps {
    loading: boolean;
    onSubmit: (values: any) => void;
}

const DriverForm: React.FC<DriverFormProps> = ({ loading, onSubmit }) => {
    const [form] = Form.useForm();
    const [selectedLicenseClass, setSelectedLicenseClass] = useState<string>('');

    // Hạng giấy phép và độ tuổi tối thiểu
    const licenseClassOptions = [
        { value: 'B2', label: 'B2 - Ô tô tải dưới 3.5 tấn', minAge: 18 },
        { value: 'C', label: 'C - Ô tô tải từ 3.5 tấn đến 10 tấn', minAge: 21 },
    ];

    // Kiểm tra độ tuổi dựa trên ngày sinh và hạng bằng
    const validateAge = (dateOfBirth: any, licenseClass: string) => {
        if (!dateOfBirth || !licenseClass) return Promise.resolve();

        const birthDate = dayjs(dateOfBirth);
        const today = dayjs();
        const age = today.diff(birthDate, 'year');

        const selectedClass = licenseClassOptions.find(option => option.value === licenseClass);
        if (!selectedClass) return Promise.resolve();

        if (age < selectedClass.minAge) {
            return Promise.reject(
                `Độ tuổi tối thiểu cho hạng bằng ${licenseClass} là ${selectedClass.minAge} tuổi (hiện tại: ${age} tuổi)`
            );
        }

        return Promise.resolve();
    };

    // Kiểm tra ngày sát hạch theo hạng giấy phép
    const validatePassingDate = (value: any, licenseClass: string) => {
        if (!value || !licenseClass) return Promise.resolve();

        const birthDate = form.getFieldValue('dateOfBirth');
        if (!birthDate) return Promise.resolve();

        const selectedClass = licenseClassOptions.find(option => option.value === licenseClass);
        if (!selectedClass) return Promise.resolve();

        // Kiểm tra tuổi tại thời điểm sát hạch
        const ageAtPassing = value.diff(birthDate, 'year');

        if (ageAtPassing < selectedClass.minAge) {
            return Promise.reject(
                `Ngày sát hạch phải sau khi đủ ${selectedClass.minAge} tuổi đối với hạng ${licenseClass}`
            );
        }

        return Promise.resolve();
    };

    // Kiểm tra thứ tự thời gian: ngày sát hạch -> ngày cấp -> ngày hết hạn
    const validateDateOrder = (rule: any, value: any) => {
        if (!value) return Promise.resolve();

        const dateOfPassing = form.getFieldValue('dateOfPassing');
        const dateOfIssue = form.getFieldValue('dateOfIssue');
        const dateOfExpiry = form.getFieldValue('dateOfExpiry');

        if (rule.field === 'dateOfIssue' && dateOfPassing && value.isBefore(dateOfPassing)) {
            return Promise.reject('Ngày cấp phải sau hoặc bằng ngày sát hạch');
        }

        if (rule.field === 'dateOfExpiry') {
            if (dateOfIssue && value.isBefore(dateOfIssue)) {
                return Promise.reject('Ngày hết hạn phải sau ngày cấp');
            }

            // Kiểm tra ngày hết hạn phải sau ngày hiện tại
            if (value.isBefore(dayjs())) {
                return Promise.reject('Giấy phép đã hết hạn. Vui lòng cập nhật giấy phép mới');
            }
        }

        return Promise.resolve();
    };

    // Kiểm tra ngày sinh không được là tương lai
    const validateBirthDate = (_: any, value: any) => {
        if (!value) return Promise.resolve();

        if (value.isAfter(dayjs())) {
            return Promise.reject('Ngày sinh không thể là ngày trong tương lai');
        }

        return Promise.resolve();
    };

    // Cập nhật hạng giấy phép và kiểm tra lại độ tuổi và ngày sát hạch
    const handleLicenseClassChange = (value: string) => {
        setSelectedLicenseClass(value);
        // Validate lại cả ngày sinh và ngày sát hạch khi thay đổi hạng giấy phép
        form.validateFields(['dateOfBirth', 'dateOfPassing']);
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onSubmit}
            className="max-w-4xl mx-auto"
            requiredMark={false}
        >
            <Alert
                message="Lưu ý về thông tin giấy phép lái xe"
                description={
                    <ul className="list-disc pl-5">
                        <li>Ngày sát hạch phải sau khi đủ tuổi theo hạng giấy phép (B2: 18 tuổi, C: 21 tuổi)</li>
                        <li>Ngày sát hạch phải trước hoặc bằng ngày cấp</li>
                        <li>Ngày cấp phải trước ngày hết hạn</li>
                        <li>Chỉ ngày hết hạn được phép chọn ngày trong tương lai</li>
                    </ul>
                }
                type="info"
                showIcon
                className="mb-6"
            />

            <div className="flex items-center mb-4">
                <UserOutlined className="text-blue-500 mr-2" />
                <Text strong className="text-lg">Thông tin tài khoản</Text>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                    name="username"
                    label="Tên đăng nhập"
                    rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
                >
                    <Input placeholder="Nhập tên đăng nhập" prefix={<UserOutlined className="text-gray-400" />} />
                </Form.Item>

                <Form.Item
                    name="password"
                    label="Mật khẩu"
                    rules={[
                        { required: true, message: 'Vui lòng nhập mật khẩu' },
                        { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
                    ]}
                >
                    <Input.Password placeholder="Nhập mật khẩu" prefix={<LockOutlined className="text-gray-400" />} />
                </Form.Item>

                <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                        { required: true, message: 'Vui lòng nhập email' },
                        { type: 'email', message: 'Email không hợp lệ' }
                    ]}
                >
                    <Input placeholder="Nhập email" prefix={<MailOutlined className="text-gray-400" />} />
                </Form.Item>

                <Form.Item
                    name="phoneNumber"
                    label="Số điện thoại"
                    rules={[
                        { required: true, message: 'Vui lòng nhập số điện thoại' },
                        { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có 10 chữ số' }
                    ]}
                >
                    <Input placeholder="Nhập số điện thoại" prefix={<PhoneOutlined className="text-gray-400" />} />
                </Form.Item>
            </div>

            <Divider />

            <div className="flex items-center mb-4">
                <UserOutlined className="text-blue-500 mr-2" />
                <Text strong className="text-lg">Thông tin cá nhân</Text>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                    name="fullName"
                    label="Họ và tên"
                    rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                >
                    <Input placeholder="Nhập họ và tên" prefix={<UserOutlined className="text-gray-400" />} />
                </Form.Item>

                <Form.Item
                    name="gender"
                    label="Giới tính"
                    rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
                >
                    <Select placeholder="Chọn giới tính">
                        <Option value={true}>Nam</Option>
                        <Option value={false}>Nữ</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    name="dateOfBirth"
                    label={
                        <Space>
                            <span>Ngày sinh</span>
                            {selectedLicenseClass && (
                                <Tooltip title={`Độ tuổi tối thiểu cho hạng ${selectedLicenseClass}: ${licenseClassOptions.find(o => o.value === selectedLicenseClass)?.minAge} tuổi`}>
                                    <InfoCircleOutlined className="text-blue-500" />
                                </Tooltip>
                            )}
                        </Space>
                    }
                    rules={[
                        { required: true, message: 'Vui lòng chọn ngày sinh' },
                        { validator: validateBirthDate },
                        {
                            validator: (_, value) =>
                                validateAge(value, form.getFieldValue('licenseClass'))
                        }
                    ]}
                    dependencies={['licenseClass']}
                >
                    <DateSelectGroup
                        disabledDate={date => date.isAfter(dayjs())}
                    />
                </Form.Item>

                <Form.Item
                    name="imageUrl"
                    label="URL hình ảnh"
                >
                    <Input placeholder="Nhập URL hình ảnh" />
                </Form.Item>
            </div>

            <Divider />

            <div className="flex items-center mb-4">
                <IdcardOutlined className="text-blue-500 mr-2" />
                <Text strong className="text-lg">Thông tin giấy tờ</Text>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                    name="identityNumber"
                    label="Số CMND/CCCD"
                    rules={[
                        { required: true, message: 'Vui lòng nhập số CMND/CCCD' },
                        { pattern: /^[0-9]{9}$|^[0-9]{12}$/, message: 'Số CMND/CCCD phải có 9 hoặc 12 chữ số' }
                    ]}
                >
                    <Input placeholder="Nhập số CMND/CCCD" prefix={<IdcardOutlined className="text-gray-400" />} />
                </Form.Item>

                <Form.Item
                    name="driverLicenseNumber"
                    label="Số giấy phép lái xe"
                    rules={[{ required: true, message: 'Vui lòng nhập số giấy phép lái xe' }]}
                >
                    <Input placeholder="Nhập số giấy phép lái xe" prefix={<IdcardOutlined className="text-gray-400" />} />
                </Form.Item>

                <Form.Item
                    name="cardSerialNumber"
                    label="Số seri thẻ"
                    rules={[{ required: true, message: 'Vui lòng nhập số seri thẻ' }]}
                >
                    <Input placeholder="Nhập số seri thẻ" prefix={<IdcardOutlined className="text-gray-400" />} />
                </Form.Item>

                <Form.Item
                    name="placeOfIssue"
                    label="Nơi cấp"
                    rules={[{ required: true, message: 'Vui lòng nhập nơi cấp' }]}
                >
                    <Input placeholder="Nhập nơi cấp" />
                </Form.Item>
            </div>

            <Form.Item
                name="licenseClass"
                label={
                    <Space>
                        <span>Hạng giấy phép</span>
                        <Tooltip title="Hạng B2: Ô tô tải dưới 3.5 tấn (≥18 tuổi), Hạng C: Ô tô tải từ 3.5 đến 10 tấn (≥21 tuổi)">
                            <InfoCircleOutlined className="text-blue-500" />
                        </Tooltip>
                    </Space>
                }
                rules={[{ required: true, message: 'Vui lòng chọn hạng giấy phép' }]}
            >
                <Select
                    placeholder="Chọn hạng giấy phép"
                    onChange={handleLicenseClassChange}
                >
                    {licenseClassOptions.map(option => (
                        <Option key={option.value} value={option.value}>
                            {option.label} (≥{option.minAge} tuổi)
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            <Divider />

            <div className="flex items-center mb-4">
                <CalendarOutlined className="text-blue-500 mr-2" />
                <Text strong className="text-lg">Thông tin thời gian</Text>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Form.Item
                    name="dateOfPassing"
                    label="Ngày sát hạch"
                    tooltip="Ngày thi và đạt giấy phép lái xe"
                    rules={[
                        { required: true, message: 'Vui lòng chọn ngày sát hạch' },
                        {
                            validator: (_, value) => {
                                if (!value) return Promise.resolve();

                                const birthDate = form.getFieldValue('dateOfBirth');
                                if (!birthDate) return Promise.resolve();

                                // Kiểm tra ngày sát hạch phải sau ngày sinh
                                if (value.isBefore(birthDate)) {
                                    return Promise.reject('Ngày sát hạch phải sau ngày sinh');
                                }

                                // Kiểm tra theo hạng giấy phép
                                const licenseClass = form.getFieldValue('licenseClass');
                                return validatePassingDate(value, licenseClass);
                            }
                        }
                    ]}
                    dependencies={['dateOfBirth', 'licenseClass']}
                >
                    <DateSelectGroup
                        disabledDate={date => date.isAfter(dayjs())}
                    />
                </Form.Item>

                <Form.Item
                    name="dateOfIssue"
                    label="Ngày cấp"
                    tooltip="Ngày cấp giấy phép lái xe"
                    rules={[
                        { required: true, message: 'Vui lòng chọn ngày cấp' },
                        { validator: validateDateOrder }
                    ]}
                    dependencies={['dateOfPassing']}
                >
                    <DateSelectGroup
                        disabledDate={date => {
                            const passingDate = form.getFieldValue('dateOfPassing');
                            return (passingDate && date.isBefore(passingDate)) || date.isAfter(dayjs());
                        }}
                    />
                </Form.Item>

                <Form.Item
                    name="dateOfExpiry"
                    label="Ngày hết hạn"
                    tooltip="Ngày hết hạn giấy phép lái xe"
                    rules={[
                        { required: true, message: 'Vui lòng chọn ngày hết hạn' },
                        { validator: validateDateOrder }
                    ]}
                    dependencies={['dateOfIssue']}
                >
                    <DateSelectGroup
                        disabledDate={date => {
                            const issueDate = form.getFieldValue('dateOfIssue');
                            return issueDate && date.isBefore(issueDate);
                        }}
                    />
                </Form.Item>
            </div>

            <Form.Item className="mt-8">
                <Button
                    type="primary"
                    htmlType="submit"
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
                    loading={loading}
                    size="large"
                >
                    Đăng ký tài xế
                </Button>
            </Form.Item>
        </Form>
    );
};

export default DriverForm; 