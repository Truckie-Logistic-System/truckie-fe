import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Button, Card, Spin, Typography, App, Tooltip, Tag, Row, Col, Divider, Space, Badge, Modal, InputNumber, Alert } from 'antd';
import routeService from '@/services/route';
import issueService from '@/services/issue';
import type { RoutePoint, RouteSegment, SuggestRouteRequest, RouteInfoFromAPI } from '@/models/RoutePoint';
import type { MapLocation } from '@/models/Map';
import VietMapMap from '@/components/common/VietMapMap';
import {
    CloseCircleOutlined,
    LoadingOutlined,
    EnvironmentOutlined,
    CarOutlined,
    DollarCircleOutlined,
    InfoCircleOutlined,
    ArrowRightOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

// Global variable to store custom points (following RoutePlanningStep pattern)
const globalCustomPoints: RoutePoint[] = [];

// Helper function to translate point names - outside component to avoid re-creation
const translatePointName = (name: string): string => {
    if (!name) return '';
    
    // Check if name contains "Stopover" anywhere
    if (name.includes('Stopover')) {
        return 'Điểm trung gian';
    }
    
    // Handle both English and already Vietnamese names
    const translations: Record<string, string> = {
        'Carrier': 'Đơn vị vận chuyển',
        'DVVC': 'Đơn vị vận chuyển',
        'Pickup': 'Điểm lấy hàng',
        'Delivery': 'Điểm giao hàng',
        'Stopover': 'Điểm trung gian',
        'Point 1': 'Điểm giao hàng',
        'Point 2': 'Điểm lấy hàng', 
        'Point 3': 'Đơn vị vận chuyển',
        'Điểm trung gian': 'Điểm trung gian',
    };
    
    return translations[name] || name;
};

interface ReturnRoutePlanningProps {
    issueId: string;
    issue?: any;
    onRouteGenerated?: (segments: RouteSegment[], customPoints: RoutePoint[], fullJourneyPoints?: RoutePoint[]) => void;
    onFeeCalculated?: (feeInfo: any) => void;
    onAdjustedFeeChange?: (adjustedFee: number | null) => void;
}

const ReturnRoutePlanning: React.FC<ReturnRoutePlanningProps> = ({
    issueId,
    issue,
    onRouteGenerated,
    onFeeCalculated,
    onAdjustedFeeChange
}) => {
    const { message } = App.useApp();
    
    // Track renders for debugging
    const renderCount = useRef<number>(0);
    const apiCallCount = useRef<number>(0);
    const lastIssueId = useRef<string | undefined>(undefined);
    
    useEffect(() => {
        renderCount.current += 1;
        lastIssueId.current = issueId;
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
    const [fullJourneyPoints, setFullJourneyPoints] = useState<RoutePoint[]>([]);
    const [segments, setSegments] = useState<RouteSegment[]>([]);
    const [customPoints, setCustomPoints] = useState<RoutePoint[]>([]);
    const [isGeneratingRoute, setIsGeneratingRoute] = useState<boolean>(false);
    const [currentMapLocation, setCurrentMapLocation] = useState<MapLocation | null>(null);
    const [markers, setMarkers] = useState<MapLocation[]>([]);
    const [isAnimatingRoute, setIsAnimatingRoute] = useState<boolean>(false);
    const [routeInfoFromAPI, setRouteInfoFromAPI] = useState<RouteInfoFromAPI>({
        totalDistance: 0,
        totalTollAmount: 0,
        totalTollCount: 0
    });
    const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number>(0);
    const [feeInfo, setFeeInfo] = useState<any>(null);
    const [adjustedFee, setAdjustedFee] = useState<number | null>(null);
    
    // Ref to track selected segment index (following RoutePlanningStep pattern)
    const selectedSegmentIndexRef = useRef<number>(0);


    // Fetch route points - only run once when issueId changes
    useEffect(() => {
        const fetchRoutePoints = async () => {
            if (!issueId) return;
            
            apiCallCount.current += 1;
            try {
                setLoading(true);
                globalCustomPoints.length = 0;
                setCustomPoints([]);

                const response = await routeService.getIssuePoints(issueId);
                const points = response.points || [];
                
                if (points.length === 0) {
                    message.error('Không tìm thấy điểm đường đi cho lộ trình trả hàng');
                    return;
                }

                const fullJourneyPoints: RoutePoint[] = points.map((point: any) => ({
                    addressId: point.addressId || '',
                    lat: point.lat,
                    lng: point.lng,
                    address: point.address,
                    name: point.name,
                    type: point.type as 'carrier' | 'pickup' | 'delivery' | 'stopover'
                }));

                const returnRoutePoints = fullJourneyPoints.slice(2);
                
                setFullJourneyPoints(fullJourneyPoints);
                setRoutePoints(returnRoutePoints);

                const mapMarkers = returnRoutePoints.map((point: RoutePoint) => ({
                    lat: point.lat,
                    lng: point.lng,
                    address: point.address,
                    name: point.name,
                    type: point.type,
                    id: `${point.type}-${point.lat}-${point.lng}`
                }));

                setMarkers(mapMarkers);

                if (returnRoutePoints.length > 0) {
                    const firstPoint = returnRoutePoints[0];
                    setCurrentMapLocation({
                        lat: firstPoint.lat,
                        lng: firstPoint.lng,
                        address: firstPoint.address
                    });

                    if (returnRoutePoints.length >= 2) {
                        await generateRouteFromPoints(returnRoutePoints, []);
                    }
                }
            } catch (error) {
                console.error('❌ Error fetching route points:', error);
                message.error('Không thể lấy thông tin điểm đường đi');
            } finally {
                setLoading(false);
            }
        };

        fetchRoutePoints();
    }, [issueId]);

    // Update selected segment index ref when state changes
    useEffect(() => {
        selectedSegmentIndexRef.current = selectedSegmentIndex;
    }, [selectedSegmentIndex]);

    // Helper function to get current segments including stopovers (copied from VehicleAssignment)
    // Helper function to update segments with correct distances when stopovers are added
    // Helper function to create markers from route points and custom points
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
            address: point.address || `Stopover ${i + 1}`,
            name: `Stopover ${i + 1}`,
            type: 'stopover' as const,
            id: `stopover-${point.lat}-${point.lng}-${timestamp}-${i}`
        }));

        return [...baseMarkers, ...customMarkers];
    };

    // Get current segments - backend already returns correct segments, just add colors
    // Memoize to prevent recalculation on every render
    const getCurrentSegments = useMemo(() => {
        if (!segments || segments.length === 0) return [];

        // Xác định base segment cho từng segment
        // Segment 1 (xanh lá): Tất cả segments cho đến khi END là Pickup
        // Segment 2 (tím): Tất cả segments START từ Pickup trở đi
        
        return segments.map((segment, index) => {
            const startNameLower = segment.startName?.toLowerCase() || '';
            const endNameLower = segment.endName?.toLowerCase() || '';
            
            let baseSegmentIndex = 1; // Default to segment 1 (xanh lá)
            
            // Nếu START là Pickup hoặc START là Stopover và segment trước END là Pickup -> segment 2
            if (startNameLower.includes('pickup')) {
                baseSegmentIndex = 2; // Tím
            } else if (index > 0) {
                // Kiểm tra segment trước xem có END là Pickup không
                const prevSegment = segments[index - 1];
                const prevEndNameLower = prevSegment?.endName?.toLowerCase() || '';
                if (prevEndNameLower.includes('pickup') || prevEndNameLower.includes('lấy hàng')) {
                    baseSegmentIndex = 2; // Tím
                }
            }
            
            const segmentColor = baseSegmentIndex === 1 ? '#52c41a' : '#722ed1';
            
            return {
                ...segment,
                startName: translatePointName(segment.startName),
                endName: translatePointName(segment.endName),
                distance: segment.distance ? Number(segment.distance.toFixed(2)) : 0, // Làm tròn 2 chữ số thập phân
                segmentOrder: baseSegmentIndex,
                segmentColor: segmentColor
            };
        });
    }, [segments]); // Only recalculate when segments change


    // Generate route from base points and custom points
    const generateRouteFromPoints = async (basePoints: RoutePoint[], customPts: RoutePoint[]) => {
        if (basePoints.length === 0) return;
        if (isGeneratingRoute) {
            console.warn('[BLOCKED] generateRouteFromPoints - already generating');
            return; // Prevent concurrent calls
        }

        // Update global array if customPts has data
        if (customPts.length > 0) {
            if (JSON.stringify(customPts) !== JSON.stringify(globalCustomPoints)) {
                globalCustomPoints.length = 0;
                globalCustomPoints.push(...customPts);
            }
            setCustomPoints([...globalCustomPoints]);
        } else if (globalCustomPoints.length > 0) {
            setCustomPoints([...globalCustomPoints]);
            return generateRouteFromPoints(basePoints, [...globalCustomPoints]);
        }

        try {
            setIsGeneratingRoute(true);

            // For return route: Delivery, Pickup, Carrier (3 points)
            const delivery = basePoints.find(p => p.type === 'delivery');
            const pickup = basePoints.find(p => p.type === 'pickup');
            const carrier = basePoints.find(p => p.type === 'carrier');

            if (!delivery || !pickup || !carrier) {
                console.error('Thiếu điểm cần thiết cho tuyến trả hàng');
                message.error('Thiếu điểm cần thiết cho tuyến trả hàng');
                setIsGeneratingRoute(false);
                return;
            }

            // Validate custom points segmentIndex for return route (1 or 2)
            const validCustomPts = globalCustomPoints.map((point: RoutePoint) => {
                if (point.segmentIndex === undefined || point.segmentIndex < 1 || point.segmentIndex > 2) {
                    return { ...point, segmentIndex: 1 };
                }
                return point;
            });

            globalCustomPoints.length = 0;
            globalCustomPoints.push(...validCustomPts);
            setCustomPoints([...validCustomPts]);

            // Group stopovers by segment
            const segment1Stopovers = validCustomPts
                .filter((p: RoutePoint) => p.segmentIndex === 1)
                .sort((a: RoutePoint, b: RoutePoint) => {
                    const aMatch = a.name.match(/Điểm trung gian (\d+)/);
                    const bMatch = b.name.match(/Điểm trung gian (\d+)/);
                    if (aMatch && bMatch) {
                        return parseInt(aMatch[1]) - parseInt(bMatch[1]);
                    }
                    return a.name.localeCompare(b.name);
                });

            const segment2Stopovers = validCustomPts
                .filter((p: RoutePoint) => p.segmentIndex === 2)
                .sort((a: RoutePoint, b: RoutePoint) => {
                    const aMatch = a.name.match(/Điểm trung gian (\d+)/);
                    const bMatch = b.name.match(/Điểm trung gian (\d+)/);
                    if (aMatch && bMatch) {
                        return parseInt(aMatch[1]) - parseInt(bMatch[1]);
                    }
                    return a.name.localeCompare(b.name);
                });

            // Create ordered points for return route: Delivery -> [Stopovers] -> Pickup -> [Stopovers] -> Carrier
            const orderedPoints: RoutePoint[] = [];

            // Segment 1: Delivery -> Pickup
            orderedPoints.push(delivery);
            if (segment1Stopovers.length > 0) {
                segment1Stopovers.forEach(point => {
                    orderedPoints.push({ ...point, type: 'stopover' });
                });
            }

            // Segment 2: Pickup -> Carrier
            orderedPoints.push(pickup);
            if (segment2Stopovers.length > 0) {
                segment2Stopovers.forEach(point => {
                    orderedPoints.push({ ...point, type: 'stopover' });
                });
            }

            // End at Carrier
            orderedPoints.push(carrier);

            // Create coordinates for API request
            const coordinates: [number, number][] = orderedPoints.map(point => [point.lng, point.lat]);
            const pointTypes: ('carrier' | 'pickup' | 'delivery' | 'stopover')[] = orderedPoints.map(point => 
                point.type === 'carrier' ? 'carrier' :
                point.type === 'pickup' ? 'pickup' :
                point.type === 'delivery' ? 'delivery' : 'stopover'
            );

            const vehicleTypeId = issue?.vehicleAssignmentEntity?.vehicle?.vehicleType?.id || 
                                issue?.vehicleAssignment?.vehicle?.vehicleType?.id || 
                                '00000000-0000-0000-0000-000000000000';

            const requestData: SuggestRouteRequest = {
                points: coordinates,
                pointTypes: pointTypes,
                vehicleTypeId: vehicleTypeId,
            };

            // Call API to get suggested route
            apiCallCount.current += 1;
            const response = await routeService.suggestRoute(requestData);

            if (response && response.segments) {
                const processedSegments = response.segments.map((segment, index) => ({
                    ...segment,
                    tolls: segment.tolls || [],
                    distance: segment.distance || 0,
                    // Keep original English names for consistency with backend
                    startName: segment.startName,
                    endName: segment.endName,
                    segmentOrder: segment.segmentOrder || (index + 1)
                }));

                const routeInfoFromAPI: RouteInfoFromAPI = {
                    totalDistance: response.totalDistance || 0,
                    totalTollAmount: response.totalTollAmount || 0,
                    totalTollCount: response.totalTollCount || 0
                };


                setIsAnimatingRoute(false);
                setSegments(processedSegments);
                setRouteInfoFromAPI(routeInfoFromAPI);

                // Calculate delivery to pickup distance for fee calculation
                let deliveryToPickupDistance = 0;
                if (processedSegments.length > 0) {
                    for (let i = 0; i < processedSegments.length; i++) {
                        const segment = processedSegments[i];
                        deliveryToPickupDistance += segment.distance;
                        // Stop when we reach pickup point
                        if (segment.endName === 'Pickup' || 
                            segment.endName.includes('lấy hàng') || 
                            segment.endName === 'Point 2') {
                            break;
                        }
                    }
                }

                // Notify parent component ONCE
                if (onRouteGenerated) {
                    onRouteGenerated(processedSegments, validCustomPts, fullJourneyPoints);
                }

                // Calculate fee with actual distance - use requestAnimationFrame instead of setTimeout
                requestAnimationFrame(() => {
                    fetchFeeCalculation(deliveryToPickupDistance);
                });

                // message.success('Tạo tuyến đường thành công');
            } else {
                message.error('Không thể tạo tuyến đường: Định dạng phản hồi không hợp lệ');
            }

        } catch (error) {
            console.error('Error generating route:', error);
            message.error('Không thể tạo tuyến đường');
            setIsAnimatingRoute(false);
            setCustomPoints([...globalCustomPoints]);
        } finally {
            setIsGeneratingRoute(false);
        }
    };

    const fetchFeeCalculation = async (actualDistanceKm?: number) => {
        try {
            const data = await issueService.calculateReturnShippingFee(issueId, actualDistanceKm);
            setFeeInfo(data);
            
            // Only call parent callback if data is different
            if (onFeeCalculated) {
                onFeeCalculated(data);
            }
            
            // Remove duplicate success message (already shown in generateRouteFromPoints)
        } catch (error) {
            console.error('❌ Error calculating fee:', error);
            // message.error('Không thể tính cước phí trả hàng');
        }
    };

    // Handle map location change
    const handleLocationChange = (location: MapLocation) => {
        try {
            setCurrentMapLocation(location);

            const selectedIndex = selectedSegmentIndexRef.current;

            // Get the actual segments including stopovers
            const currentSegments = getCurrentSegments;

            if (selectedIndex >= currentSegments.length) {
                message.error("Đoạn đường không hợp lệ");
                return;
            }

            const selectedSegment = currentSegments[selectedIndex];
            const segmentIndex = selectedSegment.segmentOrder;

            if (segmentIndex === undefined || segmentIndex < 1 || segmentIndex > 2) {
                message.error("Đoạn đường không hợp lệ");
                return;
            }

            // Determine segment name
            let segmentName = "";
            let startName = "";
            let endName = "";

            // Translate point names to Vietnamese
            startName = selectedSegment.startName === 'Delivery' ? 'Điểm giao hàng' :
                selectedSegment.startName === 'Pickup' ? 'Điểm lấy hàng' :
                    selectedSegment.startName === 'Carrier' ? 'Đơn vị vận chuyển' :
                        selectedSegment.startName === 'Stopover' ? 'Điểm trung gian' :
                            selectedSegment.startName;

            endName = selectedSegment.endName === 'Delivery' ? 'Điểm giao hàng' :
                selectedSegment.endName === 'Pickup' ? 'Điểm lấy hàng' :
                    selectedSegment.endName === 'Carrier' ? 'Đơn vị vận chuyển' :
                        selectedSegment.endName === 'Stopover' ? 'Điểm trung gian' :
                            selectedSegment.endName;

            segmentName = `${startName}-${endName}`;

            // Count current stopovers for this segment
            const currentSegmentStopoverCount = globalCustomPoints.filter(p => p.segmentIndex === segmentIndex).length;

            // Create new stopover point
            const newCustomPoint: RoutePoint = {
                name: `Stopover ${currentSegmentStopoverCount + 1} (${segmentName})`,
                type: 'stopover',
                lat: location.lat,
                lng: location.lng,
                address: location.address || `Stopover ${currentSegmentStopoverCount + 1}`,
                addressId: '',
                segmentIndex: segmentIndex
            };


            // Add to global custom points array
            globalCustomPoints.push(newCustomPoint);

            // Update state for UI rendering
            const updatedCustomPoints = [...globalCustomPoints];
            setCustomPoints(updatedCustomPoints);

            // Create new markers
            const allMarkers = createAllMarkers(routePoints, updatedCustomPoints);
            setMarkers(allMarkers);

            // Generate new route
            generateRouteFromPoints(routePoints, [...updatedCustomPoints]);

            message.success('Đã thêm điểm trung gian');
        } catch (error) {
            console.error("❌ Error adding custom point:", error);
            message.error("Có lỗi khi thêm điểm trung gian");
        }
    };

    // Remove a custom point
    const removeCustomPoint = (index: number) => {
        try {
            const pointToRemove = globalCustomPoints[index];

            // Save segment index, default to 1 if undefined
            const segmentIndex = pointToRemove.segmentIndex !== undefined ? pointToRemove.segmentIndex : 1;

            // Remove from global array
            globalCustomPoints.splice(index, 1);

            // Create a copy for further processing
            const updatedCustomPoints = [...globalCustomPoints];

            // Rename remaining points in same segment
            const updatedWithRenamedPoints = updatedCustomPoints.map(point => {
                if (point.segmentIndex === segmentIndex) {
                    // Find all points in same segment after removal
                    const pointsInSameSegment = updatedCustomPoints.filter(p => p.segmentIndex === segmentIndex);
                    const indexInSegment = pointsInSameSegment.indexOf(point);

                    // Determine segment name
                    let segmentName = "";
                    if (segmentIndex === 1) {
                        segmentName = "Điểm giao hàng - Điểm lấy hàng";
                    } else if (segmentIndex === 2) {
                        segmentName = "Điểm lấy hàng - Đơn vị vận chuyển";
                    } else {
                        segmentName = "Đoạn không xác định";
                    }

                    // Update point name - keep logic as stopover
                    return {
                        ...point,
                        name: `Stopover ${indexInSegment + 1} (${segmentName})`,
                        address: point.address.replace(/Stopover \d+/, `Stopover ${indexInSegment + 1}`)
                    };
                }
                return point;
            });

            // Update global array with renamed points
            globalCustomPoints.length = 0;
            globalCustomPoints.push(...updatedWithRenamedPoints);

            // Update state for UI
            setCustomPoints([...globalCustomPoints]);

            // Create new markers
            const allMarkers = createAllMarkers(routePoints, globalCustomPoints);
            setMarkers(allMarkers);

            // Generate new route
            generateRouteFromPoints(routePoints, [...globalCustomPoints]);

            message.success('Đã xóa điểm trung gian');
        } catch (error) {
            console.error("❌ Error removing custom point:", error);
            message.error("Có lỗi khi xóa điểm trung gian");
        }
    };


    if (loading) {
        return (
            <div className="text-center py-8">
                <Spin size="large" />
                <div className="mt-4 text-gray-600">Đang tạo lộ trình trả hàng...</div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-3" style={{ height: '580px' }}>
            {/* Left Column - Route Information & Controls */}
            <div className="flex flex-col overflow-hidden">
                {/* <Alert
                    message={<span className="text-sm font-semibold">Lộ trình trả hàng</span>}
                    description={
                        <div className="text-xs space-y-0.5">
                            <div><strong>Đoạn 1:</strong> Điểm giao hàng → Điểm lấy hàng</div>
                            <div><strong>Đoạn 2:</strong> Điểm lấy hàng → Đơn vị vận chuyển</div>
                            <div className="text-orange-600 mt-1">💰 Cước phí dựa trên khoảng cách trả hàng và khối lượng kiện</div>
                        </div>
                    }
                    type="info"
                    showIcon
                    className="mb-2 text-xs"
                /> */}
                
                {/* Segment Selection */}
                {segments.length > 0 && (
                    <div className="mb-2 p-2 bg-gray-50 rounded border border-gray-200">
                        <div className="text-xs font-semibold mb-1">Chọn đoạn thêm điểm:</div>
                        <select 
                            className="w-full p-1 border border-gray-300 rounded text-xs"
                            value={selectedSegmentIndex}
                            onChange={(e) => {
                                const newIndex = Number(e.target.value);
                                setSelectedSegmentIndex(newIndex);
                                selectedSegmentIndexRef.current = newIndex;
                            }}
                        >
                            {getCurrentSegments.map((segment: RouteSegment, index: number) => (
                                <option key={index} value={index}>
                                    Đoạn {segment.segmentOrder}: {translatePointName(segment.startName)} → {translatePointName(segment.endName)} 
                                    ({(segment.distance || 0).toFixed(2)} km)
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Custom Points List (VehicleAssignment style) */}
                {customPoints.length > 0 && (
                    <div className="mb-2">
                        <div className="text-xs font-semibold mb-1 text-green-600">Điểm trung gian đã thêm:</div>
                        <div className="space-y-1">
                            {customPoints.map((point, index) => (
                                <div key={index} className="flex items-center justify-between bg-green-50 border border-green-200 rounded p-2">
                                    <div className="flex items-center space-x-2 flex-1">
                                        <span className="text-green-600 font-bold text-xs">
                                            Đoạn {point.segmentIndex || 1}:
                                        </span>
                                        <div className="flex-1">
                                            <div className="font-medium text-green-800 text-xs">{point.name}</div>
                                            <div className="text-gray-600 text-xs">{point.address}</div>
                                        </div>
                                    </div>
                                    <Tooltip title="Xóa điểm trung gian">
                                        <Button
                                            type="text"
                                            danger
                                            size="small"
                                            icon={<CloseCircleOutlined />}
                                            onClick={() => removeCustomPoint(index)}
                                            className="ml-2"
                                        />
                                    </Tooltip>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Route Segments Legend */}
                <div className="mb-2 p-2 bg-gray-50 rounded border border-gray-200">
                    <div className="text-xs font-semibold mb-1">Chú thích:</div>
                    <div className="flex items-center space-x-4 text-xs">
                        <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#52c41a' }}></div>
                            <span>Điểm giao hàng → Điểm lấy hàng</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#722ed1' }}></div>
                            <span>Điểm lấy hàng → Đơn vị vận chuyển</span>
                        </div>
                    </div>
                </div>

                {/* Route Details */}
                {(() => {
                    const currentSegments = getCurrentSegments;
                    return currentSegments.length > 0 && (
                        <div className="flex-1 overflow-y-auto">
                            <h4 className="text-xs font-semibold mb-2">Chi tiết ({currentSegments.length} đoạn):</h4>
                            <div className="space-y-1">
                                {currentSegments.map((segment: any, index: number) => {
                                const segmentColor = segment.segmentColor || '#f0f0f0';
                                const textColor = segment.segmentOrder === 1 ? 'text-green-600' : 'text-purple-600';
                                const bgColor = segment.segmentOrder === 1 ? 'bg-green-50 border-green-200' : 'bg-purple-50 border-purple-200';
                                
                                return (
                                    <div key={index} className={`p-2 rounded border text-xs ${bgColor}`}>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 rounded" style={{ backgroundColor: segmentColor }}></div>
                                                <Tag color={segment.segmentOrder === 1 ? 'green' : 'purple'} className="text-xs px-1 py-0">
                                                    Đoạn {index + 1}
                                                </Tag>
                                                <span className="text-xs">
                                                    {segment.startName} → {segment.endName}
                                                </span>
                                            </div>
                                            <div className={`font-semibold text-xs ${textColor}`}>
                                                {segment.distance ? segment.distance.toFixed(2) : '0.00'} km
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Total Distance */}
                        <div className="mt-2 p-2 bg-indigo-100 rounded border border-indigo-300">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-indigo-800 text-xs">Tổng khoảng cách:</span>
                                <span className="font-bold text-indigo-800 text-sm">
                                    {currentSegments.reduce((total: number, segment: any) => total + (segment.distance || 0), 0).toFixed(2)} km
                                </span>
                            </div>
                        </div>
                    </div>
                );
                })()}

                {/* Fee Information */}
                {feeInfo && (
                    <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                        <h4 className="font-bold text-blue-800 mb-2 text-xs flex items-center">
                            <span className="mr-1">💰</span>
                            Cước phí trả hàng
                        </h4>
                        
                        {/* Package Details Section */}
                        {issue?.affectedOrderDetails && issue.affectedOrderDetails.length > 0 && (
                            <div className="mb-1.5 p-1.5 bg-white rounded border border-blue-200">
                                <div className="text-xs font-semibold text-blue-800 mb-1 flex items-center">
                                    <span className="mr-1">📦</span>
                                    Kiện hàng ({issue.affectedOrderDetails.length}):
                                </div>
                                {/* Compact inline list */}
                                <div className="space-y-0.5">
                                    {issue.affectedOrderDetails.map((pkg: any, index: number) => (
                                        <div key={index} className="text-xs flex items-center justify-between">
                                            <div className="flex items-center space-x-1 flex-1 min-w-0">
                                                <span className="text-blue-600 font-semibold flex-shrink-0">#{index + 1}</span>
                                                <span className="font-semibold text-gray-800 truncate">
                                                    {pkg.trackingCode}
                                                </span>
                                                {pkg.description && (
                                                    <span className="text-gray-500 truncate">- {pkg.description}</span>
                                                )}
                                            </div>
                                            {pkg.weightBaseUnit && (
                                                <span className="font-bold text-blue-700 ml-2 flex-shrink-0">
                                                    {pkg.weightBaseUnit.toFixed(2)} {pkg.unit || 'kg'}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {/* Total weight inline */}
                                {feeInfo.totalWeight && (
                                    <div className="mt-1 pt-1 border-t border-blue-200 flex justify-between items-center">
                                        <span className="text-xs font-semibold text-blue-800">Tổng:</span>
                                        <span className="text-xs font-bold text-blue-700">
                                            {feeInfo.totalWeight.toFixed(2)} kg
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="space-y-0.5 text-xs">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Khoảng cách:</span>
                                <span className="font-semibold text-blue-700">
                                    {feeInfo.distanceKm?.toFixed(2) || '0.00'} km
                                </span>
                            </div>
                            <div className="flex justify-between pt-0.5 border-t border-blue-200">
                                <span className="text-gray-600">Giá cước:</span>
                                <span className="font-semibold text-blue-700">
                                    {feeInfo.calculatedFee?.toLocaleString('vi-VN') || '0'} VNĐ
                                </span>
                            </div>
                            <div className="text-xs text-gray-500 italic">
                                • Dựa trên khoảng cách & trọng lượng
                            </div>
                            
                            {/* Adjust Fee Input */}
                            <div className="pt-1 border-t border-blue-200 mt-1">
                                <span className="text-gray-600 text-xs">Điều chỉnh giá:</span>
                                <InputNumber
                                    value={adjustedFee}
                                    onChange={(value) => {
                                        setAdjustedFee(value);
                                        if (onAdjustedFeeChange) {
                                            onAdjustedFeeChange(value);
                                        }
                                    }}
                                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, ''))}
                                    placeholder="Nhập nếu cần"
                                    className="w-full mt-0.5"
                                    size="small"
                                    min={0}
                                    suffix="VNĐ"
                                />
                            </div>

                            <div className="flex justify-between items-center pt-1 border-t border-blue-300 mt-1">
                                <span className="font-bold text-blue-900 text-xs">Giá cuối cùng:</span>
                                <span className="font-bold text-blue-900 text-sm">
                                    {(adjustedFee || feeInfo.calculatedFee)?.toLocaleString('vi-VN') || '0'} VNĐ
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Column - Map */}
            <div className="flex flex-col h-full">
                <VietMapMap
                    markers={markers}
                    onLocationChange={handleLocationChange}
                    mapLocation={currentMapLocation}
                    showRouteLines={segments.length > 0}
                    routeSegments={getCurrentSegments}
                    animateRoute={true}
                />
            </div>
        </div>
    );
};

// Memoize component to prevent re-renders when props don't change
export default React.memo(ReturnRoutePlanning, (prevProps, nextProps) => {
    // Only re-render if issueId or issue changes
    return prevProps.issueId === nextProps.issueId && 
           prevProps.issue === nextProps.issue;
});
