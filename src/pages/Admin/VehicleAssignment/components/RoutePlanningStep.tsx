import React, { useEffect, useState, useRef } from 'react';
import { Button, Card, Spin, Typography, App, Tooltip, Tag, Row, Col, Divider, Space, Badge, Modal } from 'antd';
import routeService from '../../../../services/route';
import type { RoutePoint, RouteSegment, SuggestRouteRequest, RouteInfoFromAPI } from '../../../../models/RoutePoint';
import type { Vehicle } from '../../../../models';
import type { MapLocation } from '@/models/Map';
import VietMapMap from '../../../../components/common/VietMapMap';
import { convertRouteSegmentsToRouteInfo } from '../../../../utils/routeUtils';
import type { RouteInfo } from '../../../../models/VehicleAssignment';
import {
    CloseCircleOutlined,
    PlusOutlined,
    LoadingOutlined,
    EnvironmentOutlined,
    CarOutlined,
    DollarCircleOutlined,
    InfoCircleOutlined,
    ArrowRightOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

// Global variable to store custom points
// This will persist across renders and state updates
const globalCustomPoints: RoutePoint[] = [];

interface RoutePlanningStepProps {
    orderId: string;
    vehicleId: string;
    vehicle?: Vehicle;
    onComplete: (segments: RouteSegment[], routeInfo: RouteInfo) => void;
    onBack: () => void;
}

const RoutePlanningStep: React.FC<RoutePlanningStepProps> = ({
    orderId,
    vehicleId,
    vehicle,
    onComplete,
    onBack,
}) => {
    const { message, modal } = App.useApp();
    const [loading, setLoading] = useState<boolean>(true);
    const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
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
    const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number>(0); // Đoạn đường hiện tại đang được chọn
    // Sử dụng ref để theo dõi giá trị mới nhất của selectedSegmentIndex
    const selectedSegmentIndexRef = useRef<number>(0);

    // Fetch route points
    useEffect(() => {
        const fetchRoutePoints = async () => {
            try {
                setLoading(true);
                // Clear the global custom points array
                globalCustomPoints.length = 0;
                setCustomPoints([]);

                const response = await routeService.getOrderPoints(orderId);

                // Kiểm tra cấu trúc response
                // Truy cập đúng cấu trúc response - API trả về trực tiếp points
                const points = response.points || [];
                setRoutePoints(points);

                // Convert route points to map markers
                const mapMarkers = points.map((point: RoutePoint) => ({
                    lat: point.lat,
                    lng: point.lng,
                    address: point.address,
                    name: point.name,
                    type: point.type,
                    id: `${point.type}-${point.lat}-${point.lng}` // Thêm id duy nhất
                }));

                setMarkers(mapMarkers);

                // Set initial map location to first point (usually carrier)
                if (points.length > 0) {
                    const firstPoint = points[0];
                    setCurrentMapLocation({
                        lat: firstPoint.lat,
                        lng: firstPoint.lng,
                        address: firstPoint.address
                    });

                    // Sau khi lấy được points, gọi ngay API suggest route
                    if (points.length >= 2) {
                        await generateRouteFromPoints(points, []);
                    }
                }
            } catch (error) {
                console.error('Error fetching route points:', error);
                message.error('Không thể lấy thông tin điểm đường đi');
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            fetchRoutePoints();
        }
    }, [orderId, message]);

    // Cleanup khi component unmount
    useEffect(() => {
        return () => {
            setMarkers([]);
        };
    }, []);

    // Handle map location change (when user clicks on map)
    const handleLocationChange = (location: MapLocation) => {
        try {
            // Log the current state of customPoints
            logRouteState("BEFORE ADDING NEW STOPOVER");

            setCurrentMapLocation(location);

            // Lấy thông tin đoạn đường đã chọn từ ref để đảm bảo lấy giá trị mới nhất
            const selectedIndex = selectedSegmentIndexRef.current;
            // Get the actual segments including stopovers
            const currentSegments = getCurrentSegments();

            // Make sure the selected index is valid
            if (selectedIndex >= currentSegments.length) {
                console.error("Invalid segment index:", selectedIndex);
                message.error("Đoạn đường không hợp lệ");
                return;
            }

            // Get the selected segment
            const selectedSegment = currentSegments[selectedIndex];

            // CRITICAL FIX: Use the original segment index (0, 1, 2)
            // We need to determine which original segment this belongs to
            // The segmentOrder property contains the original segment index
            const segmentIndex = selectedSegment.segmentOrder;

            // Verify the segment index is valid
            if (segmentIndex === undefined || segmentIndex < 0 || segmentIndex > 2) {
                console.error("Invalid segment order:", segmentIndex);
                message.error("Đoạn đường không hợp lệ");
                return;
            }
            // Xác định tên đoạn đường
            let segmentName = "";
            let startName = "";
            let endName = "";

            // Chuyển đổi tên điểm thành tiếng Việt dễ hiểu
            startName = selectedSegment.startName === 'Carrier' ? 'ĐVVC' :
                selectedSegment.startName === 'Pickup' ? 'Điểm lấy hàng' :
                    selectedSegment.startName === 'Delivery' ? 'Điểm giao hàng' :
                        selectedSegment.startName === 'Stopover' ? 'Điểm trung gian' :
                            selectedSegment.startName;

            endName = selectedSegment.endName === 'Carrier' ? 'ĐVVC' :
                selectedSegment.endName === 'Pickup' ? 'Điểm lấy hàng' :
                    selectedSegment.endName === 'Delivery' ? 'Điểm giao hàng' :
                        selectedSegment.endName === 'Stopover' ? 'Điểm trung gian' :
                            selectedSegment.endName.startsWith('Quay về') ? 'ĐVVC (Quay về)' :
                                selectedSegment.endName;

            segmentName = `${startName}-${endName}`;

            // Đếm số điểm trung gian hiện tại cho đoạn này
            const currentSegmentStopoverCount = globalCustomPoints.filter(p => p.segmentIndex === segmentIndex).length;

            // Create a new custom point with explicit segmentIndex
            const newCustomPoint: RoutePoint = {
                name: `Điểm trung gian ${currentSegmentStopoverCount + 1} (${segmentName})`,
                type: 'stopover',
                lat: location.lat,
                lng: location.lng,
                address: location.address || `Điểm trung gian ${currentSegmentStopoverCount + 1}`,
                addressId: '',
                segmentIndex: segmentIndex // Explicitly set segmentIndex
            };
            // Add to global custom points array
            globalCustomPoints.push(newCustomPoint);

            // Also update the state for UI rendering
            const updatedCustomPoints = [...globalCustomPoints];
            // Set the state with the new array
            setCustomPoints(updatedCustomPoints);

            // Tạo mảng markers mới với ID mới
            const allMarkers = createAllMarkers(routePoints, updatedCustomPoints);
            // Cập nhật markers
            setMarkers(allMarkers);

            // Tạo route mới với bản sao của updatedCustomPoints để tránh tham chiếu
            // Important: Use the updatedCustomPoints directly, not the state
            // as state updates are asynchronous and may not be reflected immediately
            generateRouteFromPoints(routePoints, [...updatedCustomPoints]);

            // Log state after adding stopover
            setTimeout(() => {
                logRouteState("AFTER ADDING NEW STOPOVER");
            }, 0);
        } catch (error) {
            console.error("Error adding custom point:", error);
            message.error("Có lỗi khi thêm điểm trung gian");
        }
    };

    // Helper function to create markers from route points and custom points
    const createAllMarkers = (basePoints: RoutePoint[], customPts: RoutePoint[]): MapLocation[] => {
        // Tạo một timestamp duy nhất cho mỗi lần gọi hàm
        const timestamp = Date.now();

        // Tạo markers cho các điểm cơ bản
        const baseMarkers = basePoints.map((point: RoutePoint, index) => ({
            lat: point.lat,
            lng: point.lng,
            address: point.address,
            name: point.name,
            type: point.type,
            id: `${point.type}-${point.lat}-${point.lng}-${timestamp}-${index}`
        }));

        // Tạo markers cho các điểm trung gian
        const customMarkers = customPts.map((point, i) => ({
            lat: point.lat,
            lng: point.lng,
            address: point.address || `Điểm trung gian ${i + 1}`,
            name: `Điểm trung gian ${i + 1}`,
            type: 'stopover' as const,
            id: `stopover-${point.lat}-${point.lng}-${timestamp}-${i}`
        }));
        // Kết hợp và trả về tất cả markers
        return [...baseMarkers, ...customMarkers];
    };

    // Remove a custom point
    const removeCustomPoint = (index: number) => {
        try {
            // Log state before removal
            logRouteState("BEFORE REMOVING STOPOVER");

            // Lưu lại điểm cần xóa để log
            const pointToRemove = globalCustomPoints[index];
            // Lưu lại segment index của điểm bị xóa
            // Đảm bảo segmentIndex luôn có giá trị, mặc định là 0 nếu undefined
            const segmentIndex = pointToRemove.segmentIndex !== undefined ? pointToRemove.segmentIndex : 0;

            // Cập nhật danh sách điểm trung gian trong global array
            globalCustomPoints.splice(index, 1);

            // Create a copy for further processing
            const updatedCustomPoints = [...globalCustomPoints];

            // Cập nhật tên của các điểm trung gian còn lại trong cùng segment
            const updatedWithRenamedPoints = updatedCustomPoints.map(point => {
                // Chỉ cập nhật tên cho các điểm cùng segment với điểm bị xóa
                if (point.segmentIndex === segmentIndex) {
                    // Tìm tất cả các điểm trong segment này sau khi đã xóa
                    const pointsInSameSegment = updatedCustomPoints.filter(p => p.segmentIndex === segmentIndex);
                    const indexInSegment = pointsInSameSegment.indexOf(point);

                    // Xác định tên đoạn đường
                    let segmentName = "";
                    if (segments && segments.length > segmentIndex) {
                        const segment = segments[segmentIndex];

                        // Chuyển đổi tên điểm thành tiếng Việt dễ hiểu
                        const startName = segment.startName === 'Carrier' ? 'ĐVVC' :
                            segment.startName === 'Pickup' ? 'Điểm lấy hàng' :
                                segment.startName === 'Delivery' ? 'Điểm giao hàng' : segment.startName;

                        const endName = segment.endName === 'Carrier' ? 'ĐVVC' :
                            segment.endName === 'Pickup' ? 'Điểm lấy hàng' :
                                segment.endName === 'Delivery' ? 'Điểm giao hàng' :
                                    segment.endName.startsWith('Quay về') ? 'ĐVVC (Quay về)' : segment.endName;

                        segmentName = `${startName}-${endName}`;
                    }

                    // Cập nhật tên điểm
                    return {
                        ...point,
                        name: `Điểm trung gian ${indexInSegment + 1} (${segmentName})`,
                        address: point.address.replace(/Điểm trung gian \d+/, `Điểm trung gian ${indexInSegment + 1}`)
                    };
                }
                return point;
            });

            // Update global array with renamed points
            globalCustomPoints.length = 0;
            globalCustomPoints.push(...updatedWithRenamedPoints);

            // Update state for UI
            setCustomPoints([...globalCustomPoints]);

            // Tạo mảng markers mới
            const allMarkers = createAllMarkers(routePoints, globalCustomPoints);

            // Cập nhật markers
            setMarkers(allMarkers);

            // Tạo route mới
            generateRoute(globalCustomPoints);

            // Log state after removal
            setTimeout(() => {
                logRouteState("AFTER REMOVING STOPOVER");
            }, 0);
        } catch (error) {
            console.error("Error removing custom point:", error);
            message.error("Có lỗi khi xóa điểm trung gian");
        }
    };

    // Generate route from base points and custom points
    const generateRouteFromPoints = async (basePoints: RoutePoint[], customPts: RoutePoint[]) => {
        if (basePoints.length === 0) return;
        // Log detailed route state
        logRouteState("BEFORE ROUTE GENERATION");

        // IMPORTANT: If customPts has data, update the global array
        if (customPts.length > 0) {
            // Update global array only if the provided points are different
            if (JSON.stringify(customPts) !== JSON.stringify(globalCustomPoints)) {
                globalCustomPoints.length = 0;
                globalCustomPoints.push(...customPts);
            }
            // Always update the state for UI
            setCustomPoints([...globalCustomPoints]);
        } else if (globalCustomPoints.length > 0) {
            // If customPts is empty but we have points in global array, use those
            setCustomPoints([...globalCustomPoints]);
            return generateRouteFromPoints(basePoints, [...globalCustomPoints]);
        }

        try {
            setIsGeneratingRoute(true);

            // Prepare points for route generation
            const carrierPoints = basePoints.filter(p => p.type === 'carrier');
            const pickupPoints = basePoints.filter(p => p.type === 'pickup');
            const deliveryPoints = basePoints.filter(p => p.type === 'delivery');

            // Đảm bảo chỉ có 1 điểm cho mỗi loại
            const carrier = carrierPoints.length > 0 ? carrierPoints[0] : null;
            const pickup = pickupPoints.length > 0 ? pickupPoints[0] : null;
            const delivery = deliveryPoints.length > 0 ? deliveryPoints[0] : null;

            if (!carrier || !pickup || !delivery) {
                console.error("Thiếu điểm cần thiết cho tuyến đường");
                message.error("Thiếu điểm cần thiết cho tuyến đường");
                setIsGeneratingRoute(false);
                return;
            }

            // Clone carrier point để không ảnh hưởng đến reference
            // Đảm bảo returnCarrier có tọa độ khác với carrier ban đầu
            const returnCarrier = {
                ...carrier,
                name: "Quay về " + carrier.name,
                // Thêm một giá trị nhỏ để tránh trùng lặp tọa độ với carrier gốc
                lat: carrier.lat + 0.000001,
                lng: carrier.lng + 0.000001
            };

            // IMPORTANT: Ensure all custom points have a valid segmentIndex
            const validCustomPts = globalCustomPoints.map((point: RoutePoint) => {
                // If segmentIndex is undefined or invalid, default to 0
                if (point.segmentIndex === undefined || point.segmentIndex < 0 || point.segmentIndex > 2) {
                    return { ...point, segmentIndex: 0 };
                }
                return point;
            });

            // Update the global array with validated points
            globalCustomPoints.length = 0;
            globalCustomPoints.push(...validCustomPts);

            // IMPORTANT: Update state for UI
            setCustomPoints([...validCustomPts]);

            // Double-check that our state update worked
            if (customPoints.length !== validCustomPts.length) {
            }

            // Phân loại các điểm stopover theo đoạn đường
            const segment0Stopovers = validCustomPts
                .filter((p: RoutePoint) => p.segmentIndex === 0) // Lọc các điểm thuộc đoạn Carrier -> Pickup
                .sort((a: RoutePoint, b: RoutePoint) => {
                    // Thử sắp xếp theo thời gian tạo nếu có
                    const aMatch = a.name.match(/Điểm trung gian (\d+)/);
                    const bMatch = b.name.match(/Điểm trung gian (\d+)/);
                    if (aMatch && bMatch) {
                        return parseInt(aMatch[1]) - parseInt(bMatch[1]);
                    }
                    return a.name.localeCompare(b.name);
                });

            const segment1Stopovers = validCustomPts
                .filter((p: RoutePoint) => p.segmentIndex === 1) // Lọc các điểm thuộc đoạn Pickup -> Delivery
                .sort((a: RoutePoint, b: RoutePoint) => {
                    // Thử sắp xếp theo thời gian tạo nếu có
                    const aMatch = a.name.match(/Điểm trung gian (\d+)/);
                    const bMatch = b.name.match(/Điểm trung gian (\d+)/);
                    if (aMatch && bMatch) {
                        return parseInt(aMatch[1]) - parseInt(bMatch[1]);
                    }
                    return a.name.localeCompare(b.name);
                });

            const segment2Stopovers = validCustomPts
                .filter((p: RoutePoint) => p.segmentIndex === 2) // Lọc các điểm thuộc đoạn Delivery -> Carrier
                .sort((a: RoutePoint, b: RoutePoint) => {
                    // Thử sắp xếp theo thời gian tạo nếu có
                    const aMatch = a.name.match(/Điểm trung gian (\d+)/);
                    const bMatch = b.name.match(/Điểm trung gian (\d+)/);
                    if (aMatch && bMatch) {
                        return parseInt(aMatch[1]) - parseInt(bMatch[1]);
                    }
                    return a.name.localeCompare(b.name);
                });
            // Tạo mảng các điểm theo thứ tự đúng, đảm bảo không có điểm trùng lặp
            const orderedPoints: RoutePoint[] = [];

            // Đoạn 1: Carrier -> Pickup
            // Thêm carrier đầu tiên
            orderedPoints.push(carrier);

            // Thêm các điểm trung gian của đoạn Carrier -> Pickup (segmentIndex = 0)
            if (segment0Stopovers.length > 0) {
                segment0Stopovers.forEach(point => {
                    orderedPoints.push({
                        ...point,
                        type: 'stopover'
                    });
                });
            }

            // Đoạn 2: Pickup -> Delivery
            // Thêm pickup
            orderedPoints.push(pickup);

            // Thêm các điểm trung gian của đoạn Pickup -> Delivery (segmentIndex = 1)
            if (segment1Stopovers.length > 0) {
                segment1Stopovers.forEach(point => {
                    orderedPoints.push({
                        ...point,
                        type: 'stopover'
                    });
                });
            }

            // Đoạn 3: Delivery -> Carrier
            // Thêm delivery
            orderedPoints.push(delivery);

            // Thêm các điểm trung gian của đoạn Delivery -> Carrier (segmentIndex = 2)
            if (segment2Stopovers.length > 0) {
                segment2Stopovers.forEach(point => {
                    orderedPoints.push({
                        ...point,
                        type: 'stopover'
                    });
                });
            }

            // Kết thúc tại carrier (quay về)
            // Đảm bảo returnCarrier có type khác với carrier đầu tiên để không bị loại bỏ trong quá trình deduplication
            orderedPoints.push({
                ...returnCarrier,
                type: 'carrier_return' as any // Sử dụng type khác để tránh bị lọc bỏ
            });

            

            // Kiểm tra xem có bao nhiêu điểm stopover trong mảng orderedPoints
            const stopoverCount = orderedPoints.filter(p => p.type === 'stopover').length;
            // Tạo mảng tọa độ và loại điểm cho API request
            const uniquePoints: [number, number][] = [];
            const uniquePointTypes: ('carrier' | 'pickup' | 'delivery' | 'stopover')[] = [];

            // Đảm bảo không có điểm trùng lặp
            const usedCoordinates = new Set<string>();
            const usedPointTypes = new Set<string>();

            // Log chi tiết từng điểm trong tuyến đường
            orderedPoints.forEach((point, index) => {
                // Tạo key duy nhất cho mỗi điểm
                let key = `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;

                const pointTypeStr = String(point.type); // Chuyển đổi thành string để so sánh an toàn

                // Kiểm tra nếu đã có điểm cùng loại (carrier, pickup, delivery) - chỉ cho phép một điểm mỗi loại
                // Ngoại trừ điểm stopover và carrier_return có thể có nhiều điểm
                if (pointTypeStr !== 'stopover' && pointTypeStr !== 'carrier_return' && usedPointTypes.has(pointTypeStr)) {
                    return; // Skip this point
                }

                // Nếu là điểm trùng lặp, thêm một offset nhỏ để tạo sự khác biệt
                if (usedCoordinates.has(key)) {
                    // Tạo offset dựa trên vị trí trong mảng để đảm bảo tính nhất quán
                    const offsetLat = point.lat + (index * 0.0000001);
                    const offsetLng = point.lng + (index * 0.0000001);
                    point.lat = offsetLat;
                    point.lng = offsetLng;
                    key = `${offsetLat.toFixed(6)},${offsetLng.toFixed(6)}`;
                }

                // Đánh dấu tọa độ và loại điểm đã được sử dụng
                usedCoordinates.add(key);
                usedPointTypes.add(pointTypeStr);

                // Thêm điểm vào mảng dữ liệu cho API
                uniquePoints.push([point.lng, point.lat]);
                uniquePointTypes.push(point.type);
            });

            // Đảm bảo không có trùng lặp trong request
            // Tạo mảng mới không có trùng lặp point types
            const finalPoints: [number, number][] = [];
            const finalPointTypes: ('carrier' | 'pickup' | 'delivery' | 'stopover')[] = [];
            const seenTypes = new Set<string>();

            // Chỉ giữ lại một điểm cho mỗi loại (carrier, pickup, delivery)
            // nhưng giữ lại tất cả các điểm stopover và carrier_return
            uniquePointTypes.forEach((type, index) => {
                const typeStr = String(type); // Chuyển đổi thành string để so sánh an toàn

                // Xử lý đặc biệt cho carrier_return
                if (typeStr === 'carrier_return') {
                    // Thêm điểm quay về nhưng đổi type thành carrier cho API
                    finalPoints.push(uniquePoints[index]);
                    finalPointTypes.push('carrier');
                }
                // Nếu là stopover hoặc chưa thấy loại này trước đó
                else if (type === 'stopover' || !seenTypes.has(typeStr)) {
                    finalPoints.push(uniquePoints[index]);
                    finalPointTypes.push(type);
                    seenTypes.add(typeStr);
                } else {
                }
            });
            const requestData: SuggestRouteRequest = {
                points: finalPoints,
                pointTypes: finalPointTypes,
                vehicleTypeId: vehicle?.vehicleTypeId || '',
            };
            // Call API to get suggested route
            const response = await routeService.suggestRoute(requestData);

            // IMPORTANT: After API call, verify our customPoints state is still intact
            // If customPoints state has changed unexpectedly, restore it from our saved reference
            if (customPoints.length !== validCustomPts.length) {
                setCustomPoints(validCustomPts);
            }

            // Truy cập đúng cấu trúc response
            if (response && response.segments) {
                // Đảm bảo segments có đủ thông tin
                const segments = response.segments.map(segment => ({
                    ...segment,
                    tolls: segment.tolls || [],
                    distance: segment.distance || 0
                }));

                // Lưu thông tin tổng quát từ response
                const routeInfoFromAPI: RouteInfoFromAPI = {
                    totalDistance: response.totalDistance || 0,
                    totalTollAmount: response.totalTollAmount || 0,
                    totalTollCount: response.totalTollCount || 0
                };
                // Không cần animation loading nữa vì sẽ có animation trên map
                setIsAnimatingRoute(false);
                setSegments(segments);

                // Lưu thông tin tổng quát
                setRouteInfoFromAPI(routeInfoFromAPI);

                // CRITICAL: Make sure customPoints state is still intact after setting segments
                setTimeout(() => {
                    if (customPoints.length !== validCustomPts.length) {
                        setCustomPoints(validCustomPts);
                    }

                    // Log route state after generation
                    logRouteState("AFTER ROUTE GENERATION");
                }, 0);
            } else {
                console.error("Invalid response format:", response);
                message.error("Không thể tạo tuyến đường: Định dạng phản hồi không hợp lệ");
            }

        } catch (error) {
            console.error('Error generating route:', error);
            message.error('Không thể tạo tuyến đường');
            setIsAnimatingRoute(false);

            // Even on error, ensure we preserve the custom points
            setCustomPoints([...globalCustomPoints]);
        } finally {
            setIsGeneratingRoute(false);
        }
    };

    // Function to reset route - wrapper around generateRouteFromPoints
    const resetRoute = () => {
        const executeReset = () => {
            // Xóa tất cả các điểm trung gian - both state and global
            setCustomPoints([]);
            globalCustomPoints.length = 0;

            // Tạo mảng markers mới chỉ với các điểm cơ bản
            const baseMarkers = routePoints.map((point: RoutePoint) => ({
                lat: point.lat,
                lng: point.lng,
                address: point.address,
                name: point.name,
                type: point.type,
                id: `${point.type}-${point.lat}-${point.lng}-${Date.now()}`
            }));
            // Cập nhật markers
            setMarkers(baseMarkers);

            // Gọi API để tạo lại tuyến đường chỉ với các điểm cơ bản
            generateRouteFromPoints(routePoints, []);

            // Hiển thị thông báo
            message.success('Đã đặt lại tuyến đường về mặc định');
        };

        // Hiện hộp thoại xác nhận trước khi đặt lại tuyến đường
        if (customPoints.length > 0) {
            modal.confirm({
                title: 'Xác nhận đặt lại tuyến đường',
                content: `Bạn có chắc chắn muốn đặt lại tuyến đường và xóa ${customPoints.length} điểm trung gian đã thêm?`,
                okText: 'Đồng ý',
                cancelText: 'Hủy',
                onOk() {
                    executeReset();
                },
            });
        } else {
            // Không có điểm trung gian nào, gọi API để tạo lại tuyến đường
            generateRouteFromPoints(routePoints, []);
            message.info('Đã tạo lại tuyến đường');
        }
    };

    // Function to generate route - wrapper around generateRouteFromPoints
    const generateRoute = (customPts = customPoints) => {
        // Always create a copy to avoid reference issues
        const pointsToUse = Array.isArray(customPts) ? [...customPts] : [];

        // IMPORTANT: Save the current customPoints for verification
        const currentStatePoints = [...customPoints];
        const currentGlobalPoints = [...globalCustomPoints];

        // If we're using the current state and it's different from the passed points
        if (customPts === customPoints && customPoints.length > 0) {
        } else if (pointsToUse.length > 0) {
            // Update both state and global if we're using different points
            setCustomPoints(pointsToUse);
            globalCustomPoints.length = 0;
            globalCustomPoints.push(...pointsToUse);
        } else if (currentGlobalPoints.length > 0) {
            // If no points provided but we have points in the global array, use those
            setCustomPoints(currentGlobalPoints);
            pointsToUse.push(...currentGlobalPoints);
        }

        // Use a timeout to ensure state updates have been processed
        setTimeout(() => {
            if (customPoints.length === 0 && (currentStatePoints.length > 0 || currentGlobalPoints.length > 0)) {
                const pointsToRestore = currentGlobalPoints.length > 0 ? currentGlobalPoints : currentStatePoints;
                setCustomPoints(pointsToRestore);
            }
        }, 0);

        generateRouteFromPoints(routePoints, pointsToUse.length > 0 ? pointsToUse : currentGlobalPoints);
    };

    // State for submit button loading
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Handle completion
    const handleComplete = () => {
        if (segments.length === 0) {
            message.warning('Vui lòng tạo tuyến đường trước khi hoàn thành');
            return;
        }

        setIsSubmitting(true);

        try {
            // Chuyển đổi segments sang routeInfo
            const routeInfo = convertRouteSegmentsToRouteInfo(segments);

            // Cập nhật thông tin tổng quát từ API
            routeInfo.totalDistance = routeInfoFromAPI.totalDistance;
            // Cập nhật totalTollFee từ totalTollAmount của API
            routeInfo.totalTollFee = routeInfoFromAPI.totalTollAmount;

            onComplete(segments, routeInfo);
        } catch (error) {
            console.error('Error completing route planning:', error);
            message.error('Có lỗi khi hoàn thành kế hoạch tuyến đường');
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        // Cập nhật ref mỗi khi selectedSegmentIndex thay đổi
        selectedSegmentIndexRef.current = selectedSegmentIndex;
    }, [selectedSegmentIndex]);

    // Debug function to log the current state of route points
    const logRouteState = (label: string) => {
        // Log segment details
        if (segments && segments.length > 0) {
            segments.forEach((segment, idx) => {
            });
        }

        // Log custom points by segment using global array for more reliable data
        const pointsToAnalyze = globalCustomPoints.length > 0 ? globalCustomPoints : customPoints;
        const bySegment = [0, 1, 2].map(idx => pointsToAnalyze.filter((p: RoutePoint) => p.segmentIndex === idx));
    };

    // Helper function to get current segments including stopovers
    const getCurrentSegments = () => {
        if (!segments || segments.length === 0) return [];

        // Start with the original segments
        const baseSegments = [...segments];

        // Make sure base segments have the correct segmentOrder
        baseSegments.forEach((segment, index) => {
            // Ensure each base segment has the correct segmentOrder (0, 1, 2)
            if (segment.segmentOrder !== index) {
                segment.segmentOrder = index;
            }
        });

        // If there are no custom points, just return the original segments
        if (globalCustomPoints.length === 0) return baseSegments;

        // Create a new array to hold all segments including those created by stopovers
        const allSegments: RouteSegment[] = [];

        // Group stopovers by segment index
        const stopoversBySegment = [0, 1, 2].map(idx =>
            globalCustomPoints.filter((p: RoutePoint) => p.segmentIndex === idx)
                .sort((a: RoutePoint, b: RoutePoint) => {
                    const aMatch = a.name.match(/Điểm trung gian (\d+)/);
                    const bMatch = b.name.match(/Điểm trung gian (\d+)/);
                    if (aMatch && bMatch) {
                        return parseInt(aMatch[1]) - parseInt(bMatch[1]);
                    }
                    return a.name.localeCompare(b.name);
                })
        );

        // Debug log to help understand the mapping
        
        

        // Process segment 0 (Carrier -> Pickup)
        if (stopoversBySegment[0].length > 0) {
            // Add Carrier -> Stopover1 segment
            allSegments.push({
                ...baseSegments[0],
                endName: 'Điểm trung gian',
                // Keep the original segmentOrder to maintain the mapping
                segmentOrder: 0
            });

            // Add intermediate stopover segments if there are multiple stopovers
            for (let i = 0; i < stopoversBySegment[0].length - 1; i++) {
                allSegments.push({
                    startName: 'Điểm trung gian',
                    endName: 'Điểm trung gian',
                    path: [],
                    distance: 0,
                    tolls: [],
                    segmentOrder: 0,
                    rawResponse: {} // Add empty rawResponse to satisfy the type
                });
            }

            // Add last Stopover -> Pickup segment
            allSegments.push({
                startName: 'Điểm trung gian',
                endName: baseSegments[0].endName,
                path: [],
                distance: 0,
                tolls: [],
                segmentOrder: 0,
                rawResponse: {} // Add empty rawResponse to satisfy the type
            });
        } else {
            // No stopovers in segment 0, add original
            allSegments.push(baseSegments[0]);
        }

        // Process segment 1 (Pickup -> Delivery)
        if (stopoversBySegment[1].length > 0) {
            // Add Pickup -> Stopover1 segment
            allSegments.push({
                ...baseSegments[1],
                endName: 'Điểm trung gian',
                // Keep the original segmentOrder to maintain the mapping
                segmentOrder: 1
            });

            // Add intermediate stopover segments if there are multiple stopovers
            for (let i = 0; i < stopoversBySegment[1].length - 1; i++) {
                allSegments.push({
                    startName: 'Điểm trung gian',
                    endName: 'Điểm trung gian',
                    path: [],
                    distance: 0,
                    tolls: [],
                    segmentOrder: 1,
                    rawResponse: {} // Add empty rawResponse to satisfy the type
                });
            }

            // Add last Stopover -> Delivery segment
            allSegments.push({
                startName: 'Điểm trung gian',
                endName: baseSegments[1].endName,
                path: [],
                distance: 0,
                tolls: [],
                segmentOrder: 1,
                rawResponse: {} // Add empty rawResponse to satisfy the type
            });
        } else {
            // No stopovers in segment 1, add original
            allSegments.push(baseSegments[1]);
        }

        // Process segment 2 (Delivery -> Carrier)
        if (stopoversBySegment[2].length > 0) {
            // Add Delivery -> Stopover1 segment
            allSegments.push({
                ...baseSegments[2],
                endName: 'Điểm trung gian',
                // Keep the original segmentOrder to maintain the mapping
                segmentOrder: 2
            });

            // Add intermediate stopover segments if there are multiple stopovers
            for (let i = 0; i < stopoversBySegment[2].length - 1; i++) {
                allSegments.push({
                    startName: 'Điểm trung gian',
                    endName: 'Điểm trung gian',
                    path: [],
                    distance: 0,
                    tolls: [],
                    segmentOrder: 2,
                    rawResponse: {} // Add empty rawResponse to satisfy the type
                });
            }

            // Add last Stopover -> Carrier segment
            allSegments.push({
                startName: 'Điểm trung gian',
                endName: baseSegments[2].endName,
                path: [],
                distance: 0,
                tolls: [],
                segmentOrder: 2,
                rawResponse: {} // Add empty rawResponse to satisfy the type
            });
        } else {
            // No stopovers in segment 2, add original
            allSegments.push(baseSegments[2]);
        }

        // Add debugging info to each segment for easier troubleshooting
        allSegments.forEach((segment, index) => {
            // Add a more descriptive debug property to each segment
            
        });
        return allSegments;
    };

    return (
        <div className="route-planning-step">
            <Title level={4} className="mb-4">
                <EnvironmentOutlined className="mr-2 text-blue-500" />
                Lập kế hoạch tuyến đường
            </Title>

            <div className="mb-4 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                <Text>
                    <InfoCircleOutlined className="mr-2" />
                    Chọn vị trí trên bản đồ để thêm điểm trung gian. Hệ thống sẽ tự động tính toán tuyến đường tối ưu.
                </Text>
            </div>

            <Row gutter={16}>
                {/* Cột trái - Map (chiếm 7/10) */}
                <Col span={17}>
                    <Card
                        className="mb-4 map-card"
                        bodyStyle={{ padding: '12px' }}
                        title={
                            <div className="flex justify-between items-center">
                                <span>Bản đồ tuyến đường</span>
                                <Button
                                    onClick={resetRoute}
                                    loading={isGeneratingRoute}
                                    type="primary"
                                    icon={<CarOutlined />}
                                >
                                    Đặt lại tuyến đường
                                </Button>
                            </div>
                        }
                    >
                        {customPoints.length > 0 && (
                            <div className="mb-3 px-1">
                                <Text strong className="text-sm block mb-2">Điểm trung gian đã thêm:</Text>

                                {/* Nhóm các điểm theo đoạn đường */}
                                {[0, 1, 2].map(segmentIdx => {
                                    // Lọc các điểm thuộc đoạn này
                                    const segmentPoints = customPoints.filter(p => p.segmentIndex === segmentIdx);

                                    if (segmentPoints.length === 0) return null;

                                    // Lấy thông tin đoạn đường
                                    const segmentInfo = segments[segmentIdx];
                                    if (!segmentInfo) return null;

                                    // Xác định màu sắc và style cho đoạn
                                    let badgeColor, textColorClass, bgColorClass, borderColorClass;

                                    if (segmentIdx === 0) {
                                        badgeColor = "blue";
                                        textColorClass = "text-blue-600";
                                        bgColorClass = "bg-blue-50";
                                        borderColorClass = "border-blue-200";
                                    } else if (segmentIdx === 1) {
                                        badgeColor = "green";
                                        textColorClass = "text-green-600";
                                        bgColorClass = "bg-green-50";
                                        borderColorClass = "border-green-200";
                                    } else {
                                        badgeColor = "purple";
                                        textColorClass = "text-purple-600";
                                        bgColorClass = "bg-purple-50";
                                        borderColorClass = "border-purple-200";
                                    }

                                    return (
                                        <div key={segmentIdx} className="mb-2">
                                            <div className={`text-xs font-medium mb-1 ${textColorClass}`}>
                                                <Badge color={badgeColor} />
                                                <span className="ml-1">
                                                    Đoạn {segmentIdx + 1}: {segmentInfo.startName} → {segmentInfo.endName}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 ml-4">
                                                {segmentPoints.map((point, index) => (
                                                    <div key={index} className={`${bgColorClass} px-3 py-1 rounded-full flex items-center border ${borderColorClass}`}>
                                                        <Badge color={badgeColor} />
                                                        <span className="mr-2 text-sm">{point.name}</span>
                                                        <Tooltip title="Xóa điểm này">
                                                            <Button
                                                                type="text"
                                                                danger
                                                                size="small"
                                                                icon={<CloseCircleOutlined />}
                                                                onClick={() => removeCustomPoint(customPoints.indexOf(point))}
                                                            />
                                                        </Tooltip>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="h-[500px] relative rounded-lg overflow-hidden border border-gray-200">
                            {loading ? (
                                <div className="flex justify-center items-center h-full bg-gray-50">
                                    <Spin size="large" tip="Đang tải bản đồ..." />
                                </div>
                            ) : (
                                <>
                                    {segments.length > 0 && (
                                        <div className="absolute top-2 left-2 z-10 bg-white p-2 rounded-md shadow-md" style={{ maxWidth: '500px' }}>
                                            <div className="text-sm font-medium mb-1">Chọn đoạn để thêm điểm trung gian:</div>
                                            <select
                                                className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                                                value={selectedSegmentIndex}
                                                onChange={(e) => {
                                                    const newIndex = Number(e.target.value);
                                                    // Log state before change
                                                    logRouteState("BEFORE SEGMENT CHANGE");

                                                    // Get the current segments with stopovers
                                                    const currentSegments = getCurrentSegments();

                                                    // Make sure the index is valid
                                                    if (newIndex >= currentSegments.length) {
                                                        console.error("Invalid segment index:", newIndex);
                                                        message.error("Đoạn đường không hợp lệ");
                                                        return;
                                                    }

                                                    // Get the selected segment and its segmentOrder
                                                    const selectedSegment = currentSegments[newIndex];
                                                    // Save current customPoints before changing segment - use both state and global
                                                    const currentCustomPoints = [...customPoints];
                                                    const currentGlobalPoints = [...globalCustomPoints];
                                                    // Use the points from global if available, otherwise use state
                                                    const pointsToPreserve = currentGlobalPoints.length > 0 ? currentGlobalPoints : currentCustomPoints;

                                                    if (segments && segments.length > 0) {
                                                        // Chuyển đổi tên điểm thành tiếng Việt dễ hiểu
                                                        const startName = selectedSegment.startName === 'Carrier' ? 'ĐVVC' :
                                                            selectedSegment.startName === 'Pickup' ? 'Điểm lấy hàng' :
                                                                selectedSegment.startName === 'Delivery' ? 'Điểm giao hàng' :
                                                                    selectedSegment.startName === 'Stopover' ? 'Điểm trung gian' :
                                                                        selectedSegment.startName;

                                                        const endName = selectedSegment.endName === 'Carrier' ? 'ĐVVC' :
                                                            selectedSegment.endName === 'Pickup' ? 'Điểm lấy hàng' :
                                                                selectedSegment.endName === 'Delivery' ? 'Điểm giao hàng' :
                                                                    selectedSegment.endName === 'Stopover' ? 'Điểm trung gian' :
                                                                        selectedSegment.endName.startsWith('Quay về') ? 'ĐVVC (Quay về)' :
                                                                            selectedSegment.endName;

                                                        
                                                    }

                                                    // Cập nhật cả state và ref
                                                    setSelectedSegmentIndex(newIndex);
                                                    selectedSegmentIndexRef.current = newIndex;
                                                    // IMPORTANT: Ensure customPoints are preserved after segment change
                                                    setTimeout(() => {
                                                        if (customPoints.length !== pointsToPreserve.length) {
                                                            setCustomPoints(pointsToPreserve);
                                                            globalCustomPoints.length = 0;
                                                            globalCustomPoints.push(...pointsToPreserve);
                                                        }

                                                        // Log state after change
                                                        logRouteState("AFTER SEGMENT CHANGE");
                                                    }, 0);
                                                }}
                                                style={{ minWidth: '220px' }}
                                            >
                                                {getCurrentSegments().map((segment, index) => {
                                                    // Xác định tên hiển thị cho đoạn đường
                                                    let startName = segment.startName;
                                                    let endName = segment.endName;

                                                    // Chuyển đổi tên điểm thành tiếng Việt dễ hiểu
                                                    if (startName === 'Carrier') startName = 'ĐVVC';
                                                    else if (startName === 'Pickup') startName = 'Điểm lấy hàng';
                                                    else if (startName === 'Delivery') startName = 'Điểm giao hàng';
                                                    else if (startName === 'Stopover') startName = 'Điểm trung gian';

                                                    if (endName === 'Carrier') endName = 'ĐVVC';
                                                    else if (endName === 'Pickup') endName = 'Điểm lấy hàng';
                                                    else if (endName === 'Delivery') endName = 'Điểm giao hàng';
                                                    else if (endName === 'Stopover') endName = 'Điểm trung gian';
                                                    else if (endName.startsWith('Quay về')) endName = 'ĐVVC (Quay về)';

                                                    // Xác định màu nền cho từng loại đoạn
                                                    let bgColor = '#e6f7ff'; // Mặc định xanh dương nhạt

                                                    // Màu dựa trên segmentOrder
                                                    if (segment.segmentOrder === 0) bgColor = '#e6f7ff'; // Xanh dương nhạt cho carrier-pickup
                                                    else if (segment.segmentOrder === 1) bgColor = '#f6ffed'; // Xanh lá nhạt cho pickup-delivery
                                                    else if (segment.segmentOrder === 2) bgColor = '#f9f0ff'; // Tím nhạt cho delivery-carrier

                                                    // Get the segment type based on segmentOrder
                                                    const segmentType =
                                                        segment.segmentOrder === 0 ? 'ĐVVC-Pickup' :
                                                            segment.segmentOrder === 1 ? 'Pickup-Delivery' :
                                                                'Delivery-ĐVVC';

                                                    return (
                                                        <option
                                                            key={index}
                                                            value={index}
                                                            style={{
                                                                backgroundColor: bgColor,
                                                                fontWeight: 'bold',
                                                                padding: '8px'
                                                            }}
                                                        >
                                                            {`${index + 1}: ${startName} → ${endName} (${segmentType})`}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            <div className="text-xs text-gray-500 mt-1">
                                                <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1"></span> ĐVVC → Điểm lấy hàng
                                                <span className="inline-block w-3 h-3 bg-green-500 rounded-full ml-3 mr-1"></span> Điểm lấy hàng → Điểm giao hàng
                                                <span className="inline-block w-3 h-3 bg-purple-500 rounded-full ml-3 mr-1"></span> Điểm giao hàng → ĐVVC
                                            </div>
                                        </div>
                                    )}
                                    <VietMapMap
                                        mapLocation={currentMapLocation}
                                        onLocationChange={handleLocationChange}
                                        markers={markers}
                                        showRouteLines={segments.length > 0}
                                        routeSegments={segments}
                                        animateRoute={true}
                                    />
                                </>
                            )}
                            {isAnimatingRoute && (
                                <div className="absolute bottom-4 left-4 bg-white px-3 py-1 rounded-full shadow-md text-sm flex items-center">
                                    <LoadingOutlined style={{ fontSize: 16 }} spin className="mr-2" />
                                    <span>Đang tạo tuyến đường...</span>
                                </div>
                            )}
                        </div>
                    </Card>
                </Col>

                {/* Cột phải - Thông tin tuyến đường (chiếm 3/10) */}
                <Col span={7}>
                    <Card
                        title={
                            <div className="flex items-center">
                                <CarOutlined className="mr-2 text-blue-500" />
                                <span>Thông tin tuyến đường</span>
                            </div>
                        }
                        className="mb-4 route-info-card"
                        bodyStyle={{ padding: '12px', maxHeight: '545px', overflowY: 'auto' }}
                    >
                        {segments.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                <EnvironmentOutlined style={{ fontSize: '32px' }} />
                                <p className="mt-2">Chưa có thông tin tuyến đường</p>
                                <p className="text-sm">Vui lòng chọn điểm trên bản đồ hoặc nhấn "Tạo lại tuyến đường"</p>
                            </div>
                        ) : (
                            <>
                                {/* Thông tin tổng quan */}
                                <Card size="small" className="mb-4 bg-blue-50 border-blue-200">
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex justify-between items-center">
                                            <Text strong className="text-gray-700">
                                                <EnvironmentOutlined className="mr-1" />
                                                Tổng khoảng cách:
                                            </Text>
                                            <Text className="text-lg font-bold text-blue-600">
                                                {(routeInfoFromAPI.totalDistance).toFixed(1)} km
                                            </Text>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <Text strong className="text-gray-700">
                                                <CarOutlined className="mr-1" />
                                                Số trạm thu phí:
                                            </Text>
                                            <Text className="text-lg font-bold text-blue-600">
                                                {routeInfoFromAPI.totalTollCount}
                                            </Text>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <Text strong className="text-gray-700">
                                                <DollarCircleOutlined className="mr-1" />
                                                Tổng phí đường:
                                            </Text>
                                            <Text className="text-lg font-bold text-blue-600">
                                                {routeInfoFromAPI.totalTollAmount.toLocaleString('vi-VN')} VND
                                            </Text>
                                        </div>
                                    </div>
                                </Card>

                                {/* Chi tiết từng đoạn */}
                                <div className="mb-2">
                                    <Text strong>Chi tiết các đoạn đường:</Text>
                                </div>

                                {segments.map((segment, index) => (
                                    <Card
                                        key={index}
                                        size="small"
                                        className="mb-3 route-segment-card"
                                        bordered
                                    >
                                        <div className="mb-2 pb-2 border-b border-gray-100">
                                            <div className="flex items-center mb-1">
                                                <Badge color={
                                                    segment.startName === 'Carrier' ? 'green' :
                                                        segment.startName === 'Pickup' ? 'gold' :
                                                            segment.startName === 'Delivery' ? 'red' : 'blue'
                                                } />
                                                <Text strong className="ml-1">{segment.startName === 'Carrier' ? 'ĐVVC' : segment.startName === 'Pickup' ? 'Điểm lấy hàng' : segment.startName === 'Delivery' ? 'Điểm giao hàng' : segment.startName}</Text>
                                                <ArrowRightOutlined className="mx-2 text-gray-400" />
                                                <Badge color={
                                                    segment.endName === 'Carrier' ? 'green' :
                                                        segment.endName === 'Pickup' ? 'gold' :
                                                            segment.endName === 'Delivery' ? 'red' :
                                                                segment.endName.startsWith('Quay về') ? 'purple' : 'blue'
                                                } />
                                                <Text strong className="ml-1">
                                                    {segment.endName === 'Carrier' ? 'ĐVVC' : segment.endName === 'Pickup' ? 'Điểm lấy hàng' : segment.endName === 'Delivery' ? 'Điểm giao hàng' : segment.endName}
                                                    {segment.endName.startsWith('Quay về') && (
                                                        <Tag color="purple" className="ml-2">Quay về</Tag>
                                                    )}
                                                </Text>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <Text type="secondary" className="text-sm">Đoạn {segment.segmentOrder || index + 1}</Text>
                                                <Tag color="blue">{(segment.distance || 0).toFixed(1)} km</Tag>
                                            </div>
                                        </div>

                                        {segment.tolls && segment.tolls.length > 0 && (
                                            <div className="bg-gray-50 p-2 rounded-md">
                                                <Text strong className="block mb-1 text-sm">
                                                    <DollarCircleOutlined className="mr-1" />
                                                    Chi tiết phí đường:
                                                </Text>
                                                {segment.tolls.map((toll, tollIndex) => (
                                                    <div key={tollIndex} className="flex justify-between items-center mb-1 text-sm">
                                                        <div className="truncate max-w-[70%]">
                                                            <Tooltip title={`${toll.name} - ${toll.address}`}>
                                                                <span className="font-medium">{toll.name}</span>
                                                            </Tooltip>
                                                        </div>
                                                        <div className="text-right">
                                                            <span>{(toll.amount || 0).toLocaleString('vi-VN')} VND</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between items-center mt-1 pt-1 border-t border-gray-200">
                                                    <Text strong className="text-sm">Tổng phí:</Text>
                                                    <Text strong>{(segment.tolls.reduce((sum, toll) => sum + (toll.amount || 0), 0) || 0).toLocaleString('vi-VN')} VND</Text>
                                                </div>
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </>
                        )}
                    </Card>
                </Col>
            </Row>

            <div className="flex justify-between mt-4">
                <Button onClick={onBack} icon={<ArrowRightOutlined rotate={180} />}>
                    Quay lại
                </Button>
                <Button
                    type="primary"
                    onClick={handleComplete}
                    disabled={segments.length === 0}
                    loading={isSubmitting}
                >
                    {isSubmitting ? 'Đang xử lý...' : 'Hoàn thành'}
                </Button>
            </div>
        </div>
    );
};

export default RoutePlanningStep; 