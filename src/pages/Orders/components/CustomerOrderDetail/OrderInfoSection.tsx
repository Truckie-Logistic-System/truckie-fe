import React from "react";
import { Card, Descriptions } from "antd";
import { InfoCircleOutlined, FileTextOutlined } from "@ant-design/icons";
import { OrderStatusTag } from "@/components/common/tags";
import { OrderStatusEnum } from "@/constants/enums";

interface OrderInfoSectionProps {
    packageDescription?: string;
    totalQuantity: number;
    categoryName?: string;
    notes?: string;
    orderDetails: {
        id: string;
        weightBaseUnit: number;
        unit: string;
        description?: string;
        status: string;
        trackingCode: string;
    }[];
}

const OrderInfoSection: React.FC<OrderInfoSectionProps> = ({
    packageDescription,
    totalQuantity,
    categoryName,
    notes,
    orderDetails,
}) => {

    return (
        <Card
            title={
                <div className="flex items-center">
                    <InfoCircleOutlined className="mr-2 text-blue-500" />
                    <span>Thông tin đơn hàng</span>
                </div>
            }
            className="shadow-md mb-6 rounded-xl"
        >
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="mb-2">
                    <span className="font-medium">Mô tả:</span> {packageDescription || "Không có mô tả"}
                </p>
                <p className="mb-2">
                    <span className="font-medium">Số lượng:</span> {totalQuantity}
                </p>
                <p className="mb-0">
                    <span className="font-medium">Loại hàng:</span> {categoryName || "Chưa phân loại"}
                </p>
            </div>

            {notes && (
                <div className="mt-4">
                    <h3 className="text-md font-medium mb-2 text-gray-700 flex items-center">
                        <InfoCircleOutlined className="mr-2 text-blue-500" /> Ghi chú
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="mb-0">{notes}</p>
                    </div>
                </div>
            )}

            <div className="mt-4">
                <h3 className="text-md font-medium mb-3 text-gray-700 flex items-center">
                    <FileTextOutlined className="mr-2 text-blue-500" /> Chi tiết vận chuyển
                </h3>
                {orderDetails && orderDetails.length > 0 ? (
                    orderDetails.map((detail, index) => (
                        <div key={detail.id} className={index > 0 ? "mt-4 pt-4 border-t" : ""}>
                            <Descriptions bordered column={{ xs: 1, sm: 2, md: 2 }} size="small">
                                <Descriptions.Item label="Mã theo dõi">{detail.trackingCode || "Chưa có"}</Descriptions.Item>
                                <Descriptions.Item label="Trọng lượng">
                                    {detail.weightBaseUnit} {detail.unit}
                                </Descriptions.Item>
                                <Descriptions.Item label="Trạng thái">
                                    <OrderStatusTag status={detail.status as OrderStatusEnum} />
                                </Descriptions.Item>
                                <Descriptions.Item label="Mô tả">{detail.description || "Không có mô tả"}</Descriptions.Item>
                            </Descriptions>
                        </div>
                    ))
                ) : (
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="mb-0">Chưa có thông tin chi tiết vận chuyển</p>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default OrderInfoSection; 