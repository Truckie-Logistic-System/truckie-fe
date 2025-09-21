import React, { useState } from 'react';
import { Modal, Form, Input, Radio, App, Spin } from 'antd';
import addressService from '../../../services/address/addressService';
import type { Address, AddressCreateDto, AddressUpdateDto } from '../../../models/Address';

interface AddressFormProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    initialValues: Address | null;
    mode: 'create' | 'edit';
}

const AddressForm: React.FC<AddressFormProps> = ({
    visible,
    onCancel,
    onSuccess,
    initialValues,
    mode
}) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const { message } = App.useApp();

    React.useEffect(() => {
        if (visible) {
            form.resetFields();

            if (initialValues && mode === 'edit') {
                form.setFieldsValue({
                    street: initialValues.street,
                    ward: initialValues.ward,
                    province: initialValues.province,
                    addressType: initialValues.addressType
                });
            }
        }
    }, [visible, initialValues, form, mode]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            if (mode === 'create') {
                const addressData: AddressCreateDto = {
                    street: values.street,
                    ward: values.ward,
                    province: values.province,
                    addressType: values.addressType
                };

                await addressService.createAddress(addressData);
                message.success('Thêm địa chỉ thành công');
            } else if (mode === 'edit' && initialValues) {
                const addressData: AddressUpdateDto = {
                    street: values.street,
                    ward: values.ward,
                    province: values.province,
                    addressType: values.addressType
                };

                await addressService.updateAddress(initialValues.id, addressData);
                message.success('Cập nhật địa chỉ thành công');
            }

            onSuccess();
        } catch (error) {
            const errorMessage = mode === 'create'
                ? 'Không thể thêm địa chỉ'
                : 'Không thể cập nhật địa chỉ';
            message.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const title = mode === 'create' ? 'Thêm địa chỉ mới' : 'Chỉnh sửa địa chỉ';

    return (
        <Modal
            title={title}
            open={visible}
            onCancel={onCancel}
            onOk={handleSubmit}
            okText={mode === 'create' ? 'Thêm' : 'Cập nhật'}
            cancelText="Hủy"
            confirmLoading={submitting}
            maskClosable={false}
        >
            <Spin spinning={submitting}>
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ addressType: true }}
                >
                    <Form.Item
                        name="street"
                        label="Tên đường/Số nhà"
                        rules={[{ required: true, message: 'Vui lòng nhập tên đường/số nhà' }]}
                    >
                        <Input placeholder="Nhập tên đường và số nhà" />
                    </Form.Item>

                    <Form.Item
                        name="ward"
                        label="Phường/Xã"
                        rules={[{ required: true, message: 'Vui lòng nhập phường/xã' }]}
                    >
                        <Input placeholder="Nhập phường/xã" />
                    </Form.Item>

                    <Form.Item
                        name="province"
                        label="Quận/Huyện/Tỉnh/Thành phố"
                        rules={[{ required: true, message: 'Vui lòng nhập quận/huyện/tỉnh/thành phố' }]}
                    >
                        <Input placeholder="Nhập quận/huyện/tỉnh/thành phố" />
                    </Form.Item>

                    <Form.Item
                        name="addressType"
                        label="Loại địa chỉ"
                        rules={[{ required: true, message: 'Vui lòng chọn loại địa chỉ' }]}
                    >
                        <Radio.Group>
                            <Radio value={true}>Địa chỉ gửi hàng</Radio>
                            <Radio value={false}>Địa chỉ nhận hàng</Radio>
                        </Radio.Group>
                    </Form.Item>
                </Form>
            </Spin>
        </Modal>
    );
};

export default AddressForm; 