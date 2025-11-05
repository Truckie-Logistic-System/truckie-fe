import React, { useState, useEffect } from "react";
import { 
    Modal, Button, App, Result, Form, Card, Input, Row, Col, Divider, Select
} from "antd";
import { 
    CarOutlined, ArrowRightOutlined, UserOutlined, FileTextOutlined
} from "@ant-design/icons";
import type { 
    OrderDetailGroup, GroupAssignment, Seal, 
    VehicleSuggestion
} from "../../../../models/VehicleAssignment";
import { vehicleAssignmentService } from "../../../../services/vehicle-assignment/vehicleAssignmentService";
import type { RouteInfo } from "../../../../models/VehicleAssignment";
import { RoutePlanningStep } from "../../VehicleAssignment/components";
import SealAssignmentStep from "./SealAssignmentStep";
import type { RouteSegment } from "../../../../models/RoutePoint";
import { sortAndNormalizeRouteSegments } from "../../../../utils/routeUtils";
import { 
    TripSelectionStep, 
    TripProgressHeader, 
    SubStepIndicator 
} from "./VehicleAssignmentModal/index";
import {
    TripInfoHeader
} from "./VehicleAssignmentModalContainer/index";

const { TextArea } = Input;
const { Option } = Select;

interface VehicleAssignmentModalProps {
    visible: boolean;
    orderId: string;
    onClose: () => void;
    onSuccess: () => void;
}

interface TripAssignment {
    groupIndex: number;
    group: OrderDetailGroup;
    vehicleId?: string;
    driverId_1?: string;
    driverId_2?: string;
    description?: string;
    routeInfo?: RouteInfo;
    seals?: Seal[];
    completed: boolean;
}

