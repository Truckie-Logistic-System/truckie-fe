import React, { useState } from "react";
import { Form, Input, Select, Typography, Button, App } from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import type { Address } from "../../../../models/Address";
import AddressModal from "@/components/common/AddressModal";

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
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [addressType, setAddressType] = useState<boolean>(true); // true for pickup, false for delivery
    const { message } = App.useApp();
    const mainForm = Form.useFormInstance();

    // Separate addresses by type
    const pickupAddresses = addresses.filter(address => address.addressType);
    const deliveryAddresses = addresses.filter(address => !address.addressType);

    const handleAddAddress = (addressType: boolean) => {
        setAddressType(addressType);
        setEditingAddress(null);
        setAddressModalVisible(true);
    };

    const handleEditAddress = (address: Address) => {
        setEditingAddress(address);
        setAddressType(address.addressType);
        setAddressModalVisible(true);
    };

    const handleAddressSuccess = async () => {
        // Refresh addresses list
        await onAddressesUpdated();
        setAddressModalVisible(false);
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
            <AddressModal
                visible={addressModalVisible}
                onCancel={() => setAddressModalVisible(false)}
                onSuccess={handleAddressSuccess}
                initialValues={editingAddress}
                mode={editingAddress ? 'edit' : 'create'}
                showAddressType={false}
                defaultAddressType={addressType}
                title={editingAddress ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
            />
        </>
    );
};

export default AddressInfoStep; 