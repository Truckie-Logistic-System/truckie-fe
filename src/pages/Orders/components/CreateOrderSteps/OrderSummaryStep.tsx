import React from 'react';
import { Typography, Divider } from 'antd';
import type { Address } from '../../../../models/Address';
import type { Category } from '../../../../models/Category';
import type { OrderSize } from '../../../../models/OrderSize';

const { Title, Text } = Typography;

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
    return (
        <>
            <Title level={4}>Xác nhận thông tin đơn hàng</Title>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <div className="mb-4">
                        <Text strong>Thông tin người nhận:</Text>
                        <div className="bg-gray-50 p-3 rounded-md mt-1">
                            <p><Text strong>Tên:</Text> {formValues.receiverName}</p>
                            <p><Text strong>Số điện thoại:</Text> {formValues.receiverPhone}</p>
                            <p>
                                <Text strong>Loại hàng hóa:</Text> {
                                    categories.find(c => c.id === formValues.categoryId)?.categoryName ||
                                    'Không xác định'
                                }
                            </p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <Text strong>Thông tin đơn hàng:</Text>
                        <div className="bg-gray-50 p-3 rounded-md mt-1">
                            {formValues.orderDetailsList && formValues.orderDetailsList.map((detail: any, index: number) => (
                                <div key={index} className="mb-2">
                                    <Text strong>Lô hàng {index + 1}:</Text>
                                    <div className="pl-4">
                                        <p><Text strong>Trọng lượng:</Text> {detail.weight} {detail.unit}</p>
                                        <p><Text strong>Số lượng:</Text> {detail.quantity || 1}</p>
                                        <p>
                                            <Text strong>Kích thước:</Text> {
                                                orderSizes.find(s => s.id === detail.orderSizeId)?.name ||
                                                orderSizes.find(s => s.id === detail.orderSizeId)?.description ||
                                                'Không xác định'
                                            }
                                        </p>
                                        <p><Text strong>Mô tả:</Text> {detail.description}</p>
                                    </div>
                                    {index < formValues.orderDetailsList.length - 1 && <Divider className="my-2" />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div>
                    <div className="mb-4">
                        <Text strong>Thông tin địa chỉ:</Text>
                        <div className="bg-gray-50 p-3 rounded-md mt-1">
                            <p>
                                <Text strong>Địa chỉ lấy hàng:</Text> {
                                    addresses.find(a => a.id === formValues.pickupAddressId)?.fullAddress || 'Không xác định'
                                }
                            </p>
                            <p>
                                <Text strong>Địa chỉ giao hàng:</Text> {
                                    addresses.find(a => a.id === formValues.deliveryAddressId)?.fullAddress || 'Không xác định'
                                }
                            </p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <Text strong>Thông tin bổ sung:</Text>
                        <div className="bg-gray-50 p-3 rounded-md mt-1">
                            <p><Text strong>Mô tả đơn hàng:</Text> {formValues.packageDescription}</p>
                            <p><Text strong>Ghi chú:</Text> {formValues.notes || 'Không có ghi chú'}</p>
                            <p><Text strong>Thời gian nhận hàng dự kiến:</Text> {formValues.estimateStartTime ? formValues.estimateStartTime.format('DD/MM/YYYY HH:mm') : 'Không xác định'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OrderSummaryStep; 