import React, { useState } from 'react';
import { Form, Input, Button, App, Divider, Typography, Row, Col } from 'antd';
import { SaveOutlined, BankOutlined, UserOutlined, PhoneOutlined, IdcardOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { Customer } from '@/models/Customer';
import type { CustomerUpdateRequest } from '@/services/customer/types';
import { useProfileManagement } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';

const { Text, Title } = Typography;

interface EditProfileFormProps {
    customerData: Customer;
    onSuccess: () => void;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({ customerData, onSuccess }) => {
    const [form] = Form.useForm();
    const { updateProfile } = useProfileManagement();
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();
    const { message } = App.useApp();

    // Khởi tạo form với dữ liệu hiện tại
    React.useEffect(() => {
        form.setFieldsValue({
            companyName: customerData.companyName,
            representativeName: customerData.representativeName,
            representativePhone: customerData.representativePhone,
            businessLicenseNumber: customerData.businessLicenseNumber,
            businessAddress: customerData.businessAddress,
        });
    }, [customerData, form]);

    const handleSubmit = async (values: CustomerUpdateRequest) => {
        try {
            setLoading(true);
            await updateProfile(values);

            // Làm mới dữ liệu cache
            queryClient.invalidateQueries({ queryKey: ['customerProfile'] });

            // Thông báo thành công sẽ được hiển thị bởi component cha
            onSuccess();
        } catch (error) {
            console.error('Error updating profile:', error);
            message.error({
                content: 'Không thể cập nhật thông tin. Vui lòng thử lại sau.',
                duration: 5,
                className: 'custom-message-error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
                companyName: customerData.companyName,
                representativeName: customerData.representativeName,
                representativePhone: customerData.representativePhone,
                businessLicenseNumber: customerData.businessLicenseNumber,
                businessAddress: customerData.businessAddress,
            }}
            className="mt-4"
        >
            <Divider orientation="left">
                <div className="flex items-center gap-2">
                    <BankOutlined className="text-blue-600" />
                    <Text strong>Thông tin công ty</Text>
                </div>
            </Divider>

            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <Form.Item
                        name="companyName"
                        label="Tên công ty"
                        rules={[{ required: true, message: 'Vui lòng nhập tên công ty' }]}
                    >
                        <Input
                            placeholder="Nhập tên công ty"
                            prefix={<BankOutlined className="text-gray-400" />}
                            className="rounded-md"
                        />
                    </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                    <Form.Item
                        name="businessLicenseNumber"
                        label="Mã số doanh nghiệp"
                        rules={[{ required: true, message: 'Vui lòng nhập mã số doanh nghiệp' }]}
                    >
                        <Input
                            placeholder="Nhập mã số doanh nghiệp"
                            prefix={<IdcardOutlined className="text-gray-400" />}
                            className="rounded-md"
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Divider orientation="left">
                <div className="flex items-center gap-2">
                    <UserOutlined className="text-blue-600" />
                    <Text strong>Thông tin người đại diện</Text>
                </div>
            </Divider>

            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <Form.Item
                        name="representativeName"
                        label="Tên người đại diện"
                        rules={[{ required: true, message: 'Vui lòng nhập tên người đại diện' }]}
                    >
                        <Input
                            placeholder="Nhập tên người đại diện"
                            prefix={<UserOutlined className="text-gray-400" />}
                            className="rounded-md"
                        />
                    </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                    <Form.Item
                        name="representativePhone"
                        label="Số điện thoại người đại diện"
                        rules={[
                            { required: true, message: 'Vui lòng nhập số điện thoại người đại diện' },
                            { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ' }
                        ]}
                    >
                        <Input
                            placeholder="Nhập số điện thoại người đại diện"
                            prefix={<PhoneOutlined className="text-gray-400" />}
                            className="rounded-md"
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Divider orientation="left">
                <div className="flex items-center gap-2">
                    <EnvironmentOutlined className="text-blue-600" />
                    <Text strong>Địa chỉ</Text>
                </div>
            </Divider>

            <Form.Item
                name="businessAddress"
                label="Địa chỉ kinh doanh"
                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ kinh doanh' }]}
            >
                <Input.TextArea
                    rows={3}
                    placeholder="Nhập địa chỉ kinh doanh"
                    className="rounded-md"
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

export default EditProfileForm; 