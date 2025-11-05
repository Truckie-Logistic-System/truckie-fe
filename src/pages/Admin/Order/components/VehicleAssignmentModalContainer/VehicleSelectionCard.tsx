import React from "react";
import { Form, Select, Tag } from "antd";
import { CarOutlined, CheckCircleOutlined } from "@ant-design/icons";
import type { VehicleSuggestion } from "../../../../../models/VehicleAssignment";

const { Option } = Select;

interface VehicleSelectionCardProps {
    suggestions: VehicleSuggestion[];
    onVehicleChange: (vehicleId: string) => void;
}

export const VehicleSelectionCard: React.FC<VehicleSelectionCardProps> = ({
    suggestions,
    onVehicleChange
}) => {
    return (
        <Form.Item
            name="vehicleId"
            rules={[{ required: true, message: "Vui lòng chọn xe" }]}
            className="mb-0"
        >
                <Select
                    placeholder="Chọn xe từ danh sách đề xuất"
                    onChange={onVehicleChange}
                    showSearch
                    optionFilterProp="children"
                    size="large"
                    className="rounded-lg"
                >
                    {suggestions.map(vehicle => (
                        <Option key={vehicle.id} value={vehicle.id}>
                            <div className="py-1">
                                <div className="flex items-center justify-between gap-2">
                                    <strong className="text-blue-600 text-base">{vehicle.licensePlateNumber}</strong>
                                    {vehicle.isRecommended && (
                                        <Tag color="green" className="text-xs">
                                            <CheckCircleOutlined /> Đề xuất
                                        </Tag>
                                    )}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                    {vehicle.model} • {vehicle.manufacturer} • {vehicle.vehicleTypeName}
                                </div>
                            </div>
                        </Option>
                    ))}
                </Select>
        </Form.Item>
    );
};
