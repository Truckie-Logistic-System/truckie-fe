import React, { useState, useEffect, useRef } from 'react';
import {
    Card,
    Button,
    Descriptions,
    message,
    Spin,
    Tag,
    Divider,
    Alert,
    Space,
    Typography,
    Row,
    Col,
    Badge,
    Tooltip,
    Modal,
    App
} from 'antd';
import {
    EnvironmentOutlined,
    CarOutlined,
    InfoCircleOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    WarningOutlined,
    ArrowRightOutlined,
    DollarCircleOutlined
} from '@ant-design/icons';
import type { Issue } from '@/models/Issue';
import issueService from '@/services/issue';
import VietMapMap from '@/components/common/VietMapMap';
import type { MapLocation } from '@/models/Map';
import type { RouteSegment, RoutePoint } from '@/models/RoutePoint';
import routeService from '@/services/route';
import dayjs from 'dayjs';
import { translatePointName } from '@/models/JourneyHistory';

const { Title, Text } = Typography;

interface RerouteDetailProps {
    issue: Issue;
    onUpdate?: (issue: Issue) => void;
}

interface RerouteDetailInfo {
    issueId: string;
    status: string;
    description: string;
    reportedAt: string;
    resolvedAt?: string;
    locationLatitude?: number;
    locationLongitude?: number;
    affectedSegment?: {
        id: string;
        segmentOrder: number;
        startPointName: string;
        endPointName: string;
        startLatitude: number;
        startLongitude: number;
        endLatitude: number;
        endLongitude: number;
        distanceKilometers?: number;
        status: string;
        pathCoordinatesJson?: string;
    } | null;
    vehicleAssignment: {
        id: string;
        trackingCode: string;
        status: string;
        vehicle?: {
            id: string;
            licensePlateNumber: string;
            model?: string;
            vehicleType?: {
                id: string;
                vehicleTypeName: string;
            };
        } | null;
        driver1?: {
            id: string;
            fullName: string;
            phoneNumber?: string;
        } | null;
    };
    activeJourney?: { // ✅ Make optional - not always available
        id: string;
        journeyName: string;
        journeyType: string;
        status: string;
        journeySegments: Array<{
            id: string;
            segmentOrder: number;
            startPointName: string;
            endPointName: string;
            startLatitude: number;
            startLongitude: number;
            endLatitude: number;
            endLongitude: number;
            distanceKilometers: number;
            pathCoordinatesJson?: string;
        }>;
    };
    reroutedJourney?: {
        id: string;
        journeyName: string;
        journeyType: string;
        status: string;
        journeySegments?: Array<{
            id: string;
            segmentOrder: number;
            startPointName: string;
            endPointName: string;
            startLatitude: number;
            startLongitude: number;
            endLatitude: number;
            endLongitude: number;
            distanceKilometers: number;
            pathCoordinatesJson?: string;
        }>;
    };
    issueImages?: string[];
}

// Global variable to store custom waypoints
const globalCustomPoints: RoutePoint[] = [];

// Utility function to parse path coordinates JSON
const parsePathCoordinates = (pathJson: string | undefined): [number, number][] => {
    if (!pathJson) return [];
    try {
        const pathData = JSON.parse(pathJson);
        if (Array.isArray(pathData)) {
            return pathData.map((coord: any) => [
                parseFloat(coord[0]), // lng
                parseFloat(coord[1])  // lat
            ]);
        }
        return [];
    } catch (error) {
        console.error('Error parsing path coordinates:', error);
        return [];
    }
};

