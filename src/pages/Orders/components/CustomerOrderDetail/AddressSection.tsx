import React from "react";
import { Card, Row, Col } from "antd";
import { EnvironmentOutlined, UserOutlined, PhoneOutlined, ShopOutlined, IdcardOutlined } from "@ant-design/icons";

interface AddressSectionProps {
    pickupAddress: string;
    deliveryAddress: string;
    senderName: string;
    senderPhone: string;
    senderCompanyName?: string;
    receiverName: string;
    receiverPhone: string;
    receiverIdentity?: string;
}

const AddressSection: React.FC<AddressSectionProps> = ({
    pickupAddress,
    deliveryAddress,
    senderName,
    senderPhone,
    senderCompanyName,
    receiverName,
    receiverPhone,
    receiverIdentity,
}) => {
    return (
        <Card className="mb-6 shadow-md rounded-xl">
            <Row gutter={[24, 24]}>
                {/* Sender Information */}
                <Col xs={24} md={12}>
                    <div className="border-b pb-4 mb-4 md:border-b-0 md:border-r md:pr-4 md:mb-0">
                        <h3 className="text-lg font-medium mb-3 text-gray-700 flex items-center">
                            <ShopOutlined className="mr-2 text-blue-500" /> Thông tin người gửi
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                            <p className="mb-2 flex items-center">
                                <UserOutlined className="mr-2 text-gray-500" />
                                <span className="font-medium mr-2">Họ tên:</span> {senderName || "Chưa có thông tin"}
                            </p>
                            <p className="mb-2 flex items-center">
                                <PhoneOutlined className="mr-2 text-gray-500" />
                                <span className="font-medium mr-2">Số điện thoại:</span> {senderPhone || "Chưa có thông tin"}
                            </p>
                            {senderCompanyName && (
                                <p className="mb-0 flex items-center">
                                    <ShopOutlined className="mr-2 text-gray-500" />
                                    <span className="font-medium mr-2">Công ty:</span> {senderCompanyName}
                                </p>
                            )}
                        </div>
                        <h4 className="text-md font-medium mb-2 text-gray-700 flex items-center">
                            <EnvironmentOutlined className="mr-2 text-green-500" /> Địa chỉ lấy hàng
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="mb-0">{pickupAddress || "Chưa có thông tin địa chỉ"}</p>
                        </div>
                    </div>
                </Col>

                {/* Receiver Information */}
                <Col xs={24} md={12}>
                    <div className="pt-4 md:pt-0 md:pl-4">
                        <h3 className="text-lg font-medium mb-3 text-gray-700 flex items-center">
                            <UserOutlined className="mr-2 text-blue-500" /> Thông tin người nhận
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                            <p className="mb-2 flex items-center">
                                <UserOutlined className="mr-2 text-gray-500" />
                                <span className="font-medium mr-2">Họ tên:</span> {receiverName || "Chưa có thông tin"}
                            </p>
                            <p className="mb-2 flex items-center">
                                <PhoneOutlined className="mr-2 text-gray-500" />
                                <span className="font-medium mr-2">Số điện thoại:</span> {receiverPhone || "Chưa có thông tin"}
                            </p>
                            {receiverIdentity && (
                                <p className="mb-0 flex items-center">
                                    <IdcardOutlined className="mr-2 text-gray-500" />
                                    <span className="font-medium mr-2">CMND/CCCD:</span> {receiverIdentity}
                                </p>
                            )}
                        </div>
                        <h4 className="text-md font-medium mb-2 text-gray-700 flex items-center">
                            <EnvironmentOutlined className="mr-2 text-red-500" /> Địa chỉ giao hàng
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="mb-0">{deliveryAddress || "Chưa có thông tin địa chỉ"}</p>
                        </div>
                    </div>
                </Col>
            </Row>
        </Card>
    );
};

export default AddressSection; 