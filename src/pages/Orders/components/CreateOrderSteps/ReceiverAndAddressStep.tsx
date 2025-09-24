import React, { useState, useEffect, useRef } from "react";
import { Form, Input, Select, Typography, DatePicker, Divider, Skeleton, App, Button, Modal, Spin, Row, Col } from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import type { Category } from "../../../../models/Category";
import type { Address, AddressCreateDto } from "../../../../models/Address";
import dayjs from "dayjs";
import ReceiverSuggestions from "./ReceiverSuggestions";
import orderService from "@/services/order/orderService";
import addressService from "@/services/address/addressService";

const { Title, Text } = Typography;
const { Option } = Select;

interface ReceiverAndAddressStepProps {
    categories: Category[];
    addresses: Address[];
    onReceiverDetailsLoaded: (data: any) => void;
    onAddressesUpdated: () => Promise<void>;
}

const ReceiverAndAddressStep: React.FC<ReceiverAndAddressStepProps> = ({
    categories,
    addresses,
    onReceiverDetailsLoaded,
    onAddressesUpdated
}) => {
    const [addressModalVisible, setAddressModalVisible] = useState(false);
    const [addressForm] = Form.useForm();
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [isAddressLoading, setIsAddressLoading] = useState(false);
    const { message } = App.useApp();
    const form = Form.useFormInstance();

    // State để lưu trữ thông tin địa chỉ đã chọn
    const [selectedPickupAddress, setSelectedPickupAddress] = useState<Address | null>(null);
    const [selectedDeliveryAddress, setSelectedDeliveryAddress] = useState<Address | null>(null);

    // State để lưu trữ thông tin người nhận
    const [receiverInfo, setReceiverInfo] = useState<{ name: string, phone: string } | null>(null);

    // Separate addresses by type - true là địa chỉ gửi, false là địa chỉ nhận
    const pickupAddresses = addresses.filter(address => address.addressType === true);
    const deliveryAddresses = addresses.filter(address => address.addressType === false);

    // Format địa chỉ để hiển thị
    const formatAddress = (address: Address) => {
        return `${address.street}, ${address.ward}, ${address.province}`;
    };

    // Format thông tin người nhận để hiển thị
    const formatReceiverInfo = () => {
        if (!receiverInfo) return "";
        return `${receiverInfo.name} - ${receiverInfo.phone}`;
    };

    // Cập nhật địa chỉ đã chọn khi form thay đổi hoặc addresses thay đổi
    useEffect(() => {
        // Lấy giá trị hiện tại từ form
        const pickupId = form.getFieldValue('pickupAddressId');
        const deliveryId = form.getFieldValue('deliveryAddressId');

        // Nếu pickupId là object (từ labelInValue), lấy value, nếu không thì sử dụng trực tiếp
        const pickupAddressId = pickupId?.value || pickupId;
        const deliveryAddressId = deliveryId?.value || deliveryId;

        if (pickupAddressId) {
            const address = addresses.find(addr => addr.id === pickupAddressId);
            if (address) {
                setSelectedPickupAddress(address);
            }
        }

        if (deliveryAddressId) {
            const address = addresses.find(addr => addr.id === deliveryAddressId);
            if (address) {
                setSelectedDeliveryAddress(address);
            }
        }

        // Cập nhật thông tin người nhận
        const name = form.getFieldValue('receiverName');
        const phone = form.getFieldValue('receiverPhone');
        if (name && phone) {
            setReceiverInfo({ name, phone });
        }
    }, [addresses, form]);

    // Cập nhật hàm handleSuggestionSelect để nhận displayText
    const handleSuggestionSelect = async (orderId: string, displayText: string) => {
        try {
            const response = await orderService.getReceiverDetails(orderId);
            if (response.success) {
                const { data } = response;

                // Tìm địa chỉ trong danh sách
                const pickupAddress = addresses.find(addr => addr.id === data.pickupAddressId) || data.pickupAddress;
                const deliveryAddress = addresses.find(addr => addr.id === data.deliveryAddressId) || data.deliveryAddress;

                // Cập nhật state
                setSelectedPickupAddress(pickupAddress);
                setSelectedDeliveryAddress(deliveryAddress);
                setReceiverInfo({
                    name: data.receiverName,
                    phone: data.receiverPhone
                });

                // Cập nhật form values
                form.setFieldsValue({
                    receiverName: data.receiverName,
                    receiverPhone: data.receiverPhone,
                    receiverIdentity: data.receiverIdentity
                });

                // Cập nhật giá trị của select với labelInValue
                // Sử dụng setTimeout để đảm bảo form đã được cập nhật trước khi set lại giá trị
                setTimeout(() => {
                    form.setFieldsValue({
                        pickupAddressId: {
                            key: data.pickupAddressId,
                            value: data.pickupAddressId,
                            label: formatAddress(pickupAddress)
                        },
                        deliveryAddressId: {
                            key: data.deliveryAddressId,
                            value: data.deliveryAddressId,
                            label: formatAddress(deliveryAddress)
                        }
                    });
                }, 0);

                // Pass data to parent component for address fields
                onReceiverDetailsLoaded(data);

                message.success("Đã điền thông tin người nhận và địa chỉ");
            }
        } catch (error) {
            message.error("Không thể tải thông tin người nhận");
            console.error("Error loading receiver details:", error);
        }
    };

    const handleAddAddress = (addressType: boolean) => {
        addressForm.resetFields();
        addressForm.setFieldsValue({
            addressType // true là địa chỉ gửi, false là địa chỉ nhận
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
            addressType: address.addressType // true là địa chỉ gửi, false là địa chỉ nhận
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

    // Xử lý khi chọn địa chỉ
    const handlePickupAddressChange = (value: any) => {
        // value sẽ có dạng { value: id, label: address }
        const addressId = typeof value === 'object' ? value.value : value;
        const address = addresses.find(addr => addr.id === addressId);
        if (address) {
            setSelectedPickupAddress(address);
        }
    };

    const handleDeliveryAddressChange = (value: any) => {
        // value sẽ có dạng { value: id, label: address }
        const addressId = typeof value === 'object' ? value.value : value;
        const address = addresses.find(addr => addr.id === addressId);
        if (address) {
            setSelectedDeliveryAddress(address);
        }
    };

    return (
        <>
            <Title level={4}>Thông tin người nhận và địa chỉ</Title>

            <Text className="text-gray-500 mb-4 block">
                Bạn có thể tìm kiếm người nhận gần đây để tự động điền thông tin
            </Text>

            <ReceiverSuggestions onSelect={handleSuggestionSelect} />

            <Divider className="my-4" />

            <Row gutter={24}>
                {/* Cột thông tin người nhận */}
                <Col xs={24} lg={12}>
                    <div className="bg-gray-50 p-4 rounded-lg h-full">
                        <Title level={5} className="mb-4">Thông tin người nhận</Title>

                        <Form.Item
                            name="receiverName"
                            label="Tên người nhận"
                            rules={[{ required: true, message: "Vui lòng nhập tên người nhận" }]}
                        >
                            <Input
                                placeholder="Nhập tên người nhận"
                                onChange={(e) => {
                                    const phone = form.getFieldValue('receiverPhone');
                                    if (phone) {
                                        setReceiverInfo({
                                            name: e.target.value,
                                            phone
                                        });
                                    }
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="receiverPhone"
                            label="Số điện thoại người nhận"
                            rules={[
                                { required: true, message: "Vui lòng nhập số điện thoại người nhận" },
                                {
                                    pattern: /^[0-9]{10}$/,
                                    message: "Số điện thoại phải có 10 chữ số",
                                },
                            ]}
                        >
                            <Input
                                placeholder="Nhập số điện thoại người nhận"
                                onChange={(e) => {
                                    const name = form.getFieldValue('receiverName');
                                    if (name) {
                                        setReceiverInfo({
                                            name,
                                            phone: e.target.value
                                        });
                                    }
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="receiverIdentity"
                            label="CMND/CCCD người nhận"
                            rules={[
                                { required: true, message: "Vui lòng nhập CMND/CCCD người nhận" },
                                {
                                    pattern: /^[0-9]{9,12}$/,
                                    message: "CMND/CCCD phải có 9-12 chữ số",
                                },
                            ]}
                        >
                            <Input placeholder="Nhập CMND/CCCD người nhận" />
                        </Form.Item>

                        <Form.Item
                            name="categoryId"
                            label="Loại hàng hóa"
                            rules={[{ required: true, message: "Vui lòng chọn loại hàng hóa" }]}
                        >
                            <Select placeholder="Chọn loại hàng hóa">
                                {categories.map((category) => (
                                    <Option key={category.id} value={category.id}>
                                        {category.categoryName}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="packageDescription"
                            label="Mô tả đơn hàng"
                            rules={[{ required: true, message: "Vui lòng nhập mô tả đơn hàng" }]}
                        >
                            <Input.TextArea rows={4} placeholder="Mô tả chi tiết về đơn hàng" />
                        </Form.Item>

                        <Form.Item
                            name="estimateStartTime"
                            label="Thời gian nhận hàng dự kiến"
                            rules={[
                                { required: true, message: "Vui lòng chọn thời gian nhận hàng" },
                            ]}
                        >
                            <DatePicker
                                showTime
                                placeholder="Chọn ngày và giờ nhận hàng"
                                style={{ width: "100%" }}
                                disabledDate={(current) =>
                                    current && current < dayjs().startOf("day")
                                }
                                format="DD/MM/YYYY HH:mm"
                            />
                        </Form.Item>
                    </div>
                </Col>

                {/* Cột địa chỉ */}
                <Col xs={24} lg={12}>
                    <div className="bg-gray-50 p-4 rounded-lg h-full">
                        <Title level={5} className="mb-4">Thông tin địa chỉ</Title>

                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <Text strong>Địa chỉ lấy hàng</Text>
                                <Button
                                    type="link"
                                    icon={<PlusOutlined />}
                                    onClick={() => handleAddAddress(true)} // true là địa chỉ gửi
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
                                    onChange={handlePickupAddressChange}
                                    labelInValue
                                    showSearch
                                    optionFilterProp="label"
                                    filterOption={(input, option) =>
                                        (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase())
                                    }
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
                                    options={pickupAddresses.map(address => ({
                                        value: address.id,
                                        label: formatAddress(address),
                                        address: address
                                    }))}
                                />
                            </Form.Item>
                        </div>

                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <Text strong>Địa chỉ giao hàng</Text>
                                <Button
                                    type="link"
                                    icon={<PlusOutlined />}
                                    onClick={() => handleAddAddress(false)} // false là địa chỉ nhận
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
                                    onChange={handleDeliveryAddressChange}
                                    labelInValue
                                    showSearch
                                    optionFilterProp="label"
                                    filterOption={(input, option) =>
                                        (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase())
                                    }
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
                                    options={deliveryAddresses.map(address => ({
                                        value: address.id,
                                        label: formatAddress(address),
                                        address: address
                                    }))}
                                />
                            </Form.Item>
                        </div>

                        <Form.Item
                            name="notes"
                            label="Ghi chú"
                        >
                            <Input.TextArea rows={4} placeholder="Thêm ghi chú cho đơn hàng (nếu có)" />
                        </Form.Item>
                    </div>
                </Col>
            </Row>

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

export default ReceiverAndAddressStep; 