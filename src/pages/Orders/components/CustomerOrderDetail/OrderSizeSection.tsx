import React from "react";
import { Card, Descriptions, Empty } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

interface OrderSizeProps {
    orderSize?: {
        id: string;
        description: string;
        minLength: number;
        maxLength: number;
        minHeight: number;
        maxHeight: number;
        minWidth: number;
        maxWidth: number;
    };
}

const OrderSizeSection: React.FC<OrderSizeProps> = ({ orderSize }) => {
    return (
        <Card
            title={
                <div className="flex items-center">
                    <InfoCircleOutlined className="mr-2 text-blue-500" />
                    <span>Thông tin kích thước đơn hàng</span>
                </div>
            }
            className="shadow-md mb-6 rounded-xl"
        >
            {orderSize ? (
                <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="small">
                    <Descriptions.Item label="Mô tả">{orderSize.description}</Descriptions.Item>
                    <Descriptions.Item label="Chiều dài">
                        {orderSize.minLength} - {orderSize.maxLength} cm
                    </Descriptions.Item>
                    <Descriptions.Item label="Chiều rộng">
                        {orderSize.minWidth} - {orderSize.maxWidth} cm
                    </Descriptions.Item>
                    <Descriptions.Item label="Chiều cao">
                        {orderSize.minHeight} - {orderSize.maxHeight} cm
                    </Descriptions.Item>
                </Descriptions>
            ) : (
                <Empty description="Chưa có thông tin kích thước đơn hàng" />
            )}
        </Card>
    );
};

export default OrderSizeSection; 