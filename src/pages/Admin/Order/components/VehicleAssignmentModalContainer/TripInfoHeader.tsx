import React from "react";
import { InfoCircleOutlined } from "@ant-design/icons";
import type { OrderDetailGroup } from "../../../../../models/VehicleAssignment";

interface TripInfoHeaderProps {
    group: OrderDetailGroup;
    tripIndex: number;
}

export const TripInfoHeader: React.FC<TripInfoHeaderProps> = ({ group, tripIndex }) => {
    const detailCount = group.orderDetails?.length || 0;

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-4 border-l-4 border-blue-500">
            <div className="flex items-start">
                <InfoCircleOutlined className="text-blue-500 text-lg mt-1 mr-3" />
                <div className="flex-1">
                    <h3 className="font-semibold text-blue-800 text-base mb-2">
                        Chuyến #{tripIndex + 1}
                    </h3>
                    <div className="space-y-1 text-sm text-blue-700">
                        <div>
                            <span className="font-medium">Lý do nhóm:</span>{" "}
                            <span className="text-gray-700">{group.groupingReason || "Không có thông tin"}</span>
                        </div>
                        <div>
                            <span className="font-medium">Số lô hàng:</span>{" "}
                            <span className="text-gray-700">{detailCount} lô hàng</span>
                        </div>
                    </div>

                    {/* List of order details */}
                    {group.orderDetails && group.orderDetails.length > 0 && (
                        <div className="mt-3 bg-white p-3 rounded-md border border-blue-200">
                            <div className="text-xs font-medium text-blue-700 mb-2">Các lô hàng trong nhóm này:</div>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {group.orderDetails.map((detail, idx) => (
                                    <div key={detail.id} className="text-xs pl-2 border-l-2 border-blue-300">
                                        <span className="text-blue-600 font-medium">
                                            {idx + 1}. {detail.trackingCode}
                                        </span>
                                        <span className="font-medium text-gray-800">
                                            - {detail.totalWeight} kg
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
