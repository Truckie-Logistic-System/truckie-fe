import React from 'react';
import { Form, Select, Input, Typography } from 'antd';
import type { Address } from '../../../../models/Address';

const { Title } = Typography;
const { Option } = Select;

interface AddressInfoStepProps {
    addresses: Address[];
}

const AddressInfoStep: React.FC<AddressInfoStepProps> = ({ addresses }) => {
    return (
        <>
            <Title level={4}>Thông tin địa chỉ</Title>
            <Form.Item
                name="pickupAddressId"
                label="Địa chỉ lấy hàng"
                rules={[{ required: true, message: 'Vui lòng chọn địa chỉ lấy hàng' }]}
            >
                <Select placeholder="Chọn địa chỉ lấy hàng">
                    {addresses.map(address => (
                        <Option key={address.id} value={address.id}>
                            {address.fullAddress}
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item
                name="deliveryAddressId"
                label="Địa chỉ giao hàng"
                rules={[{ required: true, message: 'Vui lòng chọn địa chỉ giao hàng' }]}
            >
                <Select placeholder="Chọn địa chỉ giao hàng">
                    {addresses.map(address => (
                        <Option key={address.id} value={address.id}>
                            {address.fullAddress}
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item
                name="notes"
                label="Ghi chú"
            >
                <Input.TextArea rows={3} placeholder="Thêm ghi chú cho đơn hàng (nếu có)" />
            </Form.Item>
        </>
    );
};

export default AddressInfoStep; 