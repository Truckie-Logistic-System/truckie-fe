import React, { useState, useEffect, useRef } from 'react';
import { Button, Space, Typography, message, List, AutoComplete, Select, Tooltip, Skeleton } from 'antd';
import { CarOutlined, CompassOutlined, EnvironmentOutlined, AimOutlined, SwapOutlined, PlayCircleOutlined, CloseCircleOutlined, RocketOutlined, PauseCircleOutlined, SearchOutlined } from '@ant-design/icons';
import trackasiagl from 'trackasia-gl';
import trackasiaService from '../../../services/map/trackasiaService';
import { calculateDistance } from '../../../models/Map';
import type { AutocompleteResult } from '../../../services/map/trackasiaService';

const { Text } = Typography;

// Định nghĩa lại hàm formatDistance
const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
};

// Định nghĩa hàm formatTime
const formatTime = (seconds: number): string => {
    if (seconds < 60) {
        return `${Math.round(seconds)} giây`;
    } else if (seconds < 3600) {
        return `${Math.round(seconds / 60)} phút`;
    } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.round((seconds % 3600) / 60);
        return `${hours} giờ ${minutes > 0 ? `${minutes} phút` : ''}`;
    }
};

interface DirectionsDemoProps {
    map: trackasiagl.Map | null;
    startNavigation?: () => void;
    startSimulation?: () => void;
    stopSimulation?: () => void;
    changeSimulationSpeed?: (speed: number) => void;
    simulationSpeed?: number;
    isNavigating?: boolean;
    isSimulating?: boolean;
    remainingDistance?: string;
    remainingTime?: string;
    currentInstructionIndex?: number;
}

// Define a type for route geometry
interface RouteGeometry {
    type: string;
    coordinates: [number, number][];
}

// Wrapper functions for API calls
const searchPlacesAutocomplete = async (query: string, bounds?: any, location?: any) => {
    // Convert location to format expected by trackasiaService.autocomplete if needed
    const locationParam = location ? [location.lat, location.lng] as [number, number] : undefined;
    const results = await trackasiaService.autocomplete(query, locationParam);

    // Chuyển đổi kết quả sang định dạng cũ
    return {
        status: 'OK',
        predictions: results
    };
};

const getPlaceDetails = async (placeId: string) => {
    const result = await trackasiaService.getPlaceDetail(placeId);

    // Chuyển đổi kết quả sang định dạng cũ
    if (result) {
        return {
            status: 'OK',
            result: result
        };
    }
    return null;
};

const reverseGeocodeV2 = async (lat: number, lng: number) => {
    const result = await trackasiaService.reverseGeocode(lat, lng);
    // Chuyển đổi từ MapLocation sang định dạng cũ
    if (result) {
        return {
            status: 'OK',
            results: [{
                formatted_address: result.address || `${lat}, ${lng}`,
                address_components: [],
                name: result.name || '',
                place_id: result.placeId || ''
            }]
        };
    }
    return { status: 'ERROR', results: [] };
};

// Wrapper cho hàm calculateDistance để tương thích với code cũ
const calculateDistanceWrapper = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    // Tạo các đối tượng MapLocation
    const point1 = { lat: lat1, lng: lng1 };
    const point2 = { lat: lat2, lng: lng2 };

    // Gọi hàm calculateDistance từ model
    return calculateDistance(point1, point2);
};

const getDirectionsV2 = async (originLat: number, originLng: number, destLat: number, destLng: number, profile: string = 'driving') => {
    // Sử dụng phương thức getDirectionsV2 từ trackasiaService
    return await trackasiaService.getDirectionsV2(originLat, originLng, destLat, destLng, profile);
};

const decodePolyline = (encoded: string): [number, number][] => {
    // Implement Google/TrackAsia polyline algorithm
    const points: [number, number][] = [];
    let index = 0, lat = 0, lng = 0;

    try {
        while (index < encoded.length) {
            // Decode latitude
            let b, shift = 0, result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lat += dlat;

            // Decode longitude
            shift = 0;
            result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lng += dlng;

            // Convert to decimal degrees and push to points array
            // Note: lat comes first in the array (standard GeoJSON format)
            points.push([lat * 1e-5, lng * 1e-5]);
        }
    } catch (error) {
        console.error("Error decoding polyline:", error, encoded);
    }

    return points;
};