const VehicleAssignmentModal: React.FC<VehicleAssignmentModalProps> = ({
    visible,
    orderId,
    onClose,
    onSuccess
}) => {
    const { message: messageApi } = App.useApp();
    const [form] = Form.useForm();
    
    // Main state
    const [loading, setLoading] = useState(false);
    const [detailGroups, setDetailGroups] = useState<OrderDetailGroup[]>([]);
    const [suggestionsMap, setSuggestionsMap] = useState<Record<number, VehicleSuggestion[]>>({});
    
    // Wizard state
    const [currentStep, setCurrentStep] = useState(0);
    const [tripAssignments, setTripAssignments] = useState<TripAssignment[]>([]);
    const [currentTripIndex, setCurrentTripIndex] = useState(0);
    const [currentSubStep, setCurrentSubStep] = useState(1);
    
    // Form state for current trip
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>();
    const [selectedDriver1Id, setSelectedDriver1Id] = useState<string | undefined>();

    // Fetch suggestions when modal opens
    useEffect(() => {
        if (visible && orderId) {
            fetchSuggestions();
        } else {
            resetWizard();
        }
    }, [visible, orderId]);

    // Prefill form when trip changes
    useEffect(() => {
        if (currentStep > 0 && currentSubStep === 1) {
            const currentTrip = tripAssignments[currentTripIndex];
            if (currentTrip && currentTrip.vehicleId) {
                form.setFieldsValue({
                    vehicleId: currentTrip.vehicleId,
                    driverId_1: currentTrip.driverId_1,
                    driverId_2: currentTrip.driverId_2,
                    description: currentTrip.description
                });
                setSelectedVehicleId(currentTrip.vehicleId);
                setSelectedDriver1Id(currentTrip.driverId_1);
            }
        }
    }, [currentTripIndex, currentStep, currentSubStep, tripAssignments, form]);

    const resetWizard = () => {
        setCurrentStep(0);
        setTripAssignments([]);
        setCurrentTripIndex(0);
        setCurrentSubStep(1);
        setSelectedVehicleId(undefined);
        setSelectedDriver1Id(undefined);
        form.resetFields();
    };

    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            const response = await vehicleAssignmentService.getGroupedSuggestionsForOrderDetails(orderId);
            
            if (!response || !response.data) {
                messageApi.error("Không thể tải gợi ý phân công xe");
                return;
            }

            const groups = response.data.groups || [];
            setDetailGroups(groups);

            const newSuggestionsMap: Record<number, VehicleSuggestion[]> = {};
            groups.forEach((group: OrderDetailGroup, index: number) => {
                newSuggestionsMap[index] = group.suggestedVehicles || [];
            });
            setSuggestionsMap(newSuggestionsMap);
        } catch (error) {
            console.error("Error fetching suggestions:", error);
            messageApi.error("Không thể tải gợi ý phân công xe");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTrips = (indices: number[]) => {
        if (indices.length !== detailGroups.length) {
            messageApi.error(`Bắt buộc phải phân công tất cả ${detailGroups.length} chuyến`);
            return;
        }

        const assignments: TripAssignment[] = indices.map(index => {
            const group = detailGroups[index];
            const suggestions = suggestionsMap[index] || [];
            
            const recommendedVehicle = suggestions.find(v => v.isRecommended);
            
            let recommendedDriver1: string | undefined;
            let recommendedDriver2: string | undefined;
            
            if (recommendedVehicle) {
                const recommendedDrivers = recommendedVehicle.suggestedDrivers
                    .filter(d => d.isRecommended)
                    .slice(0, 2);
                recommendedDriver1 = recommendedDrivers[0]?.id;
                recommendedDriver2 = recommendedDrivers[1]?.id;
            }
            
            return {
                groupIndex: index,
                group,
                vehicleId: recommendedVehicle?.id,
                driverId_1: recommendedDriver1,
                driverId_2: recommendedDriver2,
                completed: false
            };
        });

        setTripAssignments(assignments);
        setCurrentStep(1);
        setCurrentTripIndex(0);
        setCurrentSubStep(1);
    };

    const getCurrentTrip = (): TripAssignment | null => {
        if (currentTripIndex >= tripAssignments.length) return null;
        return tripAssignments[currentTripIndex];
    };

    const updateCurrentTrip = (updates: Partial<TripAssignment>) => {
        setTripAssignments(prev => {
            const newAssignments = [...prev];
            newAssignments[currentTripIndex] = {
                ...newAssignments[currentTripIndex],
                ...updates
            };
            return newAssignments;
        });
    };

    const handleVehicleAssignmentNext = async () => {
        try {
            const values = await form.validateFields();
            updateCurrentTrip({
                vehicleId: values.vehicleId,
                driverId_1: values.driverId_1,
                driverId_2: values.driverId_2,
                description: values.description
            });
            setCurrentSubStep(2);
        } catch (error) {
            console.error("Validation failed:", error);
        }
    };

    const handleRouteComplete = (_segments: RouteSegment[], routeInfo: RouteInfo) => {
        updateCurrentTrip({ routeInfo });
        setCurrentSubStep(3);
    };

    const handleRouteBack = () => {
        setCurrentSubStep(1);
    };

    const handleSealComplete = (seals: Seal[]) => {
        const updatedAssignments = tripAssignments.map((trip, idx) =>
            idx === currentTripIndex
                ? { ...trip, seals, completed: true }
                : trip
        );
        
        if (currentTripIndex < tripAssignments.length - 1) {
            messageApi.success(`Hoàn thành chuyến ${currentTripIndex + 1}/${tripAssignments.length}`);
            setTripAssignments(updatedAssignments);
            setCurrentTripIndex(currentTripIndex + 1);
            setCurrentSubStep(1);
            setSelectedVehicleId(undefined);
            setSelectedDriver1Id(undefined);
            form.resetFields();
        } else {
            messageApi.success("Hoàn thành tất cả các chuyến. Đang lưu...");
            handleSubmitAll(updatedAssignments);
        }
    };

    const handleSealBack = () => {
        setCurrentSubStep(2);
    };

    const handleSubmitAll = async (assignmentsToSubmit?: TripAssignment[]) => {
        try {
            const finalAssignments = assignmentsToSubmit || tripAssignments;

            const incompleteTrips = finalAssignments.filter(t => !t.completed);
            if (incompleteTrips.length > 0) {
                messageApi.error("Có chuyến chưa hoàn thành. Vui lòng hoàn thành tất cả các chuyến.");
                return;
            }

            const groupAssignments: GroupAssignment[] = finalAssignments.map(trip => {
                // Sắp xếp và normalize segments trước khi gửi
                const sortedRouteInfo = trip.routeInfo ? {
                    ...trip.routeInfo,
                    segments: sortAndNormalizeRouteSegments(trip.routeInfo.segments)
                } : trip.routeInfo;

                return {
                    orderDetailIds: trip.group.orderDetails.map(d => d.id),
                    vehicleId: trip.vehicleId!,
                    driverId_1: trip.driverId_1!,
                    driverId_2: trip.driverId_2!,
                    description: trip.description || "",
                    routeInfo: sortedRouteInfo!,
                    seals: trip.seals || []
                };
            });

            await vehicleAssignmentService.createGroupedAssignments({
                groupAssignments
            });

            messageApi.success("Phân công xe thành công");
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error submitting assignments:", error);
            messageApi.error("Không thể tạo phân công xe");
        }
    };

    const renderTripSelection = () => {
        return (
            <TripSelectionStep
                detailGroups={detailGroups}
                suggestionsMap={suggestionsMap}
                loading={loading}
                onSelectTrips={handleSelectTrips}
            />
        );
    };

    const renderVehicleOptions = () => {
        const groupSuggestions = suggestionsMap[currentTripIndex] || [];
        return groupSuggestions.map(vehicle => (
            <Option key={vehicle.id} value={vehicle.id}>
                <div className="flex items-center">
                    <CarOutlined className="mr-2" />
                    <span className="font-medium">{vehicle.licensePlateNumber}</span>
                    <span className="text-gray-500 mx-2">-</span>
                    <span>{vehicle.manufacturer} {vehicle.model}</span>
                    {vehicle.vehicleTypeName && (
                        <span className="text-gray-500 mx-2">({vehicle.vehicleTypeName})</span>
                    )}
                </div>
            </Option>
        ));
    };

    const getVehicleInfo = (vehicleId: string) => {
        const groupSuggestions = suggestionsMap[currentTripIndex] || [];
        const vehicle = groupSuggestions.find(v => v.id === vehicleId);
        if (!vehicle) return null;

        return (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-2 rounded-lg mt-2 mb-0 border border-blue-100">
                <div className="flex items-center mb-2">
                    <div className="bg-blue-500 text-white p-1 rounded-full mr-2">
                        <CarOutlined className="text-sm" />
                    </div>
                    <div>
                        <div className="font-medium text-sm">{vehicle.licensePlateNumber}</div>
                        <div className="text-gray-500 text-xs">{vehicle.manufacturer} {vehicle.model}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Nhà sản xuất:</span>
                        <span className="font-medium">{vehicle.manufacturer}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Mẫu xe:</span>
                        <span className="font-medium">{vehicle.model}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Biển số:</span>
                        <span className="font-medium">{vehicle.licensePlateNumber}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Loại xe:</span>
                        <span className="font-medium">{vehicle.vehicleTypeName || "Không có thông tin"}</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderDriverOptions = (vehicleId: string) => {
        const groupSuggestions = suggestionsMap[currentTripIndex] || [];
        const selectedVehicle = groupSuggestions.find(v => v.id === vehicleId);
        if (!selectedVehicle) return [];

        return selectedVehicle.suggestedDrivers.map(driver => (
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

    const getDriverDetails = (vehicleId: string, driverId: string) => {
        const groupSuggestions = suggestionsMap[currentTripIndex] || [];
        const selectedVehicle = groupSuggestions.find(v => v.id === vehicleId);
        if (!selectedVehicle) return null;

        const selectedDriver = selectedVehicle.suggestedDrivers.find(d => d.id === driverId);
        if (!selectedDriver) return null;

        return (
            <div className="bg-gradient-to-r from-green-50 to-teal-50 p-2 rounded-lg mt-2 border border-green-100">
                <div className="flex items-center mb-2">
                    <div className="bg-green-500 text-white p-1 rounded-full mr-2">
                        <UserOutlined className="text-xs" />
                    </div>
                    <div className="flex-1">
                        <div className="font-medium text-xs">{selectedDriver.fullName}</div>
                        <div className="text-xxs text-gray-500">
                            Bằng {selectedDriver.licenseClass} • {selectedDriver.driverLicenseNumber}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xxs">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Kinh nghiệm:</span>
                        <span className="font-medium">{selectedDriver.experienceYears}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Chuyến:</span>
                        <span className="font-medium">{selectedDriver.completedTripsCount}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Vi phạm:</span>
                        <span className="font-medium">{selectedDriver.violationCount}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Hoạt động:</span>
                        <span className="font-medium">{selectedDriver.lastActiveTime || "N/A"}</span>
                    </div>
                </div>
            </div>
        );
    };

    const getFilteredDriverOptions = (vehicleId: string, currentDriverId: string) => {
        const groupSuggestions = suggestionsMap[currentTripIndex] || [];
        const selectedVehicle = groupSuggestions.find(v => v.id === vehicleId);
        if (!selectedVehicle) return [];

        return selectedVehicle.suggestedDrivers
            .filter(driver => driver.id !== currentDriverId)
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

    const renderVehicleAssignmentForm = (trip: TripAssignment) => {
        const suggestions = suggestionsMap[trip.groupIndex] || [];
        const currentVehicleId = selectedVehicleId || trip.vehicleId;
        const currentDrivers = {
            driver1: form.getFieldValue('driverId_1'),
            driver2: form.getFieldValue('driverId_2')
        };

        return (
            <Card className="border-0 shadow-sm">
                {/* Trip Info Header */}
                <TripInfoHeader group={trip.group} tripIndex={currentTripIndex} />

                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{
                        vehicleId: trip.vehicleId,
                        driverId_1: trip.driverId_1,
                        driverId_2: trip.driverId_2,
                        description: trip.description
                    }}
                    size="small"
                >
                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-medium mb-3 flex items-center">
                            <CarOutlined className="mr-2 text-blue-500" />
                            Phân công phương tiện và tài xế
                        </h3>

                        <Row gutter={[16, 12]}>
                            <Col span={12}>
                                <div className="bg-blue-50 p-2 rounded-lg">
                                    <h4 className="text-xs font-medium mb-2 flex items-center">
                                        <CarOutlined className="mr-1" />
                                        Chọn xe
                                    </h4>
                                    <Form.Item
                                        name="vehicleId"
                                        rules={[{ required: true, message: "Vui lòng chọn xe" }]}
                                        className="mb-0"
                                    >
                                        <Select
                                            placeholder="Chọn xe"
                                            className="w-full"
                                            showSearch
                                            optionFilterProp="children"
                                            onChange={(value: string) => {
                                                setSelectedVehicleId(value);
                                                setSelectedDriver1Id("");
                                                form.setFieldsValue({ driverId_1: undefined, driverId_2: undefined });
                                            }}
                                            size="small"
                                        >
                                            {renderVehicleOptions()}
                                        </Select>
                                    </Form.Item>
                                </div>

                                {currentVehicleId && getVehicleInfo(currentVehicleId)}
                            </Col>

                            <Col span={12}>
                                <div className="bg-green-50 p-2 rounded-lg">
                                    <h4 className="text-xs font-medium mb-2 flex items-center">
                                        <FileTextOutlined className="mr-1" />
                                        Ghi chú phân công
                                    </h4>
                                    <Form.Item
                                        name="description"
                                        className="mb-0"
                                    >
                                        <TextArea
                                            rows={2}
                                            placeholder="Nhập ghi chú phân công (nếu có)"
                                            className="border-gray-300 text-xs"
                                            size="small"
                                        />
                                    </Form.Item>
                                </div>
                            </Col>
                        </Row>

                        <Divider className="my-3" />

                        <h3 className="text-sm font-medium mb-3 flex items-center">
                            <UserOutlined className="mr-2 text-green-500" />
                            Phân công tài xế
                        </h3>

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
                                            className="w-full"
                                            showSearch
                                            optionFilterProp="children"
                                            disabled={!currentVehicleId}
                                            onChange={(value: string) => setSelectedDriver1Id(value)}
                                            size="small"
                                        >
                                            {currentVehicleId && renderDriverOptions(currentVehicleId)}
                                        </Select>
                                    </Form.Item>
                                </div>

                                {currentVehicleId && currentDrivers.driver1 &&
                                    getDriverDetails(currentVehicleId, currentDrivers.driver1)
                                }
                            </Col>

                            <Col span={12}>
                                <div className="bg-purple-50 p-2 rounded-lg">
                                    <h4 className="text-xs font-medium mb-2 flex items-center">
                                        <UserOutlined className="mr-1" />
                                        Tài xế 2 (phụ)
                                    </h4>
                                    <Form.Item
                                        name="driverId_2"
                                        rules={[{ required: true, message: "Vui lòng chọn tài xế phụ" }]}
                                        className="mb-0"
                                    >
                                        <Select
                                            placeholder="Chọn tài xế phụ"
                                            className="w-full"
                                            showSearch
                                            optionFilterProp="children"
                                            disabled={!currentVehicleId || !currentDrivers.driver1}
                                            onChange={(value: string) => {}}
                                            size="small"
                                        >
                                            {currentVehicleId && currentDrivers.driver1 &&
                                                getFilteredDriverOptions(currentVehicleId, currentDrivers.driver1)}
                                        </Select>
                                    </Form.Item>
                                </div>

                                {currentVehicleId && currentDrivers.driver1 && currentDrivers.driver2 &&
                                    getDriverDetails(currentVehicleId, currentDrivers.driver2)
                                }
                            </Col>
                        </Row>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            type="primary"
                            size="large"
                            onClick={handleVehicleAssignmentNext}
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

    const renderRoutePlanning = (trip: TripAssignment) => {
        if (!trip.vehicleId) {
            return <Result status="error" title="Vui lòng chọn xe trước" />;
        }

        const vehicleForRoute = {
            id: trip.vehicleId,
            licensePlateNumber: "Selected Vehicle",
            model: "",
            manufacturer: "",
            vehicleTypeId: "",
            year: 2023,
            capacity: 1000,
            status: 'ACTIVE' as const
        };

        return (
            <RoutePlanningStep
                orderId={orderId}
                vehicleId={trip.vehicleId}
                vehicle={vehicleForRoute}
                onComplete={handleRouteComplete}
                onBack={handleRouteBack}
            />
        );
    };

    const renderSealAssignment = (trip: TripAssignment) => {
        return (
            <SealAssignmentStep
                onComplete={handleSealComplete}
                onBack={handleSealBack}
                initialSeals={trip.seals || []}
            />
        );
    };

    const renderTripProcessing = () => {
        const currentTrip = getCurrentTrip();
        if (!currentTrip) {
            return <Result status="error" title="Không tìm thấy thông tin chuyến" />;
        }

        return (
            <div className="p-6 space-y-6">
                <TripProgressHeader
                    currentTripIndex={currentTripIndex}
                    totalTrips={tripAssignments.length}
                    completedTrips={tripAssignments.filter(t => t.completed).length}
                    itemCount={currentTrip.group.orderDetails.length}
                />

                <SubStepIndicator currentSubStep={currentSubStep} />

                {currentSubStep === 1 && renderVehicleAssignmentForm(currentTrip)}
                {currentSubStep === 2 && renderRoutePlanning(currentTrip)}
                {currentSubStep === 3 && renderSealAssignment(currentTrip)}
            </div>
        );
    };

    const renderStepContent = () => {
        if (currentStep === 0) {
            return renderTripSelection();
        }
        return renderTripProcessing();
    };

    return (
        <Modal
            title={
                <div className="flex items-center">
                    <CarOutlined className="text-xl text-blue-600 mr-2" />
                    <span className="text-lg font-semibold">Phân công xe và tài xế</span>
                </div>
            }
            open={visible}
            onCancel={onClose}
            width="95%"
            style={{ top: 20 }}
            bodyStyle={{ maxHeight: 'calc(90vh - 120px)', overflowY: 'auto' }}
            footer={null}
            destroyOnClose
        >
            {loading ? (
                <div className="py-12 text-center">
                    <div className="inline-block">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="mt-4 text-gray-600 font-medium">Đang tải thông tin phân công...</p>
                </div>
            ) : (
                renderStepContent()
            )}
        </Modal>
    );
};

export default VehicleAssignmentModal;