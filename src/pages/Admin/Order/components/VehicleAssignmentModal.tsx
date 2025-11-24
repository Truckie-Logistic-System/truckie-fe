import React, { useState, useEffect } from "react";
import { Modal, Form, Select, Input, Button, Tabs, Card, Row, Col, Tag, Tooltip, App, Spin, Empty, Divider, Skeleton, Steps } from "antd";
import { CarOutlined, UserOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, FileTextOutlined, BoxPlotOutlined, EnvironmentOutlined, SafetyOutlined } from "@ant-design/icons";
import type { VehicleSuggestion, SuggestedDriver, CreateGroupedVehicleAssignmentsRequest, OrderDetailGroup, GroupedVehicleAssignmentSuggestionData, GroupAssignment, OrderDetailInfo, Seal } from "../../../../models/VehicleAssignment";
import { vehicleAssignmentService } from "../../../../services/vehicle-assignment/vehicleAssignmentService";
import { RoutePlanningStep } from "../../../Admin/VehicleAssignment/components";
import SealAssignmentStep from "./SealAssignmentStep";
import type { RouteSegment } from "../../../../models/RoutePoint";
import type { RouteInfo } from "../../../../models/VehicleAssignment";

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

interface VehicleAssignmentModalProps {
    visible: boolean;
    orderId: string;
    orderDetails: any[]; // Replace with proper type
    onClose: () => void;
    onSuccess: () => void;
}

interface AssignmentFormData {
    [groupIndex: string]: {
        vehicleId: string;
        driverId_1: string;
        driverId_2: string;
        description?: string;
    };
}

