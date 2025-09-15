import React, { useEffect, useState } from "react";
import { Form, Input, Select, Button, App } from "antd";
import { useQuery } from "@tanstack/react-query";
import vehicleService from "../../../../services/vehicle";
import driverService from "../../../../services/driver";
import type {
    Vehicle,
    CreateVehicleAssignmentRequest,
    UpdateVehicleAssignmentRequest,
    VehicleAssignment
} from "../../../../models";
import { VehicleAssignmentStatus } from "../../../../models/Vehicle";
import type { DriverModel } from "../../../../services/driver/types";

interface VehicleAssignmentFormProps {
    initialValues?: VehicleAssignment;
    onSubmit: (values: CreateVehicleAssignmentRequest | UpdateVehicleAssignmentRequest) => Promise<void>;
    isSubmitting: boolean;
}

const VehicleAssignmentForm: React.FC<VehicleAssignmentFormProps> = ({
    initialValues,
    onSubmit,
    isSubmitting,
}) => {
    const [form] = Form.useForm();
    const { message } = App.useApp();
    const [drivers, setDrivers] = useState<DriverModel[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const isEditing = !!initialValues;

    const { data: vehiclesData, isLoading: isLoadingVehicles } = useQuery({
        queryKey: ["vehicles"],
        queryFn: () => vehicleService.getVehicles(),
    });

    const { data: driversData, isLoading: isLoadingDrivers } = useQuery({
        queryKey: ["drivers"],
        queryFn: () => driverService.getAllDrivers(),
    });

    useEffect(() => {
        if (vehiclesData?.data) {
            setVehicles(vehiclesData.data);
        }
    }, [vehiclesData]);

    useEffect(() => {
        if (driversData) {
            setDrivers(driversData);
        }
    }, [driversData]);

    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue({
                vehicleId: initialValues.vehicleId,
                driverId_1: initialValues.driver_id_1,
                driverId_2: initialValues.driver_id_2,
                description: initialValues.description,
            });
        }
    }, [initialValues, form]);

    const handleSubmit = async (values: any) => {
        try {
            // Nếu đang tạo mới, thêm status ACTIVE
            if (!isEditing) {
                values.status = VehicleAssignmentStatus.ACTIVE;
            }

            await onSubmit(values);
            if (!isEditing) {
                form.resetFields();
            }
        } catch (error) {
            message.error("Có lỗi xảy ra khi lưu phân công xe");
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
        >
            <Form.Item
                name="vehicleId"
                label="Xe"
                rules={[{ required: true, message: "Vui lòng chọn xe" }]}
            >
                <Select
                    placeholder="Chọn xe"
                    loading={isLoadingVehicles}
                    disabled={isSubmitting || isEditing}
                >
                    {vehicles.map((vehicle) => (
                        <Select.Option key={vehicle.id} value={vehicle.id}>
                            {vehicle.licensePlateNumber} - {vehicle.model}
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item
                name="driverId_1"
                label="Tài xế chính"
                rules={[{ required: true, message: "Vui lòng chọn tài xế chính" }]}
            >
                <Select
                    placeholder="Chọn tài xế chính"
                    loading={isLoadingDrivers}
                    disabled={isSubmitting}
                >
                    {drivers.map((driver) => (
                        <Select.Option key={driver.id} value={driver.id}>
                            {driver.userResponse.fullName}
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item name="driverId_2" label="Tài xế phụ">
                <Select
                    placeholder="Chọn tài xế phụ (nếu có)"
                    loading={isLoadingDrivers}
                    disabled={isSubmitting}
                    allowClear
                >
                    {drivers.map((driver) => (
                        <Select.Option key={driver.id} value={driver.id}>
                            {driver.userResponse.fullName}
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item name="description" label="Mô tả">
                <Input.TextArea
                    placeholder="Nhập mô tả phân công"
                    rows={4}
                    disabled={isSubmitting}
                />
            </Form.Item>

            <Form.Item>
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                >
                    {isEditing ? "Cập nhật" : "Tạo mới"}
                </Button>
            </Form.Item>
        </Form>
    );
};

export default VehicleAssignmentForm; 