import React from 'react';
import { Card } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import type { Address, Order } from '../../../models';

interface AddressCardProps {
    address?: Address;
    title?: string;
    type?: 'pickup' | 'delivery';
    order?: Order;
}

const AddressCard: React.FC<AddressCardProps> = ({ address, title, type, order }) => {
    // Nếu có order, lấy địa chỉ từ order
    let addressData: Address | undefined = address;
    let addressType: 'pickup' | 'delivery' = type || 'pickup';

    if (order) {
        if (order.pickupAddress && order.deliveryAddress) {
            return (
                <Card
                    title={
                        <div className="flex items-center">
                            <EnvironmentOutlined className="mr-2 text-blue-500" />
                            <span>Địa chỉ giao nhận hàng</span>
                        </div>
                    }
                    className="shadow-md rounded-xl mb-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-start">
                                <EnvironmentOutlined className="text-blue-500 mt-1 mr-3 text-xl" />
                                <div>
                                    <p className="font-medium text-lg mb-1">Địa chỉ lấy hàng</p>
                                    <p className="text-gray-600">{order.pickupAddress.street}</p>
                                    <p className="text-gray-600">{order.pickupAddress.ward}, {order.pickupAddress.province}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                            <div className="flex items-start">
                                <EnvironmentOutlined className="text-red-500 mt-1 mr-3 text-xl" />
                                <div>
                                    <p className="font-medium text-lg mb-1">Địa chỉ giao hàng</p>
                                    <p className="text-gray-600">{order.deliveryAddress.street}</p>
                                    <p className="text-gray-600">{order.deliveryAddress.ward}, {order.deliveryAddress.province}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            );
        } else if (order.pickupAddress) {
            addressData = order.pickupAddress;
            addressType = 'pickup';
        } else if (order.deliveryAddress) {
            addressData = order.deliveryAddress;
            addressType = 'delivery';
        }
    }

    // Nếu không có dữ liệu địa chỉ, hiển thị thông báo
    if (!addressData) {
        return (
            <Card
                title={
                    <div className="flex items-center">
                        <EnvironmentOutlined className="mr-2 text-blue-500" />
                        <span>Thông tin địa chỉ</span>
                    </div>
                }
                className="shadow-md rounded-xl mb-6"
            >
                <div className="p-4 text-center text-gray-500">
                    Không có thông tin địa chỉ
                </div>
            </Card>
        );
    }

    const isPickup = addressType === 'pickup';
    const colorClass = isPickup ? 'text-blue-500' : 'text-red-500';
    const bgColorClass = isPickup ? 'bg-blue-50' : 'bg-red-50';
    const displayTitle = title || (isPickup ? 'Địa chỉ lấy hàng' : 'Địa chỉ giao hàng');

    return (
        <Card
            title={
                <div className="flex items-center">
                    <EnvironmentOutlined className={`mr-2 ${colorClass}`} />
                    <span>{displayTitle}</span>
                </div>
            }
            className="shadow-md rounded-xl h-full"
        >
            <div className="flex flex-col h-full">
                <div className={`${bgColorClass} p-4 rounded-lg mb-4`}>
                    <div className="flex items-start">
                        <EnvironmentOutlined className={`${colorClass} mt-1 mr-3 text-xl`} />
                        <div>
                            <p className="font-medium text-lg mb-1">{addressData.street}</p>
                            <p className="text-gray-600">{addressData.ward}, {addressData.province}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-auto">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-500 mb-1">Vĩ độ</p>
                            <p className="font-medium">{addressData.latitude}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-500 mb-1">Kinh độ</p>
                            <p className="font-medium">{addressData.longitude}</p>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default AddressCard; 