const VehicleAssignmentModal: React.FC<VehicleAssignmentModalProps> = ({
    visible,
    orderId,
    orderDetails,
    onClose,
    onSuccess,
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [suggestions, setSuggestions] = useState<GroupedVehicleAssignmentSuggestionData | null>(null);
    const [activeTab, setActiveTab] = useState<string>("0");
    const messageApi = App.useApp().message;
    const [selectedVehicles, setSelectedVehicles] = useState<Record<string, string>>({});
    const [selectedDrivers, setSelectedDrivers] = useState<Record<string, { driver1: string; driver2: string }>>({});
    const [detailGroups, setDetailGroups] = useState<OrderDetailGroup[]>([]);
    const [suggestionsMap, setSuggestionsMap] = useState<Record<string, VehicleSuggestion[]>>({});

    // State for three-step process
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([]);
    const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
    const [formValues, setFormValues] = useState<any>({});
    const [currentGroupIndex, setCurrentGroupIndex] = useState<string>("0");
    const [seals, setSeals] = useState<Seal[]>([]);

    // Fetch suggestions when modal opens
    useEffect(() => {
        if (visible && orderId) {
            fetchSuggestions();
        } else {
            // Reset form and selections when modal closes
            form.resetFields();
            setSelectedVehicles({});
            setSelectedDrivers({});
            setSuggestionsMap({});
            setCurrentStep(0);
            setRouteSegments([]);
            setRouteInfo(null);
            setSeals([]);
        }
    }, [visible, orderId]);

    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            
            const response = await vehicleAssignmentService.getGroupedSuggestionsForOrderDetails(orderId);
            

            if (!response || !response.data) {
                console.error("Invalid response format:", response);
                messageApi.error("Dữ liệu phân công xe không hợp lệ");
                setSuggestions(null);
                setLoading(false);
                return;
            }

            // Extract the actual suggestions data
            const suggestionsData = response.data;
            setSuggestions(suggestionsData);

            // Store the detail groups
            const groups = suggestionsData.groups || [];
            setDetailGroups(groups);

            // Create a map of vehicles by group index
            let newSuggestionsMap: Record<string, VehicleSuggestion[]> = {};

            groups.forEach((group: OrderDetailGroup, index: number) => {
                newSuggestionsMap[index.toString()] = group.suggestedVehicles || [];
            });

            setSuggestionsMap(newSuggestionsMap);

            // Pre-fill form with recommended options
            const initialValues: AssignmentFormData = {};
            const initialSelectedVehicles: Record<string, string> = {};
            const initialSelectedDrivers: Record<string, { driver1: string; driver2: string }> = {};

            // Process each group
            groups.forEach((group: OrderDetailGroup, groupIndex: number) => {
                const groupKey = groupIndex.toString();
                const vehicles = group.suggestedVehicles || [];

                // Find recommended vehicle
                const recommendedVehicle = vehicles.find((v: VehicleSuggestion) => v.isRecommended);

                if (recommendedVehicle) {
                    const recommendedDrivers = recommendedVehicle.suggestedDrivers
                        .filter((d: SuggestedDriver) => d.isRecommended)
                        .slice(0, 2);

                    // Ensure we have at least two drivers
                    if (recommendedDrivers.length >= 2) {
                        initialValues[groupKey] = {
                            vehicleId: recommendedVehicle.id,
                            driverId_1: recommendedDrivers[0].id,
                            driverId_2: recommendedDrivers[1].id,
                            description: ''
                        };

                        // Store selected vehicles and drivers for rendering
                        initialSelectedVehicles[groupKey] = recommendedVehicle.id;
                        initialSelectedDrivers[groupKey] = {
                            driver1: recommendedDrivers[0].id,
                            driver2: recommendedDrivers[1].id
                        };
                    } else if (recommendedDrivers.length === 1 && recommendedVehicle.suggestedDrivers.length >= 2) {
                        // If we only have one recommended driver but there are others available
                        const secondDriver = recommendedVehicle.suggestedDrivers.find(d => d.id !== recommendedDrivers[0].id);

                        if (secondDriver) {
                            initialValues[groupKey] = {
                                vehicleId: recommendedVehicle.id,
                                driverId_1: recommendedDrivers[0].id,
                                driverId_2: secondDriver.id,
                                description: ''
                            };

                            // Store selected vehicles and drivers for rendering
                            initialSelectedVehicles[groupKey] = recommendedVehicle.id;
                            initialSelectedDrivers[groupKey] = {
                                driver1: recommendedDrivers[0].id,
                                driver2: secondDriver.id
                            };
                        }
                    }
                } else if (vehicles.length > 0) {
                    // If no recommended vehicle, use the first one
                    const firstVehicle = vehicles[0];
                    const availableDrivers = firstVehicle.suggestedDrivers || [];

                    if (availableDrivers.length >= 2) {
                        initialValues[groupKey] = {
                            vehicleId: firstVehicle.id,
                            driverId_1: availableDrivers[0].id,
                            driverId_2: availableDrivers[1].id,
                            description: ''
                        };

                        initialSelectedVehicles[groupKey] = firstVehicle.id;
                        initialSelectedDrivers[groupKey] = {
                            driver1: availableDrivers[0].id,
                            driver2: availableDrivers[1].id
                        };
                    }
                }
            });

            setSelectedVehicles(initialSelectedVehicles);
            setSelectedDrivers(initialSelectedDrivers);
            form.setFieldsValue(initialValues);
        } catch (error) {
            messageApi.error("Không thể tải gợi ý phân công xe");
        } finally {
            setLoading(false);
        }
    };

    const handleNextStep = async () => {
        try {
            const values = await form.validateFields();
            setFormValues(values);
            setCurrentStep(1);
        } catch (error) {
            messageApi.error("Không thể tải gợi ý phân công xe");
        }
    };

    const handlePreviousStep = () => {
        // Quay lại step 0 - KHÔNG submit
        setCurrentStep(0);
    };

    const handleRouteComplete = (segments: RouteSegment[], routeInfoData: RouteInfo) => {
        setRouteSegments(segments);
        setRouteInfo(routeInfoData);
        
        // ============================================================
        // STEP 2: CHỈ CHUYỂN SANG BƯỚC GÁN SEAL - KHÔNG SUBMIT
        // ============================================================
        setCurrentStep(2);
    };

    const handleSealComplete = (assignedSeals: Seal[]) => {
        setSeals(assignedSeals);
        
        // ============================================================
        // STEP 3: ĐÂY LÀ NƠI DUY NHẤT SUBMIT - SAU KHI HOÀN THÀNH GÁN SEAL
        // ============================================================
        handleSubmitWithRouteAndSeals(routeSegments, routeInfo!, assignedSeals);
    };

    const handleSealBack = () => {
        // Quay lại step 1 (định tuyến) - KHÔNG submit
        setCurrentStep(1);
    };

    const handleSubmitWithRouteAndSeals = async (segments: RouteSegment[], routeInfoData: RouteInfo, assignedSeals: Seal[]) => {
        try {
            setSubmitting(true);

            // Format the request according to the required structure
            const groupAssignments: GroupAssignment[] = [];

            // Ensure the route info has all required fields
            const completeRouteInfo: RouteInfo = {
                segments: routeInfoData.segments.map(segment => ({
                    ...segment,
                    // Ensure each segment has tollDetails properly formatted
                    tollDetails: segment.tollDetails?.map(toll => ({
                        name: toll.name || '',
                        address: toll.address || '',
                        type: toll.type || '',
                        amount: toll.amount || 0
                    })) || [],
                    // Ensure rawResponse is included
                    rawResponse: segment.rawResponse || {}
                })),
                totalTollFee: routeInfoData.totalTollFee || 0,
                totalTollCount: routeInfoData.totalTollCount || 0,
                totalDistance: routeInfoData.totalDistance || 0
            };

            // Convert the form values to the expected API format
            Object.entries(formValues).forEach(([groupKey, groupData]: [string, any]) => {
                const groupIndex = parseInt(groupKey);
                const group = detailGroups[groupIndex];

                if (group && group.orderDetails) {
                    groupAssignments.push({
                        orderDetailIds: group.orderDetails.map((detail: OrderDetailInfo) => detail.id),
                        vehicleId: groupData.vehicleId,
                        driverId_1: groupData.driverId_1,
                        driverId_2: groupData.driverId_2,
                        description: groupData.description || "",
                        routeInfo: completeRouteInfo, // Add complete route info to the assignment
                        seals: assignedSeals.length > 0 ? assignedSeals : undefined // Add seals if any
                    });
                }
            });

            const request: CreateGroupedVehicleAssignmentsRequest = {
                groupAssignments: groupAssignments
            };

            // Call single API to create assignments with route info
            await vehicleAssignmentService.createGroupedAssignments(request);
            messageApi.success("Phân công xe thành công");
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error assigning vehicles:", error);
            messageApi.error("Không thể phân công xe");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setFormValues(values);

            // ============================================================
            // STEP 1: CHỈ CHUYỂN SANG BƯỚC ĐỊNH TUYẾN - KHÔNG SUBMIT
            // ============================================================
            setCurrentStep(1);
        } catch (error) {
            console.error("Error assigning vehicles:", error);
            messageApi.error("Vui lòng điền đầy đủ thông tin phân công xe");
        }
    };

    const handleVehicleChange = (groupKey: string, vehicleId: string) => {
        setSelectedVehicles(prev => ({ ...prev, [groupKey]: vehicleId }));

        // Get vehicle suggestions for this group
        const groupSuggestions = getSuggestionsForGroup(groupKey);
        if (!groupSuggestions || groupSuggestions.length === 0) {
            return;
        }

        const selectedVehicle = groupSuggestions.find(v => v.id === vehicleId);
        if (!selectedVehicle) {
            return;
        }

        const availableDrivers = selectedVehicle.suggestedDrivers;
        if (!availableDrivers || availableDrivers.length < 2) {
            // Reset driver selections when vehicle changes
            form.setFieldsValue({
                [groupKey]: {
                    ...form.getFieldValue(groupKey),
                    driverId_1: undefined,
                    driverId_2: undefined
                }
            });

            setSelectedDrivers(prev => ({
                ...prev,
                [groupKey]: { driver1: '', driver2: '' }
            }));

            return;
        }

        // Find recommended drivers first
        const recommendedDrivers = availableDrivers.filter(d => d.isRecommended);

        let driver1: SuggestedDriver | undefined;
        let driver2: SuggestedDriver | undefined;

        if (recommendedDrivers.length >= 2) {
            // If we have at least 2 recommended drivers, use them
            driver1 = recommendedDrivers[0];
            driver2 = recommendedDrivers[1];
        } else if (recommendedDrivers.length === 1) {
            // If we have only 1 recommended driver, use it as driver1
            // and find the most suitable driver2
            driver1 = recommendedDrivers[0];

            // Sort remaining drivers by experience (or any other criteria)
            const otherDrivers = availableDrivers.filter(d => {
                // Make sure driver1 is defined before using it
                return driver1 && d.id !== driver1.id;
            }).sort((a, b) => {
                // Sort by experience if available, otherwise by completedTripsCount
                const expA = typeof a.experienceYears === 'number' ? a.experienceYears : 0;
                const expB = typeof b.experienceYears === 'number' ? b.experienceYears : 0;

                if (expA !== expB) {
                    return expB - expA; // Sort by experience (higher first)
                }

                const tripsA = typeof a.completedTripsCount === 'number' ? a.completedTripsCount : 0;
                const tripsB = typeof b.completedTripsCount === 'number' ? b.completedTripsCount : 0;

                return tripsB - tripsA; // Sort by completed trips (higher first)
            });

            if (otherDrivers.length > 0) {
                driver2 = otherDrivers[0];
            } else {
                return;
            }
        } else {
            // No recommended drivers, sort all drivers by experience
            const sortedDrivers = [...availableDrivers].sort((a, b) => {
                // Sort by experience if available, otherwise by completedTripsCount
                const expA = typeof a.experienceYears === 'number' ? a.experienceYears : 0;
                const expB = typeof b.experienceYears === 'number' ? b.experienceYears : 0;

                if (expA !== expB) {
                    return expB - expA; // Sort by experience (higher first)
                }

                const tripsA = typeof a.completedTripsCount === 'number' ? a.completedTripsCount : 0;
                const tripsB = typeof b.completedTripsCount === 'number' ? b.completedTripsCount : 0;

                return tripsB - tripsA; // Sort by completed trips (higher first)
            });

            if (sortedDrivers.length >= 2) {
                driver1 = sortedDrivers[0];
                driver2 = sortedDrivers[1];
            } else {
                return;
            }
        }

        if (!driver1 || !driver2) {
            return;
        }

        // Update form with selected drivers
        form.setFieldsValue({
            [groupKey]: {
                ...form.getFieldValue(groupKey),
                driverId_1: driver1.id,
                driverId_2: driver2.id
            }
        });

        // Update selected drivers state
        setSelectedDrivers(prev => ({
            ...prev,
            [groupKey]: { driver1: driver1.id, driver2: driver2.id }
        }));
    };

    const handleDriver1Change = (groupKey: string, driverId: string) => {
        setSelectedDrivers(prev => ({
            ...prev,
            [groupKey]: { ...prev[groupKey], driver1: driverId }
        }));

        // If driver 1 is the same as driver 2, reset driver 2
        const currentDriver2 = form.getFieldValue([groupKey, "driverId_2"]);
        if (currentDriver2 === driverId) {
            form.setFieldsValue({
                [groupKey]: {
                    ...form.getFieldValue(groupKey),
                    driverId_2: undefined
                }
            });

            setSelectedDrivers(prev => ({
                ...prev,
                [groupKey]: { ...prev[groupKey], driver2: '' }
            }));
        }
    };

    const handleDriver2Change = (groupKey: string, driverId: string) => {
        setSelectedDrivers(prev => ({
            ...prev,
            [groupKey]: { ...prev[groupKey], driver2: driverId }
        }));
    };

    // Get suggestions for a group by index
    const getSuggestionsForGroup = (groupKey: string): VehicleSuggestion[] => {
        if (!suggestionsMap) return [];

        // Try to find suggestions by group index
        return suggestionsMap[groupKey] || [];
    };

    const renderVehicleOptions = (groupKey: string) => {
        const groupSuggestions = getSuggestionsForGroup(groupKey);

        if (!groupSuggestions || groupSuggestions.length === 0) {
            return [];
        }

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
                    {vehicle.isRecommended && (
                        <Tag color="green" className="ml-2">
                            <CheckCircleOutlined /> Đề xuất
                        </Tag>
                    )}
                </div>
            </Option>
        ));
    };

    const getVehicleInfo = (groupKey: string, vehicleId: string) => {
        const groupSuggestions = getSuggestionsForGroup(groupKey);
        if (!groupSuggestions || groupSuggestions.length === 0) return null;

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
                    {vehicle.isRecommended && (
                        <Tag color="green" className="ml-auto text-xs">
                            <CheckCircleOutlined /> Đề xuất
                        </Tag>
                    )}
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

    const renderDriverOptions = (groupKey: string, vehicleId: string) => {
        const groupSuggestions = getSuggestionsForGroup(groupKey);
        if (!groupSuggestions || groupSuggestions.length === 0) return [];

        const selectedVehicle = groupSuggestions.find(v => v.id === vehicleId);
        if (!selectedVehicle) return [];

        return selectedVehicle.suggestedDrivers.map(driver => (
            <Option key={driver.id} value={driver.id}>
                <div className="flex items-center">
                    <UserOutlined className="mr-2" />
                    <span className="font-medium">{driver.fullName}</span>
                    <span className="text-gray-500 mx-2">-</span>
                    <span>Bằng {driver.licenseClass}</span>
                    {driver.isRecommended && (
                        <Tag color="green" className="ml-2">
                            <CheckCircleOutlined /> Đề xuất
                        </Tag>
                    )}
                </div>
            </Option>
        ));
    };

    const renderDriverDetails = (groupKey: string, vehicleId: string, driverId: string) => {
        const groupSuggestions = getSuggestionsForGroup(groupKey);
        if (!groupSuggestions || groupSuggestions.length === 0) return null;

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
                    {selectedDriver.isRecommended && (
                        <Tag color="green" className="text-xxs">
                            <CheckCircleOutlined /> Đề xuất
                        </Tag>
                    )}
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

    const getFilteredDriverOptions = (groupKey: string, vehicleId: string, currentDriverId: string) => {
        const groupSuggestions = getSuggestionsForGroup(groupKey);
        if (!groupSuggestions || groupSuggestions.length === 0) return [];

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
                        {driver.isRecommended && (
                            <Tag color="green" className="ml-2">
                                <CheckCircleOutlined /> Đề xuất
                            </Tag>
                        )}
                    </div>
                </Option>
            ));
    };

    const renderDetailForm = (group: OrderDetailGroup, groupIndex: number) => {
        const groupKey = groupIndex.toString();
        const currentVehicleId = selectedVehicles[groupKey];
        const currentDrivers = selectedDrivers[groupKey] || { driver1: '', driver2: '' };

        const firstDetail = group.orderDetails && group.orderDetails.length > 0
            ? group.orderDetails[0]
            : null;

        // Count how many details are in this group
        const detailCount = group.orderDetails?.length || 0;

        return (
            <TabPane
                tab={
                    <span className="px-1 text-xs">
                        <FileTextOutlined className="mr-1" /> Chuyến #{groupIndex + 1}
                        <Tag color="blue" className="ml-1 text-xs">{detailCount} kiện hàng</Tag>
                    </span>
                }
                key={groupIndex.toString()}
            >
                <div className="bg-gray-50 p-2 mb-3 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">
                        <InfoCircleOutlined className="mr-1" />
                        <span className="font-medium">Lý do nhóm:</span> {group.groupingReason || "Không có thông tin"}
                    </div>
                    <div className="text-xs text-gray-600">
                        <InfoCircleOutlined className="mr-1" />
                        <span className="font-medium">Số kiện hàng:</span> {detailCount}
                    </div>
                </div>

                {/* List of order details in this group */}
                {group.orderDetails && group.orderDetails.length > 0 && (
                    <div className="bg-blue-50 p-2 mb-3 rounded-lg border border-blue-200">
                        <div className="text-xs font-medium text-blue-700 mb-1">Các kiện hàng trong nhóm này:</div>
                        {group.orderDetails.map((detail, idx) => (
                            <div key={detail.id} className="text-xs mb-2 pl-2 border-l-2 border-blue-300">
                                <span className="font-medium">{idx + 1}. {detail.trackingCode}</span>
                                <div className="text-gray-500 text-xs">
                                    <div>Từ: {detail.originAddress}</div>
                                    <div>Đến: {detail.destinationAddress}</div>
                                    <div>
                                        {detail.totalWeight > 0 && <span className="mr-2">KL: {detail.totalWeight}kg</span>}
                                        {detail.totalVolume > 0 && <span>TT: {detail.totalVolume}m³</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

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
                                    name={[groupKey, "vehicleId"]}
                                    rules={[{ required: true, message: "Vui lòng chọn xe" }]}
                                    className="mb-0"
                                >
                                    <Select
                                        placeholder="Chọn xe"
                                        className="w-full"
                                        showSearch
                                        optionFilterProp="children"
                                        onChange={(value) => handleVehicleChange(groupKey, value as string)}
                                        size="small"
                                    >
                                        {renderVehicleOptions(groupKey)}
                                    </Select>
                                </Form.Item>
                            </div>

                            {currentVehicleId && getVehicleInfo(groupKey, currentVehicleId)}
                        </Col>

                        <Col span={12}>
                            <div className="bg-green-50 p-2 rounded-lg">
                                <h4 className="text-xs font-medium mb-2 flex items-center">
                                    <FileTextOutlined className="mr-1" />
                                    Ghi chú phân công
                                </h4>
                                <Form.Item
                                    name={[groupKey, "description"]}
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
                                    name={[groupKey, "driverId_1"]}
                                    rules={[{ required: true, message: "Vui lòng chọn tài xế chính" }]}
                                    dependencies={[[groupKey, "vehicleId"]]}
                                    className="mb-0"
                                >
                                    <Select
                                        placeholder="Chọn tài xế chính"
                                        className="w-full"
                                        showSearch
                                        optionFilterProp="children"
                                        disabled={!currentVehicleId}
                                        onChange={(value) => handleDriver1Change(groupKey, value as string)}
                                        size="small"
                                    >
                                        {currentVehicleId && renderDriverOptions(groupKey, currentVehicleId)}
                                    </Select>
                                </Form.Item>
                            </div>

                            {currentVehicleId && currentDrivers.driver1 &&
                                renderDriverDetails(groupKey, currentVehicleId, currentDrivers.driver1)
                            }
                        </Col>

                        <Col span={12}>
                            <div className="bg-purple-50 p-2 rounded-lg">
                                <h4 className="text-xs font-medium mb-2 flex items-center">
                                    <UserOutlined className="mr-1" />
                                    Tài xế 2 (phụ)
                                </h4>
                                <Form.Item
                                    name={[groupKey, "driverId_2"]}
                                    rules={[{ required: true, message: "Vui lòng chọn tài xế phụ" }]}
                                    dependencies={[[groupKey, "vehicleId"], [groupKey, "driverId_1"]]}
                                    className="mb-0"
                                >
                                    <Select
                                        placeholder="Chọn tài xế phụ"
                                        className="w-full"
                                        showSearch
                                        optionFilterProp="children"
                                        disabled={!currentVehicleId || !currentDrivers.driver1}
                                        onChange={(value) => handleDriver2Change(groupKey, value as string)}
                                        size="small"
                                    >
                                        {currentVehicleId && currentDrivers.driver1 &&
                                            getFilteredDriverOptions(groupKey, currentVehicleId, currentDrivers.driver1)}
                                    </Select>
                                </Form.Item>
                            </div>

                            {currentVehicleId && currentDrivers.driver1 && currentDrivers.driver2 &&
                                renderDriverDetails(groupKey, currentVehicleId, currentDrivers.driver2)
                            }
                        </Col>
                    </Row>
                </div>
            </TabPane>
        );
    };

    // Get the current selected vehicle for route planning
    const getCurrentSelectedVehicle = () => {
        const vehicleId = formValues[currentGroupIndex]?.vehicleId;
        if (!vehicleId) return undefined;

        const groupSuggestions = getSuggestionsForGroup(currentGroupIndex);
        if (!groupSuggestions) return undefined;

        return groupSuggestions.find(v => v.id === vehicleId);
    };

    // Render the content based on current step
    const renderStepContent = () => {
        if (currentStep === 0) {
            return (
                <Form form={form} layout="vertical" size="small">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg mb-4 border-l-4 border-blue-500">
                        <div className="flex items-start">
                            <InfoCircleOutlined className="text-blue-500 text-base mt-1 mr-2" />
                            <div className="text-xs text-blue-700">
                                <p className="font-medium mb-1">Lưu ý khi phân công:</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                    <li>Các xe và tài xế được đề xuất dựa trên tính khả dụng và phù hợp với đơn hàng</li>
                                    <li>Mỗi chuyến xe cần được phân công 1 xe và 2 tài xế</li>
                                    <li>Tài xế 1 và Tài xế 2 không được trùng nhau</li>
                                    <li>Các đề xuất có gắn thẻ <Tag color="green" className="text-xs ml-1 py-0"><CheckCircleOutlined /> Đề xuất</Tag> là lựa chọn tối ưu từ hệ thống</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <Tabs
                        activeKey={activeTab}
                        onChange={(key) => {
                            setActiveTab(key);
                            setCurrentGroupIndex(key);
                        }}
                        type="card"
                        className="custom-assignment-tabs"
                        size="small"
                    >
                        {detailGroups.map((group, index) => (
                            renderDetailForm(group, index)
                        ))}
                    </Tabs>
                </Form>
            );
        } else if (currentStep === 1) {
            // Get the current group's order details
            const currentGroup = detailGroups[parseInt(currentGroupIndex)];
            const currentVehicle = getCurrentSelectedVehicle();

            if (!currentGroup || !currentVehicle) {
                return <Empty description="Không tìm thấy thông tin nhóm hoặc xe đã chọn" />;
            }

            // Get the first order detail to use as the order ID for route planning
            const firstOrderDetail = currentGroup.orderDetails[0];
            if (!firstOrderDetail) {
                return <Empty description="Không tìm thấy thông tin đơn hàng" />;
            }

            // Create a vehicle object with all required fields
            const vehicleForRoute = {
                id: currentVehicle.id,
                licensePlateNumber: currentVehicle.licensePlateNumber,
                model: currentVehicle.model,
                manufacturer: currentVehicle.manufacturer,
                vehicleTypeId: currentVehicle.vehicleTypeId || '',
                year: 2023, // Default values for required fields
                capacity: 1000,
                status: 'ACTIVE'
            };

            return (
                <RoutePlanningStep
                    orderId={orderId} // Sử dụng OrderID từ props
                    vehicleId={currentVehicle.id}
                    vehicle={vehicleForRoute}
                    onComplete={handleRouteComplete}
                    onBack={handlePreviousStep}
                />
            );
        } else {
            // Step 2: Seal Assignment
            return (
                <SealAssignmentStep
                    onComplete={handleSealComplete}
                    onBack={handleSealBack}
                    initialSeals={seals}
                />
            );
        }
    };

    const hasSuggestions = detailGroups.length > 0;

    return (
        <Modal
            title={
                <div className="flex items-center">
                    <CarOutlined className="text-xl text-blue-500 mr-2" />
                    <span className="text-lg font-medium">Phân công xe và tài xế</span>
                </div>
            }
            open={visible}
            onCancel={onClose}
            width="95%"
            style={{ top: 10 }}
            bodyStyle={{ padding: '12px', maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}
            footer={[
                currentStep === 0 && <Button key="back" onClick={onClose} disabled={submitting}>
                    Hủy
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={submitting}
                    onClick={currentStep === 0 ? handleSubmit : undefined}
                    disabled={!hasSuggestions || loading || currentStep !== 0}
                    className="bg-blue-500 hover:bg-blue-600"
                >
                    {currentStep === 0 ? "Tiếp theo" : ""}
                </Button>,
            ].filter(Boolean)}
        >
            {loading ? (
                <div className="py-2">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg mb-4 border-l-4 border-blue-500">
                        <Skeleton active avatar paragraph={{ rows: 1 }} />
                    </div>

                    <Tabs type="card" className="custom-assignment-tabs" size="small">
                        <TabPane tab={<span className="px-1"><FileTextOutlined className="mr-1" /> Chi tiết #1</span>} key="0">
                            <div className="bg-gray-50 p-3 mb-3 rounded-lg border border-gray-200">
                                <Skeleton active paragraph={{ rows: 1 }} />
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                <Skeleton active title={{ width: '40%' }} paragraph={{ rows: 1 }} />

                                <Row gutter={[16, 12]} className="mt-3">
                                    <Col span={12}>
                                        <div className="bg-blue-50 p-3 rounded-lg">
                                            <Skeleton active title={{ width: '30%' }} paragraph={{ rows: 1 }} />
                                        </div>
                                        <div className="mt-3">
                                            <Skeleton active paragraph={{ rows: 1 }} />
                                        </div>
                                    </Col>
                                    <Col span={12}>
                                        <div className="bg-green-50 p-3 rounded-lg">
                                            <Skeleton active title={{ width: '30%' }} paragraph={{ rows: 1 }} />
                                        </div>
                                    </Col>
                                </Row>

                                <Divider className="my-3" />

                                <Skeleton active title={{ width: '40%' }} paragraph={{ rows: 0 }} />

                                <Row gutter={[16, 12]} className="mt-3">
                                    <Col span={12}>
                                        <div className="bg-orange-50 p-3 rounded-lg">
                                            <Skeleton active title={{ width: '30%' }} paragraph={{ rows: 1 }} />
                                        </div>
                                        <div className="mt-3">
                                            <Skeleton active paragraph={{ rows: 1 }} />
                                        </div>
                                    </Col>
                                    <Col span={12}>
                                        <div className="bg-purple-50 p-3 rounded-lg">
                                            <Skeleton active title={{ width: '30%' }} paragraph={{ rows: 1 }} />
                                        </div>
                                        <div className="mt-3">
                                            <Skeleton active paragraph={{ rows: 1 }} />
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                        </TabPane>
                    </Tabs>
                </div>
            ) : !hasSuggestions ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Không có gợi ý phân công xe nào cho đơn hàng này"
                />
            ) : (
                <div>
                    <Steps current={currentStep} className="mb-4">
                        <Step title="Thông tin phân công" icon={<CarOutlined />} />
                        <Step title="Định tuyến" icon={<EnvironmentOutlined />} />
                        <Step title="Gán Seal" icon={<SafetyOutlined />} />
                    </Steps>
                    {renderStepContent()}
                </div>
            )}
        </Modal>
    );
};

export default VehicleAssignmentModal; 