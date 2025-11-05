import React from "react";
import { Form, Select, Tag, Row, Col } from "antd";
import { UserOutlined } from "@ant-design/icons";
import type { SuggestedDriver } from "../../../../../models/VehicleAssignment";

const { Option } = Select;

interface DriverSelectionCardProps {
    drivers: SuggestedDriver[];
    selectedDriver1Id?: string;
    onDriver1Change: (driverId: string) => void;
    onDriver2Change: (driverId: string) => void;
}

export const DriverSelectionCard: React.FC<DriverSelectionCardProps> = ({
    drivers,
    selectedDriver1Id,
    onDriver1Change,
    onDriver2Change
}) => {
    return (
        <Row gutter={[16, 12]}>
            <Col span={12}>
                <div className="bg-orange-50 p-2 rounded-lg">
                    <h4 className="text-xs font-medium mb-2 flex items-center">
                        <UserOutlined className="mr-1" />
                        Tài xế 1 (chính)
                    </h4>
                    <Form.Item
                        name="driverId_1"
                        rules={[{ required: true, message: "Vui lòng chọn tài xế chính" }]}
                        className="mb-0"
                    >
                        <Select
                            placeholder="Chọn tài xế chính"
                            onChange={onDriver1Change}
                            showSearch
                            optionFilterProp="children"
                            size="small"
                            className="w-full"
                        >
                            {drivers.map((driver: SuggestedDriver) => (
                                <Option key={driver.id} value={driver.id}>
                                    <div className="py-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-gray-800 text-base truncate" title={driver.fullName}>
                                                    {driver.fullName}
                                                </div>
                                                <div className="text-xs text-gray-600 mt-0.5 truncate" title={`GPLX: ${driver.driverLicenseNumber} • Hạng: ${driver.licenseClass}`}>
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
                </div>
            </Col>

            <Col span={12}>
                <div className="bg-purple-50 p-2 rounded-lg">
                    <h4 className="text-xs font-medium mb-2 flex items-center">
                        <UserOutlined className="mr-1" />
                        Tài xế 2 (phụ)
                    </h4>
                    <Form.Item
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
                        className="mb-0"
                    >
                        <Select
                            placeholder="Chọn tài xế phụ"
                            disabled={!selectedDriver1Id}
                            onChange={onDriver2Change}
                            showSearch
                            optionFilterProp="children"
                            size="small"
                            className="w-full"
                        >
                            {drivers
                                .filter((d: SuggestedDriver) => d.id !== selectedDriver1Id)
                                .map((driver: SuggestedDriver) => (
                                    <Option key={driver.id} value={driver.id}>
                                        <div className="py-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-gray-800 text-base truncate" title={driver.fullName}>
                                                        {driver.fullName}
                                                    </div>
                                                    <div className="text-xs text-gray-600 mt-0.5 truncate" title={`GPLX: ${driver.driverLicenseNumber} • Hạng: ${driver.licenseClass}`}>
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
                </div>
            </Col>
        </Row>
    );
};
