import React from "react";
import { Card, Typography } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import OrderStatusSection from "./OrderStatusSection";
import AddressSection from "./AddressSection";

const { Title } = Typography;

interface BasicInfoTabProps {
    order: any;
    contract?: any;
}

const BasicInfoTab: React.FC<BasicInfoTabProps> = ({ order, contract }) => {
    return (
        <div>
            {/* Order Status */}
            <OrderStatusSection
                orderCode={order.orderCode}
                status={order.status}
                createdAt={order.createdAt}
                totalPrice={order.totalPrice}
                contract={contract}
            />

            {/* Order Information */}
            <Card className="mb-6 shadow-md rounded-xl">
                <Title level={4} className="mb-4">
                    Thông tin đơn hàng
                </Title>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="mb-2">
                        <span className="font-medium">Mô tả:</span>{" "}
                        {order.packageDescription || "Không có mô tả"}
                    </p>
                    <p className="mb-2">
                        <span className="font-medium">Số lượng:</span>{" "}
                        {order.totalQuantity}
                    </p>
                    <p className="mb-0">
                        <span className="font-medium">Loại hàng:</span>{" "}
                        {order.categoryName || "Chưa phân loại"}
                    </p>
                </div>

                {order.notes && (
                    <div className="mt-4">
                        <h3 className="text-md font-medium mb-2 text-gray-700 flex items-center">
                            <InfoCircleOutlined className="mr-2 text-blue-500" /> Ghi chú
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="mb-0">{order.notes}</p>
                        </div>
                    </div>
                )}
            </Card>

            {/* Address and Contact Information */}
            <AddressSection
                pickupAddress={order.pickupAddress}
                deliveryAddress={order.deliveryAddress}
                senderRepresentativeName={order.senderRepresentativeName}
                senderRepresentativePhone={order.senderRepresentativePhone}
                senderCompanyName={order.senderCompanyName}
                receiverName={order.receiverName}
                receiverPhone={order.receiverPhone}
                receiverIdentity={order.receiverIdentity}
            />
        </div>
    );
};

export default BasicInfoTab; 