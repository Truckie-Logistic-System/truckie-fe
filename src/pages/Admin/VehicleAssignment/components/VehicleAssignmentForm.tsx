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

// Steps.Step deprecated in v6, use items prop instead

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
    const [isRouteCompleted, setIsRouteCompleted] = useState<boolean>(false);
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
            
            // Kiểm tra trạng thái xe
            if (vehicle && !isEditing) {
                const unavailableStatuses = ['MAINTENANCE', 'INSPECTION_EXPIRED', 'INSURANCE_EXPIRED', 'BREAKDOWN', 'ACCIDENT'];
                if (unavailableStatuses.includes(vehicle.status || '')) {
                    message.error(`Xe ${vehicle.licensePlateNumber} không thể được phân công do đang ở trạng thái: ${vehicle.status}`);
                    form.setFieldValue('vehicleId', undefined);
                    setSelectedVehicle(undefined);
                }
            }
        }
    }, [form, vehicles, isEditing]);

    const handleSubmit = async (values: any) => {
        try {
            // Nếu đang tạo mới, thêm status ACTIVE
            if (!isEditing) {
                values.status = VehicleAssignmentStatus.ACTIVE;
            }

            // Lưu lại form values để sử dụng ở step 2
            setFormValues(values);

            // ============================================================
            // QUAN TRỌNG: CHỈ SUBMIT Ở STEP CUỐI CÙNG (STEP 2)
            // ============================================================
            // Nếu yêu cầu route hoặc có orderId, CHỈ chuyển sang bước 2
            // KHÔNG ĐƯỢC SUBMIT Ở ĐÂY!
            if ((requireRoute || orderId) && !isEditing) {
                setCurrentStep(1); // Chuyển sang step 2
                setIsRouteCompleted(false); // Đánh dấu chưa hoàn thành route
                message.info("Vui lòng hoàn thành định tuyến để tạo phân công xe");
                return; // DỪNG LẠI - KHÔNG SUBMIT
            } else {
                // Trường hợp đặc biệt: Không yêu cầu route HOẶC đang chỉnh sửa
                // Chỉ áp dụng cho form không có bước định tuyến
                if (!requireRoute || isEditing) {
                    await onSubmit(values);
                    if (!isEditing) {
                        form.resetFields();
                        setFormValues({});
                        setIsRouteCompleted(false);
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
            setIsRouteCompleted(true);

            // ============================================================
            // ĐÂY LÀ NƠI DUY NHẤT SUBMIT KHI CÓ ROUTE (STEP 2)
            // ============================================================
            // Kết hợp form values từ step 1 với route segments từ step 2
            const finalValues = {
                ...formValues,
                orderId: orderId,
                routeSegments: segments,
                routeInfo: routeInfoData
            };

            // Submit tất cả dữ liệu từ cả 2 bước
            await onSubmit(finalValues);

            // Reset form sau khi submit thành công
            if (!isEditing) {
                form.resetFields();
                setCurrentStep(0);
                setFormValues({});
                setIsRouteCompleted(false);
                setRouteSegments([]);
                setRouteInfo(null);
            }
        } catch (error) {
            message.error("Có lỗi xảy ra khi lưu phân công xe");
        }
    };

    const handleBack = () => {
        // Quay lại bước 1 nhưng không reset form values
        // Chỉ reset trạng thái route completion
        setCurrentStep(0);
        setIsRouteCompleted(false);
        // Không reset formValues để giữ lại thông tin đã nhập
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
            <Steps 
                current={currentStep} 
                className="mb-6"
                items={[
                    { title: 'Thông tin cơ bản' },
                    { title: 'Định tuyến' },
                ]}
            />

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