import React, { useEffect, useState } from "react";
import { Form, Input, Select, Button, App, Steps, Card } from "antd";
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
import type { RouteSegment } from "../../../../models/RoutePoint";
import type { RouteInfo } from "../../../../models/VehicleAssignment";
import RoutePlanningStep from "./RoutePlanningStep";

const { Step } = Steps;

interface VehicleAssignmentFormProps {
    initialValues?: VehicleAssignment;
    onSubmit: (values: CreateVehicleAssignmentRequest | UpdateVehicleAssignmentRequest) => Promise<void>;
    isSubmitting: boolean;
    orderId?: string;
    requireRoute?: boolean; // Thêm thuộc tính để yêu cầu route
}

const VehicleAssignmentForm: React.FC<VehicleAssignmentFormProps> = ({
    initialValues,
    onSubmit,
    isSubmitting,
    orderId,
    requireRoute = false, // Mặc định là false
}) => {
    const [form] = Form.useForm();
    const { message } = App.useApp();
    const [drivers, setDrivers] = useState<DriverModel[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [formValues, setFormValues] = useState<any>({});
    const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([]);
    const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | undefined>(undefined);
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

    // Update selected vehicle when vehicleId changes
    useEffect(() => {
        const vehicleId = form.getFieldValue('vehicleId');
        if (vehicleId && vehicles.length > 0) {
            const vehicle = vehicles.find(v => v.id === vehicleId);
            setSelectedVehicle(vehicle);
        }
    }, [form, vehicles]);

    const handleSubmit = async (values: any) => {
        try {
            // Nếu đang tạo mới, thêm status ACTIVE
            if (!isEditing) {
                values.status = VehicleAssignmentStatus.ACTIVE;
            }

            setFormValues(values);

            // Nếu yêu cầu route hoặc có orderId, chuyển sang bước định tuyến
            if ((requireRoute || orderId) && !isEditing) {
                setCurrentStep(1);
            } else {
                // Nếu không yêu cầu route và đang chỉnh sửa, submit trực tiếp
                if (!requireRoute || isEditing) {
                    await onSubmit(values);
                    if (!isEditing) {
                        form.resetFields();
                    }
                } else {
                    // Nếu yêu cầu route nhưng không có orderId, hiển thị thông báo lỗi
                    message.error("Không thể tạo phân công xe mà không có thông tin định tuyến");
                }
            }
        } catch (error) {
            message.error("Có lỗi xảy ra khi lưu phân công xe");
        }
    };

    const handleRouteComplete = async (segments: RouteSegment[], routeInfoData: RouteInfo) => {
        try {
            setRouteSegments(segments);
            setRouteInfo(routeInfoData);

            // Combine form values with route segments
            const finalValues = {
                ...formValues,
                orderId: orderId,
                routeSegments: segments,
                routeInfo: routeInfoData
            };

            await onSubmit(finalValues);

            if (!isEditing) {
                form.resetFields();
                setCurrentStep(0);
            }
        } catch (error) {
            message.error("Có lỗi xảy ra khi lưu phân công xe");
        }
    };

    const handleBack = () => {
        setCurrentStep(0);
    };

    // Render basic info step
    const renderBasicInfoStep = () => (
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
                    {(orderId || requireRoute) && !isEditing ? "Tiếp theo" : (isEditing ? "Cập nhật" : "Tạo mới")}
                </Button>
            </Form.Item>
        </Form>
    );

    // Nếu đang chỉnh sửa, chỉ hiển thị form cơ bản
    if (isEditing) {
        return renderBasicInfoStep();
    }

    // Nếu yêu cầu route nhưng không có orderId, hiển thị thông báo
    if (requireRoute && !orderId) {
        return (
            <div className="text-red-500">
                Không thể tạo phân công xe mà không có đơn hàng. Vui lòng chọn đơn hàng để tạo phân công xe.
            </div>
        );
    }

    return (
        <div className="vehicle-assignment-form">
            <Steps current={currentStep} className="mb-6">
                <Step title="Thông tin cơ bản" />
                <Step title="Định tuyến" />
            </Steps>

            <Card bordered={false}>
                {currentStep === 0 && renderBasicInfoStep()}
                {currentStep === 1 && (
                    <RoutePlanningStep
                        orderId={orderId || ''}
                        vehicleId={formValues.vehicleId}
                        vehicle={selectedVehicle}
                        onComplete={handleRouteComplete}
                        onBack={handleBack}
                    />
                )}
            </Card>
        </div>
    );
};

export default VehicleAssignmentForm; 