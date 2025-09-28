import React, { useEffect, useRef, useState } from 'react';
import trackasiagl from 'trackasia-gl';
import 'trackasia-gl/dist/trackasia-gl.css';
import { Card, Typography, Tabs, message, Button } from 'antd';
import { EnvironmentOutlined, SearchOutlined, CarOutlined, MenuOutlined } from '@ant-design/icons';
import { TRACKASIA_MAP_API_KEY } from '../../config/env';
import MarkerDemo from './components/MarkerDemo';
import DirectionsDemo from './components/DirectionsDemo';
import SearchPanel from './components/SearchPanel';
import trackasiaService from '../../services/map/trackasiaService';
// Import các hàm từ models
import { calculateDistance } from '../../models/Map';

// Định nghĩa kiểu cho prediction với distance
type PredictionWithDistance = AutocompleteResult & {
    location?: { lat: number; lng: number };
    distance?: number;
};

// Định nghĩa lại hàm formatDistance để tương thích với code hiện tại
const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
};

// Hàm để chuyển đổi khoảng cách từ m sang km khi cần
const formatDistanceForDisplay = (distanceStr: string): string => {
    // Nếu đã là chuỗi có đơn vị, kiểm tra và định dạng lại nếu cần
    if (distanceStr.includes('km') || distanceStr.includes('m')) {
        return distanceStr;
    }

    // Nếu là số (mét), định dạng lại
    const distance = parseFloat(distanceStr);
    if (isNaN(distance)) return distanceStr;

    if (distance >= 1000) {
        return `${(distance / 1000).toFixed(1)} km`;
    }
    return `${Math.round(distance)} m`;
};

// Wrapper cho hàm calculateDistance để tương thích với code cũ
const calculateDistanceWrapper = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const point1 = { lat: lat1, lng: lon1 };
    const point2 = { lat: lat2, lng: lon2 };
    // Hàm calculateDistance trả về kết quả tính bằng mét
    return calculateDistance(point1, point2);
};
import type {
    AutocompleteResult,
    PlaceDetailResult as PlaceDetailsResult,
    ReverseGeocodingResponse,
    ReverseGeocodingResult
} from '../../models/TrackAsia';
import NavigationPanel from './components/NavigationPanel';
import TripSummary from './components/TripSummary';
import MapControls from './components/MapControls';

// Khai báo kiểu cho window object
declare global {
    interface Window {
        __AUTH_TOKEN__?: string | null;
    }
}

const { Title } = Typography;
const { TabPane } = Tabs;

// Vietnam boundaries
const VIETNAM_BOUNDS = {
    north: 23.393395, // Northernmost point
    south: 8.559615,  // Southernmost point
    west: 102.144033, // Westernmost point
    east: 109.469720  // Easternmost point
};

// Map styles
const MAP_STYLES = {
    STREETS: `https://maps.track-asia.com/styles/v2/streets.json?key=${TRACKASIA_MAP_API_KEY}`,
    NIGHT: `https://maps.track-asia.com/styles/v2/night.json?key=${TRACKASIA_MAP_API_KEY}`,
    SIMPLE: `https://maps.track-asia.com/styles/v2/simple.json?key=${TRACKASIA_MAP_API_KEY}`,
    STREETS_RASTER: `https://maps.track-asia.com/styles/v2/streets-raster.json?key=${TRACKASIA_MAP_API_KEY}`
};

