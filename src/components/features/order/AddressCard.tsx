import React from 'react';
import { Card } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import type { Address } from '../../../models';

interface AddressCardProps {
    address: Address;
    title: string;
    type: 'pickup' | 'delivery';
}

const AddressCard: React.FC<AddressCardProps> = ({ address, title, type }) => {
    const isPickup = type === 'pickup';
    const colorClass = isPickup ? 'text-blue-500' : 'text-red-500';
    const bgColorClass = isPickup ? 'bg-blue-50' : 'bg-red-50';

    return (
        <Card
            title={
                <div className="flex items-center">
                    <EnvironmentOutlined className={`mr-2 ${colorClass}`} />
                    <span>{title}</span>
                </div>
            }
            className="shadow-md rounded-xl h-full"
        >
            <div className="flex flex-col h-full">
                <div className={`${bgColorClass} p-4 rounded-lg mb-4`}>
                    <div className="flex items-start">
                        <EnvironmentOutlined className={`${colorClass} mt-1 mr-3 text-xl`} />
                        <div>
                            <p className="font-medium text-lg mb-1">{address.street}</p>
                            <p className="text-gray-600">{address.ward}, {address.province}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-auto">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-500 mb-1">Vĩ độ</p>
                            <p className="font-medium">{address.latitude}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-500 mb-1">Kinh độ</p>
                            <p className="font-medium">{address.longitude}</p>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default AddressCard; 