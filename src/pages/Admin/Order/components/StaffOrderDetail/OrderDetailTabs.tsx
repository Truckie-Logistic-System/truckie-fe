import React, { useState } from "react";
import { Empty, Tabs } from "antd";
import { BoxPlotOutlined } from "@ant-design/icons";
import type { StaffOrderDetailItem } from "../../../../../models/Order";
import AdditionalNavTabs from "./AdditionalNavTabs";
import VehicleAssignmentSection from "./VehicleAssignmentSection";

// Import missing components that need to be created
import OrderDetailPackageTab from "./OrderDetailPackageTab";

const { TabPane } = Tabs;

interface OrderDetailTabsProps {
    order: any;
    formatDate: (dateString?: string) => string;
    setVehicleAssignmentModalVisible: (visible: boolean) => void;
}

const OrderDetailTabs: React.FC<OrderDetailTabsProps> = ({
    order,
    formatDate,
    setVehicleAssignmentModalVisible,
}) => {
    const [activeDetailTab, setActiveDetailTab] = useState<string>("0");

    if (!order.orderDetails || order.orderDetails.length === 0) {
        return <Empty description="Không có thông tin chi tiết vận chuyển" />;
    }

    // Kiểm tra xem có vehicle assignment không
    const hasVehicleAssignment = order.vehicleAssignments && order.vehicleAssignments.length > 0;

    // Nếu có vehicle assignment, hiển thị theo vehicle assignment
    if (hasVehicleAssignment) {
        const getStatusColor = (status: string) => {
            switch (status) {
                case "PENDING":
                    return "orange";
                case "PROCESSING":
                case "IN_PROGRESS":
                    return "blue";
                case "DELIVERED":
                case "SUCCESSFUL":
                case "COMPLETED":
                    return "green";
                case "CANCELLED":
                case "IN_TROUBLES":
                    return "red";
                default:
                    return "default";
            }
        };

        return (
            <>
                {/* Sử dụng VehicleAssignmentSection giống customer */}
                <VehicleAssignmentSection
                    vehicleAssignments={order.vehicleAssignments}
                    orderDetails={order.orderDetails}
                    formatDate={formatDate}
                    getStatusColor={getStatusColor}
                />
            </>
        );
    }

    // Nếu chưa phân công, hiển thị theo từng order detail như cũ
    return (
        <>
            <Tabs
                activeKey={activeDetailTab}
                onChange={setActiveDetailTab}
                type="card"
                className="order-detail-tabs"
            >
                {order.orderDetails.map((detail: StaffOrderDetailItem, index: number) => (
                    <TabPane
                        tab={
                            <span>
                                <BoxPlotOutlined /> Kiện {index + 1}{" "}
                                {detail.trackingCode ? `- ${detail.trackingCode} ` : ""}
                            </span>
                        }
                        key={index.toString()}
                    >
                        <OrderDetailPackageTab
                            detail={detail}
                            formatDate={formatDate}
                            setVehicleAssignmentModalVisible={setVehicleAssignmentModalVisible}
                            order={order}
                            vehicleAssignments={order.vehicleAssignments}
                        />
                    </TabPane>
                ))}
            </Tabs>

            {/* Hiển thị AdditionalNavTabs */}
            <AdditionalNavTabs
                orderData={{
                    order: order,
                }}
                formatDate={formatDate}
            />
        </>
    );
};

export default OrderDetailTabs; 