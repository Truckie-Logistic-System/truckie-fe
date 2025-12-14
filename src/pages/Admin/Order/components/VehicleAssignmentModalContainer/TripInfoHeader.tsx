import React, { useState } from "react";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Pagination } from "antd";
import type { OrderDetailGroup } from "../../../../../models/VehicleAssignment";

const PACKAGES_PER_PAGE = 3;

interface TripInfoHeaderProps {
    group: OrderDetailGroup;
    tripIndex: number;
}

export const TripInfoHeader: React.FC<TripInfoHeaderProps> = ({ group, tripIndex }) => {
    const detailCount = group.orderDetails?.length || 0;
    const [currentPage, setCurrentPage] = useState(1);

    // Pagination logic
    const startIndex = (currentPage - 1) * PACKAGES_PER_PAGE;
    const endIndex = startIndex + PACKAGES_PER_PAGE;
    const paginatedDetails = group.orderDetails?.slice(startIndex, endIndex) || [];

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
                            <span className="font-medium">Số kiện hàng:</span>{" "}
                            <span className="text-gray-700">{detailCount} kiện hàng</span>
                        </div>
                    </div>

                    {/* List of order details */}
                    {group.orderDetails && group.orderDetails.length > 0 && (
                        <div className="mt-3 bg-white p-3 rounded-md border border-blue-200">
                            <div className="text-xs font-medium text-blue-700 mb-2">Các kiện hàng trong nhóm này:</div>
                            <div className="space-y-1">
                                {paginatedDetails.map((detail, idx) => (
                                    <div key={detail.id} className="text-xs pl-2 border-l-2 border-blue-300">
                                        <span className="text-blue-600 font-medium">
                                            {startIndex + idx + 1}. {detail.trackingCode}
                                        </span>
                                        {detail.weightBaseUnit != null && detail.unit && (
                                            <span className="font-medium text-gray-800">
                                                - {detail.weightBaseUnit} {detail.unit}
                                            </span>
                                        )}
                                        {detail.description && (
                                            <div className="text-gray-500 text-xs mt-1">
                                                Mô tả: {detail.description}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {detailCount > PACKAGES_PER_PAGE && (
                                <div className="flex justify-center mt-2">
                                    <Pagination
                                        current={currentPage}
                                        pageSize={PACKAGES_PER_PAGE}
                                        total={detailCount}
                                        onChange={setCurrentPage}
                                        size="small"
                                        showSizeChanger={false}
                                        showTotal={(total, range) =>
                                            `${range[0]}-${range[1]} / ${total} kiện`
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
