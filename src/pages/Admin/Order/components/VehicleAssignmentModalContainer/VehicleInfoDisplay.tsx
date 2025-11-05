import React from "react";
import { CarOutlined } from "@ant-design/icons";
import type { VehicleSuggestion } from "../../../../../models/VehicleAssignment";

interface VehicleInfoDisplayProps {
    vehicle: VehicleSuggestion;
}

export const VehicleInfoDisplay: React.FC<VehicleInfoDisplayProps> = ({ vehicle }) => {
    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <CarOutlined className="text-blue-600" />
                Thông tin xe đã chọn
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded-md shadow-sm">
                    <div className="text-xs text-gray-500 font-medium mb-1">Biển số</div>
                    <div className="font-bold text-blue-600 text-base truncate" title={vehicle.licensePlateNumber}>
                        {vehicle.licensePlateNumber}
                    </div>
                </div>
                <div className="bg-white p-3 rounded-md shadow-sm">
                    <div className="text-xs text-gray-500 font-medium mb-1">Model</div>
                    <div className="font-semibold text-gray-800 truncate" title={vehicle.model}>
                        {vehicle.model}
                    </div>
                </div>
                <div className="bg-white p-3 rounded-md shadow-sm">
                    <div className="text-xs text-gray-500 font-medium mb-1">Hãng</div>
                    <div className="font-semibold text-gray-800 truncate" title={vehicle.manufacturer}>
                        {vehicle.manufacturer}
                    </div>
                </div>
                <div className="bg-white p-3 rounded-md shadow-sm">
                    <div className="text-xs text-gray-500 font-medium mb-1">Loại xe</div>
                    <div className="font-semibold text-gray-800 truncate" title={vehicle.vehicleTypeName}>
                        {vehicle.vehicleTypeName}
                    </div>
                </div>
            </div>
        </div>
    );
};
