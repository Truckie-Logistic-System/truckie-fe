import React, { useState, useEffect } from "react";
import { Button, Card, Row, Col, Select, Form, Input, App, Tag } from "antd";
import {
    CheckCircleOutlined,
    CarOutlined,
    UserOutlined,
    EnvironmentOutlined,
    EditOutlined,
    SafetyOutlined,
    LoadingOutlined
} from "@ant-design/icons";
import type { TripAssignment } from "./types";
import type { VehicleSuggestion } from "../../../../../models/VehicleAssignment";

const { TextArea } = Input;
const { Option } = Select;

interface TripConfirmationModalProps {
    visible: boolean;
    tripAssignments: TripAssignment[];
    suggestionsMap: Record<number, VehicleSuggestion[]>;
    onConfirm: (updatedAssignments: TripAssignment[]) => Promise<void>;
    onBack: () => void;
    excludedDriverIds?: Set<string>;
    excludedVehicleIds?: Set<string>;
}

const TripConfirmationModal: React.FC<TripConfirmationModalProps> = ({
    visible,
    tripAssignments,
    suggestionsMap,
    onConfirm,
    onBack
}) => {
    const { message: messageApi } = App.useApp();
    const [form] = Form.useForm();
    const [selectedTripIndex, setSelectedTripIndex] = useState<number | null>(null);
    const [editedAssignments, setEditedAssignments] = useState<TripAssignment[]>(tripAssignments);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>();
    const [sealInput, setSealInput] = useState<string>('');
    const [editingSeals, setEditingSeals] = useState<string[]>([]);
    const [isConfirming, setIsConfirming] = useState<boolean>(false);

    // Sync editedAssignments with tripAssignments prop
    useEffect(() => {
        if (visible && tripAssignments.length > 0) {
            setEditedAssignments(tripAssignments);
        }
    }, [visible, tripAssignments]);

    // Get all assigned driver IDs and vehicle IDs across all trips
    const getAssignedResourceIds = (excludeTripIndex?: number) => {
        const driverIds = new Set<string>();
        const vehicleIds = new Set<string>();

        editedAssignments.forEach((trip, index) => {
            if (excludeTripIndex !== undefined && index === excludeTripIndex) return;
            
            if (trip.vehicleId) vehicleIds.add(trip.vehicleId);
            if (trip.driverId_1) driverIds.add(trip.driverId_1);
            if (trip.driverId_2) driverIds.add(trip.driverId_2);
        });

        return { driverIds, vehicleIds };
    };

    const handleSelectTrip = (index: number) => {
        const trip = editedAssignments[index];
        setSelectedTripIndex(index);
        
        form.setFieldsValue({
            vehicleId: trip.vehicleId,
            driverId_1: trip.driverId_1,
            driverId_2: trip.driverId_2,
            description: trip.description
        });
        setSelectedVehicleId(trip.vehicleId);
        setEditingSeals(trip.seals?.map(s => s.sealCode) || []);
        setSealInput('');
    };

    const handleUpdateTrip = async () => {
        try {
            const values = await form.validateFields();
            
            const updatedAssignments = [...editedAssignments];
            updatedAssignments[selectedTripIndex!] = {
                ...updatedAssignments[selectedTripIndex!],
                vehicleId: values.vehicleId,
                driverId_1: values.driverId_1,
                driverId_2: values.driverId_2,
                description: values.description,
                seals: editingSeals.map(code => ({ sealCode: code, description: '' }))
            };

            setEditedAssignments(updatedAssignments);
            messageApi.success(`✅ Đã cập nhật chuyến ${selectedTripIndex! + 1}`);
            setSelectedTripIndex(null);
            form.resetFields();
            setEditingSeals([]);
            setSealInput('');
        } catch (error) {
            console.error("Validation failed:", error);
        }
    };

    const handleConfirmAll = async () => {
        setIsConfirming(true);
        try {
            await onConfirm(editedAssignments);
            // Modal will be closed by parent component after successful API call
        } catch (error) {
            console.error("Confirmation failed:", error);
            messageApi.error("❌ Không thể hoàn tất phân công. Vui lòng thử lại.");
        } finally {
            setIsConfirming(false);
        }
    };

    const getVehicleInfo = (vehicleId: string, tripIndex: number) => {
        const suggestions = suggestionsMap[tripIndex] || [];
        return suggestions.find(v => v.id === vehicleId);
    };

    const getDriverInfo = (driverId: string, tripIndex: number) => {
        const suggestions = suggestionsMap[tripIndex] || [];
        for (const vehicle of suggestions) {
            const driver = vehicle.suggestedDrivers.find(d => d.id === driverId);
            if (driver) return driver;
        }
        return null;
    };

    const renderVehicleOptions = (tripIndex: number) => {
        const { vehicleIds } = getAssignedResourceIds(tripIndex);
        const suggestions = suggestionsMap[tripIndex] || [];
        
        return suggestions
            .filter(vehicle => !vehicleIds.has(vehicle.id))
            .map(vehicle => (
                <Option key={vehicle.id} value={vehicle.id}>
                    <div className="flex items-center">
                        <CarOutlined className="mr-2" />
                        <span className="font-medium">{vehicle.licensePlateNumber}</span>
                        <span className="text-gray-500 mx-2">-</span>
                        <span>{vehicle.manufacturer} {vehicle.model}</span>
                    </div>
                </Option>
            ));
    };

    const renderDriverOptions = (vehicleId: string, tripIndex: number, excludeDriverId?: string) => {
        const { driverIds } = getAssignedResourceIds(tripIndex);
        const suggestions = suggestionsMap[tripIndex] || [];
        const selectedVehicle = suggestions.find(v => v.id === vehicleId);
        
        if (!selectedVehicle) return [];

        return selectedVehicle.suggestedDrivers
            .filter(driver => 
                !driverIds.has(driver.id) && 
                driver.id !== excludeDriverId
            )
            .map(driver => (
                <Option key={driver.id} value={driver.id}>
                    <div className="flex items-center">
                        <UserOutlined className="mr-2" />
                        <span className="font-medium">{driver.fullName}</span>
                        <span className="text-gray-500 mx-2">-</span>
                        <span>Bằng {driver.licenseClass}</span>
                    </div>
                </Option>
            ));
    };

    const renderTripSummaryList = () => {
        return (
            <div className="space-y-3">
                <div className="bg-blue-600 text-white p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-1">Xác nhận phân công</h3>
                    <p className="text-sm opacity-90">
                        Tổng số chuyến: {editedAssignments.length} • Click vào chuyến để chỉnh sửa nhanh
                    </p>
                </div>

                {editedAssignments.map((trip, index) => {
                    const vehicle = getVehicleInfo(trip.vehicleId!, trip.groupIndex);
                    const driver1 = getDriverInfo(trip.driverId_1!, trip.groupIndex);
                    const driver2 = getDriverInfo(trip.driverId_2!, trip.groupIndex);
                    const isSelected = selectedTripIndex === index;

                    return (
                        <Card
                            key={index}
                            className={`cursor-pointer transition-all hover:shadow-lg ${
                                isSelected 
                                    ? 'border-2 border-blue-500 shadow-lg' 
                                    : 'border border-gray-200 hover:border-blue-300'
                            }`}
                            onClick={() => handleSelectTrip(index)}
                            bodyStyle={{ padding: '16px' }}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center mb-2">
                                        <CheckCircleOutlined className="text-green-500 text-lg mr-2" />
                                        <h4 className="font-semibold text-base">
                                            Chuyến {index + 1}
                                        </h4>
                                        {trip.group.orderDetails.length > 1 && (
                                            <Tag color="blue" className="ml-2">
                                                {trip.group.orderDetails.length} đơn hàng
                                            </Tag>
                                        )}
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        {/* Vehicle Info */}
                                        <div className="flex items-center text-gray-700">
                                            <CarOutlined className="mr-2 text-blue-500" />
                                            <span className="font-medium">{vehicle?.licensePlateNumber || 'N/A'}</span>
                                            <span className="text-gray-400 mx-2">•</span>
                                            <span className="text-gray-500">
                                                {vehicle?.manufacturer} {vehicle?.model}
                                            </span>
                                        </div>

                                        {/* Driver 1 */}
                                        <div className="flex items-center text-gray-700">
                                            <UserOutlined className="mr-2 text-green-500" />
                                            <span className="font-medium">Tài xế 1:</span>
                                            <span className="ml-2">{driver1?.fullName || 'N/A'}</span>
                                        </div>

                                        {/* Driver 2 */}
                                        <div className="flex items-center text-gray-700">
                                            <UserOutlined className="mr-2 text-purple-500" />
                                            <span className="font-medium">Tài xế 2:</span>
                                            <span className="ml-2">{driver2?.fullName || 'N/A'}</span>
                                        </div>

                                        {/* Route Info */}
                                        <div className="flex items-center text-gray-700">
                                            <EnvironmentOutlined className="mr-2 text-red-500" />
                                            <span>
                                                {trip.routeInfo 
                                                    ? trip.routeInfo.totalDistance.toFixed(1) 
                                                    : '0.0'} km
                                            </span>
                                            {trip.routeInfo && (
                                                <>
                                                    <span className="text-gray-400 mx-2">•</span>
                                                    <span>
                                                        {trip.routeInfo.totalTollFee.toLocaleString('vi-VN')} VNĐ phí
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        {/* Seals */}
                                        {trip.seals && trip.seals.length > 0 ? (
                                            <div className="flex items-start text-gray-700">
                                                <SafetyOutlined className="mr-2 text-orange-500 mt-0.5" />
                                                <div className="flex flex-wrap gap-1">
                                                    {trip.seals.map((seal, sealIdx) => (
                                                        <Tag key={sealIdx} color="orange" className="mb-1">
                                                            {seal.sealCode}
                                                        </Tag>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-gray-400">
                                                <SafetyOutlined className="mr-2" />
                                                <span className="italic">Chưa có seal</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <EditOutlined 
                                    className={`text-lg ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}
                                />
                            </div>
                        </Card>
                    );
                })}
            </div>
        );
    };

    const renderEditPanel = () => {
        if (selectedTripIndex === null) {
            return (
                <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                        <EditOutlined className="text-6xl mb-4" />
                        <p className="text-lg">Chọn một chuyến để chỉnh sửa</p>
                    </div>
                </div>
            );
        }

        const trip = editedAssignments[selectedTripIndex];
        const currentVehicleId = selectedVehicleId || trip.vehicleId;
        const currentDriver1 = form.getFieldValue('driverId_1');

        return (
            <div className="flex flex-col h-full">
                <div className="bg-blue-600 text-white p-4 rounded-t-lg mb-0">
                    <h3 className="text-lg font-semibold">
                        Chỉnh sửa Chuyến {selectedTripIndex + 1}
                    </h3>
                </div>
                <Card className="flex-1 overflow-y-auto rounded-t-none">

                <Form
                    form={form}
                    layout="vertical"
                    size="small"
                >
                    <Form.Item
                        label={<span className="font-medium">Phương tiện</span>}
                        name="vehicleId"
                        rules={[{ required: true, message: "Vui lòng chọn xe" }]}
                    >
                        <Select
                            placeholder="Chọn xe"
                            showSearch
                            optionFilterProp="children"
                            onChange={(value: string) => {
                                setSelectedVehicleId(value);
                                form.setFieldsValue({ driverId_1: undefined, driverId_2: undefined });
                            }}
                        >
                            {renderVehicleOptions(trip.groupIndex)}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label={<span className="font-medium">Tài xế chính</span>}
                        name="driverId_1"
                        rules={[{ required: true, message: "Vui lòng chọn tài xế chính" }]}
                    >
                        <Select
                            placeholder="Chọn tài xế chính"
                            showSearch
                            optionFilterProp="children"
                            disabled={!currentVehicleId}
                        >
                            {currentVehicleId && renderDriverOptions(currentVehicleId, trip.groupIndex)}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label={<span className="font-medium">Tài xế phụ</span>}
                        name="driverId_2"
                        rules={[{ required: true, message: "Vui lòng chọn tài xế phụ" }]}
                    >
                        <Select
                            placeholder="Chọn tài xế phụ"
                            showSearch
                            optionFilterProp="children"
                            disabled={!currentVehicleId || !currentDriver1}
                        >
                            {currentVehicleId && currentDriver1 && 
                                renderDriverOptions(currentVehicleId, trip.groupIndex, currentDriver1)}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label={<span className="font-medium">Ghi chú</span>}
                        name="description"
                    >
                        <TextArea
                            rows={3}
                            placeholder="Nhập ghi chú (nếu có)"
                        />
                    </Form.Item>

                    <Form.Item
                        label={
                            <span className="font-medium flex items-center">
                                <SafetyOutlined className="mr-1" />
                                Seals ({editingSeals.length})
                            </span>
                        }
                    >
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Nhập mã seal (vd: SEAL-001)"
                                    value={sealInput}
                                    onChange={(e) => setSealInput(e.target.value.toUpperCase())}
                                    onPressEnter={() => {
                                        const trimmed = sealInput.trim();
                                        if (trimmed && !editingSeals.includes(trimmed)) {
                                            setEditingSeals([...editingSeals, trimmed]);
                                            setSealInput('');
                                            messageApi.success(`✅ Đã thêm seal: ${trimmed}`);
                                        } else if (editingSeals.includes(trimmed)) {
                                            messageApi.warning('⚠️ Seal đã tồn tại');
                                        }
                                    }}
                                    prefix={<SafetyOutlined />}
                                    size="small"
                                />
                                <Button
                                    size="small"
                                    type="primary"
                                    onClick={() => {
                                        const trimmed = sealInput.trim();
                                        if (trimmed && !editingSeals.includes(trimmed)) {
                                            setEditingSeals([...editingSeals, trimmed]);
                                            setSealInput('');
                                            messageApi.success(`✅ Đã thêm seal: ${trimmed}`);
                                        } else if (editingSeals.includes(trimmed)) {
                                            messageApi.warning('⚠️ Seal đã tồn tại');
                                        }
                                    }}
                                    disabled={!sealInput.trim()}
                                >
                                    Thêm
                                </Button>
                            </div>
                            {editingSeals.length > 0 && (
                                <div className="flex flex-wrap gap-1 p-2 bg-gray-50 rounded border">
                                    {editingSeals.map((seal, idx) => (
                                        <Tag
                                            key={idx}
                                            color="orange"
                                            closable
                                            onClose={() => {
                                                setEditingSeals(editingSeals.filter((_, i) => i !== idx));
                                                messageApi.info(`🗑️ Đã xóa seal: ${seal}`);
                                            }}
                                        >
                                            {seal}
                                        </Tag>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Form.Item>

                    <div className="flex gap-2">
                        <Button
                            type="primary"
                            className="flex-1 bg-blue-600"
                            onClick={handleUpdateTrip}
                        >
                            Cập nhật
                        </Button>
                        <Button
                            onClick={() => {
                                setSelectedTripIndex(null);
                                form.resetFields();
                                setEditingSeals([]);
                                setSealInput('');
                            }}
                        >
                            Hủy
                        </Button>
                    </div>
                </Form>
                </Card>
            </div>
        );
    };

    if (!visible) return null;

    return (
        <div className="confirmation-content">
            <Row gutter={24} style={{ minHeight: '70vh' }}>
                <Col span={14}>
                    {renderTripSummaryList()}
                </Col>
                <Col span={10}>
                    {renderEditPanel()}
                </Col>
            </Row>

            <div className="flex justify-between items-center pt-6 border-t mt-6">
                <Button size="large" onClick={onBack}>
                    Quay lại
                </Button>
                <Button
                    type="primary"
                    size="large"
                    onClick={handleConfirmAll}
                    loading={isConfirming}
                    disabled={isConfirming}
                    className="bg-green-600 hover:bg-green-700 font-semibold px-8"
                >
                    {isConfirming ? 'Đang xử lý...' : 'Xác nhận và hoàn tất'}
                </Button>
            </div>
        </div>
    );
};

export default TripConfirmationModal;