const RerouteDetail: React.FC<RerouteDetailProps> = ({ issue, onUpdate }) => {
    const { modal } = App.useApp();
    const [loading, setLoading] = useState<boolean>(false);
    const [detailInfo, setDetailInfo] = useState<RerouteDetailInfo | null>(null);
    const [processing, setProcessing] = useState(false);
    const [routingModalVisible, setRoutingModalVisible] = useState(false);
    const [routingLoading, setRoutingLoading] = useState(false);
    const [isGeneratingRoute, setIsGeneratingRoute] = useState(false);
    const [currentMapLocation, setCurrentMapLocation] = useState<MapLocation | null>(null);
    const [markers, setMarkers] = useState<MapLocation[]>([]);
    const [affectedSegmentPath, setAffectedSegmentPath] = useState<[number, number][]>([]);
    const [customPoints, setCustomPoints] = useState<RoutePoint[]>([]);
    const [customWaypoints, setCustomWaypoints] = useState<RoutePoint[]>([]);
    const [newRouteSegments, setNewRouteSegments] = useState<RouteSegment[]>([]);
    const [routeInfoFromAPI, setRouteInfoFromAPI] = useState<any>({
        totalDistance: 0,
        totalTollAmount: 0,
        totalTollCount: 0
    });
    const [error, setError] = useState<string | null>(null);

    const selectedSegmentIndexRef = useRef<number>(0);

    // Fetch reroute detail
    useEffect(() => {
        fetchRerouteDetail();
    }, [issue.id]);

    const fetchRerouteDetail = async () => {
        try {
            setLoading(true);
            
            // Try to get from dedicated API first, fallback to issue prop
            let response: RerouteDetailInfo;
            try {
                response = await issueService.getRerouteDetail(issue.id);
            } catch (apiError) {
                console.warn('getRerouteDetail API failed, using issue prop data:', apiError);
                // Fallback: construct from issue prop
                if (!issue.affectedSegment) {
                    throw new Error('Không có thông tin đoạn đường bị ảnh hưởng');
                }
                response = {
                    issueId: issue.id,
                    status: issue.status,
                    description: issue.description,
                    reportedAt: issue.reportedAt || '',
                    resolvedAt: issue.resolvedAt,
                    locationLatitude: issue.locationLatitude || undefined,
                    locationLongitude: issue.locationLongitude || undefined,
                    affectedSegment: {
                        id: issue.affectedSegment.id,
                        segmentOrder: issue.affectedSegment.segmentOrder,
                        startPointName: issue.affectedSegment.startPointName,
                        endPointName: issue.affectedSegment.endPointName,
                        startLatitude: issue.affectedSegment.startLatitude,
                        startLongitude: issue.affectedSegment.startLongitude,
                        endLatitude: issue.affectedSegment.endLatitude,
                        endLongitude: issue.affectedSegment.endLongitude,
                        distanceKilometers: issue.affectedSegment.distanceKilometers,
                        status: issue.affectedSegment.status || 'PENDING',
                        pathCoordinatesJson: issue.affectedSegment.pathCoordinatesJson
                    },
                    vehicleAssignment: {
                        id: issue.vehicleAssignmentEntity?.id || '',
                        trackingCode: issue.vehicleAssignmentEntity?.trackingCode || '',
                        status: issue.vehicleAssignmentEntity?.status || '',
                        vehicle: issue.vehicleAssignmentEntity?.vehicle,
                        driver1: issue.vehicleAssignmentEntity?.driver1
                    },
                    // activeJourney is optional - not available when using issue prop
                    issueImages: issue.issueImages,
                    reroutedJourney: issue.reroutedJourney
                } as RerouteDetailInfo;
            }
            
            setDetailInfo(response);

            // Debug: Log response data
            console.log('📍 Reroute Detail Response:', {
                hasAffectedSegment: !!response.affectedSegment,
                hasActiveJourney: !!response.activeJourney,
                activeJourneySegments: response.activeJourney?.journeySegments?.length || 0,
                affectedSegmentPath: response.affectedSegment?.pathCoordinatesJson ? 'exists' : 'missing'
            });

            // Parse affected segment path for map display
            if (response.affectedSegment?.pathCoordinatesJson) {
                try {
                    const pathData = JSON.parse(response.affectedSegment.pathCoordinatesJson);
                    // GeoJSON LineString expects [lng, lat] format - keep as is from backend
                    let parsedPath: [number, number][] = [];
                    if (Array.isArray(pathData)) {
                        // Direct array format: [[lng, lat], ...] - keep as is
                        parsedPath = pathData.map((coord: any) => [
                            parseFloat(coord[0]), // lng
                            parseFloat(coord[1])  // lat
                        ]);
                    } else if (pathData.coordinates) {
                        // Object with coordinates property
                        parsedPath = pathData.coordinates.map((coord: any) => [
                            coord.lng || coord[0],
                            coord.lat || coord[1]
                        ]);
                    }
                    setAffectedSegmentPath(parsedPath);
                    console.log('✅ Parsed affected segment path:', parsedPath.length, 'points');
                } catch (parseError) {
                    console.error('❌ Error parsing affected segment path coordinates:', parseError);
                }
            }

            // Debug: Check active journey segments
            if (response.activeJourney?.journeySegments) {
                console.log('🗺️ Active journey segments:', response.activeJourney.journeySegments.length);
                response.activeJourney.journeySegments.forEach((seg: any, idx: number) => {
                    console.log(`  Segment ${idx + 1}:`, {
                        hasPath: !!seg.pathCoordinatesJson,
                        startName: seg.startPointName,
                        endName: seg.endPointName
                    });
                });
            }

            // Set up markers for affected segment
            const segmentMarkers: MapLocation[] = [];
            
            if (response.affectedSegment) {
                // Start point marker
                segmentMarkers.push({
                    lat: response.affectedSegment.startLatitude,
                    lng: response.affectedSegment.startLongitude,
                    address: response.affectedSegment.startPointName,
                    name: 'Điểm đầu',
                    type: 'pickup',
                    id: 'segment-start'
                });

                // End point marker
                segmentMarkers.push({
                    lat: response.affectedSegment.endLatitude,
                    lng: response.affectedSegment.endLongitude,
                    address: response.affectedSegment.endPointName,
                    name: 'Điểm cuối',
                    type: 'delivery',
                    id: 'segment-end'
                });
            }

            // Issue location marker if available - use special icon ⚠️
            if (response.locationLatitude && response.locationLongitude) {
                segmentMarkers.push({
                    lat: response.locationLatitude,
                    lng: response.locationLongitude,
                    address: 'Vị trí báo cáo sự cố',
                    name: '⚠️ Vị trí sự cố',
                    type: 'stopover',
                    id: 'issue-location',
                    issueCategory: 'REROUTE' as any // Special marker for issue location
                });
            }

            setMarkers(segmentMarkers);
            console.log('🎯 Initial markers set:', segmentMarkers.length, 'markers');

            // Set initial map location to issue location or segment start
            if (response.locationLatitude && response.locationLongitude) {
                setCurrentMapLocation({
                    lat: response.locationLatitude,
                    lng: response.locationLongitude,
                    address: 'Vị trí sự cố'
                });
            } else if (response.affectedSegment) {
                setCurrentMapLocation({
                    lat: response.affectedSegment.startLatitude,
                    lng: response.affectedSegment.startLongitude,
                    address: response.affectedSegment.startPointName
                });
            }

        } catch (error: any) {
            message.error(error.message);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Generate new route with custom waypoints
    // Order: start → issue location → custom waypoints → end
    const generateRouteFromPoints = async (customWaypoints: RoutePoint[]) => {
        if (!detailInfo || !detailInfo.affectedSegment) return;

        try {
            setIsGeneratingRoute(true);

            const startPoint: RoutePoint = {
                addressId: '',
                lat: detailInfo.affectedSegment.startLatitude,
                lng: detailInfo.affectedSegment.startLongitude,
                address: detailInfo.affectedSegment.startPointName,
                name: detailInfo.affectedSegment.startPointName,
                type: 'pickup'
            };

            const endPoint: RoutePoint = {
                addressId: '',
                lat: detailInfo.affectedSegment.endLatitude,
                lng: detailInfo.affectedSegment.endLongitude,
                address: detailInfo.affectedSegment.endPointName,
                name: detailInfo.affectedSegment.endPointName,
                type: 'delivery'
            };

            // Include issue location in route (driver must pass through it)
            const issuePoint: RoutePoint | null = (detailInfo.locationLatitude && detailInfo.locationLongitude) ? {
                addressId: '',
                lat: detailInfo.locationLatitude,
                lng: detailInfo.locationLongitude,
                address: 'Vị trí sự cố',
                name: 'Vị trí sự cố',
                type: 'stopover'
            } : null;

            // Order: start → issue → custom waypoints → end
            const routePoints = issuePoint 
                ? [startPoint, issuePoint, ...customWaypoints, endPoint]
                : [startPoint, ...customWaypoints, endPoint];

            // Backend expects coordinates as [lng, lat] format
            const coordinates: [number, number][] = routePoints.map(point => [point.lng, point.lat]);
            const pointTypes: ('carrier' | 'pickup' | 'delivery' | 'stopover')[] = routePoints.map(point => point.type);
            
            // Get vehicleTypeId from vehicleType, not from vehicle
            const vehicleTypeId = detailInfo.vehicleAssignment?.vehicle?.vehicleType?.id || 
                                 '00000000-0000-0000-0000-000000000000';

            const request = {
                points: coordinates,
                pointTypes: pointTypes,
                vehicleTypeId: vehicleTypeId
            };
            
            console.log('🚗 Suggest Route Request:', {
                pointsCount: coordinates.length,
                includesIssuePoint: !!issuePoint,
                customWaypointsCount: customWaypoints.length,
                vehicleTypeId: vehicleTypeId,
                order: issuePoint ? 'start → issue → waypoints → end' : 'start → waypoints → end',
                firstPoint: coordinates[0],
                lastPoint: coordinates[coordinates.length - 1]
            });

            const response = await routeService.suggestRoute(request) as any;

            if (response.segments && response.segments.length > 0) {
                setNewRouteSegments(response.segments as any);
                setRouteInfoFromAPI({
                    totalDistance: response.totalDistance || 0,
                    totalTollAmount: response.totalTollAmount || 0,
                    totalTollCount: response.totalTollCount || 0
                });

                message.success('Đã tạo lộ trình mới thành công');
            }
        } catch (error: any) {
            message.error('Lỗi khi tạo lộ trình: ' + error.message);
        } finally {
            setIsGeneratingRoute(false);
        }
    };

    // Helper function to create all markers from base points and custom points
    const createAllMarkers = (customPts: RoutePoint[]): MapLocation[] => {
        const timestamp = Date.now();
        const baseMarkers: MapLocation[] = [];

        // Add affected segment START marker (green 📦)
        if (detailInfo?.affectedSegment) {
            baseMarkers.push({
                lat: detailInfo.affectedSegment.startLatitude,
                lng: detailInfo.affectedSegment.startLongitude,
                address: detailInfo.affectedSegment.startPointName,
                name: 'Điểm đầu',
                type: 'pickup',
                id: `segment-start-${timestamp}`
            });

            // Add affected segment END marker (red 🎯)
            baseMarkers.push({
                lat: detailInfo.affectedSegment.endLatitude,
                lng: detailInfo.affectedSegment.endLongitude,
                address: detailInfo.affectedSegment.endPointName,
                name: 'Điểm cuối',
                type: 'delivery',
                id: `segment-end-${timestamp}`
            });
        }

        // Add ISSUE location marker (🚧 orange construction icon) - ALWAYS SHOW
        if (detailInfo?.locationLatitude && detailInfo?.locationLongitude) {
            baseMarkers.push({
                lat: detailInfo.locationLatitude,
                lng: detailInfo.locationLongitude,
                address: 'Vị trí báo cáo sự cố',
                name: '🚧 Vị trí sự cố',
                type: 'stopover',
                id: `issue-location-${timestamp}`,
                issueCategory: 'REROUTE' as any
            });
        }

        // Add CUSTOM WAYPOINT markers (blue 📍) - additional to issue point
        const customMarkers = customPts.map((point, i) => ({
            lat: point.lat,
            lng: point.lng,
            address: point.address || `Điểm trung gian ${i + 1}`,
            name: `Điểm TG ${i + 1}`,
            type: 'stopover' as const,
            id: `custom-waypoint-${point.lat}-${point.lng}-${timestamp}-${i}`
        }));

        return [...baseMarkers, ...customMarkers];
    };

    // Handle map waypoint addition
    const handleMapPointAdded = (point: MapLocation) => {
        console.log('📍 [WAYPOINT] Adding waypoint:', point);
        console.log('📍 [WAYPOINT] BEFORE - globalCustomPoints.length:', globalCustomPoints.length);
        
        // ✅ FIX: Use globalCustomPoints.length as source of truth (like RoutePlanningStep.tsx)
        const newPoint: RoutePoint = {
            addressId: '',
            lat: point.lat,
            lng: point.lng,
            address: point.address || 'Điểm trung gian',
            name: `Điểm trung gian ${globalCustomPoints.length + 1}`,
            type: 'stopover'
        };

        console.log('📍 [WAYPOINT] New point:', newPoint);
        
        // ✅ FIX: Push directly to globalCustomPoints (source of truth)
        globalCustomPoints.push(newPoint);
        console.log('📍 [WAYPOINT] AFTER - globalCustomPoints.length:', globalCustomPoints.length);
        
        // ✅ FIX: Create new array from globalCustomPoints for state update
        const updatedPoints = [...globalCustomPoints];
        console.log('📍 [WAYPOINT] Updated points from global:', updatedPoints.length);
        
        // Update state for UI rendering
        setCustomPoints(updatedPoints);

        // Update markers to include new custom point
        const updatedMarkers = createAllMarkers(updatedPoints);
        console.log('📍 [WAYPOINT] Updated markers count:', updatedMarkers.length);
        setMarkers(updatedMarkers);

        // Auto-generate route after adding waypoint
        generateRouteFromPoints(updatedPoints);
    };

    // Handle remove waypoint
    const handleRemoveWaypoint = (index: number) => {
        const updatedPoints = customPoints.filter((_, i) => i !== index);
        setCustomPoints(updatedPoints);
        globalCustomPoints.length = 0;
        globalCustomPoints.push(...updatedPoints);

        // Update markers to exclude removed point
        const updatedMarkers = createAllMarkers(updatedPoints);
        setMarkers(updatedMarkers);

        // Regenerate route
        if (updatedPoints.length === 0) {
            setNewRouteSegments([]);
            setRouteInfoFromAPI({
                totalDistance: 0,
                totalTollAmount: 0,
                totalTollCount: 0
            });
        } else {
            generateRouteFromPoints(updatedPoints);
        }
    };

    // Submit complete journey with replaced segment
    const handleSubmitReroute = async () => {
        console.log('🔍 [DEBUG] handleSubmitReroute called');
        console.log('🔍 [DEBUG] detailInfo:', !!detailInfo);
        console.log("detail info", detailInfo)
        console.log('🔍 [DEBUG] newRouteSegments.length:', newRouteSegments.length);
        
        if (!detailInfo || newRouteSegments.length === 0) {
            console.log('🔍 [DEBUG] Failed validation: detailInfo or newRouteSegments');
            message.error('Vui lòng tạo lộ trình mới trước khi submit');
            return;
        }

        console.log('🔍 [DEBUG] detailInfo.activeJourney:', !!detailInfo.activeJourney);
        console.log('🔍 [DEBUG] detailInfo.activeJourney.journeySegments:', !!detailInfo.activeJourney?.journeySegments);

        if (!detailInfo.activeJourney || !detailInfo.activeJourney.journeySegments) {
            console.log('🔍 [DEBUG] Failed validation: activeJourney or journeySegments');
            message.error('Không tìm thấy thông tin journey hiện tại');
            return;
        }

        console.log('🔍 [DEBUG] detailInfo.affectedSegment:', !!detailInfo.affectedSegment);

        if (!detailInfo.affectedSegment) {
            console.log('🔍 [DEBUG] Failed validation: affectedSegment');
            message.error('Không tìm thấy thông tin đoạn bị ảnh hưởng');
            return;
        }

        console.log('🔍 [DEBUG] All validations passed, showing modal...');

        // Show confirmation dialog
        console.log('🔍 [DEBUG] About to call modal.confirm...');
        
        modal.confirm({
            title: 'Xác nhận xử lý tái định tuyến',
            content: (
                <div>
                    <p style={{ marginBottom: 16, fontSize: 15 }}>
                        Bạn có chắc chắn muốn xác nhận lộ trình mới này?
                    </p>
                    <div style={{ 
                        background: '#f5f5f5', 
                        padding: 16, 
                        borderRadius: 6,
                        marginBottom: 16
                    }}>
                        <p style={{ 
                            fontWeight: 'bold', 
                            marginBottom: 12, 
                            color: '#1890ff',
                            fontSize: 14
                        }}>
                            📍 Thông tin lộ trình:
                        </p>
                        <ul style={{ 
                            margin: 0, 
                            paddingLeft: 20,
                            lineHeight: '1.8'
                        }}>
                            <li style={{ marginBottom: 4 }}>
                                <strong>Tổng quãng đường:</strong> {routeInfoFromAPI.totalDistance.toFixed(1)} km
                            </li>
                            <li style={{ marginBottom: 4 }}>
                                <strong>Phí cầu đường:</strong> {routeInfoFromAPI.totalTollAmount.toLocaleString()} đ
                            </li>
                            <li style={{ marginBottom: 4 }}>
                                <strong>Số trạm cầu:</strong> {routeInfoFromAPI.totalTollCount}
                            </li>
                        </ul>
                    </div>
                </div>
            ),
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            okType: 'primary',
            width: 520,
            onOk: async () => {
                console.log('🔍 [DEBUG] Modal confirmed, processing...');
                await processRerouteSubmission();
            },
            onCancel: () => {
                console.log('🔍 [DEBUG] Modal cancelled');
            }
        });
        
        console.log('🔍 [DEBUG] modal.confirm called');
    };

    // Process the actual reroute submission
    const processRerouteSubmission = async () => {
        if (!detailInfo || newRouteSegments.length === 0) {
            message.error('Vui lòng tạo lộ trình mới trước khi submit');
            return;
        }

        if (!detailInfo.activeJourney || !detailInfo.activeJourney.journeySegments) {
            message.error('Không tìm thấy thông tin journey hiện tại');
            return;
        }

        if (!detailInfo.affectedSegment) {
            message.error('Không tìm thấy thông tin đoạn bị ảnh hưởng');
            return;
        }

        try {
            setProcessing(true);

            const affectedSegment = detailInfo.affectedSegment; // Capture for type safety
            const affectedSegmentOrder = affectedSegment.segmentOrder;
            
            // Build complete journey: replace affected segment with new route segments
            const completeJourneySegments: any[] = [];
            
            // Get all active journey segments
            const activeSegments = detailInfo.activeJourney.journeySegments;
            
            activeSegments.forEach((seg: any) => {
                if (seg.segmentOrder === affectedSegmentOrder) {
                    // Replace affected segment with new route segments
                    // Merge all new route segments into a single segment (start → end of affected segment)
                    
                    // Parse toll details from newRouteSegments
                    let tollDetails: any[] = [];
                    try {
                        const firstSegmentTolls = (newRouteSegments[0] as any)?.tollDetailsJson;
                        if (firstSegmentTolls) {
                            tollDetails = typeof firstSegmentTolls === 'string' 
                                ? JSON.parse(firstSegmentTolls) 
                                : firstSegmentTolls;
                        }
                    } catch (e) {
                        console.warn('Failed to parse toll details:', e);
                        tollDetails = [];
                    }
                    
                    const mergedSegment = {
                        segmentOrder: affectedSegmentOrder,
                        startPointName: affectedSegment.startPointName, // Keep original: Carrier/Pickup/Delivery only
                        endPointName: affectedSegment.endPointName, // Keep original: Carrier/Pickup/Delivery only
                        startLatitude: affectedSegment.startLatitude,
                        startLongitude: affectedSegment.startLongitude,
                        endLatitude: affectedSegment.endLatitude,
                        endLongitude: affectedSegment.endLongitude,
                        distanceKilometers: routeInfoFromAPI.totalDistance, // Total distance in KM (preserve decimal precision)
                        estimatedTollFee: routeInfoFromAPI.totalTollAmount,
                        // ✅ Merge all stopover paths into one segment path (stopovers not saved to DB)
                        pathCoordinatesJson: JSON.stringify(
                            newRouteSegments.flatMap((s: any) => {
                                try {
                                    const parsed = typeof s.path === 'string' ? JSON.parse(s.path) : s.path;
                                    return Array.isArray(parsed) ? parsed : [];
                                } catch {
                                    return s.path || [];
                                }
                            })
                        ),
                        tollDetails: tollDetails // Array of toll objects, not JSON string
                    };
                    completeJourneySegments.push(mergedSegment);
                } else {
                    // Keep other segments unchanged
                    // Parse toll details for existing segments
                    let existingTollDetails: any[] = [];
                    try {
                        if (seg.tollDetailsJson) {
                            const parsed = typeof seg.tollDetailsJson === 'string' 
                                ? JSON.parse(seg.tollDetailsJson) 
                                : seg.tollDetailsJson;
                            existingTollDetails = Array.isArray(parsed) ? parsed : [];
                        }
                    } catch (e) {
                        console.warn('Failed to parse existing toll details:', e);
                        existingTollDetails = [];
                    }
                    
                    completeJourneySegments.push({
                        segmentOrder: seg.segmentOrder,
                        startPointName: seg.startPointName,
                        endPointName: seg.endPointName,
                        startLatitude: seg.startLatitude,
                        startLongitude: seg.startLongitude,
                        endLatitude: seg.endLatitude,
                        endLongitude: seg.endLongitude,
                        distanceKilometers: seg.distanceKilometers, // Distance in KM (preserve decimal precision)
                        estimatedTollFee: existingTollDetails.reduce((sum: number, toll: any) => {
                            return sum + (toll.amount || 0);
                        }, 0), // Calculate from toll details
                        pathCoordinatesJson: seg.pathCoordinatesJson || '',
                        tollDetails: existingTollDetails // Array of toll objects
                    });
                }
            });

            // Calculate totals for the COMPLETE journey (all segments)
            const totalDistanceKm = completeJourneySegments.reduce((sum, seg) => {
                return sum + seg.distanceKilometers; // Distance in KM
            }, 0);

            // Calculate total toll fee for complete journey
            const totalTollFee = completeJourneySegments.reduce((sum, seg) => {
                return sum + (seg.estimatedTollFee || 0);
            }, 0);

            // Calculate total toll count for complete journey
            const totalTollCount = completeJourneySegments.reduce((sum, seg) => {
                const tollsInSegment = seg.tollDetails?.length || 0;
                return sum + tollsInSegment;
            }, 0);

            const request = {
                issueId: issue.id,
                newRouteSegments: completeJourneySegments, // Complete journey with replaced segment
                totalTollFee: totalTollFee, // Total toll fee for complete journey
                totalTollCount: totalTollCount, // Total toll count for complete journey
                totalDistance: totalDistanceKm // Total distance of complete journey in km
            };

            console.log('📤 Submitting complete journey:', {
                totalSegments: completeJourneySegments.length,
                replacedSegmentOrder: affectedSegmentOrder,
                newSegmentDistance: routeInfoFromAPI.totalDistance,
                totalJourneyDistance: totalDistanceKm.toFixed(2) + ' km',
                totalTollFee: totalTollFee,
                totalTollCount: totalTollCount
            });
            
            console.log('📦 Request structure:', JSON.stringify(request, null, 2));

            await issueService.processReroute(request);

            message.success('Đã xử lý tái định tuyến thành công! Driver sẽ nhận được thông báo.');

            // Refresh detail
            await fetchRerouteDetail();

            if (onUpdate) {
                const updatedIssue = await issueService.getIssueById(issue.id);
                onUpdate(updatedIssue);
            }
        } catch (error: any) {
            message.error(error.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" tip="Đang tải chi tiết tái định tuyến..." />
            </div>
        );
    }

    if (!detailInfo) {
        return <Alert message="Không tìm thấy thông tin chi tiết" type="error" />;
    }

    // Check if required data exists for REROUTE
    if (!detailInfo.affectedSegment) {
        return (
            <Alert 
                message="Dữ liệu không đầy đủ" 
                description="Sự cố này thiếu thông tin đoạn đường bị ảnh hưởng. Vui lòng kiểm tra lại hoặc liên hệ admin."
                type="error" 
                showIcon
            />
        );
    }

    const isResolved = detailInfo.status === 'RESOLVED';

    return (
        <div>
            {/* Single Card for All Reroute Information */}
            <Card 
                style={{ 
                    marginBottom: 16,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
            >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {/* Prominent Header Section */}
                    <div style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        padding: '20px',
                        borderRadius: '8px',
                        margin: '-24px -24px 0 -24px'
                    }}>
                        <Row align="middle" gutter={16}>
                            <Col>
                                <WarningOutlined style={{ fontSize: 32, color: '#fff' }} />
                            </Col>
                            <Col flex="auto">
                                <Title level={4} style={{ color: '#fff', margin: 0 }}>
                                    Xử Lý Tái Định Tuyến
                                </Title>
                                <Text style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                                    Sự cố: Kẹt xe / Cần thay đổi tuyến đường
                                </Text>
                            </Col>
                            <Col>
                                <Tag 
                                    color={isResolved ? 'success' : 'warning'} 
                                    style={{ fontSize: 14, padding: '4px 12px' }}
                                >
                                    {isResolved ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                                    {' '}{isResolved ? 'Đã xử lý' : 'Đang chờ xử lý'}
                                </Tag>
                            </Col>
                        </Row>
                    </div>

                    {/* Status Alert */}
                    <div style={{ marginTop: 16 }}>
                        {isResolved ? (
                            <Alert
                                message="Sự cố đã được xử lý"
                                description={`Đã tạo lộ trình mới và thông báo cho tài xế lúc ${dayjs(detailInfo.resolvedAt).format('DD/MM/YYYY HH:mm')}`}
                                type="success"
                                icon={<CheckCircleOutlined />}
                                showIcon
                            />
                        ) : (
                            <Alert
                                message="Đang chờ xử lý"
                                description="Vui lòng tạo lộ trình mới để tránh khu vực gặp sự cố"
                                type="warning"
                                icon={<WarningOutlined />}
                                showIcon
                            />
                        )}
                    </div>

                    {/* Affected Segment Info */}
                    <div>
                        <Title level={5} style={{ marginBottom: 16, color: '#ff4d4f' }}>
                            <WarningOutlined /> Đoạn đường gặp sự cố
                        </Title>
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            <div>
                                <Text strong style={{ fontSize: 16 }}>
                                    <EnvironmentOutlined style={{ color: '#1890ff' }} /> {translatePointName(detailInfo.affectedSegment.startPointName)}
                                    {' '}<ArrowRightOutlined style={{ color: '#999' }} />{' '}
                                    <EnvironmentOutlined style={{ color: '#52c41a' }} /> {translatePointName(detailInfo.affectedSegment.endPointName)}
                                </Text>
                            </div>
                            <div>
                                <Tag color="red" style={{ fontSize: 14 }}>
                                    Khoảng cách: {detailInfo.affectedSegment.distanceKilometers?.toFixed(1) || 'N/A'} km
                                </Tag>
                            </div>
                        </Space>
                    </div>

                    <Divider />

                    {/* Map with Affected Segment */}
                    <div>
                        <Title level={5} style={{ marginBottom: 16 }}>
                            <EnvironmentOutlined /> Bản đồ tái định tuyến
                        </Title>
                        {!isResolved && (
                            <Alert
                                message="Hướng dẫn tái định tuyến"
                                description={
                                    <div>
                                        <p style={{ marginBottom: 8 }}>
                                            • <strong style={{ color: '#ff4d4f' }}>Đường ĐỎ ĐỨT NÉT (- - -):</strong> Đoạn gặp sự cố cần tránh
                                        </p>
                                        <p style={{ marginBottom: 8 }}>
                                            • <strong style={{ color: '#ff7a45' }}>Marker 🚧:</strong> Vị trí báo cáo sự cố (lộ trình mới sẽ đi qua đây)
                                        </p>
                                        {newRouteSegments.length > 0 && (
                                            <p style={{ marginBottom: 8 }}>
                                                • <strong style={{ color: '#52c41a' }}>Đường XANH LÁ LIỀN:</strong> Lộ trình mới đề xuất
                                            </p>
                                        )}
                                        <p style={{ marginBottom: 8 }}>
                                            • <strong>Click vào bản đồ</strong> để thêm điểm trung gian
                                        </p>
                                        <p style={{ marginBottom: 0, marginTop: 4, fontSize: '12px', color: '#666' }}>
                                            💡 Có thể chọn nhiều điểm! Lộ trình: Đầu → 🚧 Sự cố → 📍 TG1 → 📍 TG2... → Cuối
                                        </p>
                                    </div>
                                }
                                type="info"
                                showIcon
                                style={{ marginBottom: 12 }}
                            />
                        )}

                        {/* Custom Waypoints List - MOVED ABOVE MAP for better UX */}
                        {customPoints.length > 0 && (
                            <div style={{ marginBottom: 16 }}>
                                <Title level={5} style={{ marginBottom: 12, color: '#1890ff' }}>
                                    <EnvironmentOutlined /> Điểm trung gian đã chọn ({customPoints.length})
                                </Title>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {customPoints.map((point, index) => (
                                        <Tag 
                                            key={index}
                                            closable={!isResolved}
                                            onClose={() => handleRemoveWaypoint(index)}
                                            color="blue"
                                            style={{ 
                                                padding: '4px 12px', 
                                                fontSize: '14px',
                                                margin: 0
                                            }}
                                        >
                                            📍 Điểm trung gian {index + 1}
                                        </Tag>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {currentMapLocation && (
                            <div style={{ height: '500px', position: 'relative' }}>
                                <VietMapMap
                                    mapLocation={currentMapLocation}
                                    markers={markers}
                                    onLocationChange={(location) => setCurrentMapLocation(location)}
                                    onMapClick={!isResolved ? handleMapPointAdded : undefined}
                                    showRouteLines={true}
                                    routeSegments={(() => {
                                        const segments = isResolved && detailInfo.reroutedJourney?.journeySegments ? 
                                            // ✅ RESOLVED: Show complete rerouted journey
                                            detailInfo.reroutedJourney.journeySegments.map((seg: any, idx: number) => ({
                                                segmentOrder: idx + 1,
                                                startName: seg.startPointName,
                                                endName: seg.endPointName,
                                                path: parsePathCoordinates(seg.pathCoordinatesJson),
                                                distance: seg.distanceKilometers,
                                                tolls: [],
                                                segmentColor: '#52c41a',
                                                lineWidth: 5,
                                                lineOpacity: 0.9,
                                                rawResponse: {}
                                            })) as RouteSegment[]
                                            : 
                                            // ❌ NOT RESOLVED: Show affected segment + new route preview
                                            [
                                                // ❌ AFFECTED SEGMENT - RED DASHED LINE
                                                ...(detailInfo.affectedSegment ? [{
                                                    segmentOrder: 1,
                                                    startName: detailInfo.affectedSegment.startPointName,
                                                    endName: detailInfo.affectedSegment.endPointName,
                                                    path: parsePathCoordinates(detailInfo.affectedSegment.pathCoordinatesJson),
                                                    distance: detailInfo.affectedSegment.distanceKilometers || 0,
                                                    tolls: [],
                                                    segmentColor: '#ff4d4f',
                                                    lineWidth: 4,
                                                    lineDasharray: [10, 5],
                                                    lineOpacity: 0.7,
                                                    rawResponse: {}
                                                }] : []),
                                                // ✅ NEW ROUTE SEGMENTS - SOLID GREEN LINE
                                                ...newRouteSegments.map((seg: any) => ({
                                                    ...seg,
                                                    segmentColor: '#52c41a',
                                                    lineWidth: 5,
                                                    lineOpacity: 0.9
                                                }))
                                            ] as RouteSegment[];
                                        
                                        console.log('🗺️ Rendering segments on map:', {
                                            isResolved,
                                            segmentCount: segments.length,
                                            segments: segments.map(s => ({
                                                startName: s.startName,
                                                endName: s.endName,
                                                pathLength: s.path?.length || 0,
                                                color: s.segmentColor,
                                                dasharray: s.lineDasharray
                                            }))
                                        });
                                        
                                        return segments;
                                    })()}
                                />
                            </div>
                        )}
                    </div>


                    {/* Waypoint section moved above map - remove duplicate here */}

                    {/* New Route Summary - Only show when NOT resolved */}
                    {!isResolved && newRouteSegments.length > 0 && (
                        <>
                            <Divider />
                            <div style={{ 
                                background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                                borderRadius: '8px',
                                padding: '16px 20px',
                                boxShadow: '0 2px 8px rgba(82, 196, 26, 0.15)'
                            }}>
                                <Row gutter={24} align="middle">
                                    <Col span={6}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ color: 'white', opacity: 0.9, fontSize: '12px', marginBottom: 4 }}>Tổng quãng đường</div>
                                            <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                                                {routeInfoFromAPI.totalDistance.toFixed(1)} km
                                            </div>
                                        </div>
                                    </Col>
                                    <Col span={1}>
                                        <div style={{ height: '40px', width: '1px', background: 'rgba(255,255,255,0.3)' }} />
                                    </Col>
                                    <Col span={8}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ color: 'white', opacity: 0.9, fontSize: '12px', marginBottom: 4 }}>Phí cầu đường</div>
                                            <div style={{ color: 'white', fontSize: '22px', fontWeight: 'bold' }}>
                                                <DollarCircleOutlined /> {routeInfoFromAPI.totalTollAmount.toLocaleString()} đ
                                            </div>
                                        </div>
                                    </Col>
                                    <Col span={1}>
                                        <div style={{ height: '40px', width: '1px', background: 'rgba(255,255,255,0.3)' }} />
                                    </Col>
                                    <Col span={6}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ color: 'white', opacity: 0.9, fontSize: '12px', marginBottom: 4 }}>Số trạm</div>
                                            <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                                                {routeInfoFromAPI.totalTollCount}
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                        </>
                    )}

                    {/* Action Buttons */}
                    {!isResolved && (
                        <>
                            <Divider />
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<CheckCircleOutlined />}
                                    onClick={handleSubmitReroute}
                                    loading={processing}
                                    disabled={newRouteSegments.length === 0}
                                >
                                    Xác nhận lộ trình mới
                                </Button>
                            </div>
                        </>
                    )}

                    {/* Rerouted Journey Info (if resolved) */}
                    {/* {isResolved && detailInfo.reroutedJourney && (
                        <>
                            <Divider />
                            <div>
                                <Title level={5} style={{ marginBottom: 16 }}>
                                    <CheckCircleOutlined /> Lộ trình mới đã tạo
                                </Title>
                                <Descriptions bordered column={2}>
                                    <Descriptions.Item label="Tên lộ trình">
                                        {detailInfo.reroutedJourney.journeyName}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Loại">
                                        <Tag color="blue">{detailInfo.reroutedJourney.journeyType}</Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Trạng thái" span={2}>
                                        <Tag color="success">{detailInfo.reroutedJourney.status}</Tag>
                                    </Descriptions.Item>
                                </Descriptions>
                            </div>
                        </>
                    )} */}
                </Space>
            </Card>
        </div>
    );
};

export default RerouteDetail;
