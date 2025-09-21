import React from 'react';
import { Typography, Divider, Card, Tag } from 'antd';
import { IdcardOutlined, PhoneOutlined, ShopOutlined, EnvironmentOutlined, CalendarOutlined, FileTextOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { Address } from '../../../../models/Address';
import type { Category } from '../../../../models/Category';
import type { OrderSize } from '../../../../models/OrderSize';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

interface OrderSummaryStepProps {
    formValues: any;
    categories: Category[];
    orderSizes: OrderSize[];
    addresses: Address[];
}

const OrderSummaryStep: React.FC<OrderSummaryStepProps> = ({
    formValues,
    categories,
    orderSizes,
    addresses
}) => {
    // Log để debug
    console.log("OrderSummaryStep - formValues:", formValues);
    console.log("OrderSummaryStep - orderDetailsList:", formValues.orderDetailsList);

    // Xử lý giá trị pickupAddressId và deliveryAddressId (có thể là object hoặc string)
    const getAddressId = (addressField: any) => {
        if (!addressField) return null;
        return typeof addressField === 'object' ? addressField.value : addressField;
    };

    const pickupAddressId = getAddressId(formValues.pickupAddressId);
    const deliveryAddressId = getAddressId(formValues.deliveryAddressId);

    // Format địa chỉ đầy đủ
    const formatAddress = (address: Address | undefined) => {
        if (!address) return 'Không xác định';
        return `${address.street}, ${address.ward}, ${address.province}`;
    };

    // Tìm địa chỉ
    const pickupAddress = addresses.find(a => a.id === pickupAddressId);
    const deliveryAddress = addresses.find(a => a.id === deliveryAddressId);

    // Format thời gian
    const formatDateTime = (dateTime: any) => {
        if (!dateTime) return 'Không xác định';
        if (dayjs.isDayjs(dateTime)) {
            return dateTime.format('DD/MM/YYYY HH:mm');
        }
        if (dateTime instanceof Date) {
            return dayjs(dateTime).format('DD/MM/YYYY HH:mm');
        }
        return dateTime;
    };

    return (
        <>
            <Title level={4}>Xác nhận thông tin đơn hàng</Title>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Thông tin người nhận" className="shadow-sm">
                    <div className="space-y-3">
                        <div className="flex items-start">
                            <IdcardOutlined className="text-blue-500 mt-1 mr-3" />
                            <div>
                                <Text strong className="block">Tên người nhận</Text>
                                <Text>{formValues.receiverName || 'Chưa cung cấp'}</Text>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <PhoneOutlined className="text-blue-500 mt-1 mr-3" />
                            <div>
                                <Text strong className="block">Số điện thoại</Text>
                                <Text>{formValues.receiverPhone || 'Chưa cung cấp'}</Text>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <IdcardOutlined className="text-blue-500 mt-1 mr-3" />
                            <div>
                                <Text strong className="block">CMND/CCCD</Text>
                                <Text>{formValues.receiverIdentity || 'Chưa cung cấp'}</Text>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <ShopOutlined className="text-blue-500 mt-1 mr-3" />
                            <div>
                                <Text strong className="block">Loại hàng hóa</Text>
                                <Text>
                                    {categories.find(c => c.id === formValues.categoryId)?.categoryName || 'Không xác định'}
                                </Text>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="Thông tin địa chỉ" className="shadow-sm">
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-3 rounded-md">
                            <div className="flex items-start">
                                <EnvironmentOutlined className="text-blue-500 mt-1 mr-2" />
                                <div>
                                    <Text strong className="block">Địa chỉ lấy hàng</Text>
                                    <Text>{formatAddress(pickupAddress)}</Text>
                                </div>
                            </div>
                        </div>

                        <div className="bg-red-50 p-3 rounded-md">
                            <div className="flex items-start">
                                <EnvironmentOutlined className="text-red-500 mt-1 mr-2" />
                                <div>
                                    <Text strong className="block">Địa chỉ giao hàng</Text>
                                    <Text>{formatAddress(deliveryAddress)}</Text>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="Thông tin lô hàng" className="shadow-sm md:col-span-2">
                    {formValues.orderDetailsList && formValues.orderDetailsList.length > 0 ? (
                        formValues.orderDetailsList.map((detail: any, index: number) => (
                            <div key={index} className="mb-4">
                                <div className="flex items-center mb-2">
                                    <Tag color="blue" className="mr-2">Lô hàng {index + 1}</Tag>
                                    <Text strong>Kích thước & Trọng lượng</Text>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <Text strong className="block">Trọng lượng</Text>
                                            <Text>{detail.weight} {detail.unit || 'kg'}</Text>
                                        </div>
                                        <div>
                                            <Text strong className="block">Số lượng</Text>
                                            <Text>{detail.quantity || 1}</Text>
                                        </div>
                                        <div>
                                            <Text strong className="block">Kích thước</Text>
                                            <Text>
                                                {(() => {
                                                    const size = orderSizes.find(s => s.id === detail.orderSizeId);
                                                    if (!size) return 'Không xác định';
                                                    return `${size.minWidth}-${size.maxWidth} x ${size.minLength}-${size.maxLength} x ${size.minHeight}-${size.maxHeight}`;
                                                })()}
                                            </Text>
                                        </div>
                                        <div className="md:col-span-3">
                                            <Text strong className="block">Mô tả chi tiết</Text>
                                            <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: 'Xem thêm' }}>
                                                {detail.description || 'Không có mô tả'}
                                            </Paragraph>
                                        </div>
                                    </div>
                                </div>
                                {index < formValues.orderDetailsList.length - 1 && <Divider className="my-4" />}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-4 text-gray-500">
                            <Text>Chưa có thông tin lô hàng</Text>
                        </div>
                    )}
                </Card>

                <Card title="Thông tin bổ sung" className="shadow-sm md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div className="flex items-start">
                                <FileTextOutlined className="text-blue-500 mt-1 mr-3" />
                                <div>
                                    <Text strong className="block">Mô tả đơn hàng</Text>
                                    <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: 'Xem thêm' }}>
                                        {formValues.packageDescription || 'Không có mô tả'}
                                    </Paragraph>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-start">
                                <CalendarOutlined className="text-blue-500 mt-1 mr-3" />
                                <div>
                                    <Text strong className="block">Thời gian nhận hàng dự kiến</Text>
                                    <Text>{formatDateTime(formValues.estimateStartTime)}</Text>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <InfoCircleOutlined className="text-blue-500 mt-1 mr-3" />
                                <div>
                                    <Text strong className="block">Ghi chú</Text>
                                    <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: 'Xem thêm' }}>
                                        {formValues.notes || 'Không có ghi chú'}
                                    </Paragraph>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </>
    );
};

export default OrderSummaryStep; 