const DirectionsDemo: React.FC<DirectionsDemoProps> = ({
    map,
    startNavigation: parentStartNavigation,
    startSimulation: parentStartSimulation,
    stopSimulation: parentStopSimulation,
    changeSimulationSpeed: parentChangeSimulationSpeed,
    simulationSpeed: parentSimulationSpeed,
    isNavigating: parentIsNavigating,
    isSimulating: parentIsSimulating,
    remainingDistance: parentRemainingDistance,
    remainingTime: parentRemainingTime,
    currentInstructionIndex: parentCurrentInstructionIndex
}) => {
    const [startPoint, setStartPoint] = useState<string>('');
    const [endPoint, setEndPoint] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSearchingStart, setIsSearchingStart] = useState<boolean>(false);
    const [isSearchingEnd, setIsSearchingEnd] = useState<boolean>(false);
    const [profile, setProfile] = useState<'driving' | 'motorcycling' | 'walking' | 'truck'>('driving');
    const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string; steps: any[] } | null>(null);
    const [simulationSpeed, setSimulationSpeed] = useState<number>(parentSimulationSpeed || 1);

    // Sử dụng state từ parent nếu có
    const isSimulating = parentIsSimulating !== undefined ? parentIsSimulating : false;
    const isNavigating = parentIsNavigating !== undefined ? parentIsNavigating : false;
    const currentStepIndex = parentCurrentInstructionIndex !== undefined ? parentCurrentInstructionIndex : 0;

    // Thêm state cho tính năng mô phỏng và dẫn đường
    const [isSimulatingState, setIsSimulatingState] = useState<boolean>(false);
    const [isNavigatingState, setIsNavigatingState] = useState<boolean>(false);
    const [currentStepIndexState, setCurrentStepIndexState] = useState<number>(0);
    const [simulationProgress, setSimulationProgress] = useState<number>(0); // 0-100%
    const [remainingDistance, setRemainingDistance] = useState<string>('');
    const [remainingTime, setRemainingTime] = useState<string>('');

    // Start and end coordinates
    const [startCoords, setStartCoords] = useState<[number, number] | null>(null);
    const [endCoords, setEndCoords] = useState<[number, number] | null>(null);

    // Start and end search options
    const [startOptions, setStartOptions] = useState<{ value: string; label: React.ReactNode; feature: any }[]>([]);
    const [endOptions, setEndOptions] = useState<{ value: string; label: React.ReactNode; feature: any }[]>([]);

    // References to markers and route layers
    const startMarkerRef = useRef<trackasiagl.Marker | null>(null);
    const endMarkerRef = useRef<trackasiagl.Marker | null>(null);
    const routeLayerId = 'route-layer';
    const routeSourceId = 'route-source';

    // Thêm refs cho tính năng mô phỏng và dẫn đường
    const simulationMarkerRef = useRef<trackasiagl.Marker | null>(null);
    const simulationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const routeCoordinatesRef = useRef<[number, number][]>([]);
    const currentRouteRef = useRef<any>(null);

    // Reference to the component's div element
    const directionsDemoRef = useRef<HTMLDivElement>(null);

    // Search timeout refs
    const startSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const endSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Lắng nghe sự kiện setCurrentLocation
    useEffect(() => {
        // Tránh tạo lại event listener mỗi khi map thay đổi
        if (!directionsDemoRef.current) return;

        const handleSetCurrentLocation = (event: any) => {
            const { lat, lng, address } = event.detail;

            // Kiểm tra xem vị trí có thay đổi không để tránh re-render không cần thiết
            if (startCoords && startCoords[0] === lng && startCoords[1] === lat && startPoint === address) {
                return;
            }

            // Đặt vị trí hiện tại làm điểm xuất phát
            setStartPoint(address);
            setStartCoords([lng, lat]);

            // Thêm marker cho điểm xuất phát
            if (map) {
                if (startMarkerRef.current) {
                    startMarkerRef.current.remove();
                }

                startMarkerRef.current = new trackasiagl.Marker({ color: '#00FF00' })
                    .setLngLat([lng, lat])
                    .addTo(map);

                // Fly to location
                map.flyTo({
                    center: [lng, lat],
                    zoom: 12
                });
            }
        };

        // Thêm ID cho component
        directionsDemoRef.current.id = 'trackasia-directions-demo';
        directionsDemoRef.current.addEventListener('setCurrentLocation', handleSetCurrentLocation);

        return () => {
            // Cleanup
            if (directionsDemoRef.current) {
                directionsDemoRef.current.removeEventListener('setCurrentLocation', handleSetCurrentLocation);
            }
        };
    }, [map, startCoords, startPoint]);

    // Tạo nội dung loading với Skeleton
    const loadingContent = (
        <div className="py-2 px-1">
            <div className="flex items-center mb-2">
                <Skeleton.Avatar active size="small" className="mr-2" />
                <Skeleton.Input active size="small" style={{ width: '60%' }} />
            </div>
            <div className="ml-8">
                <Skeleton.Input active size="small" style={{ width: '80%' }} />
            </div>
            <div className="flex items-center mt-2">
                <Skeleton.Avatar active size="small" className="mr-2" />
                <Skeleton.Input active size="small" style={{ width: '60%' }} />
            </div>
            <div className="ml-8">
                <Skeleton.Input active size="small" style={{ width: '80%' }} />
            </div>
        </div>
    );

    const clearRoute = () => {
        if (!map) return;

        // Remove markers
        if (startMarkerRef.current) {
            startMarkerRef.current.remove();
            startMarkerRef.current = null;
        }

        if (endMarkerRef.current) {
            endMarkerRef.current.remove();
            endMarkerRef.current = null;
        }

        // Remove route layer and source
        if (map.getLayer(routeLayerId)) {
            map.removeLayer(routeLayerId);
        }

        if (map.getSource(routeSourceId)) {
            map.removeSource(routeSourceId);
        }

        // Clear route info
        setRouteInfo(null);
    };

    const findRoute = async () => {
        if (!map || !startCoords || !endCoords) {
            message.error('Vui lòng chọn điểm đi và điểm đến');
            return;
        }

        setIsLoading(true);

        try {
            // Clear previous route
            if (map.getLayer(routeLayerId)) {
                map.removeLayer(routeLayerId);
            }

            if (map.getSource(routeSourceId)) {
                map.removeSource(routeSourceId);
            }

            // Get directions using the new API
            const directions = await getDirectionsV2(
                startCoords[1], // lat
                startCoords[0], // lng
                endCoords[1],   // lat
                endCoords[0],   // lng
                profile
            );

            if (!directions || directions.status !== 'OK' || !directions.routes || directions.routes.length === 0) {
                message.warning('Không tìm thấy đường đi giữa hai điểm này');
                setIsLoading(false);
                return;
            }

            const route = directions.routes[0];

            // Lưu route hiện tại để sử dụng cho mô phỏng
            currentRouteRef.current = route;

            // Decode the polyline to get coordinates
            let coordinates: [number, number][] = [];

            // Tạo coordinates từ tất cả các steps và polyline của từng step
            if (route.legs && route.legs[0] && route.legs[0].steps) {
                const steps = route.legs[0].steps;

                // Tạo mảng tọa độ từ polyline của từng step
                steps.forEach((step: any) => {
                    if (step.polyline && step.polyline.points) {
                        // Giải mã polyline của từng step
                        const stepPoints = decodePolyline(step.polyline.points);

                        // Chuyển đổi từ [lat, lng] sang [lng, lat] cho TrackAsia GL
                        const stepCoords = stepPoints.map(point => {
                            // Đảm bảo lat và lng hợp lệ
                            const lat = point[0];
                            const lng = point[1];
                            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                                return [lng, lat] as [number, number];
                            }
                            return null;
                        }).filter(point => point !== null) as [number, number][];

                        // Thêm vào mảng tọa độ chính
                        coordinates = [...coordinates, ...stepCoords];
                    }
                });
            }

            // Nếu không có đủ tọa độ từ các step, sử dụng overview_polyline
            if (coordinates.length < 2 && route.overview_polyline && route.overview_polyline.points) {
                // Decode the polyline
                const decodedPoints = decodePolyline(route.overview_polyline.points);
                // Convert from [lat, lng] to [lng, lat] for TrackAsia GL
                const polylineCoords = decodedPoints.map(point => {
                    // Đảm bảo lat và lng hợp lệ
                    const lat = point[0];
                    const lng = point[1];
                    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                        return [lng, lat] as [number, number];
                    }
                    return null;
                }).filter(point => point !== null) as [number, number][];

                if (polylineCoords.length > 0) {
                    coordinates = polylineCoords;
                }
            }

            // Fallback to simple straight line nếu không có coordinates
            if (coordinates.length < 2) {
                coordinates = [[startCoords[0], startCoords[1]], [endCoords[0], endCoords[1]]];
            }

            // Lưu tọa độ tuyến đường để sử dụng cho mô phỏng
            routeCoordinatesRef.current = coordinates;

            // Kiểm tra và đảm bảo tọa độ hợp lệ trước khi thêm vào map
            let validCoordinates = coordinates.filter(coord => {
                // Kiểm tra lat (-90 đến 90) và lng (-180 đến 180)
                const lng = coord[0];
                const lat = coord[1];
                return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
            });

            // Đảm bảo có ít nhất 2 điểm để vẽ đường
            if (validCoordinates.length < 2) {
                // Thêm điểm đầu và điểm cuối nếu có
                if (startCoords && endCoords) {
                    validCoordinates = [[startCoords[0], startCoords[1]], [endCoords[0], endCoords[1]]];
                } else {
                    message.warning('Không đủ dữ liệu để vẽ tuyến đường');
                    setIsLoading(false);
                    return;
                }
            }

            // Add route to map
            map.addSource(routeSourceId, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: validCoordinates
                    }
                }
            });

            map.addLayer({
                id: routeLayerId,
                type: 'line',
                source: routeSourceId,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#3887be',
                    'line-width': 5,
                    'line-opacity': 0.75
                }
            });

            // Fit map to show the route
            const bounds = new trackasiagl.LngLatBounds();

            // Extend bounds with all coordinates in the route
            validCoordinates.forEach(coord => {
                if (coord && coord.length === 2 && !isNaN(coord[0]) && !isNaN(coord[1])) {
                    bounds.extend(coord as trackasiagl.LngLatLike);
                }
            });

            // Kiểm tra nếu bounds không rỗng trước khi gọi fitBounds
            if (!bounds.isEmpty()) {
                map.fitBounds(bounds, {
                    padding: {
                        top: 100,
                        bottom: 100,
                        left: 350,
                        right: 100
                    },
                    maxZoom: 10
                });
            } else if (validCoordinates.length > 0) {
                // Fallback: nếu không có bounds hợp lệ nhưng có ít nhất một tọa độ
                map.flyTo({
                    center: validCoordinates[0] as trackasiagl.LngLatLike,
                    zoom: 12
                });
            }

            // Extract route steps from the first leg
            const steps = route.legs[0].steps.map((step: any) => {
                // Remove HTML tags from instructions
                const instruction = step.html_instructions ? step.html_instructions.replace(/<[^>]*>?/gm, '') : 'Đi thẳng';

                // Đảm bảo các trường distance và duration có giá trị hợp lệ
                const distanceText = step.distance && step.distance.text ? step.distance.text : '0m';
                const durationText = step.duration && step.duration.text ? step.duration.text : '0 giây';

                return {
                    instruction,
                    distance: distanceText,
                    duration: durationText,
                    maneuver: step.maneuver || '',
                    interval: [0, 0] // Thêm interval để tương thích với code mô phỏng
                };
            });

            // Assign interval values for steps
            const totalPoints = coordinates.length;
            const stepCount = steps.length;

            if (stepCount > 0) {
                for (let i = 0; i < stepCount; i++) {
                    const startIdx = Math.floor((i / stepCount) * totalPoints);
                    const endIdx = Math.floor(((i + 1) / stepCount) * totalPoints);
                    steps[i].interval = [startIdx, endIdx];
                }
            }

            // Đảm bảo có giá trị hợp lệ cho distance và duration
            const routeDistance = route.legs[0].distance && route.legs[0].distance.text
                ? route.legs[0].distance.text
                : '0 km';

            const routeDuration = route.legs[0].duration && route.legs[0].duration.text
                ? route.legs[0].duration.text
                : '0 phút';

            // Set route info
            setRouteInfo({
                distance: routeDistance,
                duration: routeDuration,
                steps: steps.map((step: { instruction: string; distance: string; duration: string; maneuver: string; interval: number[] }) => ({
                    ...step,
                    // Đảm bảo khoảng cách hiển thị đúng
                    distance: step.distance
                }))
            });

            // Gửi thông tin tuyến đường lên parent component
            if (parentStartNavigation || parentStartSimulation) {
                // Chuẩn bị dữ liệu tuyến đường với các giá trị hợp lệ
                const routeForParent = {
                    ...route,
                    legs: [{
                        ...route.legs[0],
                        distance: {
                            text: routeDistance,
                            value: route.legs[0].distance?.value || 0
                        },
                        duration: {
                            text: routeDuration,
                            value: route.legs[0].duration?.value || 0
                        },
                        steps: steps
                    }]
                };

                // Tạo và kích hoạt sự kiện tùy chỉnh để thông báo cho parent
                const event = new CustomEvent('routeFound', {
                    bubbles: true,
                    detail: {
                        route: routeForParent,
                        coordinates: coordinates
                    }
                });
                document.dispatchEvent(event);
            }

            message.success('Đã tìm thấy đường đi');
        } catch (error) {
            console.error('Error finding route:', error);
            message.error('Lỗi tìm đường. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartSearchChange = (value: string) => {
        setStartPoint(value);

        if (startSearchTimeoutRef.current) {
            clearTimeout(startSearchTimeoutRef.current);
        }

        if (value.length >= 2) {
            setIsSearchingStart(true);

            startSearchTimeoutRef.current = setTimeout(async () => {
                try {
                    // Use the current map bounds to bias results
                    let mapBounds = undefined;
                    if (map) {
                        const bounds = map.getBounds();
                        mapBounds = {
                            north: bounds.getNorth(),
                            east: bounds.getEast(),
                            south: bounds.getSouth(),
                            west: bounds.getWest()
                        };
                    }

                    // Sử dụng vị trí hiện tại từ điểm kết thúc nếu có
                    let currentLocation = undefined;
                    if (endCoords) {
                        currentLocation = {
                            lat: endCoords[1], // lat
                            lng: endCoords[0]  // lng
                        };
                    }

                    const response = await searchPlacesAutocomplete(
                        value,
                        mapBounds,
                        currentLocation
                    );

                    if (response.status === 'OK' && response.predictions.length > 0) {
                        // Định nghĩa type cho prediction với distance
                        type PredictionWithDistance = AutocompleteResult & {
                            location?: { lat: number; lng: number };
                            distance?: number;
                        };

                        // Nếu có vị trí hiện tại từ điểm kết thúc, tính khoảng cách và thêm vào kết quả
                        if (currentLocation) {
                            // Lấy chi tiết của mỗi địa điểm để có thông tin về vị trí
                            const predictionsWithDetails = await Promise.all(
                                response.predictions.map(async (prediction) => {
                                    try {
                                        const details = await getPlaceDetails(prediction.place_id);
                                        if (details && details.status === 'OK') {
                                            const place = details.result;
                                            const distance = calculateDistanceWrapper(
                                                currentLocation.lat,
                                                currentLocation.lng,
                                                place.geometry.location.lat,
                                                place.geometry.location.lng
                                            );
                                            return {
                                                ...prediction,
                                                location: place.geometry.location,
                                                distance
                                            } as PredictionWithDistance;
                                        }
                                        return prediction as PredictionWithDistance;
                                    } catch (error) {
                                        console.error('Error getting place details:', error);
                                        return prediction as PredictionWithDistance;
                                    }
                                })
                            );

                            // Lọc các kết quả có thông tin khoảng cách
                            const resultsWithDistance = predictionsWithDetails.filter(
                                (pred): pred is PredictionWithDistance & { distance: number } =>
                                    pred.hasOwnProperty('distance') && typeof pred.distance === 'number'
                            );

                            // Sắp xếp theo khoảng cách tăng dần
                            resultsWithDistance.sort((a, b) => a.distance - b.distance);

                            // Chuyển đổi kết quả thành options cho AutoComplete
                            const formattedOptions = resultsWithDistance.map(prediction => ({
                                value: prediction.description,
                                label: (
                                    <div>
                                        <div className="font-medium">{prediction.structured_formatting.main_text}</div>
                                        <div className="flex justify-between">
                                            <div className="text-xs text-gray-500">{prediction.structured_formatting.secondary_text}</div>
                                            <div className="text-xs text-blue-500 font-medium">{formatDistance(prediction.distance)}</div>
                                        </div>
                                    </div>
                                ),
                                feature: prediction
                            }));
                            setStartOptions(formattedOptions);
                        } else {
                            // Không có vị trí hiện tại, hiển thị kết quả bình thường
                            const formattedOptions = response.predictions.map(prediction => ({
                                value: prediction.description,
                                label: (
                                    <div>
                                        <div className="font-medium">{prediction.structured_formatting.main_text}</div>
                                        <div className="text-xs text-gray-500">{prediction.structured_formatting.secondary_text}</div>
                                    </div>
                                ),
                                feature: prediction
                            }));
                            setStartOptions(formattedOptions);
                        }
                    } else {
                        setStartOptions([]);
                    }
                    setIsSearchingStart(false);
                } catch (error) {
                    console.error('Error searching start point:', error);
                    setStartOptions([]);
                    setIsSearchingStart(false);
                }
            }, 500);
        } else {
            setStartOptions([]);
            setIsSearchingStart(false);
        }
    };

    const handleEndSearchChange = (value: string) => {
        setEndPoint(value);

        if (endSearchTimeoutRef.current) {
            clearTimeout(endSearchTimeoutRef.current);
        }

        if (value.length >= 2) {
            setIsSearchingEnd(true);

            endSearchTimeoutRef.current = setTimeout(async () => {
                try {
                    // Use the current map bounds to bias results
                    let mapBounds = undefined;
                    if (map) {
                        const bounds = map.getBounds();
                        mapBounds = {
                            north: bounds.getNorth(),
                            east: bounds.getEast(),
                            south: bounds.getSouth(),
                            west: bounds.getWest()
                        };
                    }

                    // Sử dụng vị trí hiện tại từ điểm bắt đầu nếu có
                    let currentLocation = undefined;
                    if (startCoords) {
                        currentLocation = {
                            lat: startCoords[1], // lat
                            lng: startCoords[0]  // lng
                        };
                    }

                    const response = await searchPlacesAutocomplete(
                        value,
                        mapBounds,
                        currentLocation
                    );

                    if (response.status === 'OK' && response.predictions.length > 0) {
                        // Định nghĩa type cho prediction với distance
                        type PredictionWithDistance = AutocompleteResult & {
                            location?: { lat: number; lng: number };
                            distance?: number;
                        };

                        // Nếu có vị trí hiện tại từ điểm bắt đầu, tính khoảng cách và thêm vào kết quả
                        if (currentLocation) {
                            // Lấy chi tiết của mỗi địa điểm để có thông tin về vị trí
                            const predictionsWithDetails = await Promise.all(
                                response.predictions.map(async (prediction) => {
                                    try {
                                        const details = await getPlaceDetails(prediction.place_id);
                                        if (details && details.status === 'OK') {
                                            const place = details.result;
                                            const distance = calculateDistanceWrapper(
                                                currentLocation.lat,
                                                currentLocation.lng,
                                                place.geometry.location.lat,
                                                place.geometry.location.lng
                                            );
                                            return {
                                                ...prediction,
                                                location: place.geometry.location,
                                                distance
                                            } as PredictionWithDistance;
                                        }
                                        return prediction as PredictionWithDistance;
                                    } catch (error) {
                                        console.error('Error getting place details:', error);
                                        return prediction as PredictionWithDistance;
                                    }
                                })
                            );

                            // Lọc các kết quả có thông tin khoảng cách
                            const resultsWithDistance = predictionsWithDetails.filter(
                                (pred): pred is PredictionWithDistance & { distance: number } =>
                                    pred.hasOwnProperty('distance') && typeof pred.distance === 'number'
                            );

                            // Sắp xếp theo khoảng cách tăng dần
                            resultsWithDistance.sort((a, b) => a.distance - b.distance);

                            // Chuyển đổi kết quả thành options cho AutoComplete
                            const formattedOptions = resultsWithDistance.map(prediction => ({
                                value: prediction.description,
                                label: (
                                    <div>
                                        <div className="font-medium">{prediction.structured_formatting.main_text}</div>
                                        <div className="flex justify-between">
                                            <div className="text-xs text-gray-500">{prediction.structured_formatting.secondary_text}</div>
                                            <div className="text-xs text-blue-500 font-medium">{formatDistance(prediction.distance)}</div>
                                        </div>
                                    </div>
                                ),
                                feature: prediction
                            }));
                            setEndOptions(formattedOptions);
                        } else {
                            // Không có vị trí hiện tại, hiển thị kết quả bình thường
                            const formattedOptions = response.predictions.map(prediction => ({
                                value: prediction.description,
                                label: (
                                    <div>
                                        <div className="font-medium">{prediction.structured_formatting.main_text}</div>
                                        <div className="text-xs text-gray-500">{prediction.structured_formatting.secondary_text}</div>
                                    </div>
                                ),
                                feature: prediction
                            }));
                            setEndOptions(formattedOptions);
                        }
                    } else {
                        setEndOptions([]);
                    }
                    setIsSearchingEnd(false);
                } catch (error) {
                    console.error('Error searching end point:', error);
                    setEndOptions([]);
                    setIsSearchingEnd(false);
                }
            }, 500);
        } else {
            setEndOptions([]);
            setIsSearchingEnd(false);
        }
    };

    const handleSelectStartPlace = (value: string, option: any) => {
        if (!map || !option.feature) return;

        const feature = option.feature as AutocompleteResult;

        // Get place details
        getPlaceDetails(feature.place_id)
            .then(response => {
                if (response && response.status === 'OK') {
                    const place = response.result;

                    // Get coordinates
                    const lat = place.geometry.location.lat;
                    const lng = place.geometry.location.lng;

                    // Update start point
                    setStartPoint(place.formatted_address);
                    setStartCoords([lng, lat]);

                    // Add marker
                    if (map) {
                        if (startMarkerRef.current) {
                            startMarkerRef.current.remove();
                        }

                        startMarkerRef.current = new trackasiagl.Marker({ color: '#00FF00' })
                            .setLngLat([lng, lat])
                            .addTo(map);

                        // If we have both markers, fit the map to show both
                        if (endMarkerRef.current) {
                            const bounds = new trackasiagl.LngLatBounds()
                                .extend(startMarkerRef.current.getLngLat())
                                .extend(endMarkerRef.current.getLngLat());

                            map.fitBounds(bounds, {
                                padding: {
                                    top: 100,
                                    bottom: 100,
                                    left: 350,
                                    right: 100
                                },
                                maxZoom: 12
                            });
                        } else {
                            // Otherwise just fly to this point
                            map.flyTo({
                                center: [lng, lat],
                                zoom: 12
                            });
                        }
                    }
                }
            })
            .catch(error => {
                console.error('Error getting place details:', error);
            });
    };

    const handleSelectEndPlace = (value: string, option: any) => {
        if (!map || !option.feature) return;

        const feature = option.feature as AutocompleteResult;

        // Get place details
        getPlaceDetails(feature.place_id)
            .then(response => {
                if (response && response.status === 'OK') {
                    const place = response.result;

                    // Get coordinates
                    const lat = place.geometry.location.lat;
                    const lng = place.geometry.location.lng;

                    // Update end point
                    setEndPoint(place.formatted_address);
                    setEndCoords([lng, lat]);

                    // Add marker
                    if (map) {
                        if (endMarkerRef.current) {
                            endMarkerRef.current.remove();
                        }

                        endMarkerRef.current = new trackasiagl.Marker({ color: '#FF0000' })
                            .setLngLat([lng, lat])
                            .addTo(map);

                        // If we have both markers, fit the map to show both
                        if (startMarkerRef.current) {
                            const bounds = new trackasiagl.LngLatBounds()
                                .extend(startMarkerRef.current.getLngLat())
                                .extend(endMarkerRef.current.getLngLat());

                            map.fitBounds(bounds, {
                                padding: {
                                    top: 100,
                                    bottom: 100,
                                    left: 350,
                                    right: 100
                                },
                                maxZoom: 12
                            });
                        } else {
                            // Otherwise just fly to this point
                            map.flyTo({
                                center: [lng, lat],
                                zoom: 12
                            });
                        }
                    }
                }
            })
            .catch(error => {
                console.error('Error getting place details:', error);
            });
    };

    const useCurrentLocationAsStart = () => {
        // Kích hoạt sự kiện để thông báo cho trang chính rằng chúng ta cần vị trí hiện tại
        const event = new CustomEvent('requestCurrentLocation', {
            bubbles: true,
            composed: true
        });

        if (directionsDemoRef.current) {
            directionsDemoRef.current.dispatchEvent(event);
        } else {
            // Fallback nếu không thể sử dụng sự kiện
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;

                        // Update start point
                        setStartCoords([longitude, latitude]);

                        // Add marker
                        if (map) {
                            if (startMarkerRef.current) {
                                startMarkerRef.current.remove();
                            }

                            startMarkerRef.current = new trackasiagl.Marker({ color: '#00FF00' })
                                .setLngLat([longitude, latitude])
                                .addTo(map);

                            // Fly to location
                            map.flyTo({
                                center: [longitude, latitude],
                                zoom: 12
                            });

                            // Get address
                            reverseGeocodeV2(latitude, longitude)
                                .then(response => {
                                    if (response && response.status === 'OK' && response.results && response.results.length > 0) {
                                        setStartPoint(response.results[0].formatted_address);
                                    } else {
                                        setStartPoint(`Vị trí hiện tại (${longitude.toFixed(6)}, ${latitude.toFixed(6)})`);
                                    }
                                })
                                .catch(error => {
                                    console.error('Error reverse geocoding:', error);
                                    setStartPoint(`Vị trí hiện tại (${longitude.toFixed(6)}, ${latitude.toFixed(6)})`);
                                });
                        }
                    },
                    (error) => {
                        console.error('Error getting current location:', error);
                        message.error('Không thể xác định vị trí hiện tại của bạn');
                    }
                );
            } else {
                message.error('Trình duyệt của bạn không hỗ trợ định vị');
            }
        }
    };

    const swapPoints = () => {
        if (!startCoords || !endCoords) return;

        // Swap text values
        const tempPoint = startPoint;
        setStartPoint(endPoint);
        setEndPoint(tempPoint);

        // Swap coordinates
        const tempCoords = startCoords;
        setStartCoords(endCoords);
        setEndCoords(tempCoords);

        // Swap markers
        if (map && startMarkerRef.current && endMarkerRef.current) {
            const startLngLat = startMarkerRef.current.getLngLat();
            const endLngLat = endMarkerRef.current.getLngLat();

            startMarkerRef.current.setLngLat(endLngLat);
            endMarkerRef.current.setLngLat(startLngLat);
        }

        // Clear route if exists
        clearRoute();
    };

    // Wrapper functions for parent functions
    const handleStartSimulation = () => {
        if (parentStartSimulation) {
            parentStartSimulation();
        } else {
            message.info('Chức năng mô phỏng đang được phát triển');
        }
    };

    const handleStopSimulation = () => {
        if (parentStopSimulation) {
            parentStopSimulation();
        }
    };

    const handleStartNavigation = () => {
        if (parentStartNavigation) {
            parentStartNavigation();
        } else {
            message.info('Chức năng dẫn đường đang được phát triển');
        }
    };

    const handleChangeSimulationSpeed = (speed: number) => {
        if (parentChangeSimulationSpeed) {
            parentChangeSimulationSpeed(speed);
        } else {
            setSimulationSpeed(speed);
        }
    };

    // Dừng mô phỏng và dọn dẹp
    const stopSimulation = null;

    // Bắt đầu mô phỏng
    const startSimulation = null;

    // Bắt đầu dẫn đường
    const startNavigation = null;

    // Tính toán góc bearing giữa hai điểm (để xác định hướng di chuyển)
    const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number) => {
        // Chuyển đổi từ độ sang radian
        const lat1Rad = (lat1 * Math.PI) / 180;
        const lat2Rad = (lat2 * Math.PI) / 180;
        const lngDiff = ((lng2 - lng1) * Math.PI) / 180;

        // Tính toán góc bearing
        const y = Math.sin(lngDiff) * Math.cos(lat2Rad);
        const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(lngDiff);
        const bearing = (Math.atan2(y, x) * 180) / Math.PI;

        // Chuyển đổi sang góc từ 0-360
        return (bearing + 360) % 360;
    };

    // Thay đổi tốc độ mô phỏng
    const changeSimulationSpeed = null;

    const getVehicleIcon = () => {
        switch (profile) {
            case 'driving':
                return <CarOutlined />;
            case 'walking':
                return <EnvironmentOutlined />;
            case 'motorcycling':
                return <CompassOutlined />;
            case 'truck':
                return <CarOutlined />;
            default:
                return <CarOutlined />;
        }
    };

    // Format distance for display
    const formatDistance = (distance: string | number): string => {
        if (typeof distance === 'string') return distance;

        // Giả sử distance đã ở đơn vị mét
        if (distance >= 1000) {
            return `${(distance / 1000).toFixed(1)} km`;
        } else {
            return `${Math.round(distance)} m`;
        }
    };

    // Format time for display
    const formatTime = (time: string | number): string => {
        if (typeof time === 'string') return time;

        const minutes = Math.round(Number(time) / 60);
        if (minutes < 60) {
            return `${minutes} phút`;
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return `${hours} giờ ${remainingMinutes > 0 ? `${remainingMinutes} phút` : ''}`;
        }
    };

    return (
        <Space direction="vertical" className="w-full" ref={directionsDemoRef}>
            {/* Vehicle selection */}
            <div className="mb-2">
                <Select
                    value={profile}
                    onChange={(value) => setProfile(value)}
                    className="w-full"
                    options={[
                        { value: 'driving', label: 'Ô tô' },
                        { value: 'motorcycling', label: 'Xe máy' },
                        { value: 'walking', label: 'Đi bộ' },
                        { value: 'truck', label: 'Xe tải' }
                    ]}
                />
            </div>

            {/* Start point */}
            <div className="relative w-full">
                <div className="flex items-center mb-1">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white mr-2">
                        A
                    </div>
                    <div className="text-sm font-medium">Điểm xuất phát</div>
                </div>
                <div className="flex">
                    <AutoComplete
                        className="flex-1"
                        options={startOptions}
                        onSelect={handleSelectStartPlace}
                        onSearch={handleStartSearchChange}
                        value={startPoint}
                        placeholder="Chọn điểm xuất phát"
                        notFoundContent={isSearchingStart ? loadingContent : (startPoint.length >= 2 ? "Không tìm thấy kết quả" : null)}
                        dropdownMatchSelectWidth={true}
                    />
                    <Tooltip title="Dùng vị trí hiện tại">
                        <Button
                            type="text"
                            icon={<AimOutlined />}
                            onClick={useCurrentLocationAsStart}
                        />
                    </Tooltip>
                </div>
            </div>

            {/* Swap button */}
            <div className="flex justify-center my-1">
                <Button
                    type="text"
                    icon={<SwapOutlined />}
                    onClick={swapPoints}
                    disabled={!startCoords || !endCoords}
                />
            </div>

            {/* End point */}
            <div className="relative w-full">
                <div className="flex items-center mb-1">
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white mr-2">
                        B
                    </div>
                    <div className="text-sm font-medium">Điểm đến</div>
                </div>
                <AutoComplete
                    className="w-full"
                    options={endOptions}
                    onSelect={handleSelectEndPlace}
                    onSearch={handleEndSearchChange}
                    value={endPoint}
                    placeholder="Chọn điểm đến"
                    notFoundContent={isSearchingEnd ? loadingContent : (endPoint.length >= 2 ? "Không tìm thấy kết quả" : null)}
                    dropdownMatchSelectWidth={true}
                />
            </div>

            {/* Buttons */}
            <div className="mt-4 space-y-2">
                <Button
                    type="primary"
                    block
                    icon={<SearchOutlined />}
                    onClick={findRoute}
                    loading={isLoading}
                    className="bg-blue-500 hover:bg-blue-600"
                >
                    Tìm đường
                </Button>

                {routeInfo && (
                    <>
                        <Button
                            block
                            icon={<CarOutlined />}
                            onClick={handleStartNavigation}
                            disabled={isSimulating || isNavigating}
                            className="bg-green-500 text-white hover:bg-green-600 border-green-500"
                        >
                            Bắt đầu dẫn đường
                        </Button>

                        <Button
                            block
                            icon={<PlayCircleOutlined />}
                            onClick={handleStartSimulation}
                            disabled={isSimulating || isNavigating}
                            className="bg-blue-500 text-white hover:bg-blue-600 border-blue-500"
                        >
                            Mô phỏng
                        </Button>
                    </>
                )}
            </div>

            {/* Route info */}
            {routeInfo && (
                <div className="mt-4 border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                        <div className="font-bold text-lg">Kết quả tìm đường</div>
                        <Button
                            type="text"
                            icon={<CloseCircleOutlined />}
                            onClick={() => setRouteInfo(null)}
                            size="small"
                        />
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg mb-3">
                        <div className="flex justify-between mb-1">
                            <div className="text-gray-600">Tổng quãng đường:</div>
                            <div className="font-medium">{routeInfo.distance}</div>
                        </div>
                        <div className="flex justify-between">
                            <div className="text-gray-600">Thời gian ước tính:</div>
                            <div className="font-medium">{routeInfo.duration}</div>
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                        <List
                            itemLayout="horizontal"
                            dataSource={routeInfo.steps}
                            renderItem={(step: { instruction: string; distance: string; duration: string }, index: number) => (
                                <List.Item className={index === currentStepIndex ? 'bg-blue-50 rounded p-2' : 'p-2'}>
                                    <List.Item.Meta
                                        avatar={<div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">{index + 1}</div>}
                                        title={step.instruction}
                                        description={`${step.distance} - ${step.duration}`}
                                    />
                                </List.Item>
                            )}
                        />
                    </div>
                </div>
            )}
        </Space>
    );
};

export default DirectionsDemo; 