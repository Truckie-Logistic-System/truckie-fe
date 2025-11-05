import React from "react";
import { Card, Form, Select, Input, Row, Col, Button, Tag } from "antd";
import { ArrowRightOutlined, CheckCircleOutlined } from "@ant-design/icons";
import type { VehicleSuggestion, SuggestedDriver } from "../../../../../models/VehicleAssignment";

interface TripAssignment {
    groupIndex: number;
    vehicleId?: string;
    driverId_1?: string;
    driverId_2?: string;
    description?: string;
    completed: boolean;
}

interface VehicleAssignmentFormProps {
    trip: TripAssignment;
    suggestions: VehicleSuggestion[];
    form: any;
    selectedVehicleId?: string;
    selectedDriver1Id?: string;
    onVehicleChange: (vehicleId: string) => void;
    onDriver1Change: (driverId: string) => void;
    onNext: () => void;
}

const { TextArea } = Input;
const { Option } = Select;

export const VehicleAssignmentForm: React.FC<VehicleAssignmentFormProps> = ({
    trip,
    suggestions,
    form,
    selectedVehicleId,
    selectedDriver1Id,
    onVehicleChange,
    onDriver1Change,
    onNext
}) => {
    const currentVehicleId = selectedVehicleId || trip.vehicleId;
    const selectedVehicle = suggestions.find(v => v.id === currentVehicleId);

    return (
        <Card className="border-0 shadow-sm">
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    vehicleId: trip.vehicleId,
                    driverId_1: trip.driverId_1,
                    driverId_2: trip.driverId_2,
                    description: trip.description
                }}
                className="space-y-4"
            >
                {/* Vehicle Selection */}
                <div>
                    <Form.Item
                        label={
                            <span className="font-semibold text-gray-800">
                                Chọn xe
                            </span>
                        }
                        name="vehicleId"
                        rules={[{ required: true, message: "Vui lòng chọn xe" }]}
                    >
                        <Select
                            placeholder="Chọn xe từ danh sách đề xuất"
                            onChange={(value) => {
                                onVehicleChange(value);
                                onDriver1Change("");
                                form.setFieldsValue({ driverId_1: undefined, driverId_2: undefined });
                            }}
                            showSearch
                            optionFilterProp="children"
                            size="large"
                            className="rounded-lg"
                        >
                            {suggestions.map(vehicle => (
                                <Option key={vehicle.id} value={vehicle.id}>
                                    <div className="py-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <strong className="text-blue-600">{vehicle.licensePlateNumber}</strong>
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
                </div>

                {/* Vehicle Details Card */}
                {selectedVehicle && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                                <div className="text-xs text-gray-600 font-medium">Biển số</div>
                                <div className="font-semibold text-blue-600">{selectedVehicle.licensePlateNumber}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-600 font-medium">Model</div>
                                <div className="font-semibold text-gray-800">{selectedVehicle.model}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-600 font-medium">Hãng</div>
                                <div className="font-semibold text-gray-800">{selectedVehicle.manufacturer}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-600 font-medium">Loại xe</div>
                                <div className="font-semibold text-gray-800">{selectedVehicle.vehicleTypeName}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Drivers Selection */}
                {selectedVehicle && (
                    <div className="space-y-4">
                        <div className="border-t pt-4">
                            <h4 className="font-semibold text-gray-800 mb-4">Chọn tài xế</h4>
                            <Row gutter={16}>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        label={
                                            <span className="font-medium text-gray-700">
                                                Tài xế 1 (chính)
                                            </span>
                                        }
                                        name="driverId_1"
                                        rules={[{ required: true, message: "Vui lòng chọn tài xế chính" }]}
                                    >
                                        <Select
                                            placeholder="Chọn tài xế chính"
                                            onChange={(value) => onDriver1Change(value)}
                                            showSearch
                                            optionFilterProp="children"
                                            size="large"
                                            className="rounded-lg"
                                        >
                                            {selectedVehicle.suggestedDrivers.map((driver: SuggestedDriver) => (
                                                <Option key={driver.id} value={driver.id}>
                                                    <div className="py-1">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div>
                                                                <div className="font-semibold text-gray-800">{driver.fullName}</div>
                                                                <div className="text-xs text-gray-600 mt-0.5">
                                                                    GPLX: {driver.driverLicenseNumber} • Hạng: {driver.licenseClass}
                                                                </div>
                                                            </div>
                                                            {driver.isRecommended && (
                                                                <Tag color="green" className="text-xs flex-shrink-0">Đề xuất</Tag>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        label={
                                            <span className="font-medium text-gray-700">
                                                Tài xế 2 (phụ)
                                            </span>
                                        }
                                        name="driverId_2"
                                        rules={[
                                            { required: true, message: "Vui lòng chọn tài xế phụ" },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    if (!value || getFieldValue('driverId_1') !== value) {
                                                        return Promise.resolve();
                                                    }
                                                    return Promise.reject(new Error('Tài xế 2 phải khác tài xế 1'));
                                                },
                                            }),
                                        ]}
                                        dependencies={['driverId_1']}
                                    >
                                        <Select
                                            placeholder="Chọn tài xế phụ"
                                            disabled={!selectedDriver1Id}
                                            showSearch
                                            optionFilterProp="children"
                                            size="large"
                                            className="rounded-lg"
                                        >
                                            {selectedVehicle.suggestedDrivers
                                                .filter((d: SuggestedDriver) => d.id !== selectedDriver1Id)
                                                .map((driver: SuggestedDriver) => (
                                                    <Option key={driver.id} value={driver.id}>
                                                        <div className="py-1">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div>
                                                                    <div className="font-semibold text-gray-800">{driver.fullName}</div>
                                                                    <div className="text-xs text-gray-600 mt-0.5">
                                                                        GPLX: {driver.driverLicenseNumber} • Hạng: {driver.licenseClass}
                                                                    </div>
                                                                </div>
                                                                {driver.isRecommended && (
                                                                    <Tag color="green" className="text-xs flex-shrink-0">Đề xuất</Tag>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </Option>
                                                ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>
                    </div>
                )}

                {/* Description */}
                <Form.Item
                    label={
                        <span className="font-medium text-gray-700">
                            Ghi chú
                        </span>
                    }
                    name="description"
                >
                    <TextArea
                        rows={2}
                        placeholder="Ghi chú cho chuyến xe (tùy chọn)"
                        className="rounded-lg"
                    />
                </Form.Item>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                        type="primary"
                        size="large"
                        onClick={onNext}
                        icon={<ArrowRightOutlined />}
                        className="bg-blue-600 hover:bg-blue-700 font-semibold px-6"
                    >
                        Tiếp theo: Định tuyến
                    </Button>
                </div>
            </Form>
        </Card>
    );
};
