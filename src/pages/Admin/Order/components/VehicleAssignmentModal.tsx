import React, { useState, useEffect } from "react";
import { Modal, Form, Select, Input, Button, Tabs, Card, Row, Col, Tag, Tooltip, App, Spin, Empty, Divider, Skeleton } from "antd";
import { CarOutlined, UserOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, FileTextOutlined, BoxPlotOutlined } from "@ant-design/icons";
import type { VehicleSuggestion, SuggestedDriver, VehicleAssignmentSuggestionData, CreateVehicleAssignmentForDetailsRequest } from "../../../../models/VehicleAssignment";
import { vehicleAssignmentService } from "../../../../services/vehicle-assignment/vehicleAssignmentService";

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

interface VehicleAssignmentModalProps {
    visible: boolean;
    orderId: string;
    orderDetails: any[]; // Replace with proper type
    onClose: () => void;
    onSuccess: () => void;
}

interface AssignmentFormData {
    [detailId: string]: {
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
    const [suggestions, setSuggestions] = useState<VehicleAssignmentSuggestionData | null>(null);
    const [activeTab, setActiveTab] = useState<string>("0");
    const messageApi = App.useApp().message;
    const [selectedVehicles, setSelectedVehicles] = useState<Record<string, string>>({});
    const [selectedDrivers, setSelectedDrivers] = useState<Record<string, { driver1: string; driver2: string }>>({});
    const [suggestionsMap, setSuggestionsMap] = useState<Record<string, VehicleSuggestion[]>>({});

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
        }
    }, [visible, orderId]);

    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            console.log("Fetching suggestions for order ID:", orderId);
            const response = await vehicleAssignmentService.getSuggestionsForOrderDetails(orderId);
            console.log("Received suggestions response:", response);

            if (!response || !response.data) {
                console.error("Invalid response format:", response);
                messageApi.error("Dữ liệu phân công xe không hợp lệ");
                setSuggestions(null);
                setLoading(false);
                return;
            }

            // Extract the actual suggestions data
            const suggestionsData = response.data;
            console.log("Extracted suggestions data:", suggestionsData);
            setSuggestions(suggestionsData);

            // Create a map of suggestions by detail ID or tracking code
            let suggestionsByKey: Record<string, VehicleSuggestion[]> = {};

            if (suggestionsData.suggestionsByDetailId) {
                suggestionsByKey = suggestionsData.suggestionsByDetailId;
                console.log("Using suggestionsByDetailId");
            } else if (suggestionsData.suggestionsByTrackingCode) {
                suggestionsByKey = suggestionsData.suggestionsByTrackingCode;
                console.log("Using suggestionsByTrackingCode");
            } else {
                console.error("No suggestions found in response");
                messageApi.error("Không tìm thấy gợi ý phân công xe");
                setLoading(false);
                return;
            }

            setSuggestionsMap(suggestionsByKey);

            // Pre-fill form with recommended options
            const initialValues: AssignmentFormData = {};
            const initialSelectedVehicles: Record<string, string> = {};
            const initialSelectedDrivers: Record<string, { driver1: string; driver2: string }> = {};

            // Match order details with suggestions
            orderDetails.forEach(detail => {
                const detailId = detail.id;
                const trackingCode = detail.trackingCode;

                // Try to find suggestions by detail ID or tracking code
                const vehicleSuggestions = suggestionsByKey[detailId] || suggestionsByKey[trackingCode];

                if (vehicleSuggestions && vehicleSuggestions.length > 0) {
                    console.log(`Found suggestions for detail ${detailId} / tracking code ${trackingCode}`);

                    const recommendedVehicle = vehicleSuggestions.find(v => v.isRecommended);

                    if (recommendedVehicle) {
                        console.log("Found recommended vehicle:", recommendedVehicle);
                        const recommendedDrivers = recommendedVehicle.suggestedDrivers
                            .filter(d => d.isRecommended)
                            .slice(0, 2);

                        // Ensure we have at least two drivers
                        if (recommendedDrivers.length >= 2) {
                            initialValues[detailId] = {
                                vehicleId: recommendedVehicle.id,
                                driverId_1: recommendedDrivers[0].id,
                                driverId_2: recommendedDrivers[1].id,
                                description: ''
                            };

                            // Store selected vehicles and drivers for rendering
                            initialSelectedVehicles[detailId] = recommendedVehicle.id;
                            initialSelectedDrivers[detailId] = {
                                driver1: recommendedDrivers[0].id,
                                driver2: recommendedDrivers[1].id
                            };
                        } else if (recommendedDrivers.length === 1 && recommendedVehicle.suggestedDrivers.length >= 2) {
                            // If we only have one recommended driver but there are others available
                            const secondDriver = recommendedVehicle.suggestedDrivers.find(d => d.id !== recommendedDrivers[0].id);

                            if (secondDriver) {
                                initialValues[detailId] = {
                                    vehicleId: recommendedVehicle.id,
                                    driverId_1: recommendedDrivers[0].id,
                                    driverId_2: secondDriver.id,
                                    description: ''
                                };

                                // Store selected vehicles and drivers for rendering
                                initialSelectedVehicles[detailId] = recommendedVehicle.id;
                                initialSelectedDrivers[detailId] = {
                                    driver1: recommendedDrivers[0].id,
                                    driver2: secondDriver.id
                                };
                            }
                        }
                    }
                } else {
                    console.log(`No suggestions found for detail ${detailId} / tracking code ${trackingCode}`);
                }
            });

            console.log("Setting initial form values:", initialValues);
            setSelectedVehicles(initialSelectedVehicles);
            setSelectedDrivers(initialSelectedDrivers);
            form.setFieldsValue(initialValues);
        } catch (error) {
            console.error("Error fetching vehicle assignment suggestions:", error);
            messageApi.error("Không thể tải gợi ý phân công xe");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            // Format the request according to the required structure
            const assignments: Record<string, any> = {};

            // Convert the form values to the expected API format
            Object.entries(values).forEach(([detailId, detailData]: [string, any]) => {
                assignments[detailId] = {
                    vehicleId: detailData.vehicleId,
                    driverId_1: detailData.driverId_1,
                    driverId_2: detailData.driverId_2,
                    description: detailData.description || ""
                };
            });

            const request: CreateVehicleAssignmentForDetailsRequest = {
                assignments: assignments
            };

            // Debug log to show the final request structure
            console.log("Final assignment request structure:", JSON.stringify(request, null, 2));

            await vehicleAssignmentService.createAndAssignForDetails(request);
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

    const handleVehicleChange = (detailId: string, vehicleId: string) => {
        console.log(`Vehicle changed for detail ${detailId}: ${vehicleId}`);
        setSelectedVehicles(prev => ({ ...prev, [detailId]: vehicleId }));

        // Get vehicle suggestions for this detail
        const vehicleSuggestions = getSuggestionsForDetail({ id: detailId });
        if (!vehicleSuggestions || vehicleSuggestions.length === 0) {
            console.log("No vehicle suggestions found for auto-fill drivers");
            return;
        }

        // Find the selected vehicle
        const selectedVehicle = vehicleSuggestions.find(v => v.id === vehicleId);
        if (!selectedVehicle) {
            console.log("Selected vehicle not found in suggestions");
            return;
        }

        // Get available drivers for this vehicle
        const availableDrivers = selectedVehicle.suggestedDrivers;
        if (!availableDrivers || availableDrivers.length < 2) {
            console.log("Not enough drivers available for auto-fill");

            // Reset driver selections when vehicle changes
            form.setFieldsValue({
                [detailId]: {
                    ...form.getFieldValue(detailId),
                    driverId_1: undefined,
                    driverId_2: undefined
                }
            });

            setSelectedDrivers(prev => ({
                ...prev,
                [detailId]: { driver1: '', driver2: '' }
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
                console.log("Could not find suitable driver2");
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
                console.log("Not enough drivers available after sorting");
                return;
            }
        }

        if (!driver1 || !driver2) {
            console.log("Failed to select two drivers");
            return;
        }

        // Update form with selected drivers
        form.setFieldsValue({
            [detailId]: {
                ...form.getFieldValue(detailId),
                driverId_1: driver1.id,
                driverId_2: driver2.id
            }
        });

        // Update selected drivers state
        setSelectedDrivers(prev => ({
            ...prev,
            [detailId]: { driver1: driver1.id, driver2: driver2.id }
        }));

        console.log(`Auto-filled drivers for detail ${detailId}: Driver1=${driver1.fullName}, Driver2=${driver2.fullName}`);
    };

    const handleDriver1Change = (detailId: string, driverId: string) => {
        console.log(`Driver 1 changed for detail ${detailId}: ${driverId}`);
        setSelectedDrivers(prev => ({
            ...prev,
            [detailId]: { ...prev[detailId], driver1: driverId }
        }));

        // If driver 1 is the same as driver 2, reset driver 2
        const currentDriver2 = form.getFieldValue([detailId, "driverId_2"]);
        if (currentDriver2 === driverId) {
            form.setFieldsValue({
                [detailId]: {
                    ...form.getFieldValue(detailId),
                    driverId_2: undefined
                }
            });

            setSelectedDrivers(prev => ({
                ...prev,
                [detailId]: { ...prev[detailId], driver2: '' }
            }));
        }
    };

    const handleDriver2Change = (detailId: string, driverId: string) => {
        console.log(`Driver 2 changed for detail ${detailId}: ${driverId}`);
        setSelectedDrivers(prev => ({
            ...prev,
            [detailId]: { ...prev[detailId], driver2: driverId }
        }));
    };

    // Get suggestions for a detail by ID or tracking code
    const getSuggestionsForDetail = (detail: any): VehicleSuggestion[] => {
        if (!suggestionsMap) return [];

        // Try to find suggestions by detail ID or tracking code
        return suggestionsMap[detail.id] || suggestionsMap[detail.trackingCode] || [];
    };

    const renderVehicleOptions = (detail: any) => {
        const vehicleSuggestions = getSuggestionsForDetail(detail);

        if (!vehicleSuggestions || vehicleSuggestions.length === 0) {
            console.log(`No vehicle suggestions found for detail ID ${detail.id} / tracking code ${detail.trackingCode}`);
            return [];
        }

        console.log(`Rendering ${vehicleSuggestions.length} vehicle options for detail`);
        return vehicleSuggestions.map(vehicle => (
            <Option key={vehicle.id} value={vehicle.id}>
                <div className="flex items-center">
                    <CarOutlined className="mr-2" />
                    <span className="font-medium">{vehicle.licensePlateNumber}</span>
                    <span className="text-gray-500 mx-2">-</span>
                    <span>{vehicle.manufacturer} {vehicle.model}</span>
                    {vehicle.isRecommended && (
                        <Tag color="green" className="ml-2">
                            <CheckCircleOutlined /> Đề xuất
                        </Tag>
                    )}
                </div>
            </Option>
        ));
    };

    const getVehicleInfo = (detail: any, vehicleId: string) => {
        const vehicleSuggestions = getSuggestionsForDetail(detail);
        if (!vehicleSuggestions || vehicleSuggestions.length === 0) return null;

        const vehicle = vehicleSuggestions.find(v => v.id === vehicleId);
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
                        <span className="text-gray-500">Số tài xế:</span>
                        <span className="font-medium">{vehicle.suggestedDrivers.length}</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderDriverOptions = (detail: any, vehicleId: string) => {
        const vehicleSuggestions = getSuggestionsForDetail(detail);
        if (!vehicleSuggestions || vehicleSuggestions.length === 0) return [];

        const selectedVehicle = vehicleSuggestions.find(v => v.id === vehicleId);
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

    const renderDriverDetails = (detail: any, vehicleId: string, driverId: string) => {
        const vehicleSuggestions = getSuggestionsForDetail(detail);
        if (!vehicleSuggestions || vehicleSuggestions.length === 0) return null;

        const selectedVehicle = vehicleSuggestions.find(v => v.id === vehicleId);
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

    const getFilteredDriverOptions = (detail: any, vehicleId: string, currentDriverId: string) => {
        const vehicleSuggestions = getSuggestionsForDetail(detail);
        if (!vehicleSuggestions || vehicleSuggestions.length === 0) return [];

        const selectedVehicle = vehicleSuggestions.find(v => v.id === vehicleId);
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

    const renderDetailForm = (detail: any, index: number) => {
        const detailId = detail.id;
        console.log(`Rendering detail form for detail ${detailId}, index ${index}, tracking code ${detail.trackingCode}`);
        const currentVehicleId = selectedVehicles[detailId];
        const currentDrivers = selectedDrivers[detailId] || { driver1: '', driver2: '' };

        return (
            <TabPane
                tab={
                    <span className="px-1 text-xs">
                        <FileTextOutlined className="mr-1" /> Chi tiết #{index + 1}
                        {detail.trackingCode &&
                            <Tag color="blue" className="ml-1 text-xs">{detail.trackingCode}</Tag>
                        }
                    </span>
                }
                key={index.toString()}
            >
                <div className="bg-gray-50 p-2 mb-3 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">
                        <InfoCircleOutlined className="mr-1" />
                        <span className="font-medium">Thông tin chi tiết:</span> {detail.description || "Không có mô tả"}
                    </div>
                    {detail.orderSize && (
                        <div className="text-xs text-gray-600">
                            <BoxPlotOutlined className="mr-1" />
                            <span className="font-medium">Kích thước:</span> {detail.orderSize.minLength} x {detail.orderSize.minWidth} x {detail.orderSize.minHeight} m
                        </div>
                    )}
                </div>

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
                                    name={[detailId, "vehicleId"]}
                                    rules={[{ required: true, message: "Vui lòng chọn xe" }]}
                                    className="mb-0"
                                >
                                    <Select
                                        placeholder="Chọn xe"
                                        className="w-full"
                                        showSearch
                                        optionFilterProp="children"
                                        onChange={(value) => handleVehicleChange(detailId, value as string)}
                                        size="small"
                                    >
                                        {renderVehicleOptions(detail)}
                                    </Select>
                                </Form.Item>
                            </div>

                            {currentVehicleId && getVehicleInfo(detail, currentVehicleId)}
                        </Col>

                        <Col span={12}>
                            <div className="bg-green-50 p-2 rounded-lg">
                                <h4 className="text-xs font-medium mb-2 flex items-center">
                                    <FileTextOutlined className="mr-1" />
                                    Ghi chú phân công
                                </h4>
                                <Form.Item
                                    name={[detailId, "description"]}
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
                                    name={[detailId, "driverId_1"]}
                                    rules={[{ required: true, message: "Vui lòng chọn tài xế chính" }]}
                                    dependencies={[[detailId, "vehicleId"]]}
                                    className="mb-0"
                                >
                                    <Select
                                        placeholder="Chọn tài xế chính"
                                        className="w-full"
                                        showSearch
                                        optionFilterProp="children"
                                        disabled={!currentVehicleId}
                                        onChange={(value) => handleDriver1Change(detailId, value as string)}
                                        size="small"
                                    >
                                        {currentVehicleId && renderDriverOptions(detail, currentVehicleId)}
                                    </Select>
                                </Form.Item>
                            </div>

                            {currentVehicleId && currentDrivers.driver1 &&
                                renderDriverDetails(detail, currentVehicleId, currentDrivers.driver1)
                            }
                        </Col>

                        <Col span={12}>
                            <div className="bg-purple-50 p-2 rounded-lg">
                                <h4 className="text-xs font-medium mb-2 flex items-center">
                                    <UserOutlined className="mr-1" />
                                    Tài xế 2 (phụ)
                                </h4>
                                <Form.Item
                                    name={[detailId, "driverId_2"]}
                                    rules={[{ required: true, message: "Vui lòng chọn tài xế phụ" }]}
                                    dependencies={[[detailId, "vehicleId"], [detailId, "driverId_1"]]}
                                    className="mb-0"
                                >
                                    <Select
                                        placeholder="Chọn tài xế phụ"
                                        className="w-full"
                                        showSearch
                                        optionFilterProp="children"
                                        disabled={!currentVehicleId || !currentDrivers.driver1}
                                        onChange={(value) => handleDriver2Change(detailId, value as string)}
                                        size="small"
                                    >
                                        {currentVehicleId && currentDrivers.driver1 &&
                                            getFilteredDriverOptions(detail, currentVehicleId, currentDrivers.driver1)}
                                    </Select>
                                </Form.Item>
                            </div>

                            {currentVehicleId && currentDrivers.driver1 && currentDrivers.driver2 &&
                                renderDriverDetails(detail, currentVehicleId, currentDrivers.driver2)
                            }
                        </Col>
                    </Row>
                </div>
            </TabPane>
        );
    };

    console.log("Modal render - suggestions:", suggestions);
    console.log("Modal render - orderDetails:", orderDetails);
    console.log("Modal render - selectedVehicles:", selectedVehicles);
    console.log("Modal render - selectedDrivers:", selectedDrivers);
    console.log("Modal render - suggestionsMap:", suggestionsMap);

    // Check if we have any suggestions
    const hasSuggestions = Object.keys(suggestionsMap).length > 0;

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
                <Button key="back" onClick={onClose} disabled={submitting}>
                    Hủy
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={submitting}
                    onClick={handleSubmit}
                    disabled={!hasSuggestions || loading}
                    className="bg-blue-500 hover:bg-blue-600"
                >
                    Phân công
                </Button>,
            ]}
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
                        onChange={setActiveTab}
                        type="card"
                        className="custom-assignment-tabs"
                        size="small"
                    >
                        {orderDetails.map((detail, index) => (
                            renderDetailForm(detail, index)
                        ))}
                    </Tabs>
                </Form>
            )}
        </Modal>
    );
};

export default VehicleAssignmentModal; 