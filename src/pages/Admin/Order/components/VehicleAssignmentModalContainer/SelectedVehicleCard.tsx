import React from "react";
import { Tag } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import type { VehicleSuggestion } from "../../../../../models/VehicleAssignment";

interface SelectedVehicleCardProps {
    vehicle: VehicleSuggestion;
}

export const SelectedVehicleCard: React.FC<SelectedVehicleCardProps> = ({ vehicle }) => {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
            {/* License Plate Number */}
            <div className="flex items-center justify-between mb-3">
                <div className="text-2xl font-bold text-blue-600">
                    {vehicle.licensePlateNumber}
                </div>
                {vehicle.isRecommended && (
                    <Tag color="green" className="text-xs">
                        <CheckCircleOutlined /> Đề xuất
                    </Tag>
                )}
            </div>

            {/* Vehicle Details */}
            <div className="text-sm text-gray-600">
                {vehicle.model} • {vehicle.manufacturer} • {vehicle.vehicleTypeName}
            </div>

            {/* Detailed Info Section */}
            <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm font-semibold text-gray-700">Thông tin xe đã chọn</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                        <div className="text-xs text-gray-500 mb-1">Biển số</div>
                        <div className="font-bold text-blue-600 text-sm">{vehicle.licensePlateNumber}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 mb-1">Model</div>
                        <div className="font-semibold text-gray-800 text-sm">{vehicle.model}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 mb-1">Hãng</div>
                        <div className="font-semibold text-gray-800 text-sm">{vehicle.manufacturer}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 mb-1">Loại xe</div>
                        <div className="font-semibold text-gray-800 text-sm">{vehicle.vehicleTypeName}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
