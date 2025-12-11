import React, { useState, useEffect, useRef } from "react";
import { 
    Modal, Button, App, Result, Form, Card, Input, Row, Col, Divider, Select, Space, Tooltip
} from "antd";
import { 
    CarOutlined, ArrowRightOutlined, UserOutlined, FileTextOutlined, PhoneOutlined, SearchOutlined
} from "@ant-design/icons";
import driverService from "../../../../services/driver/driverService";
import type { 
    OrderDetailGroup, GroupAssignment, Seal, 
    VehicleSuggestion, SuggestedDriver
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
import TripConfirmationModal from "./VehicleAssignmentModal/TripConfirmationModal";
import type { TripAssignment } from "./VehicleAssignmentModal/types";

const { TextArea } = Input;
const { Option } = Select;

interface VehicleAssignmentModalProps {
    visible: boolean;
    orderId: string;
    onClose: () => void;
    onSuccess: () => void;
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
    const [showConfirmation, setShowConfirmation] = useState(false);
    
    // Form state for current trip
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>();
    const [manualDriver1Phone, setManualDriver1Phone] = useState<string>(""); // Phone number for manual driver 1 search
    const [manualDriver2Phone, setManualDriver2Phone] = useState<string>(""); // Phone number for manual driver 2 search
    const [searchingDriver, setSearchingDriver] = useState(false); // Flag for searching driver
    const [selectedDriver1, setSelectedDriver1] = useState<string | undefined>();
    const [selectedDriver2, setSelectedDriver2] = useState<string | undefined>();
    
    // Modal state: 'idle' | 'loading' | 'ready' | 'submitting' | 'success'
    // Simple state machine - NO complex refs, NO race conditions
    const [modalState, setModalState] = useState<'idle' | 'loading' | 'ready' | 'submitting' | 'success'>('idle');
    
    // Track previous visible state to detect open/close transitions
    const prevVisibleRef = useRef(visible);

    // ONLY fetch when modal OPENS (visible changes from false to true)
    useEffect(() => {
        const wasVisible = prevVisibleRef.current;
        const isNowVisible = visible;
        prevVisibleRef.current = visible;
        
        // Modal just OPENED (false -> true)
        if (!wasVisible && isNowVisible && orderId && modalState === 'idle') {
            console.log('📂 Modal opened - fetching data');
            fetchSuggestions();
        }
        
        // Modal just CLOSED (true -> false)
        if (wasVisible && !isNowVisible) {
            console.log('📁 Modal closed - resetting state');
            // Reset everything when modal closes
            resetWizard();
            setModalState('idle');
        }
    }, [visible, orderId, modalState]);

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
            }
        }
    }, [currentTripIndex, currentStep, currentSubStep, tripAssignments, form]);

    const resetWizard = () => {
        setCurrentStep(0);
        setTripAssignments([]);
        setCurrentTripIndex(0);
        setCurrentSubStep(1);
        setSelectedVehicleId(undefined);
        form.resetFields();
    };

    const fetchSuggestions = async () => {
        // Don't fetch if already submitting or success
        if (modalState === 'submitting' || modalState === 'success') {
            console.log('🚫 Skipping fetch - modalState:', modalState);
            return;
        }
        
        setModalState('loading');
        setLoading(true);
        
        try {
            const response = await vehicleAssignmentService.getGroupedSuggestionsForOrderDetails(orderId);
            
            if (!response || !response.data) {
                messageApi.error("❌ Không thể tải gợi ý phân công xe");
                setModalState('idle');
                return;
            }

            const groups = response.data.groups || [];
            setDetailGroups(groups);

            const newSuggestionsMap: Record<number, VehicleSuggestion[]> = {};
            groups.forEach((group: OrderDetailGroup, index: number) => {
                newSuggestionsMap[index] = group.suggestedVehicles || [];
            });
            setSuggestionsMap(newSuggestionsMap);
            setModalState('ready');
        } catch (error: any) {
            console.error("Error fetching suggestions:", error);
            const errorMessage = error?.response?.data?.message || "";
            // Don't show error if order is already assigned
            if (!errorMessage.includes("đã được phân công") && !errorMessage.includes("already assigned")) {
                messageApi.error("❌ Không thể tải gợi ý phân công xe");
            }
            setModalState('idle');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTrips = (indices: number[]) => {
        if (indices.length !== detailGroups.length) {
            messageApi.error(`⚠️ Bắt buộc phải chọn tất cả ${detailGroups.length} chuyến trước khi tiếp tục`);
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

    const handleSearchDriverByPhone = async (phoneNumber: string, driverField: 'driverId_1' | 'driverId_2') => {
        if (!phoneNumber || phoneNumber.trim() === "") {
            messageApi.warning("⚠️ Vui lòng nhập số điện thoại");
            return;
        }

        setSearchingDriver(true);
        try {
            const driver = await driverService.validateDriverByPhone(phoneNumber);
            
            if (!driver || !driver.id) {
                messageApi.error("❌ Không tìm thấy tài xế với số điện thoại này");
                return;
            }

            // Check if driver is already assigned to another trip
            const { driverIds } = getAssignedResourceIds();
            if (driverIds.has(driver.id)) {
                messageApi.warning(`⚠️ ${driver.userResponse?.fullName || 'Tài xế này'} đã được phân công cho chuyến khác`);
                return;
            }

            // Check if driver is already selected in current trip
            const currentDriver1 = form.getFieldValue('driverId_1');
            const currentDriver2 = form.getFieldValue('driverId_2');
            
            if (driverField === 'driverId_1' && driver.id === currentDriver2) {
                messageApi.warning(`⚠️ ${driver.userResponse?.fullName || 'Tài xế này'} đã được chọn làm tài xế phụ`);
                return;
            }
            
            if (driverField === 'driverId_2' && driver.id === currentDriver1) {
                messageApi.warning(`⚠️ ${driver.userResponse?.fullName || 'Tài xế này'} đã được chọn làm tài xế chính`);
                return;
            }

            // Add driver to suggestionsMap for current vehicle so it can be displayed
            const currentVehicleId = form.getFieldValue('vehicleId');
            if (currentVehicleId) {
                const updatedSuggestionsMap = { ...suggestionsMap };
                const currentGroupSuggestions = updatedSuggestionsMap[currentTripIndex] || [];
                
                const vehicleIndex = currentGroupSuggestions.findIndex(v => v.id === currentVehicleId);
                if (vehicleIndex !== -1) {
                    // Transform driver data to match SuggestedDriver interface
                    const driverSuggestion: SuggestedDriver = {
                        id: driver.id,
                        fullName: driver.userResponse?.fullName || 'N/A',
                        licenseClass: driver.licenseClass || 'N/A',
                        driverLicenseNumber: driver.driverLicenseNumber || 'N/A',
                        experienceYears: '0',  // Default to 0 years as string
                        violationCount: driver.penaltyHistories?.length || 0,
                        completedTripsCount: 0,  // Unknown for manually added drivers
                        lastActiveTime: new Date().toISOString(),  // Current time
                        isRecommended: false  // Manually added drivers are not auto-recommended
                    };
                    
                    // Check if driver already exists in suggestions
                    const driverExists = currentGroupSuggestions[vehicleIndex].suggestedDrivers.some(
                        d => d.id === driver.id
                    );
                    
                    if (!driverExists) {
                        // Add driver to vehicle's suggested drivers
                        currentGroupSuggestions[vehicleIndex] = {
                            ...currentGroupSuggestions[vehicleIndex],
                            suggestedDrivers: [
                                ...currentGroupSuggestions[vehicleIndex].suggestedDrivers,
                                driverSuggestion
                            ]
                        };
                        updatedSuggestionsMap[currentTripIndex] = currentGroupSuggestions;
                        setSuggestionsMap(updatedSuggestionsMap);
                    }
                }
            }
            
            form.setFieldValue(driverField, driver.id);
            const roleText = driverField === 'driverId_1' ? 'tài xế chính' : 'tài xế phụ';
            messageApi.success(`✅ Đã thêm ${roleText}: ${driver.userResponse?.fullName || 'N/A'}`);
            
            // Clear phone input after successful assignment
            if (driverField === 'driverId_1') {
                setManualDriver1Phone("");
            } else {
                setManualDriver2Phone("");
            }
        } catch (error: any) {
            console.error("Error searching driver:", error);
            
            // Show backend message directly (backend already formats user-friendly messages)
            const backendMessage = error?.response?.data?.message || "❌ Không thể xác thực tài xế. Vui lòng kiểm tra số điện thoại.";
            
            // Use warning for business logic errors, error for technical failures
            if (error.response?.status === 400 || error.response?.status === 404) {
                messageApi.warning(backendMessage);
            } else {
                messageApi.error(backendMessage);
            }
        } finally {
            setSearchingDriver(false);
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
            messageApi.success(`✅ Hoàn thành chuyến ${currentTripIndex + 1}/${tripAssignments.length}`);
            setTripAssignments(updatedAssignments);
            setCurrentTripIndex(currentTripIndex + 1);
            setCurrentSubStep(1);
            setSelectedVehicleId(undefined);
            form.resetFields();
        } else {
            messageApi.success("✅ Hoàn thành tất cả các chuyến! Vui lòng xác nhận thông tin...");
            setTripAssignments(updatedAssignments);
            setShowConfirmation(true);
        }
    };

    const handleConfirmAssignments = async (updatedAssignments: TripAssignment[]): Promise<void> => {
        await handleSubmitAll(updatedAssignments);
        setShowConfirmation(false);
    };

    const handleBackFromConfirmation = () => {
        setShowConfirmation(false);
    };

    // Get all assigned driver and vehicle IDs across trips (excluding current trip)
    const getAssignedResourceIds = () => {
        const driverIds = new Set<string>();
        const vehicleIds = new Set<string>();

        tripAssignments.forEach((trip, index) => {
            if (index === currentTripIndex) return; // Skip current trip
            
            if (trip.vehicleId) vehicleIds.add(trip.vehicleId);
            if (trip.driverId_1) driverIds.add(trip.driverId_1);
            if (trip.driverId_2) driverIds.add(trip.driverId_2);
        });

        return { driverIds, vehicleIds };
    };

    const handleSealBack = () => {
        setCurrentSubStep(2);
    };

    const handleSubmitAll = async (assignmentsToSubmit?: TripAssignment[]): Promise<void> => {
        const finalAssignments = assignmentsToSubmit || tripAssignments;

        const incompleteTrips = finalAssignments.filter(t => !t.completed);
        if (incompleteTrips.length > 0) {
            messageApi.error(`⚠️ Có ${incompleteTrips.length} chuyến chưa hoàn thành. Vui lòng hoàn thành tất cả các chuyến trước khi xác nhận.`);
            throw new Error("Incomplete trips");
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
                routeInfo: sortedRouteInfo,
                seals: trip.seals || []
            };
        });

        // Set state to submitting FIRST - this prevents any re-fetch
        setModalState('submitting');
        
        try {
            await vehicleAssignmentService.createGroupedAssignments({
                groupAssignments
            });

            // SUCCESS! Set state to success - this is a terminal state
            setModalState('success');
            console.log('✅ Submit success - modalState set to success');
            
            messageApi.success("✅ Phân công xe thành công!");
            
            // Close modal and notify parent
            onClose();
            onSuccess();
        } catch (error) {
            console.error("Error submitting assignments:", error);
            messageApi.error("❌ Không thể tạo phân công xe. Vui lòng thử lại.");
            // Reset to ready state so user can try again
            setModalState('ready');
            throw error;
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
        const { vehicleIds } = getAssignedResourceIds();
        const groupSuggestions = suggestionsMap[currentTripIndex] || [];
        
        return groupSuggestions
            .filter(vehicle => !vehicleIds.has(vehicle.id))
            .map(vehicle => (
                <Option key={vehicle.id} value={vehicle.id}>
                    <div className="flex items-center">
                        <CarOutlined className="mr-2" />
                        <span className="font-medium">{vehicle.licensePlateNumber}</span>
                        <span className="text-gray-500 mx-2">-</span>
                        <span>{vehicle.manufacturer} {vehicle.model}</span>
                        {(vehicle.vehicleTypeDescription || vehicle.vehicleTypeName) && (
                            <span className="text-gray-500 mx-2">
                                ({vehicle.vehicleTypeDescription ?? vehicle.vehicleTypeName})
                            </span>
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
                        <span className="font-medium">{vehicle.vehicleTypeDescription ?? vehicle.vehicleTypeName ?? "Không có thông tin"}</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderDriverOptions = (vehicleId: string) => {
        const { driverIds } = getAssignedResourceIds();
        const groupSuggestions = suggestionsMap[currentTripIndex] || [];
        const selectedVehicle = groupSuggestions.find(v => v.id === vehicleId);
        if (!selectedVehicle) return [];

        return selectedVehicle.suggestedDrivers
            .filter(driver => 
                !driverIds.has(driver.id) &&           // Not in other trips
                driver.id !== selectedDriver2           // Not selected as driver 2
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
        const { driverIds } = getAssignedResourceIds();
        const groupSuggestions = suggestionsMap[currentTripIndex] || [];
        const selectedVehicle = groupSuggestions.find(v => v.id === vehicleId);
        if (!selectedVehicle) return [];

        return selectedVehicle.suggestedDrivers
            .filter(driver => 
                driver.id !== currentDriverId &&        // Not the current driver (driver 1)
                driver.id !== selectedDriver1 &&        // Not selected as driver 1
                !driverIds.has(driver.id)               // Not in other trips
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

    const renderVehicleAssignmentForm = (trip: TripAssignment) => {
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
                                        dependencies={['driverId_2']}
                                        rules={[{ required: true, message: "Vui lòng chọn tài xế chính" }]}
                                        className="mb-2"
                                    >
                                        <Select
                                            placeholder="Chọn tài xế chính"
                                            className="w-full"
                                            showSearch
                                            optionFilterProp="children"
                                            disabled={!currentVehicleId}
                                            size="small"
                                            onChange={(value: string) => {
                                                setSelectedDriver1(value);
                                                // If driver 2 is same as new driver 1, clear it
                                                if (selectedDriver2 === value) {
                                                    form.setFieldValue('driverId_2', undefined);
                                                    setSelectedDriver2(undefined);
                                                }
                                            }}
                                            notFoundContent={
                                                <div className="p-2 text-gray-400 text-center">
                                                    Không có tài xế phù hợp
                                                </div>
                                            }
                                        >
                                            {currentVehicleId && renderDriverOptions(currentVehicleId)}
                                        </Select>
                                    </Form.Item>
                                    
                                    <div className="mt-2">
                                        <Tooltip title="Nhập số điện thoại để chỉ định tài xế cụ thể">
                                            <Space.Compact className="w-full" size="small">
                                                <Input
                                                    placeholder="Nhập SĐT tài xế (nếu muốn chỉ định)"
                                                    value={manualDriver1Phone}
                                                    onChange={(e) => setManualDriver1Phone(e.target.value)}
                                                    prefix={<PhoneOutlined />}
                                                    disabled={!currentVehicleId || searchingDriver}
                                                    size="small"
                                                    onPressEnter={() => handleSearchDriverByPhone(manualDriver1Phone, 'driverId_1')}
                                                />
                                                <Button
                                                    type="primary"
                                                    icon={<SearchOutlined />}
                                                    onClick={() => handleSearchDriverByPhone(manualDriver1Phone, 'driverId_1')}
                                                    disabled={!currentVehicleId || searchingDriver}
                                                    loading={searchingDriver}
                                                    size="small"
                                                >
                                                    Tìm
                                                </Button>
                                            </Space.Compact>
                                        </Tooltip>
                                    </div>
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
                                        dependencies={['driverId_1']}
                                        rules={[{ required: true, message: "Vui lòng chọn tài xế phụ" }]}
                                        className="mb-2"
                                    >
                                        <Select
                                            placeholder="Chọn tài xế phụ"
                                            className="w-full"
                                            showSearch
                                            optionFilterProp="children"
                                            disabled={!currentVehicleId || !currentDrivers.driver1}
                                            size="small"
                                            onChange={(value: string) => {
                                                setSelectedDriver2(value);
                                            }}
                                            notFoundContent={
                                                <div className="p-2 text-gray-400 text-center">
                                                    {!currentDrivers.driver1 
                                                        ? "Vui lòng chọn tài xế chính trước"
                                                        : "Không có tài xế phù hợp"}
                                                </div>
                                            }
                                        >
                                            {currentVehicleId && currentDrivers.driver1 &&
                                                getFilteredDriverOptions(currentVehicleId, currentDrivers.driver1)}
                                        </Select>
                                    </Form.Item>
                                    
                                    <div className="mt-2">
                                        <Tooltip title="Nhập số điện thoại để chỉ định tài xế cụ thể">
                                            <Space.Compact className="w-full" size="small">
                                                <Input
                                                    placeholder="Nhập SĐT tài xế (nếu muốn chỉ định)"
                                                    value={manualDriver2Phone}
                                                    onChange={(e) => setManualDriver2Phone(e.target.value)}
                                                    prefix={<PhoneOutlined />}
                                                    disabled={!currentVehicleId || !currentDrivers.driver1 || searchingDriver}
                                                    size="small"
                                                    onPressEnter={() => handleSearchDriverByPhone(manualDriver2Phone, 'driverId_2')}
                                                />
                                                <Button
                                                    type="primary"
                                                    icon={<SearchOutlined />}
                                                    onClick={() => handleSearchDriverByPhone(manualDriver2Phone, 'driverId_2')}
                                                    disabled={!currentVehicleId || !currentDrivers.driver1 || searchingDriver}
                                                    loading={searchingDriver}
                                                    size="small"
                                                >
                                                    Tìm
                                                </Button>
                                            </Space.Compact>
                                        </Tooltip>
                                    </div>
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

        const newVehicle = {
            id: `temp-${Date.now()}`,
            licensePlateNumber: "",
            model: "",
            manufacturer: "",
            vehicleTypeId: "",
            year: 2023,
            status: 'ACTIVE' as const
        };

        return (
            <RoutePlanningStep
                orderId={orderId}
                vehicleId={trip.vehicleId}
                vehicle={newVehicle}
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
            ) : showConfirmation ? (
                <TripConfirmationModal
                    visible={showConfirmation}
                    tripAssignments={tripAssignments}
                    suggestionsMap={suggestionsMap}
                    onConfirm={handleConfirmAssignments}
                    onBack={handleBackFromConfirmation}
                />
            ) : (
                renderStepContent()
            )}
        </Modal>
    );
};

export default VehicleAssignmentModal;