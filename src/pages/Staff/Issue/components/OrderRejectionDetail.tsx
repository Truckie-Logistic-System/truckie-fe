import React, { useState, useEffect, useCallback } from 'react';
import {
    Card,
    Button,
    Descriptions,
    InputNumber,
    message,
    Spin,
    Tag,
    Divider,
    Alert,
    Modal,
    Form,
    Select,
    Space,
    Typography,
    Statistic
} from 'antd';
import {
    DollarOutlined,
    PhoneOutlined,
    MailOutlined,
    UserOutlined,
    CheckCircleOutlined,
    ShareAltOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    WarningOutlined,
    InfoCircleOutlined,
    CreditCardOutlined
} from '@ant-design/icons';
import type { Issue } from '@/models/Issue';
import { TransactionStatusTag } from '@/components/common/tags';
import { TransactionEnum } from '@/constants/enums';
import issueService from '@/services/issue';
import { useVietMapRouting } from '@/hooks/useVietMapRouting';
import VietMapMap from '@/components/common/VietMapMap';
import type { MapLocation } from '@/models/Map';
import type { RouteSegment, RoutePoint, SuggestRouteRequest, RouteInfoFromAPI } from '@/models/RoutePoint';
import routeService from '@/services/route';
import ReturnRoutePlanning from './ReturnRoutePlanning';
import { issueWebSocket } from '@/services/websocket/issueWebSocket';

const { Title } = Typography;

interface OrderRejectionDetailProps {
    issue: Issue;
    onUpdate?: (issue: Issue) => void;
}

interface ReturnFeeInfo {
    issueId: string;
    calculatedFee: number;
    adjustedFee?: number;
    finalFee: number;
    distanceKm: number;
    fullJourneyPoints?: RoutePoint[];
}

interface OrderRejectionInfo {
    issueId: string;
    status: string;
    calculatedFee: number;
    adjustedFee?: number;
    finalFee: number;
    customerInfo?: {
        customerId: string;
        fullName: string;
        email: string;
        phoneNumber: string;
        company?: string;
        businessAddress?: string;
    };
    affectedOrderDetails: Array<{
        trackingCode: string;
        description?: string;
        weightBaseUnit?: number;
        unit?: string;
    }>;
    returnTransaction?: {
        id: string;
        amount: number;
        status: string;
    };
    paymentDeadline?: string;
    returnDeliveryImages?: string[]; // Multiple images support
}

const OrderRejectionDetail: React.FC<OrderRejectionDetailProps> = ({ issue, onUpdate }) => {
    const [loading] = useState(false);
    const [feeInfo, setFeeInfo] = useState<ReturnFeeInfo | null>(null);
    const [detailInfo, setDetailInfo] = useState<OrderRejectionInfo | null>(null);
    const [adjustedFee, setAdjustedFee] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);
    const [routingModalVisible, setRoutingModalVisible] = useState(false);
    const [routingLoading, setRoutingLoading] = useState(false);
    const [routeSegments, setRouteSegments] = useState<Array<{
        segmentOrder: number;
        startPointName: string;
        endPointName: string;
        distanceMeters: number;
        [key: string]: any;
    }>>([]);
    const [segments, setSegments] = useState<RouteSegment[]>([]);
    const [currentMapLocation, setCurrentMapLocation] = useState<MapLocation | null>(null);
    const [markers, setMarkers] = useState<MapLocation[]>([]);
    const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
    const [fullJourneyPoints, setFullJourneyPoints] = useState<RoutePoint[]>([]); // Store full 5 points for journey history
    const [customPoints, setCustomPoints] = useState<RoutePoint[]>([]);
    const [isGeneratingRoute, setIsGeneratingRoute] = useState<boolean>(false);
    const [isAnimatingRoute, setIsAnimatingRoute] = useState<boolean>(false);
    const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number>(0);
    const { getRoute } = useVietMapRouting();

