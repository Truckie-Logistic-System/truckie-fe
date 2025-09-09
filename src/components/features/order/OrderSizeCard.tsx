import React from 'react';
import { Card } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

interface OrderSizeProps {
    orderSize: {
        id: string;
        minWeight: number;
        maxWeight: number;
        minLength: number;
        maxLength: number;
        minHeight: number;
        maxHeight: number;
        minWidth: number;
        maxWidth: number;
        status: string;
        description: string;
    };
}

const OrderSizeCard: React.FC<OrderSizeProps> = ({ orderSize }) => {
    return (
        <Card
            title={
                <div className="flex items-center">
                    <InfoCircleOutlined className="mr-2 text-purple-500" />
                    <span>Thông tin kích thước</span>
                </div>
            }
            className="shadow-md rounded-xl mb-6"
        >
            <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="text-sm text-gray-500 mb-1">Khối lượng</h4>
                        <p className="font-medium">
                            {orderSize.minWeight} - {orderSize.maxWeight} kg
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="text-sm text-gray-500 mb-1">Chiều dài</h4>
                        <p className="font-medium">
                            {orderSize.minLength} - {orderSize.maxLength} cm
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="text-sm text-gray-500 mb-1">Chiều cao</h4>
                        <p className="font-medium">
                            {orderSize.minHeight} - {orderSize.maxHeight} cm
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="text-sm text-gray-500 mb-1">Chiều rộng</h4>
                        <p className="font-medium">
                            {orderSize.minWidth} - {orderSize.maxWidth} cm
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm col-span-1 md:col-span-2">
                        <h4 className="text-sm text-gray-500 mb-1">Mô tả</h4>
                        <p className="font-medium">
                            {orderSize.description || 'Không có mô tả'}
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default OrderSizeCard; 