// Cập nhật hàm formatTime để xử lý đúng định dạng thời gian
const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    if (minutes < 60) {
        return `${minutes} phút${seconds > 0 ? ` ${seconds} giây` : ''}`;
    } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours} giờ${remainingMinutes > 0 ? ` ${remainingMinutes} phút` : ''}`;
    }
};

// Calculate bearing between two points
const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const toDeg = (value: number) => (value * 180) / Math.PI;

    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
        Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    const brng = toDeg(Math.atan2(y, x));

    return (brng + 360) % 360;
};

// Find closest point on route to current position
const findClosestPointOnRoute = (position: [number, number], routePoints: [number, number][]): number => {
    let minDistance = Infinity;
    let closestPointIndex = 0;

    for (let i = 0; i < routePoints.length; i++) {
        const distance = calculateDistanceWrapper(
            position[1], position[0],
            routePoints[i][1], routePoints[i][0]
        );

        if (distance < minDistance) {
            minDistance = distance;
            closestPointIndex = i;
        }
    }

    return closestPointIndex;
};

// Calculate remaining distance on route
const calculateRemainingDistance = (
    position: [number, number],
    routePoints: [number, number][],
    closestPointIndex: number
): number => {
    let remainingDist = 0;

    // Add distance from current position to closest point on route
    remainingDist += calculateDistanceWrapper(
        position[1], position[0],
        routePoints[closestPointIndex][1], routePoints[closestPointIndex][0]
    );

    // Add distances between remaining points on route
    for (let i = closestPointIndex; i < routePoints.length - 1; i++) {
        remainingDist += calculateDistanceWrapper(
            routePoints[i][1], routePoints[i][0],
            routePoints[i + 1][1], routePoints[i + 1][0]
        );
    }

    // Trả về khoảng cách tính bằng mét
    return remainingDist;
};

// Find current instruction based on route position
const findCurrentInstruction = (
    currentPointIndex: number,
    instructions: any[]
): number => {
    for (let i = instructions.length - 1; i >= 0; i--) {
        if (currentPointIndex >= instructions[i].interval[0]) {
            return i;
        }
    }
    return 0;
};

// Calculate distance to next turn
const calculateDistanceToNextTurn = (
    position: [number, number],
    routePoints: [number, number][],
    closestPointIndex: number,
    instructions: any[],
    currentInstructionIndex: number
): number => {
    if (currentInstructionIndex >= instructions.length - 1) {
        return 0; // No next turn
    }

    const nextInstruction = instructions[currentInstructionIndex + 1];
    const nextTurnPointIndex = nextInstruction.interval[0];

    let distToNextTurn = 0;

    // Add distance from current position to closest point on route
    distToNextTurn += calculateDistanceWrapper(
        position[1], position[0],
        routePoints[closestPointIndex][1], routePoints[closestPointIndex][0]
    );

    // Add distances between points until next turn
    for (let i = closestPointIndex; i < nextTurnPointIndex; i++) {
        distToNextTurn += calculateDistanceWrapper(
            routePoints[i][1], routePoints[i][0],
            routePoints[i + 1][1], routePoints[i + 1][0]
        );
    }

    return distToNextTurn;
};

const TrackAsiaMapPage: React.FC = () => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<trackasiagl.Map | null>(null);
    const [lng, setLng] = useState<number>(106.694945);
    const [lat, setLat] = useState<number>(10.769034);
    const [zoom, setZoom] = useState<number>(9);
    const [currentStyle, setCurrentStyle] = useState<string>(MAP_STYLES.STREETS);
    const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<string>("search");
    const [messageApi, contextHolder] = message.useMessage();

    // Thêm state lưu trữ vị trí hiện tại
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

    // Search states
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [options, setOptions] = useState<{ value: string; label: React.ReactNode; feature: any }[]>([]);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [currentAddress, setCurrentAddress] = useState<string>('');
    const [addressDetails, setAddressDetails] = useState<any>(null);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const markersRef = useRef<trackasiagl.Marker[]>([]);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Navigation and simulation states
    const [isNavigating, setIsNavigating] = useState<boolean>(false);
    const [isSimulating, setIsSimulating] = useState<boolean>(false);
    const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
    const [remainingDistance, setRemainingDistance] = useState<string>('');
    const [remainingTime, setRemainingTime] = useState<string>('');
    const [currentInstructionIndex, setCurrentInstructionIndex] = useState<number>(0);
    const [nextTurnDistance, setNextTurnDistance] = useState<number>(0);
    const [compassHeading, setCompassHeading] = useState<number | null>(null);
    const [isNavigationPanelCollapsed, setIsNavigationPanelCollapsed] = useState<boolean>(false);
    const [showNavigationModal, setShowNavigationModal] = useState<boolean>(false);
    const [showTripSummary, setShowTripSummary] = useState<boolean>(false);
    const [currentSpeed, setCurrentSpeed] = useState<number>(0); // Tốc độ hiện tại (km/h)
    const [tripSummary, setTripSummary] = useState<{
        startTime: number | null;
        endTime: number | null;
        totalDistance: number;
        totalTime: number;
        averageSpeed: number;
    }>({
        startTime: null,
        endTime: null,
        totalDistance: 0,
        totalTime: 0,
        averageSpeed: 0
    });

    // Route states
    const [routeInfo, setRouteInfo] = useState<{
        distance: string;
        duration: string;
        steps: any[];
    } | null>(null);
    const routeCoordinatesRef = useRef<[number, number][]>([]);
    const routeLayerId = 'route-layer';
    const routeSourceId = 'route-source';

    // Navigation and simulation refs
    const startMarkerRef = useRef<trackasiagl.Marker | null>(null);
    const endMarkerRef = useRef<trackasiagl.Marker | null>(null);
    const userLocationMarkerRef = useRef<trackasiagl.Marker | null>(null);
    const simulationMarkerRef = useRef<trackasiagl.Marker | null>(null);
    const simulationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const watchPositionRef = useRef<number | null>(null);
    const simulationRoutePointsRef = useRef<[number, number][]>([]);
    const simulationCurrentPointIndexRef = useRef<number>(0);
    const navigationProgressRef = useRef<number>(0);

    // Thêm biến selectedMarkerRef
    const selectedMarkerRef = useRef<trackasiagl.Marker | null>(null);

    // Thêm state để quản lý việc hiển thị/ẩn panel điều khiển
    const [showControlPanel, setShowControlPanel] = useState<boolean>(true);

    // Thêm state để quản lý trạng thái tạm dừng
    const [isPaused, setIsPaused] = useState<boolean>(false);

    // Tạm dừng/tiếp tục dẫn đường
    const togglePauseNavigation = () => {
        if (isNavigating) {
            if (isPaused) {
                // Tiếp tục dẫn đường
                resumeNavigation();
            } else {
                // Tạm dừng dẫn đường
                pauseNavigation();
            }
        } else if (isSimulating) {
            if (isPaused) {
                // Tiếp tục mô phỏng
                resumeSimulation();
            } else {
                // Tạm dừng mô phỏng
                pauseSimulation();
            }
        }
    };

    // Tạm dừng dẫn đường
    const pauseNavigation = () => {
        if (watchPositionRef.current !== null) {
            navigator.geolocation.clearWatch(watchPositionRef.current);
            watchPositionRef.current = null;
        }
        setIsPaused(true);
    };

    // Tiếp tục dẫn đường
    const resumeNavigation = () => {
        if (navigator.geolocation && map.current) {
            watchPositionRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    const currentPosition: [number, number] = [longitude, latitude];

                    // Update user location on map
                    updateUserLocationOnMap(currentPosition, accuracy);

                    // Tính tốc độ từ Geolocation API nếu có
                    if (position.coords.speed !== null) {
                        // Tốc độ từ API (m/s)
                        const speedMps = position.coords.speed;
                        // Chuyển đổi sang km/h
                        const speedKmh = speedMps * 3.6;
                        // Cập nhật tốc độ hiện tại (làm mịn)
                        setCurrentSpeed(prevSpeed => {
                            const smoothedSpeed = prevSpeed * 0.7 + speedKmh * 0.3;
                            return Math.min(Math.max(smoothedSpeed, 0), 120); // Giới hạn 0-120 km/h
                        });
                    }

                    const routePoints = routeCoordinatesRef.current;
                    if (!routePoints || routePoints.length === 0) {
                        console.error("No route points available");
                        return;
                    }

                    // Calculate navigation progress
                    const closestPointIndex = findClosestPointOnRoute(currentPosition, routePoints);
                    const remainingDist = calculateRemainingDistance(currentPosition, routePoints, closestPointIndex);

                    // Update remaining distance and time
                    setRemainingDistance(formatDistance(remainingDist));

                    // Calculate progress percentage
                    const totalDistance = parseFloat(routeInfo!.distance.replace(/[^\d.]/g, ''));
                    const progress = Math.max(0, Math.min(1, 1 - (remainingDist / totalDistance)));
                    navigationProgressRef.current = progress;

                    // Update remaining time based on progress
                    const totalTimeSeconds = parseTimeStringToSeconds(routeInfo!.duration);
                    // Làm tròn thời gian còn lại để tránh thay đổi liên tục
                    const remainingTimeEstimate = Math.round(totalTimeSeconds * (1 - progress));
                    setRemainingTime(formatTime(remainingTimeEstimate));

                    // Find current instruction based on progress
                    if (routeInfo!.steps && routeInfo!.steps.length > 0) {
                        const stepCount = routeInfo!.steps.length;
                        const stepIndex = Math.min(Math.floor(progress * stepCount), stepCount - 1);

                        if (stepIndex !== currentInstructionIndex) {
                            setCurrentInstructionIndex(stepIndex);
                            // Announce new instruction
                            // message.info(routeInfo!.steps[stepIndex].instruction);
                        }
                    }

                    // Check if we've reached the destination (within 50 meters)
                    if (remainingDist < 0.05) {
                        messageApi.success('Bạn đã đến điểm đến!');
                        stopNavigation();
                    }
                },
                (error) => {
                    console.error('Error getting location during navigation:', error);
                    messageApi.error('Không thể lấy vị trí hiện tại để dẫn đường');
                    stopNavigation();
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 5000
                }
            );
        }
        setIsPaused(false);
    };

    // Tạm dừng mô phỏng
    const pauseSimulation = () => {
        if (simulationIntervalRef.current !== null) {
            clearInterval(simulationIntervalRef.current);
            simulationIntervalRef.current = null;
        }
        setIsPaused(true);
    };

    // Tiếp tục mô phỏng
    const resumeSimulation = () => {
        simulationIntervalRef.current = setInterval(() => {
            moveSimulationVehicle();
        }, 1000 / simulationSpeed);
        setIsPaused(false);
    };

    // Replace public_key with the actual API key from environment variables
    const replaceApiKey = (styleUrl: string) => {
        return styleUrl.replace('public_key', TRACKASIA_MAP_API_KEY);
    };

    useEffect(() => {
        if (map.current) return; // Initialize map only once

        if (mapContainer.current) {
            map.current = new trackasiagl.Map({
                container: mapContainer.current,
                style: replaceApiKey(currentStyle),
                center: [lng, lat],
                zoom: zoom,
                bounds: [
                    [VIETNAM_BOUNDS.west, VIETNAM_BOUNDS.south], // Southwest coordinates
                    [VIETNAM_BOUNDS.east, VIETNAM_BOUNDS.north]  // Northeast coordinates
                ],
                fitBoundsOptions: {
                    padding: {
                        top: 100,
                        bottom: 100,
                        left: 350,
                        right: 100
                    },
                    maxZoom: 12
                },
                transformRequest: (url: string, resourceType?: string) => {
                    // Chỉ thêm token vào header mà không xử lý URL
                    const authToken = window.__AUTH_TOKEN__;
                    const headers: Record<string, string> = {};

                    // Thêm Authorization header nếu có authToken
                    if (authToken) {
                        headers['Authorization'] = `Bearer ${authToken}`;
                    }

                    return { url, headers };
                }
            });

            map.current.addControl(new trackasiagl.NavigationControl(), 'top-right');
            map.current.addControl(new trackasiagl.FullscreenControl(), 'top-right');
            map.current.addControl(new trackasiagl.ScaleControl(), 'bottom-left');

            map.current.on('load', () => {
                setIsMapLoaded(true);
                // messageApi.success('TrackAsia Map đã tải thành công!');
            });

            // Sử dụng debounce để giảm số lần cập nhật state
            let moveTimeout: NodeJS.Timeout | null = null;
            map.current.on('move', () => {
                if (!map.current) return;

                // Hủy timeout trước đó nếu có
                if (moveTimeout) clearTimeout(moveTimeout);

                // Đặt timeout mới để cập nhật state
                moveTimeout = setTimeout(() => {
                    const center = map.current?.getCenter();
                    if (!center) return;

                    // Lấy giá trị hiện tại để so sánh
                    const newLng = Number(center.lng.toFixed(4));
                    const newLat = Number(center.lat.toFixed(4));
                    const newZoom = Number(map.current?.getZoom().toFixed(2) || 0);

                    // Chỉ cập nhật nếu giá trị thực sự thay đổi
                    if (newLng !== lng) setLng(newLng);
                    if (newLat !== lat) setLat(newLat);
                    if (newZoom !== zoom) setZoom(newZoom);
                }, 100); // Đợi 100ms sau khi map dừng di chuyển
            });

            map.current.on('click', (e) => {
                handleMapClick(e);
            });

            map.current.on('error', (e) => {
                console.error('Map error:', e);
                messageApi.error('Lỗi tải bản đồ. Vui lòng thử lại sau.');
            });
        }

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []);

    // Auto-start và lấy vị trí hiện tại khi component mounts
    useEffect(() => {
        // Chỉ chạy một lần khi component mount
        if (!isMapLoaded) return;

        // Đợi một chút để đảm bảo map đã được tải
        const timer = setTimeout(() => {
            // Tự động lấy vị trí hiện tại khi trang tải
            getCurrentLocation();

            // Đặt tab mặc định là "directions" để hiển thị tab tìm đường ngay từ đầu
            setActiveTab("directions");
        }, 1000);

        return () => clearTimeout(timer);
    }, [isMapLoaded]); // Chỉ chạy lại khi isMapLoaded thay đổi

    // Lắng nghe sự kiện requestCurrentLocation từ DirectionsDemo
    useEffect(() => {
        const handleRequestCurrentLocation = () => {
            getCurrentLocation();

            // Nếu đã có vị trí hiện tại, gửi ngay cho DirectionsDemo
            // Sử dụng setTimeout để tránh vòng lặp vô hạn
            if (currentLocation) {
                setTimeout(() => {
                    const directionsDemo = document.getElementById('trackasia-directions-demo');
                    if (directionsDemo) {
                        const event = new CustomEvent('setCurrentLocation', {
                            detail: {
                                lat: currentLocation.lat,
                                lng: currentLocation.lng,
                                address: currentAddress || 'Vị trí hiện tại'
                            }
                        });
                        directionsDemo.dispatchEvent(event);
                    }
                }, 0);
            }
        };

        document.addEventListener('requestCurrentLocation', handleRequestCurrentLocation);

        return () => {
            document.removeEventListener('requestCurrentLocation', handleRequestCurrentLocation);
        };
    }, [currentLocation, currentAddress]);

    // Gửi vị trí hiện tại cho DirectionsDemo khi vị trí hiện tại thay đổi
    // Sử dụng useRef để theo dõi lần render cuối cùng và tránh vòng lặp vô hạn
    const lastLocationSentRef = useRef<{ lat?: number, lng?: number, address?: string }>({});

    useEffect(() => {
        if (currentLocation && activeTab === 'directions') {
            // Kiểm tra xem vị trí đã thay đổi so với lần trước chưa
            const locationChanged =
                lastLocationSentRef.current.lat !== currentLocation.lat ||
                lastLocationSentRef.current.lng !== currentLocation.lng ||
                lastLocationSentRef.current.address !== currentAddress;

            if (locationChanged) {
                // Lưu lại vị trí hiện tại để so sánh lần sau
                lastLocationSentRef.current = {
                    lat: currentLocation.lat,
                    lng: currentLocation.lng,
                    address: currentAddress
                };

                // Thông báo cho component DirectionsDemo về vị trí hiện tại
                const directionsDemo = document.getElementById('trackasia-directions-demo');
                if (directionsDemo) {
                    // Tạo và kích hoạt sự kiện tùy chỉnh
                    const event = new CustomEvent('setCurrentLocation', {
                        detail: {
                            lat: currentLocation.lat,
                            lng: currentLocation.lng,
                            address: currentAddress || 'Vị trí hiện tại'
                        }
                    });
                    directionsDemo.dispatchEvent(event);
                }
            }
        }
    }, [currentLocation, currentAddress, activeTab]);

    // Lắng nghe sự kiện routeFound từ DirectionsDemo
    useEffect(() => {
        const handleRouteFound = (event: any) => {
            const { route, coordinates } = event.detail;

            // Lưu trữ dữ liệu tuyến đường
            routeCoordinatesRef.current = coordinates;

            // Cập nhật routeInfo một cách an toàn
            // Sử dụng một biến tạm để tránh cập nhật state trong useEffect
            // Đảm bảo có giá trị hợp lệ cho distance và duration
            const routeDistance = route.legs[0]?.distance?.text || '0 km';
            const routeDuration = route.legs[0]?.duration?.text || '0 phút';

            // Xử lý các bước với kiểm tra giá trị undefined
            const processedSteps = route.legs[0]?.steps?.map((step: any) => {
                // Đảm bảo các trường có giá trị hợp lệ
                const instruction = step.html_instructions
                    ? step.html_instructions.replace(/<[^>]*>?/gm, '')
                    : 'Đi thẳng';

                const distanceText = step.distance?.text || '0m';
                const durationText = step.duration?.text || '0 giây';

                return {
                    instruction,
                    distance: distanceText,
                    duration: durationText,
                    maneuver: step.maneuver || ''
                };
            }) || [];

            const newRouteInfo = {
                distance: routeDistance,
                duration: routeDuration,
                steps: processedSteps
            };

            // Chỉ cập nhật nếu routeInfo chưa có hoặc khác với giá trị mới
            if (!routeInfo ||
                routeInfo.distance !== newRouteInfo.distance ||
                routeInfo.duration !== newRouteInfo.duration ||
                routeInfo.steps.length !== newRouteInfo.steps.length) {

                // Sử dụng setTimeout để tránh cập nhật state trực tiếp trong useEffect
                setTimeout(() => {
                    setRouteInfo(newRouteInfo);
                }, 0);
            }
        };

        document.addEventListener('routeFound', handleRouteFound);

        return () => {
            document.removeEventListener('routeFound', handleRouteFound);
        };
    }, [routeInfo]);

    // Handle map click
    const handleMapClick = (e: trackasiagl.MapMouseEvent) => {
        if (!map.current) return;

        const { lng, lat } = e.lngLat;

        // Clear existing markers
        clearMarkers();

        // Add marker at clicked location
        const marker = new trackasiagl.Marker()
            .setLngLat([lng, lat])
            .addTo(map.current);

        markersRef.current.push(marker);

        // Update selected location
        setSelectedLocation({ lng, lat });

        // Use the reverse geocoding API
        reverseGeocodeV2(lat, lng)
            .then(response => {
                if (response.status === 'OK' && response.results.length > 0) {
                    const place = response.results[0];
                    setCurrentAddress(place.formatted_address);

                    // Thêm khoảng cách nếu có vị trí hiện tại
                    let details = formatAddressDetails(place);
                    if (currentLocation) {
                        const distance = calculateDistanceWrapper(
                            currentLocation.lat,
                            currentLocation.lng,
                            lat,
                            lng
                        );
                        details = {
                            ...details,
                            distance: formatDistance(distance)
                        };
                    }
                    setAddressDetails(details);
                } else {
                    // Nếu không tìm thấy địa chỉ, hiển thị tọa độ
                    setCurrentAddress(`Vị trí: ${lng.toFixed(6)}, ${lat.toFixed(6)}`);

                    // Thêm khoảng cách nếu có vị trí hiện tại
                    if (currentLocation) {
                        const distance = calculateDistanceWrapper(
                            currentLocation.lat,
                            currentLocation.lng,
                            lat,
                            lng
                        );
                        setAddressDetails({
                            distance: formatDistance(distance)
                        });
                    } else {
                        setAddressDetails(null);
                    }
                }
            })
            .catch(error => {
                console.error('Error getting location info:', error);
                setCurrentAddress(`Vị trí: ${lng.toFixed(6)}, ${lat.toFixed(6)}`);

                // Thêm khoảng cách nếu có vị trí hiện tại
                if (currentLocation) {
                    const distance = calculateDistanceWrapper(
                        currentLocation.lat,
                        currentLocation.lng,
                        lat,
                        lng
                    );
                    setAddressDetails({
                        distance: formatDistance(distance)
                    });
                } else {
                    setAddressDetails(null);
                }
            });
    };

    // Format address details from reverse geocoding result
    const formatAddressDetails = (place: any) => {
        const details: any = {
            name: place.name,
            boundaries: []
        };

        if (place.address_components) {
            place.address_components.forEach((component: any) => {
                if (component.types.includes('administrative_area_level_1')) {
                    details.boundaries.push({
                        prefix: 'Tỉnh/Thành phố',
                        name: component.long_name
                    });
                } else if (component.types.includes('administrative_area_level_2')) {
                    details.boundaries.push({
                        prefix: 'Quận/Huyện',
                        name: component.long_name
                    });
                } else if (component.types.includes('administrative_area_level_3')) {
                    details.boundaries.push({
                        prefix: 'Phường/Xã',
                        name: component.long_name
                    });
                } else if (component.types.includes('street_number')) {
                    details.street_number = component.long_name;
                } else if (component.types.includes('route')) {
                    details.route = component.long_name;
                }
            });
        }

        return details;
    };

    // Format address details from place details result
    const formatAddressDetailsFromPlace = (place: PlaceDetailsResult) => {
        const details: any = {
            name: place.name,
            boundaries: []
        };

        if (place.address_components) {
            place.address_components.forEach((component: any) => {
                if (component.types.includes('administrative_area_level_1')) {
                    details.boundaries.push({
                        prefix: 'Tỉnh/Thành phố',
                        name: component.long_name
                    });
                } else if (component.types.includes('administrative_area_level_2')) {
                    details.boundaries.push({
                        prefix: 'Quận/Huyện',
                        name: component.long_name
                    });
                } else if (component.types.includes('administrative_area_level_3')) {
                    details.boundaries.push({
                        prefix: 'Phường/Xã',
                        name: component.long_name
                    });
                } else if (component.types.includes('street_number')) {
                    details.street_number = component.long_name;
                } else if (component.types.includes('route')) {
                    details.route = component.long_name;
                }
            });
        }

        return details;
    };

    // Clear all markers from the map
    const clearMarkers = () => {
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
    };

    const changeMapStyle = (style: string) => {
        if (!map.current) return;

        try {
            map.current.setStyle(replaceApiKey(style));
            setCurrentStyle(style);
            messageApi.success('Đã thay đổi kiểu bản đồ thành công');
        } catch (error) {
            console.error('Error changing map style:', error);
            messageApi.error('Không thể thay đổi kiểu bản đồ');
        }
    };

    const getCurrentLocation = () => {
        if (!map.current) return;

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;

                    // Lưu trữ vị trí hiện tại
                    setCurrentLocation({ lat: latitude, lng: longitude });

                    // Clear existing markers
                    clearMarkers();

                    // Create a marker for current location
                    if (map.current) {
                        const marker = new trackasiagl.Marker({ color: '#FF0000' })
                            .setLngLat([longitude, latitude])
                            .addTo(map.current);

                        markersRef.current.push(marker);

                        // Fly to current location
                        map.current.flyTo({
                            center: [longitude, latitude],
                            zoom: 15,
                            essential: true
                        });

                        // Update selected location
                        setSelectedLocation({ lng: longitude, lat: latitude });

                        // Get location info using new API
                        reverseGeocodeV2(latitude, longitude)
                            .then(response => {
                                if (response.status === 'OK' && response.results.length > 0) {
                                    const place = response.results[0];
                                    setCurrentAddress(place.formatted_address);
                                    setAddressDetails(formatAddressDetails(place));
                                } else {
                                    setCurrentAddress(`Vị trí hiện tại: ${longitude.toFixed(6)}, ${latitude.toFixed(6)}`);
                                    setAddressDetails(null);
                                }
                            })
                            .catch(error => {
                                console.error('Error reverse geocoding:', error);
                                setCurrentAddress(`Vị trí hiện tại: ${longitude.toFixed(6)}, ${latitude.toFixed(6)}`);
                                setAddressDetails(null);
                            });
                    }

                    // messageApi.success('Đã tìm thấy vị trí hiện tại');
                },
                (error) => {
                    console.error('Error getting current location:', error);
                    messageApi.error('Không thể xác định vị trí hiện tại của bạn');
                }
            );
        } else {
            messageApi.error('Trình duyệt của bạn không hỗ trợ định vị');
        }
    };

    // Handle search input change with debounce
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (value.length >= 2) {
            setIsSearching(true);
            searchTimeoutRef.current = setTimeout(() => {
                // Use the current map bounds to bias results
                let mapBounds: { north: number; east: number; south: number; west: number } | undefined = undefined;
                if (map.current) {
                    const bounds = map.current.getBounds();
                    mapBounds = {
                        north: bounds.getNorth(),
                        east: bounds.getEast(),
                        south: bounds.getSouth(),
                        west: bounds.getWest()
                    };
                }

                // Chỉ sử dụng autocomplete API
                searchPlacesAutocomplete(
                    value,
                    mapBounds,
                    currentLocation || undefined // Truyền vị trí hiện tại hoặc undefined nếu không có
                )
                    .then(async (response) => {
                        if (response.status === 'OK' && response.predictions.length > 0) {
                            // Nếu có vị trí hiện tại, tính khoảng cách và thêm vào kết quả
                            if (currentLocation) {
                                // Định nghĩa type cho prediction với distance
                                type PredictionWithDistance = AutocompleteResult & {
                                    location?: { lat: number; lng: number };
                                    distance?: number;
                                };

                                // Lấy chi tiết của mỗi địa điểm để có thông tin về vị trí
                                const predictionsWithDetails = await Promise.all(
                                    response.predictions.map(async (prediction) => {
                                        try {
                                            const details = await getPlaceDetails(prediction.place_id);
                                            if (details) {
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
                                    (pred: any): pred is PredictionWithDistance & { distance: number } =>
                                        pred.hasOwnProperty('distance') && typeof pred.distance === 'number'
                                );

                                // Sắp xếp theo khoảng cách tăng dần
                                resultsWithDistance.sort((a: any, b: any) => a.distance - b.distance);

                                // Chuyển đổi kết quả thành options cho AutoComplete
                                const formattedOptions = resultsWithDistance.map((prediction: any) => ({
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
                                setOptions(formattedOptions);
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
                                setOptions(formattedOptions);
                            }
                        } else {
                            setOptions([]);
                        }
                        setIsSearching(false);
                    })
                    .catch(error => {
                        console.error('Error searching places:', error);
                        setOptions([]);
                        setIsSearching(false);
                    });
            }, 500);
        } else {
            setOptions([]);
            setIsSearching(false);
        }
    };

    // Handle search completion
    const handleSearchComplete = (value: string) => {
        if (value.length < 2) return;

        setIsSearching(true);

        // Use the current map bounds to bias results
        let mapBounds: { north: number; east: number; south: number; west: number } | undefined = undefined;
        if (map.current) {
            const bounds = map.current.getBounds();
            mapBounds = {
                north: bounds.getNorth(),
                east: bounds.getEast(),
                south: bounds.getSouth(),
                west: bounds.getWest()
            };
        }

        // Chỉ sử dụng autocomplete API
        searchPlacesAutocomplete(
            value,
            mapBounds,
            currentLocation || undefined // Truyền vị trí hiện tại hoặc undefined nếu không có
        )
            .then(response => {
                if (response.status === 'OK' && response.predictions.length > 0) {
                    const prediction = response.predictions[0];
                    handlePlaceSelection(prediction.place_id);
                } else {
                    messageApi.info('Không tìm thấy địa điểm');
                    setIsSearching(false);
                }
            })
            .catch(error => {
                console.error('Error searching places:', error);
                setIsSearching(false);
                messageApi.error('Lỗi tìm kiếm địa điểm');
            });

        // Hàm xử lý khi đã có place_id
        function handlePlaceSelection(placeId: string) {
            // Get place details
            getPlaceDetails(placeId)
                .then(response => {
                    if (response) {
                        const place = response.result;

                        // Clear existing markers
                        clearMarkers();

                        // Get coordinates
                        const lat = place.geometry.location.lat;
                        const lng = place.geometry.location.lng;

                        // Add marker at selected location
                        const marker = new trackasiagl.Marker()
                            .setLngLat([lng, lat])
                            .addTo(map.current!);

                        markersRef.current.push(marker);

                        // Update selected location
                        setSelectedLocation({ lng, lat });

                        // Update current address and details
                        setCurrentAddress(place.formatted_address);

                        // Thêm khoảng cách nếu có vị trí hiện tại
                        let details = formatAddressDetailsFromPlace(place);
                        if (currentLocation) {
                            const distance = calculateDistanceWrapper(
                                currentLocation.lat,
                                currentLocation.lng,
                                lat,
                                lng
                            );
                            details = {
                                ...details,
                                distance: formatDistance(distance)
                            };
                        }
                        setAddressDetails(details);

                        // Fly to selected location
                        map.current!.flyTo({
                            center: [lng, lat],
                            zoom: 15,
                            essential: true
                        });
                    } else {
                        messageApi.error('Không thể lấy thông tin địa điểm');
                    }
                    setIsSearching(false);
                })
                .catch(error => {
                    console.error('Error getting place details:', error);
                    setIsSearching(false);
                    messageApi.error('Lỗi lấy thông tin địa điểm');
                });
        }
    };

    // Handle place selection
    const handleSelectPlace = (value: string, option: any) => {
        if (!map.current || !option.feature) return;

        const feature = option.feature;
        const placeId = feature.place_id;

        setIsSearching(true);

        // Get place details
        getPlaceDetails(placeId)
            .then(response => {
                if (response) {
                    const place = response.result;

                    // Clear existing markers
                    clearMarkers();

                    // Get coordinates
                    const lat = place.geometry.location.lat;
                    const lng = place.geometry.location.lng;

                    // Add marker at selected location
                    const marker = new trackasiagl.Marker()
                        .setLngLat([lng, lat])
                        .addTo(map.current!);

                    markersRef.current.push(marker);

                    // Update selected location
                    setSelectedLocation({ lng, lat });

                    // Update current address and details
                    setCurrentAddress(place.formatted_address);

                    // Thêm khoảng cách nếu có vị trí hiện tại
                    let details = formatAddressDetailsFromPlace(place);
                    if (currentLocation) {
                        const distance = calculateDistanceWrapper(
                            currentLocation.lat,
                            currentLocation.lng,
                            lat,
                            lng
                        );
                        details = {
                            ...details,
                            distance: formatDistance(distance)
                        };
                    }
                    setAddressDetails(details);

                    // Fly to selected location
                    map.current!.flyTo({
                        center: [lng, lat],
                        zoom: 15,
                        essential: true
                    });
                } else {
                    messageApi.error('Không thể lấy thông tin địa điểm');
                }
                setIsSearching(false);
            })
            .catch(error => {
                console.error('Error getting place details:', error);
                setIsSearching(false);
                messageApi.error('Lỗi lấy thông tin địa điểm');
            });
    };

    const handleTabChange = (key: string) => {
        setActiveTab(key);

        // Nếu chuyển sang tab tìm đường và có vị trí hiện tại, đặt làm điểm xuất phát
        // Sử dụng setTimeout để đảm bảo DOM đã được cập nhật và tránh vòng lặp vô hạn
        if (key === 'directions' && currentLocation && map.current) {
            // Đợi cho DOM được cập nhật sau khi tab thay đổi
            setTimeout(() => {
                // Thông báo cho component DirectionsDemo về vị trí hiện tại
                const directionsDemo = document.getElementById('trackasia-directions-demo');
                if (directionsDemo) {
                    // Tạo và kích hoạt sự kiện tùy chỉnh
                    const event = new CustomEvent('setCurrentLocation', {
                        detail: {
                            lat: currentLocation.lat,
                            lng: currentLocation.lng,
                            address: currentAddress || 'Vị trí hiện tại'
                        }
                    });
                    directionsDemo.dispatchEvent(event);
                }
            }, 100);
        }
    };

    // Start navigation
    const startNavigation = () => {
        if (!routeInfo || !map.current) {
            messageApi.error('Không có tuyến đường để dẫn đường');
            return;
        }

        // Stop any existing navigation or simulation
        // stopNavigation();
        stopSimulation();

        // Ẩn panel điều khiển và hiển thị panel dẫn đường
        setShowControlPanel(false);
        setIsNavigating(true);
        setShowNavigationModal(true);
        setShowTripSummary(false);

        // Record start time for trip summary
        const distanceText = routeInfo.distance;
        let totalDistanceMeters = 0;

        if (distanceText.includes('km')) {
            // Nếu là km, chuyển về mét
            totalDistanceMeters = parseFloat(distanceText.replace(/[^\d.]/g, '')) * 1000;
        } else {
            // Nếu là mét
            totalDistanceMeters = parseFloat(distanceText.replace(/[^\d.]/g, ''));
        }

        setTripSummary(prev => ({
            ...prev,
            startTime: Date.now(),
            totalDistance: totalDistanceMeters,
            totalTime: parseTimeStringToSeconds(routeInfo.duration)
        }));

        // Initial values
        const routePoints = routeCoordinatesRef.current;
        setRemainingDistance(routeInfo.distance);
        setRemainingTime(routeInfo.duration);
        setCurrentInstructionIndex(0);

        // Start watching position
        if (navigator.geolocation) {
            // Clear any existing watch
            if (watchPositionRef.current !== null) {
                navigator.geolocation.clearWatch(watchPositionRef.current);
            }

            // Create navigation marker
            const navigationIcon = document.createElement('div');
            navigationIcon.className = 'navigation-marker';
            navigationIcon.style.width = '24px';
            navigationIcon.style.height = '24px';
            navigationIcon.style.borderRadius = '50%';
            navigationIcon.style.backgroundColor = '#4285F4';
            navigationIcon.style.border = '2px solid white';
            navigationIcon.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)';
            navigationIcon.style.position = 'relative';

            // Add direction indicator
            const arrow = document.createElement('div');
            arrow.style.width = '0';
            arrow.style.height = '0';
            arrow.style.borderLeft = '6px solid transparent';
            arrow.style.borderRight = '6px solid transparent';
            arrow.style.borderBottom = '10px solid white';
            arrow.style.position = 'absolute';
            arrow.style.top = '-6px';
            arrow.style.left = '50%';
            arrow.style.transform = 'translateX(-50%)';
            arrow.style.transformOrigin = 'center bottom';
            navigationIcon.appendChild(arrow);

            // Lấy vị trí hiện tại để bắt đầu dẫn đường
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    const currentPosition: [number, number] = [longitude, latitude];

                    // Add marker to map at current position
                    userLocationMarkerRef.current = new trackasiagl.Marker({
                        element: navigationIcon,
                        rotationAlignment: 'map'
                    })
                        .setLngLat(currentPosition)
                        .addTo(map.current!);

                    // Initial map view
                    map.current!.flyTo({
                        center: currentPosition,
                        zoom: 17,
                        pitch: 60,
                        bearing: 0,
                        duration: 1000
                    });

                    // Đặt một timeout ngắn để đảm bảo watchPosition có đủ thời gian để bắt đầu
                    setTimeout(() => {
                        watchPositionRef.current = navigator.geolocation.watchPosition(
                            (position) => {
                                const { latitude, longitude, accuracy } = position.coords;
                                const currentPosition: [number, number] = [longitude, latitude];

                                // Update user location on map
                                updateUserLocationOnMap(currentPosition, accuracy);

                                if (!routePoints || routePoints.length === 0) {
                                    console.error("No route points available");
                                    return;
                                }

                                // Calculate navigation progress
                                const closestPointIndex = findClosestPointOnRoute(currentPosition, routePoints);
                                const remainingDist = calculateRemainingDistance(currentPosition, routePoints, closestPointIndex);

                                // Update remaining distance and time
                                setRemainingDistance(formatDistance(remainingDist));

                                // Calculate progress percentage
                                const totalDistance = parseFloat(routeInfo.distance.replace(/[^\d.]/g, ''));
                                const progress = Math.max(0, Math.min(1, 1 - (remainingDist / totalDistance)));
                                navigationProgressRef.current = progress;

                                // Update remaining time based on progress
                                const totalTimeSeconds = parseTimeStringToSeconds(routeInfo.duration);
                                const remainingTimeEstimate = totalTimeSeconds * (1 - progress);
                                setRemainingTime(formatTime(remainingTimeEstimate));

                                // Find current instruction based on progress
                                if (routeInfo.steps && routeInfo.steps.length > 0) {
                                    const stepCount = routeInfo.steps.length;
                                    const stepIndex = Math.min(Math.floor(progress * stepCount), stepCount - 1);

                                    if (stepIndex !== currentInstructionIndex) {
                                        setCurrentInstructionIndex(stepIndex);
                                        // Announce new instruction
                                        // message.info(routeInfo.steps[stepIndex].instruction);
                                    }
                                }

                                // Check if we've reached the destination (within 50 meters)
                                if (remainingDist < 0.05) {
                                    messageApi.success('Bạn đã đến điểm đến!');
                                    stopNavigation();
                                }
                            },
                            (error) => {
                                console.error('Error getting location during navigation:', error);
                                messageApi.error('Không thể lấy vị trí hiện tại để dẫn đường');
                                stopNavigation();
                            },
                            {
                                enableHighAccuracy: true,
                                maximumAge: 0,
                                timeout: 5000
                            }
                        );
                    }, 500);
                },
                (error) => {
                    console.error('Error getting current location:', error);
                    messageApi.error('Không thể lấy vị trí hiện tại để dẫn đường');
                    stopNavigation();
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 5000
                }
            );
        } else {
            messageApi.error('Trình duyệt không hỗ trợ định vị');
            setIsNavigating(false);
        }
    };

    // Update user location on map during navigation
    const updateUserLocationOnMap = (position: [number, number], accuracy: number) => {
        if (!map.current) return;

        // Create or update user location marker
        if (!userLocationMarkerRef.current) {
            // Create a new marker with custom HTML element for direction
            const el = document.createElement('div');
            el.className = 'navigation-marker';
            el.style.width = '24px';
            el.style.height = '24px';
            el.style.borderRadius = '50%';
            el.style.backgroundColor = '#4285F4';
            el.style.border = '2px solid white';
            el.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)';
            el.style.position = 'relative';

            // Add direction indicator
            const arrow = document.createElement('div');
            arrow.style.width = '0';
            arrow.style.height = '0';
            arrow.style.borderLeft = '6px solid transparent';
            arrow.style.borderRight = '6px solid transparent';
            arrow.style.borderBottom = '10px solid white';
            arrow.style.position = 'absolute';
            arrow.style.top = '-6px';
            arrow.style.left = '50%';
            arrow.style.transform = 'translateX(-50%)';
            arrow.style.transformOrigin = 'center bottom';
            el.appendChild(arrow);

            userLocationMarkerRef.current = new trackasiagl.Marker({
                element: el,
                rotationAlignment: 'map'
            })
                .setLngLat(position)
                .addTo(map.current);
        } else {
            userLocationMarkerRef.current.setLngLat(position);

            // Update rotation based on compass heading if available
            if (compassHeading !== null) {
                const el = userLocationMarkerRef.current.getElement();
                const arrow = el.querySelector('div');
                if (arrow) {
                    (arrow as HTMLElement).style.transform = `translateX(-50%) rotate(${compassHeading}deg)`;
                }
            }
        }

        // Center map on user location during navigation with smooth animation
        map.current.easeTo({
            center: position,
            zoom: 17,
            bearing: compassHeading !== null ? compassHeading : 0,
            pitch: 60,
            duration: 500
        });
    };

    // Stop navigation
    const stopNavigation = () => {
        // Clear watch position
        if (watchPositionRef.current !== null) {
            navigator.geolocation.clearWatch(watchPositionRef.current);
            watchPositionRef.current = null;
        }

        // Remove user location marker
        if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.remove();
            userLocationMarkerRef.current = null;
        }

        // Reset map view
        if (map.current) {
            map.current.setPitch(0);
            map.current.setBearing(0);

            // Fit map to route bounds if route exists
            if (routeInfo) {
                const bounds = new trackasiagl.LngLatBounds();
                routeCoordinatesRef.current.forEach(coord => {
                    bounds.extend(coord as trackasiagl.LngLatLike);
                });
                map.current.fitBounds(bounds, {
                    padding: {
                        top: 100,
                        bottom: 100,
                        left: 350, // Tăng padding bên trái để tránh panel
                        right: 100
                    },
                    maxZoom: 12 // Giảm maxZoom để zoom out nhiều hơn
                });
            }
        }

        // Hiển thị tổng kết hành trình nếu có thời gian bắt đầu
        const shouldShowSummary = tripSummary.startTime !== null;
        if (shouldShowSummary) {
            const endTime = Date.now();
            const durationMs = endTime - tripSummary.startTime!;
            const durationHours = durationMs / (1000 * 60 * 60);

            // Tính tốc độ trung bình (km/h)
            // Đảm bảo totalDistance là đơn vị mét, và chuyển sang km
            const distanceInKm = tripSummary.totalDistance / 1000;

            // Đảm bảo thời gian tối thiểu là 1 giây để tránh chia cho 0
            const minDurationHours = Math.max(durationHours, 1 / 3600);

            // Tính tốc độ trung bình và giới hạn trong khoảng hợp lý (0-120 km/h)
            const averageSpeed = Math.min(
                distanceInKm / minDurationHours,
                120 // Giới hạn tốc độ tối đa 120 km/h
            );

            // Cập nhật trip summary trước khi hiển thị
            setTripSummary(prev => ({
                ...prev,
                endTime,
                averageSpeed
            }));

            // Hiển thị trip summary
            setShowTripSummary(true);
        }

        // Reset all navigation states EXCEPT showTripSummary
        setIsNavigating(false);
        setIsSimulating(false);
        setIsPaused(false);
        setShowNavigationModal(false);

        // Reset các thông tin về thời gian và khoảng cách
        setRemainingDistance('');
        setRemainingTime('');
        setCurrentInstructionIndex(0);
        setNextTurnDistance(0);
        setCompassHeading(null);
        setCurrentSpeed(0); // Reset tốc độ

        // Reset tiến trình dẫn đường
        navigationProgressRef.current = 0;

        // Reset các ref liên quan đến mô phỏng
        simulationRoutePointsRef.current = [];
        simulationCurrentPointIndexRef.current = 0;

        // Hiển thị lại panel điều khiển
        setShowControlPanel(true);

        // Reset speed về mặc định
        setSimulationSpeed(1);

        // Show success message
        messageApi.success('Hành trình đã kết thúc');
    };

    // Stop simulation
    const stopSimulation = () => {
        if (simulationIntervalRef.current !== null) {
            clearInterval(simulationIntervalRef.current);
            simulationIntervalRef.current = null;
        }

        // Remove simulation marker
        if (simulationMarkerRef.current) {
            simulationMarkerRef.current.remove();
            simulationMarkerRef.current = null;
        }

        // Reset map view
        if (map.current) {
            map.current.setPitch(0);
            map.current.setBearing(0);
        }

        // Hiển thị tổng kết hành trình nếu có thời gian bắt đầu
        const shouldShowSummary = tripSummary.startTime !== null;
        if (shouldShowSummary) {
            const endTime = Date.now();
            const durationMs = endTime - tripSummary.startTime!;
            const durationHours = durationMs / (1000 * 60 * 60);

            // Tính tốc độ trung bình (km/h)
            // Đảm bảo totalDistance là đơn vị mét, và chuyển sang km
            const distanceInKm = tripSummary.totalDistance / 1000;

            // Đảm bảo thời gian tối thiểu là 1 giây để tránh chia cho 0
            const minDurationHours = Math.max(durationHours, 1 / 3600);

            // Tính tốc độ trung bình và giới hạn trong khoảng hợp lý (0-120 km/h)
            const averageSpeed = Math.min(
                distanceInKm / minDurationHours,
                120 // Giới hạn tốc độ tối đa 120 km/h
            );

            // Cập nhật trip summary trước khi hiển thị
            setTripSummary(prev => ({
                ...prev,
                endTime,
                averageSpeed
            }));

            // Hiển thị trip summary
            setShowTripSummary(true);
        }

        // Reset all navigation states EXCEPT showTripSummary
        setIsNavigating(false);
        setIsSimulating(false);
        setIsPaused(false);
        setShowNavigationModal(false);

        // Reset các thông tin về thời gian và khoảng cách
        setRemainingDistance('');
        setRemainingTime('');
        setCurrentInstructionIndex(0);
        setNextTurnDistance(0);
        setCompassHeading(null);
        setCurrentSpeed(0); // Reset tốc độ

        // Reset tiến trình dẫn đường
        navigationProgressRef.current = 0;

        // Reset các ref liên quan đến mô phỏng
        simulationRoutePointsRef.current = [];
        simulationCurrentPointIndexRef.current = 0;

        // Hiển thị lại panel điều khiển
        setShowControlPanel(true);

        // Reset speed về mặc định
        setSimulationSpeed(1);
    };

    // Start simulation
    const startSimulation = () => {
        if (!routeInfo || !routeCoordinatesRef.current.length || !map.current) {
            messageApi.error('Không có tuyến đường để mô phỏng');
            return;
        }

        // Stop any existing simulation or navigation
        stopSimulation();
        stopNavigation();

        // Ẩn panel điều khiển và hiển thị panel dẫn đường
        setShowControlPanel(false);
        setIsSimulating(true);
        setIsNavigating(true);
        setShowNavigationModal(true);
        setShowTripSummary(false);

        // Record start time for trip summary
        const distanceText = routeInfo.distance;
        let totalDistanceMeters = 0;

        if (distanceText.includes('km')) {
            // Nếu là km, chuyển về mét
            totalDistanceMeters = parseFloat(distanceText.replace(/[^\d.]/g, '')) * 1000;
        } else {
            // Nếu là mét
            totalDistanceMeters = parseFloat(distanceText.replace(/[^\d.]/g, ''));
        }

        setTripSummary(prev => ({
            ...prev,
            startTime: Date.now(),
            totalDistance: totalDistanceMeters,
            totalTime: parseTimeStringToSeconds(routeInfo.duration)
        }));

        // Initial values
        const routePoints = routeCoordinatesRef.current;
        simulationRoutePointsRef.current = routePoints;
        simulationCurrentPointIndexRef.current = 0;

        // Đặt giá trị ban đầu cho khoảng cách và thời gian còn lại
        const initialDistance = routeInfo.distance;
        const initialDuration = routeInfo.duration;

        setRemainingDistance(initialDistance);
        setRemainingTime(initialDuration);
        setCurrentInstructionIndex(0);

        // Create simulation vehicle marker
        if (map.current) {
            // Create a custom marker element
            const el = document.createElement('div');
            el.className = 'simulation-marker';
            el.style.width = '30px';
            el.style.height = '30px';
            el.style.borderRadius = '50%';
            el.style.backgroundColor = '#4285F4';
            el.style.border = '3px solid white';
            el.style.boxShadow = '0 0 8px rgba(0,0,0,0.5)';
            el.style.position = 'relative';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';

            // Add car icon
            const carIcon = document.createElement('div');
            carIcon.innerHTML = '🚗';
            carIcon.style.fontSize = '16px';
            el.appendChild(carIcon);

            // Add direction indicator
            const arrow = document.createElement('div');
            arrow.style.width = '0';
            arrow.style.height = '0';
            arrow.style.borderLeft = '8px solid transparent';
            arrow.style.borderRight = '8px solid transparent';
            arrow.style.borderBottom = '12px solid white';
            arrow.style.position = 'absolute';
            arrow.style.top = '-10px';
            arrow.style.left = '50%';
            arrow.style.transform = 'translateX(-50%)';
            arrow.style.transformOrigin = 'center bottom';
            el.appendChild(arrow);

            // Create and add marker
            simulationMarkerRef.current = new trackasiagl.Marker({
                element: el,
                rotationAlignment: 'map'
            })
                .setLngLat(routePoints[0])
                .addTo(map.current);

            // Center map on starting point
            map.current.flyTo({
                center: routePoints[0],
                zoom: 17,
                pitch: 60,
                bearing: 0,
                duration: 1000
            });
        }

        // Start simulation interval
        simulationIntervalRef.current = setInterval(() => {
            moveSimulationVehicle();
        }, 1000 / simulationSpeed);
    };

    // Change simulation speed
    const changeSimulationSpeed = (speed: number) => {
        setSimulationSpeed(speed);

        // Restart interval with new speed
        if (simulationIntervalRef.current) {
            clearInterval(simulationIntervalRef.current);
            simulationIntervalRef.current = setInterval(() => {
                moveSimulationVehicle();
            }, 1000 / speed);
        }
    };

    // Move simulation vehicle along the route
    const moveSimulationVehicle = () => {
        const routePoints = simulationRoutePointsRef.current;
        const currentIndex = simulationCurrentPointIndexRef.current;

        if (!routePoints || routePoints.length === 0 || currentIndex >= routePoints.length - 1) {
            // Reached the end of route
            stopSimulation();
            messageApi.success('Mô phỏng hoàn tất! Đã đến điểm đến.');
            return;
        }

        // Move to next point
        const nextIndex = currentIndex + 1;
        simulationCurrentPointIndexRef.current = nextIndex;

        const currentPoint = routePoints[currentIndex];
        const nextPoint = routePoints[nextIndex];

        // Tính tốc độ hiện tại
        // Khoảng cách giữa 2 điểm (mét)
        const segmentDistance = calculateDistanceWrapper(
            currentPoint[1], currentPoint[0],
            nextPoint[1], nextPoint[0]
        );

        // Thời gian di chuyển (giây) - phụ thuộc vào simulationSpeed
        const segmentTime = 1 / simulationSpeed;

        // Tốc độ (m/s) = khoảng cách / thời gian
        const speedMps = segmentDistance / segmentTime;

        // Chuyển đổi từ m/s sang km/h
        const speedKmh = (speedMps * 3.6);

        // Cập nhật tốc độ hiện tại (làm mịn để tránh thay đổi đột ngột)
        setCurrentSpeed(prevSpeed => {
            const smoothedSpeed = prevSpeed * 0.7 + speedKmh * 0.3;
            return Math.min(Math.max(smoothedSpeed, 0), 120); // Giới hạn tốc độ từ 0-120 km/h
        });

        if (!currentPoint || !nextPoint) {
            console.error("Invalid route points", { currentPoint, nextPoint });
            stopSimulation();
            return;
        }

        // Calculate bearing/heading between points
        const bearing = calculateBearing(
            currentPoint[1], currentPoint[0],
            nextPoint[1], nextPoint[0]
        );

        // Update marker position and rotation
        if (simulationMarkerRef.current && map.current) {
            simulationMarkerRef.current.setLngLat(nextPoint);

            // Rotate arrow to match direction
            const el = simulationMarkerRef.current.getElement();
            const arrow = el.querySelector('div:nth-child(2)') as HTMLElement;
            if (arrow) {
                arrow.style.transform = `translateX(-50%) rotate(${bearing}deg)`;
            }

            // Update map view to follow vehicle with smooth animation
            map.current.easeTo({
                center: nextPoint,
                bearing: bearing,
                pitch: 60,
                duration: 1000 / simulationSpeed
            });
        }

        // Calculate remaining distance
        let remainingDist = 0;
        for (let i = nextIndex; i < routePoints.length - 1; i++) {
            remainingDist += calculateDistanceWrapper(
                routePoints[i][1], routePoints[i][0],
                routePoints[i + 1][1], routePoints[i + 1][0]
            );
        }

        // Format remaining distance
        setRemainingDistance(formatDistance(remainingDist));

        // Calculate progress percentage
        // Lấy tổng khoảng cách từ routeInfo, đảm bảo đơn vị là mét
        const totalDistanceText = routeInfo!.distance;
        let totalDistance = 0;

        if (totalDistanceText.includes('km')) {
            // Nếu là km, chuyển về mét
            totalDistance = parseFloat(totalDistanceText.replace(/[^\d.]/g, '')) * 1000;
        } else {
            // Nếu là mét
            totalDistance = parseFloat(totalDistanceText.replace(/[^\d.]/g, ''));
        }
        const progress = 1 - (remainingDist / totalDistance);
        navigationProgressRef.current = progress;

        // Update remaining time based on progress
        if (routeInfo && routeInfo.duration) {
            // Tính thời gian còn lại dựa trên tiến trình
            const totalTimeSeconds = parseTimeStringToSeconds(routeInfo.duration);
            // Làm tròn thời gian còn lại để tránh thay đổi liên tục
            const remainingTimeEstimate = Math.round(totalTimeSeconds * (1 - progress));

            // Định dạng và hiển thị thời gian còn lại
            setRemainingTime(formatTime(remainingTimeEstimate));
        }

        // Find current instruction
        if (routeInfo!.steps && routeInfo!.steps.length > 0) {
            // Determine which step we're in based on progress
            const stepCount = routeInfo!.steps.length;
            const stepIndex = Math.min(Math.floor(progress * stepCount), stepCount - 1);

            if (stepIndex !== currentInstructionIndex) {
                setCurrentInstructionIndex(stepIndex);
            }

            // Tính khoảng cách đến lượt rẽ tiếp theo
            if (stepIndex < stepCount - 1) {
                const nextStep = routeInfo!.steps[stepIndex + 1];
                const distanceToNextTurn = nextStep.distance;
                setNextTurnDistance(parseFloat(distanceToNextTurn.replace(/[^\d.]/g, '')));
            }
        }
    };

    // Hàm hỗ trợ chuyển đổi chuỗi thời gian sang giây
    const parseTimeStringToSeconds = (timeString: string): number => {
        let totalSeconds = 0;

        // Tìm giờ (nếu có)
        const hoursMatch = timeString.match(/(\d+)\s*giờ/);
        if (hoursMatch) {
            totalSeconds += parseInt(hoursMatch[1]) * 3600;
        }

        // Tìm phút
        const minutesMatch = timeString.match(/(\d+)\s*phút/);
        if (minutesMatch) {
            totalSeconds += parseInt(minutesMatch[1]) * 60;
        }

        // Tìm giây
        const secondsMatch = timeString.match(/(\d+)\s*giây/);
        if (secondsMatch) {
            totalSeconds += parseInt(secondsMatch[1]);
        }

        return totalSeconds;
    };

    // Hàm reset các state liên quan đến dẫn đường
    const resetNavigationState = () => {
        // Reset các state chính
        setIsNavigating(false);
        setIsSimulating(false);
        setIsPaused(false);
        setShowNavigationModal(false);
        setShowTripSummary(false);

        // Reset các thông tin về thời gian và khoảng cách
        setRemainingDistance('');
        setRemainingTime('');
        setCurrentInstructionIndex(0);
        setNextTurnDistance(0);
        setCompassHeading(null);
        setCurrentSpeed(0); // Reset tốc độ

        // Reset tiến trình dẫn đường
        navigationProgressRef.current = 0;

        // Reset thông tin về hành trình
        setTripSummary({
            startTime: null,
            endTime: null,
            totalDistance: 0,
            totalTime: 0,
            averageSpeed: 0
        });

        // Reset các ref liên quan đến mô phỏng
        simulationRoutePointsRef.current = [];
        simulationCurrentPointIndexRef.current = 0;

        // Hiển thị lại panel điều khiển
        setShowControlPanel(true);

        // Reset speed về mặc định
        setSimulationSpeed(1);
    };

    // Wrapper functions for API calls
    const reverseGeocodeV2 = async (lat: number, lng: number) => {
        const result = await trackasiaService.reverseGeocode(`${lat},${lng}`);
        // Chuyển đổi từ MapLocation sang định dạng cũ
        if (result && result.results && result.results.length > 0) {
            return {
                status: 'OK',
                results: [{
                    formatted_address: result.results[0].formatted_address || `${lat}, ${lng}`,
                    geometry: {
                        location: { lat, lng }
                    }
                }]
            };
        }
        return null;
    };

    const searchPlacesAutocomplete = async (query: string, bounds?: any, location?: any) => {
        // Convert location to format expected by trackasiaService.autocomplete if needed
        let locationParam: string | undefined = undefined;
        if (location) {
            locationParam = `${location.lng},${location.lat}`;
        }
        const results = await trackasiaService.autocomplete(query, 10, bounds ? JSON.stringify(bounds) : undefined, locationParam);

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



    return (
        <div className="h-screen w-full relative">
            {contextHolder}
            <div ref={mapContainer} className="h-full w-full" />

            {/* Control panel - ẩn khi đang dẫn đường hoặc mô phỏng */}
            {showControlPanel && (
                <Card className="absolute top-4 left-4 shadow-lg z-10 w-1/3 bg-white/90 backdrop-blur-sm">
                    <Title level={4}>Bản đồ TrackAsia</Title>

                    <Tabs activeKey={activeTab} onChange={handleTabChange}>
                        <TabPane tab="Tìm kiếm" key="search">
                            <SearchPanel
                                currentAddress={currentAddress}
                                addressDetails={addressDetails}
                                searchQuery={searchQuery}
                                options={options}
                                isSearching={isSearching}
                                handleSearchChange={handleSearchChange}
                                handleSearchComplete={handleSearchComplete}
                                handleSelectPlace={handleSelectPlace}
                                getCurrentLocation={getCurrentLocation}
                            />
                        </TabPane>

                        <TabPane tab="Tìm đường" key="directions">
                            <DirectionsDemo
                                map={map.current}
                                startNavigation={startNavigation}
                                startSimulation={startSimulation}
                                stopSimulation={stopSimulation}
                                changeSimulationSpeed={changeSimulationSpeed}
                                simulationSpeed={simulationSpeed}
                                isNavigating={isNavigating}
                                isSimulating={isSimulating}
                                remainingDistance={remainingDistance}
                                remainingTime={remainingTime}
                                currentInstructionIndex={currentInstructionIndex}
                            />
                        </TabPane>
                    </Tabs>
                </Card>
            )}

            {/* Navigation Panel */}
            {(isNavigating || isSimulating) && showNavigationModal && (
                <NavigationPanel
                    isNavigating={isNavigating}
                    isSimulating={isSimulating}
                    remainingDistance={formatDistanceForDisplay(remainingDistance)}
                    remainingTime={remainingTime}
                    currentInstructionIndex={currentInstructionIndex}
                    routeInfo={routeInfo ? {
                        ...routeInfo,
                        steps: routeInfo.steps.map(step => ({
                            ...step,
                            distance: formatDistanceForDisplay(step.distance)
                        }))
                    } : null}
                    onClose={() => {
                        stopNavigation();
                        stopSimulation();
                    }}
                    progress={navigationProgressRef.current}
                    simulationSpeed={simulationSpeed}
                    onChangeSpeed={changeSimulationSpeed}
                    isPaused={isPaused}
                    onTogglePause={togglePauseNavigation}
                    currentSpeed={currentSpeed}
                />
            )}

            {/* Trip Summary Modal */}
            {showTripSummary && (
                <TripSummary
                    tripSummary={tripSummary}
                    onClose={() => setShowTripSummary(false)}
                    routeInfo={routeInfo}
                />
            )}

            {/* Map Controls */}
            <MapControls
                showControlPanel={showControlPanel}
                setShowControlPanel={setShowControlPanel}
                isNavigating={isNavigating}
                isSimulating={isSimulating}
            />
        </div>
    );
};

export default TrackAsiaMapPage; 