// Global variable to store custom points for this modal
const globalCustomPoints: RoutePoint[] = [];

    // Helper function to translate point names to Vietnamese
    const translatePointName = (name: string): string => {
        const translations: { [key: string]: string } = {
            'Delivery': 'Điểm giao hàng',
            'Pickup': 'Điểm gửi hàng',
            'Pickup (Return)': 'Điểm gửi hàng (Trả về)',
            'Carrier': 'Kho vận chuyển',
            'Carrier (Return)': 'Kho vận chuyển (Quay về)',
        };
        return translations[name] || name;
    };

    // Memoized callback handlers to prevent re-renders
    const handleRouteGenerated = useCallback((segments: any, customPoints: any, fullPoints: any) => {
        // Batch all state updates to prevent multiple re-renders
        queueMicrotask(() => {
            setRouteSegments(segments.map((seg: any, idx: number) => {
                // Calculate estimated toll fee for this segment
                const estimatedTollFee = seg.tolls?.reduce((sum: number, toll: any) => 
                    sum + (toll.price || 0), 0) || 0;

                return {
                    segmentOrder: idx + 1,
                    startPointName: seg.startName,
                    endPointName: seg.endName,
                    startLatitude: seg.startLat,
                    startLongitude: seg.startLng,
                    endLatitude: seg.endLat,
                    endLongitude: seg.endLng,
                    distanceMeters: Math.round(seg.distance * 1000),
                    pathCoordinatesJson: JSON.stringify(seg.path || []),
                    tollDetails: seg.tolls || [],
                    estimatedTollFee: estimatedTollFee
                };
            }));
            setCustomPoints(customPoints);
            setFullJourneyPoints(fullPoints || []);
        });
    }, []);

    const handleFeeCalculated = useCallback((fee: any) => {
        // Batch state updates
        queueMicrotask(() => {
            setFeeInfo(fee);
            setAdjustedFee(fee.adjustedFee || null);
        });
    }, []);

    const handleAdjustedFeeChange = useCallback((adjustedFeeValue: number | null) => {
        setAdjustedFee(adjustedFeeValue);
    }, []);

    useEffect(() => {
        // Only fetch rejection detail on mount
        // Fee will be calculated AFTER route is created
        fetchRejectionDetail();
    }, [issue.id]);

    // Subscribe to WebSocket notifications for this issue
    useEffect(() => {
        if (!issue?.id) return;

        console.log('📡 [OrderRejectionDetail] Subscribing to issue updates:', issue.id);
        
        // Subscribe to issue updates via WebSocket
        const unsubscribe = issueWebSocket.subscribeToIssue(issue.id, (updatedIssue) => {
            console.log('🔄 [OrderRejectionDetail] Received issue update:', updatedIssue);
            
            // If issue status changed to RESOLVED (payment successful), refetch detail
            if (updatedIssue.status === 'RESOLVED') {
                console.log('✅ [OrderRejectionDetail] Issue resolved, refetching detail...');
                message.success('Khách hàng đã thanh toán thành công!');
                fetchRejectionDetail();
            }
        });
        
        // Listen to global return payment success event from IssuesContext
        const handleRefetchEvent = (event: any) => {
            const { issueId } = event.detail || {};
            console.log('📢 [OrderRejectionDetail] Received refetch event for issueId:', issueId);
            
            if (issueId === issue.id) {
                console.log('✅ [OrderRejectionDetail] Refetching issue detail...');
                fetchRejectionDetail();
            }
        };
        
        window.addEventListener('refetch-issue-detail', handleRefetchEvent);
        
        return () => {
            console.log('📡 [OrderRejectionDetail] Unsubscribing from issue:', issue.id);
            unsubscribe();
            window.removeEventListener('refetch-issue-detail', handleRefetchEvent);
        };
    }, [issue.id, onUpdate]);

    const fetchFeeCalculation = async (actualDistanceKm?: number) => {
        try {
            console.log("💰 Calculating return fee...");
            if (actualDistanceKm) {
                console.log("📏 Using actual route distance:", actualDistanceKm, "km");
            }
            
            // Use real API only - no mock data
            const data = await issueService.calculateReturnShippingFee(issue.id);
            
            // If actual distance provided, update the display
            if (actualDistanceKm && data) {
                data.distanceKm = actualDistanceKm; // Override with actual route distance
            }
            
            setFeeInfo(data);
            setAdjustedFee(data.adjustedFee || null);
            // message.success('Đã tính toán cước phí trả hàng');
        } catch (error) {
            console.error('Error fetching fee calculation:', error);
            // message.error('Không thể tính cước phí trả hàng');
        }
    };

    const fetchRejectionDetail = async () => {
        try {
            const data = await issueService.getOrderRejectionDetail(issue.id);
            setDetailInfo(data);
        } catch (error) {
            console.error('Error fetching rejection detail:', error);
        }
    };

    const handleRouting = () => {
        setRoutingModalVisible(true);
        generateReturnRoute();
    };

    // Generate route from points
    const generateRouteFromPoints = async (basePoints: RoutePoint[], customPts: RoutePoint[]) => {
        console.log("🔄 generateRouteFromPoints called with:", {
            basePoints: basePoints.length,
            customPts: customPts.length
        });
        
        if (basePoints.length < 2) {
            console.error("❌ Not enough points:", basePoints.length);
            message.error('Cần ít nhất 2 điểm để tạo tuyến đường');
            return;
        }

        console.log("🚀 Starting route generation...");
        setIsGeneratingRoute(true);
        setIsAnimatingRoute(true);

        try {
            // Tạo danh sách điểm theo thứ tự
            const allPoints = [...basePoints];
            
            // Chèn custom points vào đúng vị trí
            customPts.forEach(customPoint => {
                const segmentIndex = customPoint.segmentIndex || 0;
                const insertIndex = segmentIndex + 1;
                allPoints.splice(insertIndex, 0, customPoint);
            });

            // Prepare points for route API (copy logic từ RoutePlanningStep)
            const uniquePoints: [number, number][] = [];
            const uniquePointTypes: ('carrier' | 'pickup' | 'delivery' | 'stopover')[] = [];

            // Add base points
            allPoints.forEach(point => {
                uniquePoints.push([point.lng, point.lat]);
                uniquePointTypes.push(point.type);
            });

            const requestData: any = {
                points: uniquePoints, // Keep original format
                pointTypes: uniquePointTypes,
                vehicleTypeId: null // Use null instead of invalid UUID
            };

            console.log("📡 ROUTE GEN - Request data:", requestData);

            // Call API to get suggested route
            console.log("📞 Calling route service...");
            
            // Try route service first, but use fallback for now
            let routeSuccess = false;
            try {
                const response = await routeService.suggestRoute(requestData);
                console.log("📨 Route service response:", response);

                if (response && response.segments) {
                    console.log("✅ Got segments from API:", response.segments.length);
                    // Process segments cho VietMapMap
                    const processedSegments = response.segments.map(segment => ({
                        ...segment,
                        tolls: segment.tolls || [],
                        distance: segment.distance || 0
                    }));
                    
                    console.log("🗺️ Setting segments for VietMapMap:", processedSegments);
                    setSegments(processedSegments); // For VietMapMap
                    
                    // Process segments cho UI list
                    const uiSegments = response.segments.map((segment, index) => ({
                        segmentOrder: index + 1,
                        startPointName: segment.startName,
                        endPointName: segment.endName,
                        distanceMeters: segment.distance * 1000 // Convert to meters
                    }));
                    
                    console.log("📋 Setting UI segments:", uiSegments);
                    setRouteSegments(uiSegments);
                    // message.success(`Tạo tuyến đường thành công với ${response.segments.length} đoạn`);
                    routeSuccess = true;
                    
                    // Calculate return fee AFTER route is created successfully
                    // Get actual distance of segment 1 (Delivery → Pickup) from route
                    const deliveryToPickupDistance = response.segments.length > 0 ? response.segments[0].distance : 0;
                    console.log("✅ Route created, calculating return fee with actual distance:", deliveryToPickupDistance, "km");
                    setTimeout(() => {
                        fetchFeeCalculation(deliveryToPickupDistance);
                    }, 500);
                }
            } catch (apiError) {
                console.log("⚠️ Route API failed, using fallback:", apiError);
            }

            if (!routeSuccess) {
                console.log("❌ Route API failed, no fallback available");
                message.error('Không thể tạo tuyến đường. Vui lòng thử lại.');
                setSegments([]);
                setRouteSegments([]);
            }
        } catch (error) {
            console.error('Error generating route:', error);
            message.error('Không thể tạo tuyến đường');
        } finally {
            setIsGeneratingRoute(false);
            setTimeout(() => setIsAnimatingRoute(false), 2000);
        }
    };

    const generateReturnRoute = async () => {
        if (!detailInfo?.customerInfo) {
            message.error('Không có thông tin khách hàng');
            return;
        }

        setRoutingLoading(true);
        try {
            // Get real route points from API - tương tự RoutePlanningStep
            console.log("🔍 Fetching return route points for issue:", issue.id);
            
            const response = await routeService.getIssuePoints(issue.id);
            console.log("📡 Return route points response:", response);

            // Truy cập đúng cấu trúc response - API trả về trực tiếp points
            const points = response.points || [];
            if (points.length === 0) {
                message.error('Không tìm thấy điểm đường đi cho lộ trình trả hàng');
                return;
            }

            console.log("✅ Got full journey route points:", points.length);
            
            // Convert API response to RoutePoint format (full 5 points for journey history)
            const fullJourneyPoints: RoutePoint[] = points.map(point => ({
                addressId: point.addressId || '',
                lat: point.lat,
                lng: point.lng,
                address: point.address,
                name: point.name,
                type: point.type as 'carrier' | 'pickup' | 'delivery' | 'stopover'
            }));

            // Return route uses last 3 points: Delivery → Pickup (Return) → Carrier (Return)
            const returnRoutePoints = fullJourneyPoints.slice(2);
            
            console.log("📍 Full journey points:", fullJourneyPoints.length);
            console.log("📍 Return route points for display:", returnRoutePoints.length);

            // Save full journey points for submission later
            setFullJourneyPoints(fullJourneyPoints);
            
            // Set route points for display (3 điểm return)
            setRoutePoints(returnRoutePoints);
            
            // Create markers from return route points
            const allMarkers = createAllMarkers(returnRoutePoints, []);
            setMarkers(allMarkers);
            
            // Set map location to first return point (Delivery)
            if (returnRoutePoints.length > 0) {
                const firstPoint = returnRoutePoints[0];
                setCurrentMapLocation({
                    lat: firstPoint.lat,
                    lng: firstPoint.lng
                });
            }
            
            console.log("🚀 Opening modal with return points:", returnRoutePoints.length);
            console.log("🗺️ Created markers:", allMarkers.length);
            
            setRoutingModalVisible(true);
            
            // Generate route after modal opens - with return points
            if (returnRoutePoints.length >= 2) {
                setTimeout(() => {
                    console.log("⏰ Starting route generation with return points...");
                    generateRouteFromPoints(returnRoutePoints, []);
                }, 500);
            }
        } catch (error) {
            console.error('Error generating route:', error);
            message.error('Không thể tạo lộ trình');
        } finally {
            setRoutingLoading(false);
        }
    };

    const handleGenerateReturnRoute = async () => {
        if (!issue) {
            message.error('Không có thông tin issue');
            return;
        }

        // Simply open modal - let ReturnRoutePlanning handle everything
        console.log("🚪 Opening return routing modal for issue:", issue.id);
        setRoutingModalVisible(true);
    };

    const handleLocationChange = (location: MapLocation) => {
        // Add custom point when user clicks on map
        try {
            const newCustomPoint: RoutePoint = {
                addressId: `custom-${Date.now()}`,
                lat: location.lat,
                lng: location.lng,
                address: location.address || `Điểm trung gian ${customPoints.length + 1}`,
                name: `Điểm trung gian ${customPoints.length + 1}`,
                type: 'stopover',
                segmentIndex: selectedSegmentIndex
            };

            const updatedCustomPoints = [...customPoints, newCustomPoint];
            setCustomPoints(updatedCustomPoints);

            // Update markers
            const allMarkers = createAllMarkers(routePoints, updatedCustomPoints);
            setMarkers(allMarkers);

            // Regenerate route
            generateRouteFromPoints(routePoints, updatedCustomPoints);

            message.success('Đã thêm điểm trung gian');
        } catch (error) {
            console.error('Error adding custom point:', error);
            message.error('Có lỗi khi thêm điểm trung gian');
        }
    };

    // Helper function to create markers
    const createAllMarkers = (basePoints: RoutePoint[], customPts: RoutePoint[]): MapLocation[] => {
        const timestamp = Date.now();

        const baseMarkers = basePoints.map((point: RoutePoint, index) => ({
            lat: point.lat,
            lng: point.lng,
            address: point.address,
            name: point.name,
            type: point.type,
            id: `${point.type}-${point.lat}-${point.lng}-${timestamp}-${index}`
        }));

        const customMarkers = customPts.map((point, i) => ({
            lat: point.lat,
            lng: point.lng,
            address: point.address || `Điểm trung gian ${i + 1}`,
            name: `Điểm trung gian ${i + 1}`,
            type: 'stopover' as const,
            id: `stopover-${point.lat}-${point.lng}-${timestamp}-${i}`
        }));

        return [...baseMarkers, ...customMarkers];
    };

    // Remove custom point
    const removeCustomPoint = (index: number) => {
        // Remove the custom point at the specified index
        const updatedCustomPoints = customPoints.filter((_, i) => i !== index);
        setCustomPoints(updatedCustomPoints);
        
        // Update markers
        const allMarkers = createAllMarkers(routePoints, updatedCustomPoints);
        setMarkers(allMarkers);
        
        // Regenerate route and recalculate fee
        generateRouteFromPoints(routePoints, updatedCustomPoints);
        
        message.success('Đã xóa điểm trung gian');
    };

    const handleProcess = async () => {
        if (!feeInfo) {
            message.error('Chưa có thông tin giá cước');
            return;
        }

        if (routeSegments.length === 0) {
            message.error('Chưa có lộ trình trả hàng. Vui lòng tạo lộ trình trước.');
            return;
        }

        setProcessing(true);
        setRoutingLoading(true);
        try {
            // Create journey history + transaction
            await issueService.processOrderRejection({
                issueId: issue.id,
                adjustedReturnFee: adjustedFee || undefined,
                routeSegments: routeSegments,
                totalTollFee: 0,
                totalTollCount: 0,
                totalDistance: feeInfo.distanceKm,
            });

            message.success('Đã tạo lộ trình trả hàng và giao dịch thanh toán thành công');
            
            // Close modal
            setRoutingModalVisible(false);
            
            // Refresh issue data
            if (onUpdate) {
                const updatedIssue = await issueService.getIssueById(issue.id);
                onUpdate(updatedIssue);
            }
            fetchRejectionDetail();
        } catch (error) {
            message.error('Lỗi tạo lộ trình trả hàng');
            console.error(error);
        } finally {
            setProcessing(false);
            setRoutingLoading(false);
        }
    };

    // Check if payment deadline has passed
    const isDeadlinePassed = (deadline: string | undefined): boolean => {
        if (!deadline) return false;
        return new Date(deadline).getTime() < Date.now();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    if (loading) {
        return (
            <Card title="Xử lý trả hàng">
                <div className="text-center py-8">
                    <Spin size="large" />
                </div>
            </Card>
        );
    }

    return (
        <>
        <Card 
            className="shadow-md"
            style={{ borderRadius: 8 }}
        >
            {/* Header with gradient */}
            <div style={{ 
                background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
                margin: '-24px -24px 24px -24px',
                padding: '20px 24px',
                borderRadius: '8px 8px 0 0'
            }}>
                <Space>
                    <ExclamationCircleOutlined style={{ fontSize: 24, color: 'white' }} />
                    <Title level={4} style={{ margin: 0, color: 'white' }}>
                        Xử lý người nhận từ chối
                    </Title>
                </Space>
            </div>

            {/* Customer Contact Information */}
            {detailInfo?.customerInfo && (
                <>
                    <div className="mb-4">
                        <div className="bg-orange-50 border-l-4 border-orange-400 pl-4 py-2 mb-3">
                            <h3 className="text-lg font-semibold text-orange-800 flex items-center mb-0">
                                <UserOutlined className="mr-2" />
                                Thông tin người gửi
                            </h3>
                        </div>
                        <Descriptions bordered size="small" column={2}>
                            <Descriptions.Item label="Họ tên">
                                {detailInfo.customerInfo.fullName}
                            </Descriptions.Item>
                            <Descriptions.Item label="Công ty">
                                {detailInfo.customerInfo.company || 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label={<><PhoneOutlined /> Điện thoại</>}>
                                <a href={`tel:${detailInfo.customerInfo.phoneNumber}`}>
                                    {detailInfo.customerInfo.phoneNumber}
                                </a>
                            </Descriptions.Item>
                            <Descriptions.Item label={<><MailOutlined /> Email</>}>
                                <a href={`mailto:${detailInfo.customerInfo.email}`}>
                                    {detailInfo.customerInfo.email}
                                </a>
                            </Descriptions.Item>
                            {detailInfo.customerInfo.businessAddress && (
                                <Descriptions.Item label="Địa chỉ doanh nghiệp" span={2}>
                                    {detailInfo.customerInfo.businessAddress}
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    </div>
                    <Divider />
                </>
            )}

            {/* Affected Packages */}
            {detailInfo?.affectedOrderDetails && detailInfo.affectedOrderDetails.length > 0 && (
                <>
                    <div className="mb-4">
                        <div className="bg-orange-50 border-l-4 border-orange-400 pl-4 py-2 mb-3">
                            <h3 className="text-lg font-semibold text-orange-800 mb-0">
                                📦 Các kiện hàng cần trả ({detailInfo.affectedOrderDetails.length} kiện)
                            </h3>
                        </div>
                        <div className="space-y-2">
                            {detailInfo.affectedOrderDetails.map((pkg, index) => (
                                <Card 
                                    size="small" 
                                    key={index} 
                                    className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 hover:shadow-md transition-shadow"
                                    style={{ borderRadius: 8 }}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <Tag color="orange" className="font-semibold">
                                                {pkg.trackingCode}
                                            </Tag>
                                            {pkg.description && (
                                                <span className="ml-2 text-gray-700 font-medium">
                                                    {pkg.description}
                                                </span>
                                            )}
                                        </div>
                                        {pkg.weightBaseUnit && (
                                            <span className="text-orange-600 font-semibold bg-orange-100 px-2 py-1 rounded">
                                                {pkg.weightBaseUnit} {pkg.unit || 'kg'}
                                            </span>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                    <Divider />
                </>
            )}

            {/* Fee Calculation - Only show after route is created and fee is calculated */}
            {/* {feeInfo && (
                <>
                    <div className="mb-4">
                            <div className="bg-orange-50 border-l-4 border-orange-400 pl-4 py-2 mb-3">
                                <h3 className="text-lg font-semibold text-orange-800 flex items-center mb-0">
                                    <DollarOutlined className="mr-2" />
                                    Cước phí trả hàng
                                </h3>
                            </div>
                            <Alert
                                message="Khoảng cách trả hàng"
                                description={`${feeInfo.distanceKm.toFixed(2)} km (từ điểm giao về điểm lấy hàng)`}
                                type="info"
                                showIcon
                                className="mb-3"
                            />
                        <Descriptions bordered size="small" column={1}>
                            <Descriptions.Item label="Giá cước tính toán">
                                <span className="font-semibold text-blue-600">
                                    {formatCurrency(feeInfo.calculatedFee)}
                                </span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Điều chỉnh giá (VIP customer, etc.)">
                                <InputNumber
                                    value={adjustedFee}
                                    onChange={setAdjustedFee}
                                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, ''))}
                                    style={{ width: '100%' }}
                                    placeholder={`Mặc định: ${formatCurrency(feeInfo.calculatedFee)}`}
                                    disabled={detailInfo?.status !== 'OPEN'}
                                />
                            </Descriptions.Item>
                            <Descriptions.Item label="Giá cuối cùng">
                                <span className="text-xl font-bold text-green-600">
                                    {formatCurrency(adjustedFee || feeInfo.calculatedFee)}
                                </span>
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                    <Divider />
                </>
            )} */}

            {/* Return Shipping Fee Information - Show after staff processes */}
            {issue.status === 'IN_PROGRESS' && detailInfo?.finalFee && (
                <Card 
                    className="mb-4"
                    title={
                        <div className="flex items-center">
                            <DollarOutlined className="mr-2 text-blue-500" />
                            <span>Thông tin cước phí trả hàng</span>
                        </div>
                    }
                    bordered
                >
                    {/* Fee Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Calculated Fee */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="text-xs text-blue-600 mb-1 font-semibold">Giá cước tính toán</div>
                            <div className="text-lg font-bold text-blue-700">
                                {formatCurrency(detailInfo.calculatedFee || 0)}
                            </div>
                            {detailInfo.adjustedFee && (
                                <div className="text-xs text-gray-500 mt-1">
                                    Giá điều chỉnh: {formatCurrency(detailInfo.adjustedFee)}
                                </div>
                            )}
                        </div>

                        {/* Final Fee */}
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <div className="text-xs text-green-600 mb-1 font-semibold">Giá cuối cùng</div>
                            <div className="text-xl font-bold text-green-700">
                                {formatCurrency(detailInfo.finalFee)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                Khách hàng cần thanh toán
                            </div>
                        </div>
                    </div>

                    {/* Payment deadline with countdown */}
                    {detailInfo.paymentDeadline && (
                        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <ClockCircleOutlined className="text-orange-600 text-xl" />
                                    <span className="font-semibold text-gray-700">Thời gian còn lại</span>
                                </div>
                                <div className="text-xs text-gray-500">
                                    Hết hạn: {new Date(detailInfo.paymentDeadline).toLocaleString('vi-VN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                    })}
                                </div>
                            </div>
                            <div className="flex justify-center">
                                {isDeadlinePassed(detailInfo.paymentDeadline) ? (
                                    <div className="text-center">
                                        <div className="text-6xl font-bold text-red-600 mb-2">
                                            Hết hạn
                                        </div>
                                        <div className="text-sm text-red-500">
                                            ❌ Đã quá thời gian thanh toán
                                        </div>
                                    </div>
                                ) : (
                                    <Statistic.Countdown
                                        value={new Date(detailInfo.paymentDeadline).getTime()}
                                        format="mm:ss"
                                        valueStyle={{
                                            fontSize: '48px',
                                            fontWeight: 'bold',
                                            background: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            fontFamily: 'monospace'
                                        }}
                                        suffix={
                                            <span className="text-sm text-gray-500 ml-2">phút:giây</span>
                                        }
                                    />
                                )}
                            </div>
                            <div className="text-center mt-2 text-sm text-gray-600">
                                {isDeadlinePassed(detailInfo.paymentDeadline) ? (
                                    <span className="text-red-600 font-semibold">
                                        ⏰ Đã quá hạn! Liên hệ khách hàng hoặc xử lý theo quy trình.
                                    </span>
                                ) : (
                                    '⚠️ Driver đang chờ! Vui lòng nhắc khách hàng thanh toán ngay nếu cần.'
                                )}
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* Transaction Status - Show when customer creates payment */}
            {detailInfo?.returnTransaction && (
                <Card 
                    className="mb-4"
                    title={
                        <div className="flex items-center">
                            <CreditCardOutlined className="mr-2 text-green-500" />
                            <span>Trạng thái giao dịch thanh toán</span>
                        </div>
                    }
                    bordered
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {/* Mã giao dịch */}
                        <div className="bg-gray-50 p-3 rounded">
                            <div className="text-xs text-gray-500 mb-1">Mã giao dịch</div>
                            <div className="text-sm font-mono font-semibold text-gray-800">
                                {detailInfo.returnTransaction.id}
                            </div>
                        </div>

                        {/* Số tiền */}
                        <div className="bg-blue-50 p-3 rounded">
                            <div className="text-xs text-gray-500 mb-1">Số tiền</div>
                            <div className="text-base font-bold text-blue-600">
                                {formatCurrency(detailInfo.returnTransaction.amount)}
                            </div>
                        </div>

                        {/* Trạng thái */}
                        <div className="bg-gray-50 p-3 rounded">
                            <div className="text-xs text-gray-500 mb-1">Trạng thái</div>
                            <div>
                                <TransactionStatusTag 
                                    status={detailInfo.returnTransaction.status as TransactionEnum}
                                />
                            </div>
                        </div>
                    </div>

                    {detailInfo.returnTransaction.status === 'PAID' && (
                        <Alert
                            icon={<CheckCircleOutlined />}
                            message="Đã thanh toán thành công"
                            description="Lộ trình đã được kích hoạt và tài xế đang tiến hành trả hàng."
                            type="success"
                            showIcon
                        />
                    )}
                </Card>
            )}

            {/* Action Button */}
            {issue.status === 'OPEN' && (
                <div className="mt-4 flex justify-center">
                    <Button
                        type="primary"
                        size="large"
                        icon={<ShareAltOutlined />}
                        onClick={handleRouting}
                        loading={routingLoading}
                    >
                        Tạo lộ trình trả hàng & Tạo giao dịch
                    </Button>
                </div>
            )}

            {/* Waiting for Payment Alert */}
            {issue.status === 'IN_PROGRESS' && !detailInfo?.returnTransaction && (
                <Alert
                    icon={<InfoCircleOutlined />}
                    message={
                        <div className="font-semibold text-lg">✅ Đã hoàn tất xử lý! Đang chờ khách hàng thanh toán</div>
                    }
                    description={
                        <div className="space-y-2">
                            <p className="text-base">
                                Yêu cầu thanh toán cước trả hàng <strong>{formatCurrency(detailInfo?.finalFee || 0)}</strong> đã được gửi tới khách hàng.
                            </p>
                            <p className="text-sm text-gray-600">
                                Khách hàng sẽ thấy thông báo trong trang <strong>Chi tiết đơn hàng</strong> và có thể thanh toán ngay. 
                                Sau khi thanh toán thành công, tài xế sẽ tự động nhận được lộ trình trả hàng.
                            </p>
                            <Divider className="my-3" />
                            <div className="bg-yellow-50 p-2 rounded text-sm">
                                <strong>💡 Gợi ý:</strong> Nếu cần thiết, bạn có thể gọi điện nhắc nhở khách hàng thanh toán qua số điện thoại bên trên. 
                                Hạn thanh toán là <strong>30 phút</strong> kể từ bây giờ.
                            </div>
                        </div>
                    }
                    type="success"
                    showIcon
                    className="mb-4"
                />
            )}

            {/* Payment in progress */}
            {issue.status === 'IN_PROGRESS' && detailInfo?.returnTransaction?.status === 'PENDING' && (
                <Alert
                    icon={<ClockCircleOutlined />}
                    message={
                        <div className="font-semibold">⏳ Khách hàng đã tạo giao dịch, đang chờ thanh toán</div>
                    }
                    description={
                        <div>
                            <p>Khách hàng đã ấn nút thanh toán và tạo giao dịch. Đang chờ hoàn tất thanh toán trên PayOS.</p>
                            <p className="mt-2 text-sm text-gray-600">Trạng thái sẽ tự động cập nhật khi thanh toán thành công.</p>
                        </div>
                    }
                    type="warning"
                    showIcon
                    className="mb-4"
                />
            )}

            {issue.status === 'RESOLVED' && (
                <>
                    <Alert
                        message="Đã hoàn tất"
                        description="Khách hàng đã thanh toán và tài xế đã trả hàng về điểm lấy hàng."
                        type="success"
                        showIcon
                    />
                    
                    {/* Return Delivery Images */}
                    {detailInfo?.returnDeliveryImages && detailInfo.returnDeliveryImages.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-lg font-semibold mb-3">Ảnh xác nhận trả hàng</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {detailInfo.returnDeliveryImages.map((imageUrl, index) => (
                                    <div key={index} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                                        <img 
                                            src={imageUrl} 
                                            alt={`Ảnh trả hàng ${index + 1}`}
                                            className="w-full h-48 object-cover cursor-pointer"
                                            onClick={() => window.open(imageUrl, '_blank')}
                                        />
                                        <div className="p-2 bg-gray-50 text-center text-sm text-gray-600">
                                            Ảnh {index + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </Card>

        {/* Routing Modal */}
        <Modal
            title="Tạo lộ trình trả hàng"
            open={routingModalVisible}
            onCancel={() => setRoutingModalVisible(false)}
            width={1200}
            style={{ top: 20 }}
            footer={[
                <Button key="cancel" onClick={() => setRoutingModalVisible(false)}>
                    Hủy
                </Button>,
                <Button
                    key="confirm"
                    type="primary"
                    onClick={handleProcess}
                    disabled={!routeSegments.length || !feeInfo}
                    loading={routingLoading}
                >
                    Xác nhận & Tạo giao dịch
                </Button>
            ]}
        >
            <ReturnRoutePlanning
                issueId={issue.id}
                issue={detailInfo || issue}
                onRouteGenerated={handleRouteGenerated}
                onFeeCalculated={handleFeeCalculated}
                onAdjustedFeeChange={handleAdjustedFeeChange}
            />
        </Modal>
        </>
    );
};

export default OrderRejectionDetail;
