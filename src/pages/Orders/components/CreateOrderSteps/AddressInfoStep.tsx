import React, { useState } from "react";
import { Form, Input, Select, Typography, Button, Modal, App, Spin } from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import type { Address, AddressCreateDto } from "../../../../models/Address";
import addressService from "@/services/address/addressService";

const { Title, Text } = Typography;
const { Option } = Select;

interface AddressInfoStepProps {
    addresses: Address[];
    onAddressesUpdated: () => Promise<void>;
}

const AddressInfoStep: React.FC<AddressInfoStepProps> = ({
    addresses,
    onAddressesUpdated
}) => {
    const [addressModalVisible, setAddressModalVisible] = useState(false);
    const [addressForm] = Form.useForm();
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [isAddressLoading, setIsAddressLoading] = useState(false);
    const { message } = App.useApp();
    const mainForm = Form.useFormInstance();

    // Separate addresses by type
    const pickupAddresses = addresses.filter(address => address.addressType);
    const deliveryAddresses = addresses.filter(address => !address.addressType);

    const handleAddAddress = (addressType: boolean) => {
        addressForm.resetFields();
        addressForm.setFieldsValue({
            addressType
        });
        setEditingAddress(null);
        setAddressModalVisible(true);
    };

    const handleEditAddress = (address: Address) => {
        addressForm.resetFields();
        addressForm.setFieldsValue({
            street: address.street,
            ward: address.ward,
            province: address.province,
            addressType: address.addressType
        });
        setEditingAddress(address);
        setAddressModalVisible(true);
    };

    const handleAddressSubmit = async (values: AddressCreateDto) => {
        setIsAddressLoading(true);
        try {
            if (editingAddress) {
                // Update existing address
                await addressService.updateAddress(editingAddress.id, values);
                message.success("Địa chỉ đã được cập nhật");
            } else {
                // Create new address
                await addressService.createAddress(values);
                message.success("Địa chỉ đã được tạo");
            }

            // Refresh addresses list
            await onAddressesUpdated();
            setAddressModalVisible(false);
        } catch (error) {
            message.error("Không thể lưu địa chỉ");
            console.error("Error saving address:", error);
        } finally {
            setIsAddressLoading(false);
        }
    };

    return (
        <>
            <Title level={4}>Thông tin địa chỉ</Title>

            <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                    <Text strong>Địa chỉ lấy hàng</Text>
                    <Button
                        type="link"
                        icon={<PlusOutlined />}
                        onClick={() => handleAddAddress(true)}
                    >
                        Thêm địa chỉ mới
                    </Button>
                </div>

                <Form.Item
                    name="pickupAddressId"
                    rules={[{ required: true, message: 'Vui lòng chọn địa chỉ lấy hàng' }]}
                >
                    <Select
                        placeholder="Chọn địa chỉ lấy hàng"
                        optionLabelProp="label"
                        dropdownRender={(menu) => (
                            <>
                                {menu}
                                {pickupAddresses.length === 0 && (
                                    <div className="p-2 text-center text-gray-500">
                                        <Text>Chưa có địa chỉ lấy hàng</Text>
                                    </div>
                                )}
                            </>
                        )}
                    >
                        {pickupAddresses.map(address => (
                            <Option
                                key={address.id}
                                value={address.id}
                                label={`${address.street}, ${address.ward}, ${address.province}`}
                            >
                                <div className="flex justify-between items-center">
                                    <span>{address.street}, {address.ward}, {address.province}</span>
                                    <Button
                                        type="text"
                                        icon={<EditOutlined />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditAddress(address);
                                        }}
                                    />
                                </div>
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
            </div>

            <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                    <Text strong>Địa chỉ giao hàng</Text>
                    <Button
                        type="link"
                        icon={<PlusOutlined />}
                        onClick={() => handleAddAddress(false)}
                    >
                        Thêm địa chỉ mới
                    </Button>
                </div>

                <Form.Item
                    name="deliveryAddressId"
                    rules={[{ required: true, message: 'Vui lòng chọn địa chỉ giao hàng' }]}
                >
                    <Select
                        placeholder="Chọn địa chỉ giao hàng"
                        optionLabelProp="label"
                        dropdownRender={(menu) => (
                            <>
                                {menu}
                                {deliveryAddresses.length === 0 && (
                                    <div className="p-2 text-center text-gray-500">
                                        <Text>Chưa có địa chỉ giao hàng</Text>
                                    </div>
                                )}
                            </>
                        )}
                    >
                        {deliveryAddresses.map(address => (
                            <Option
                                key={address.id}
                                value={address.id}
                                label={`${address.street}, ${address.ward}, ${address.province}`}
                            >
                                <div className="flex justify-between items-center">
                                    <span>{address.street}, {address.ward}, {address.province}</span>
                                    <Button
                                        type="text"
                                        icon={<EditOutlined />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditAddress(address);
                                        }}
                                    />
                                </div>
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
            </div>

            <Form.Item
                name="notes"
                label="Ghi chú"
            >
                <Input.TextArea rows={3} placeholder="Thêm ghi chú cho đơn hàng (nếu có)" />
            </Form.Item>

            {/* Modal for adding/editing addresses */}
            <Modal
                title={editingAddress ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
                open={addressModalVisible}
                onCancel={() => setAddressModalVisible(false)}
                footer={null}
                destroyOnClose
            >
                <Spin spinning={isAddressLoading}>
                    <Form
                        form={addressForm}
                        layout="vertical"
                        onFinish={handleAddressSubmit}
                    >
                        <Form.Item
                            name="street"
                            label="Đường/Số nhà"
                            rules={[{ required: true, message: 'Vui lòng nhập đường/số nhà' }]}
                        >
                            <Input placeholder="Nhập đường/số nhà" />
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
                            label="Tỉnh/Thành phố"
                            rules={[{ required: true, message: 'Vui lòng nhập tỉnh/thành phố' }]}
                        >
                            <Input placeholder="Nhập tỉnh/thành phố" />
                        </Form.Item>

                        <Form.Item name="addressType" hidden>
                            <Input />
                        </Form.Item>

                        <div className="flex justify-end gap-2 mt-4">
                            <Button onClick={() => setAddressModalVisible(false)}>
                                Hủy
                            </Button>
                            <Button type="primary" htmlType="submit" loading={isAddressLoading}>
                                {editingAddress ? "Cập nhật" : "Thêm mới"}
                            </Button>
                        </div>
                    </Form>
                </Spin>
            </Modal>
        </>
    );
};

export default AddressInfoStep; 