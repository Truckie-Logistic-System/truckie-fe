import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button, Card, Space, Typography, Spin, AutoComplete, Divider, Tag, Tabs, message } from 'antd';
import { SearchOutlined, AimOutlined, EnvironmentOutlined, CarOutlined, CompassOutlined } from '@ant-design/icons';
import { OPEN_MAP_API_KEY } from '../../config/env';
import { searchPlaces, getPlaceDetail, getReverseGeocode, findDirection, decodePolyline } from '../../services/openmap.service';
import type { AutocompleteResult, DirectionResponse } from '../../services/openmap.service';

// Import components
import RoutePanel from './components/RoutePanel';
import NavigationPanel from './components/NavigationPanel';
import TripSummary from './components/TripSummary';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Vietnam boundaries
const VIETNAM_BOUNDS = {
    north: 23.393395, // Northernmost point
    south: 8.559615,  // Southernmost point
    west: 102.144033, // Westernmost point
    east: 109.469720  // Easternmost point
};

const OpenMapPage = () => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const [lng, setLng] = useState<number>(105.85);
    const [lat, setLat] = useState<number>(21.0);
    const [zoom, setZoom] = useState<number>(13);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [options, setOptions] = useState<{ value: string; label: React.ReactNode }[]>([]);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [currentAddress, setCurrentAddress] = useState<string>('');
    const [addressDetails, setAddressDetails] = useState<any>(null);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const markersRef = useRef<maplibregl.Marker[]>([]);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isLoadingAddress, setIsLoadingAddress] = useState<boolean>(false);

    // Route finding states
    const [activeTab, setActiveTab] = useState<string>('search');
    const [startPoint, setStartPoint] = useState<{ lat: number; lng: number; address: string } | null>(null);
    const [endPoint, setEndPoint] = useState<{ lat: number; lng: number; address: string } | null>(null);
    const [startSearchQuery, setStartSearchQuery] = useState<string>('');
    const [endSearchQuery, setEndSearchQuery] = useState<string>('');
    const [startOptions, setStartOptions] = useState<{ value: string; label: React.ReactNode }[]>([]);
    const [endOptions, setEndOptions] = useState<{ value: string; label: React.ReactNode }[]>([]);
    const [isStartSearching, setIsStartSearching] = useState<boolean>(false);
    const [isEndSearching, setIsEndSearching] = useState<boolean>(false);
    const [routeResult, setRouteResult] = useState<DirectionResponse | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<'car' | 'bike' | 'motor' | 'taxi' | 'truck' | 'walking'>('car');
    const [isRouteFinding, setIsRouteFinding] = useState<boolean>(false);
    const routeLayerRef = useRef<string | null>(null);
    const routeSourceRef = useRef<string | null>(null);
    const startMarkerRef = useRef<maplibregl.Marker | null>(null);
    const endMarkerRef = useRef<maplibregl.Marker | null>(null);

    // Navigation states
    const [isNavigating, setIsNavigating] = useState<boolean>(false);
    const [remainingDistance, setRemainingDistance] = useState<number>(0);
    const [remainingTime, setRemainingTime] = useState<number>(0);
    const [currentInstructionIndex, setCurrentInstructionIndex] = useState<number>(0);
    const [nextTurnDistance, setNextTurnDistance] = useState<number>(0);
    const [showNavigationModal, setShowNavigationModal] = useState<boolean>(false);
    const [isNavigationPanelCollapsed, setIsNavigationPanelCollapsed] = useState<boolean>(false);
    const [compassHeading, setCompassHeading] = useState<number | null>(null);
    const watchPositionRef = useRef<number | null>(null);
    const userLocationMarkerRef = useRef<maplibregl.Marker | null>(null);
    const navigationProgressRef = useRef<number>(0);

    // Simulation states
    const [isSimulating, setIsSimulating] = useState<boolean>(false);
    const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
    const simulationIntervalRef = useRef<number | null>(null);
    const simulationRoutePointsRef = useRef<[number, number][]>([]);
    const simulationCurrentPointIndexRef = useRef<number>(0);
    const simulationMarkerRef = useRef<maplibregl.Marker | null>(null);

    // Trip summary states
    const [showTripSummary, setShowTripSummary] = useState<boolean>(false);
    const [tripSummary, setTripSummary] = useState<{
        startTime: number | null;
        endTime: number | null;
        totalDistance: string;
        totalTime: string;
        averageSpeed: number;
    }>({
        startTime: null,
        endTime: null,
        totalDistance: '0 km',
        totalTime: '0 min',
        averageSpeed: 0
    });

    // Format search results
    const formatSearchResults = (results: AutocompleteResult[]) => {
        if (results && results.length > 0) {
            return results.map(result => ({
                key: result.place_id,
                value: result.description,
                label: (
                    <div>
                        <div className="font-medium">{result.structured_formatting.main_text}</div>
                        <div className="text-xs text-gray-500">{result.structured_formatting.secondary_text}</div>
                        {result.distance_meters && (
                            <div className="text-xs text-blue-500">
                                {(result.distance_meters / 1000).toFixed(1)} km
                            </div>
                        )}
                    </div>
                ),
                result: result
            }));
        }
        return [];
    };

    // Handle search input change
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);

        if (!value || value.length < 2) {
            setOptions([]);
            return;
        }

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (value.length >= 2) {
            setIsSearching(true);
        }

        const currentValue = value;

        searchTimeoutRef.current = setTimeout(() => {
            if (currentValue.length >= 2) {
                performSearch(currentValue);
            }
        }, 400);
    };

    // Perform search with the given query
    const performSearch = async (value: string) => {
        if (value.length < 2) {
            setOptions([]);
            return;
        }

        try {
            const focusParam = map.current
                ? `${map.current.getCenter().lat},${map.current.getCenter().lng}`
                : undefined;

            const results = await searchPlaces(value, focusParam);
            setOptions(formatSearchResults(results));
        } catch (error) {
            console.error('Error searching places:', error);
            setOptions([]);
        } finally {
            setIsSearching(false);
        }
    };

    // Handle search when input is complete (Enter key or search button)
    const handleSearchComplete = (value: string) => {
        if (value.length >= 2) {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
                searchTimeoutRef.current = null;
            }

            setIsSearching(true);
            performSearch(value);
        }
    };

    // Handle selection of a place from search results
    const handleSelectPlace = async (value: string, option: any) => {
        try {
            const placeDetail = await getPlaceDetail(option.key);

            if (placeDetail && placeDetail.geometry) {
                const { lat, lng } = placeDetail.geometry.location;

                // Clear existing markers
                clearMarkers();

                // Add marker for selected location
                if (map.current) {
                    const marker = new maplibregl.Marker()
                        .setLngLat([lng, lat])
                        .addTo(map.current);
                    markersRef.current.push(marker);

                    // Fly to the location
                    map.current.flyTo({
                        center: [lng, lat],
                        zoom: 16,
                        duration: 1000
                    });

                    // Update selected location
                    setSelectedLocation({ lat, lng });

                    // Get reverse geocode for the location
                    getReverseGeocodeFromCoordinates(lng, lat);
                }
            }
        } catch (error) {
            console.error('Error handling place selection:', error);
            message.error('Không thể tìm thấy thông tin chi tiết của địa điểm');
        }
    };

    // Get current location
    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            setIsLoadingAddress(true);

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;

                    // Update map position
                    if (map.current) {
                        map.current.flyTo({
                            center: [longitude, latitude],
                            zoom: 16,
                            duration: 1000
                        });

                        // Clear existing markers
                        clearMarkers();

                        // Add marker for current location
                        const marker = new maplibregl.Marker({
                            color: '#1677ff'
                        })
                            .setLngLat([longitude, latitude])
                            .addTo(map.current);
                        markersRef.current.push(marker);

                        // Update selected location
                        setSelectedLocation({ lat: latitude, lng: longitude });

                        // Update start point if in route tab
                        if (activeTab === 'route') {
                            setStartPoint({
                                lat: latitude,
                                lng: longitude,
                                address: 'Vị trí hiện tại'
                            });
                            setStartSearchQuery('Vị trí hiện tại');
                        }

                        // Get address from coordinates
                        getReverseGeocodeFromCoordinates(longitude, latitude);
                    }
                },
                (error) => {
                    console.error('Error getting current location:', error);
                    message.error('Không thể lấy vị trí hiện tại');
                    setIsLoadingAddress(false);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        } else {
            message.error('Trình duyệt không hỗ trợ định vị');
        }
    };

    // Get address from coordinates
    const getReverseGeocodeFromCoordinates = async (lng: number, lat: number) => {
        try {
            setIsLoadingAddress(true);

            const result = await getReverseGeocode(lng, lat);

            if (result) {
                setCurrentAddress(result.display);
                setAddressDetails(result);

                // If we're in route tab and getting current location as start point
                if (activeTab === 'route' && startSearchQuery === 'Vị trí hiện tại') {
                    setStartPoint(prev => ({
                        ...prev!,
                        address: result.display
                    }));
                }
            } else {
                setCurrentAddress(`Vị trí (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
                setAddressDetails(null);
            }
        } catch (error) {
            console.error('Error getting reverse geocode:', error);
            setCurrentAddress(`Vị trí (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
            setAddressDetails(null);
        } finally {
            setIsLoadingAddress(false);
        }
    };

    // Format distance for display
    const formatDistanceStr = (distance: string): string => {
        // OpenMap API returns distance in format like "1.76 km" or "280 m"
        return distance;
    };

    // Format time for display
    const formatTimeStr = (duration: string): string => {
        // OpenMap API returns duration in format like "2 minutes" or "20 seconds"
        return duration;
    };

    useEffect(() => {
        if (map.current) return; // Initialize map only once

        if (mapContainer.current) {
            map.current = new maplibregl.Map({
                container: mapContainer.current,
                style: `https://maptiles.openmap.vn/styles/day-v1/style.json?apikey=${OPEN_MAP_API_KEY}`,
                center: [lng, lat],
                zoom: zoom,
                maxZoom: 19,
                minZoom: 3,
                attributionControl: false
            });

            // Add navigation control (zoom buttons)
            map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

            // Add attribution control
            map.current.addControl(new maplibregl.AttributionControl({
                compact: true
            }), 'bottom-right');

            // Update state on map move
            map.current.on('move', () => {
                if (map.current) {
                    setLng(Number(map.current.getCenter().lng.toFixed(4)));
                    setLat(Number(map.current.getCenter().lat.toFixed(4)));
                    setZoom(Number(map.current.getZoom().toFixed(2)));
                }
            });

            // Add click event to add marker
            map.current.on('click', (e) => {
                clearMarkers();
                const marker = new maplibregl.Marker()
                    .setLngLat([e.lngLat.lng, e.lngLat.lat])
                    .addTo(map.current!);
                markersRef.current.push(marker);

                // Update selected location
                setSelectedLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng });

                // Get address from coordinates (reverse geocoding)
                getReverseGeocodeFromCoordinates(e.lngLat.lng, e.lngLat.lat);
            });
        }

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []); // Empty dependency array - only run once on mount

    // Auto get current location when page loads
    useEffect(() => {
        // Small delay to ensure the map is loaded first
        const timer = setTimeout(() => {
            getCurrentLocation();
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    // Handle search for start point
    const handleStartSearchChange = (value: string) => {
        setStartSearchQuery(value);

        if (!value || value.length < 2) {
            setStartOptions([]);
            return;
        }

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (value.length >= 2) {
            setIsStartSearching(true);
        }

        const currentValue = value;

        searchTimeoutRef.current = setTimeout(() => {
            if (currentValue.length >= 2) {
                performStartSearch(currentValue);
            }
        }, 400);
    };

    // Perform search for start point
    const performStartSearch = async (value: string) => {
        if (value.length < 2) {
            setStartOptions([]);
            return;
        }

        try {
            const focusParam = map.current
                ? `${map.current.getCenter().lat},${map.current.getCenter().lng}`
                : undefined;

            const results = await searchPlaces(value, focusParam);
            setStartOptions(formatSearchResults(results));
        } catch (error) {
            console.error('Error searching places for start point:', error);
            setStartOptions([]);
        } finally {
            setIsStartSearching(false);
        }
    };

    // Handle search for end point
    const handleEndSearchChange = (value: string) => {
        setEndSearchQuery(value);

        if (!value || value.length < 2) {
            setEndOptions([]);
            return;
        }

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (value.length >= 2) {
            setIsEndSearching(true);
        }

        const currentValue = value;

        searchTimeoutRef.current = setTimeout(() => {
            if (currentValue.length >= 2) {
                performEndSearch(currentValue);
            }
        }, 400);
    };

    // Perform search for end point
    const performEndSearch = async (value: string) => {
        if (value.length < 2) {
            setEndOptions([]);
            return;
        }

        try {
            const focusParam = map.current
                ? `${map.current.getCenter().lat},${map.current.getCenter().lng}`
                : undefined;

            const results = await searchPlaces(value, focusParam);
            setEndOptions(formatSearchResults(results));
        } catch (error) {
            console.error('Error searching places for end point:', error);
            setEndOptions([]);
        } finally {
            setIsEndSearching(false);
        }
    };

    // Handle selection of start point
    const handleSelectStartPlace = async (value: string, option: any) => {
        if (!map.current) return;

        try {
            const placeDetail = await getPlaceDetail(option.key);

            if (placeDetail) {
                setStartPoint({
                    lat: placeDetail.geometry.location.lat,
                    lng: placeDetail.geometry.location.lng,
                    address: placeDetail.formatted_address
                });

                // Clear any existing route when changing start/end points
                clearRoute();
            }
        } catch (error) {
            console.error('Error handling start place selection:', error);
            message.error('Không thể tìm thấy thông tin chi tiết của địa điểm');
        }
    };

    // Handle selection of end point
    const handleSelectEndPlace = async (value: string, option: any) => {
        if (!map.current) return;

        try {
            const placeDetail = await getPlaceDetail(option.key);

            if (placeDetail) {
                setEndPoint({
                    lat: placeDetail.geometry.location.lat,
                    lng: placeDetail.geometry.location.lng,
                    address: placeDetail.formatted_address
                });

                // Clear any existing route when changing start/end points
                clearRoute();
            }
        } catch (error) {
            console.error('Error handling end place selection:', error);
            message.error('Không thể tìm thấy thông tin chi tiết của địa điểm');
        }
    };

    // Use current location as start point
    const useCurrentLocationAsStart = () => {
        getCurrentLocation();
    };

    // Swap start and end points
    const swapStartAndEndPoints = () => {
        if (startPoint && endPoint) {
            const tempStart = { ...startPoint };
            const tempStartQuery = startSearchQuery;

            setStartPoint(endPoint);
            setStartSearchQuery(endSearchQuery);

            setEndPoint(tempStart);
            setEndSearchQuery(tempStartQuery);

            // Clear any existing route
            clearRoute();
        }
    };

    // Handle vehicle change
    const handleVehicleChange = (vehicle: 'car' | 'bike' | 'motor' | 'taxi' | 'truck' | 'walking') => {
        setSelectedVehicle(vehicle);
        // Clear existing route when changing vehicle
        clearRoute();
    };

    // Find route between two points
    const findRouteBetweenPoints = async () => {
        if (!startPoint || !endPoint) {
            message.error('Vui lòng chọn điểm xuất phát và điểm đến');
            return;
        }

        setIsRouteFinding(true);
        clearRoute();

        try {
            const origin = `${startPoint.lat},${startPoint.lng}`;
            const destination = `${endPoint.lat},${endPoint.lng}`;

            const result = await findDirection(origin, destination, selectedVehicle);

            if (result && result.routes && result.routes.length > 0) {
                setRouteResult(result);

                // Decode polyline and draw route on map
                const route = result.routes[0];
                const decodedPoints = decodePolyline(route.overview_polyline.points);

                if (map.current) {
                    // Generate unique IDs for this route
                    const sourceId = `route-source-${Date.now()}`;
                    const layerId = `route-layer-${Date.now()}`;

                    // Store IDs for later cleanup
                    routeSourceRef.current = sourceId;
                    routeLayerRef.current = layerId;

                    // Add source for the route
                    map.current.addSource(sourceId, {
                        type: 'geojson',
                        data: {
                            type: 'Feature',
                            properties: {},
                            geometry: {
                                type: 'LineString',
                                coordinates: decodedPoints
                            }
                        }
                    });

                    // Add route layer
                    map.current.addLayer({
                        id: layerId,
                        type: 'line',
                        source: sourceId,
                        layout: {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        paint: {
                            'line-color': '#1677ff',
                            'line-width': 5,
                            'line-opacity': 0.8
                        }
                    });

                    // Add markers for start and end points
                    startMarkerRef.current = new maplibregl.Marker({ color: 'green' })
                        .setLngLat([startPoint.lng, startPoint.lat])
                        .addTo(map.current);

                    endMarkerRef.current = new maplibregl.Marker({ color: 'red' })
                        .setLngLat([endPoint.lng, endPoint.lat])
                        .addTo(map.current);

                    // Fit map to route bounds
                    const bounds = route.bounds;
                    if (bounds) {
                        map.current.fitBounds([
                            [bounds.southwest.lng, bounds.southwest.lat], // Southwest corner
                            [bounds.northeast.lng, bounds.northeast.lat]  // Northeast corner
                        ], { padding: 50 });
                    } else {
                        // If bounds not available, fit to start and end points
                        const boundingBox = new maplibregl.LngLatBounds()
                            .extend([startPoint.lng, startPoint.lat])
                            .extend([endPoint.lng, endPoint.lat]);

                        map.current.fitBounds(boundingBox, { padding: 50 });
                    }
                }

                message.success('Đã tìm thấy đường đi');
            } else {
                message.error('Không tìm thấy đường đi phù hợp');
            }
        } catch (error) {
            console.error('Error finding route:', error);
            message.error('Lỗi khi tìm đường đi');
        } finally {
            setIsRouteFinding(false);
        }
    };

    // Hiển thị loại địa điểm
    const renderPlaceTypes = (types: string[]) => {
        if (!types || types.length === 0) return null;

        // Giới hạn số lượng loại hiển thị
        const displayTypes = types.slice(0, 3);

        return (
            <div className="mt-2">
                {displayTypes.map((type, index) => (
                    <Tag key={index} color="blue" className="mr-1 mb-1">{type}</Tag>
                ))}
            </div>
        );
    };

    // Initialize compass heading
    useEffect(() => {
        if (window.DeviceOrientationEvent) {
            const handleOrientation = (event: any) => {
                // For iOS devices
                if (event.webkitCompassHeading) {
                    setCompassHeading(event.webkitCompassHeading);
                }
                // For Android devices
                else if (event.alpha) {
                    setCompassHeading(360 - event.alpha);
                }
            };

            window.addEventListener('deviceorientation', handleOrientation, true);

            return () => {
                window.removeEventListener('deviceorientation', handleOrientation, true);
            };
        }
    }, []);

    // Clear navigation and simulation when component unmounts
    useEffect(() => {
        return () => {
            if (watchPositionRef.current !== null) {
                navigator.geolocation.clearWatch(watchPositionRef.current);
                watchPositionRef.current = null;
            }

            if (simulationIntervalRef.current !== null) {
                window.clearInterval(simulationIntervalRef.current);
                simulationIntervalRef.current = null;
            }
        };
    }, []);

    // Get vehicle icon based on selected vehicle
    const getVehicleIcon = () => {
        switch (selectedVehicle) {
            case 'car':
            case 'taxi':
            case 'truck':
                return <CarOutlined />;
            case 'bike':
            case 'motor':
            case 'walking':
                return <CompassOutlined />;
            default:
                return <CarOutlined />;
        }
    };

    // Handle tab change
    const handleTabChange = (key: string) => {
        setActiveTab(key);

        // If switching to route tab and we have the current location, set it as start point
        if (key === 'route' && selectedLocation && !startPoint) {
            setStartPoint({
                lat: selectedLocation.lat,
                lng: selectedLocation.lng,
                address: currentAddress || 'Vị trí hiện tại'
            });
            setStartSearchQuery(currentAddress || 'Vị trí hiện tại');
        }

        // Clear route when switching tabs
        if (key !== 'route') {
            clearRoute();
        }
    };

    // Clear all markers from the map
    const clearMarkers = () => {
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
    };

    // Clear route from map
    const clearRoute = () => {
        if (map.current) {
            // Remove existing route layer and source
            if (routeLayerRef.current && map.current.getLayer(routeLayerRef.current)) {
                map.current.removeLayer(routeLayerRef.current);
            }

            if (routeSourceRef.current && map.current.getSource(routeSourceRef.current)) {
                map.current.removeSource(routeSourceRef.current);
            }

            // Reset refs
            routeLayerRef.current = null;
            routeSourceRef.current = null;

            // Remove markers
            if (startMarkerRef.current) {
                startMarkerRef.current.remove();
                startMarkerRef.current = null;
            }

            if (endMarkerRef.current) {
                endMarkerRef.current.remove();
                endMarkerRef.current = null;
            }
        }

        // Clear route result
        setRouteResult(null);
    };

    // Calculate distance between two geographic points
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Radius of Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in km
        return distance;
    };

    // Toggle navigation panel collapse
    const toggleNavigationPanel = () => {
        setIsNavigationPanelCollapsed(!isNavigationPanelCollapsed);
    };

    // Start navigation
    const startNavigation = () => {
        if (!routeResult || !routeResult.routes || routeResult.routes.length === 0) {
            message.error('Không có đường đi để bắt đầu dẫn đường');
            return;
        }

        // If simulation is enabled, start simulation instead of real navigation
        if (isSimulating) {
            stopSimulation();
            return;
        }

        setIsNavigating(true);
        setShowNavigationModal(true);
        setShowTripSummary(false);

        // Record start time for trip summary
        setTripSummary(prev => ({
            ...prev,
            startTime: Date.now(),
            totalDistance: routeResult.routes[0].legs[0].distance.text,
            totalTime: routeResult.routes[0].legs[0].duration.text
        }));

        // Start watching position
        if (navigator.geolocation) {
            // Clear any existing watch
            if (watchPositionRef.current !== null) {
                navigator.geolocation.clearWatch(watchPositionRef.current);
            }

            watchPositionRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    const currentPosition: [number, number] = [longitude, latitude];

                    // Update user location on map
                    updateUserLocationOnMap(currentPosition, accuracy);

                    // Calculate navigation progress
                    const routePoints = decodePolyline(routeResult.routes[0].overview_polyline.points);
                    const closestPointIndex = findClosestPointOnRoute(currentPosition, routePoints);
                    const remainingDist = calculateRemainingDistance(currentPosition, routePoints, closestPointIndex);

                    // Update remaining distance and time
                    setRemainingDistance(remainingDist);

                    // Calculate progress percentage
                    const totalDistance = routeResult.routes[0].legs[0].distance.value; // in meters
                    const progress = 1 - (remainingDist / totalDistance);
                    navigationProgressRef.current = progress;

                    // Update remaining time based on progress
                    const remainingTimeEstimate = routeResult.routes[0].legs[0].duration.value * (1 - progress);
                    setRemainingTime(remainingTimeEstimate);

                    // Find current instruction
                    if (routeResult.routes[0].legs[0].steps && routeResult.routes[0].legs[0].steps.length > 0) {
                        const newInstructionIndex = findCurrentInstruction(
                            closestPointIndex,
                            routeResult.routes[0].legs[0].steps,
                            routePoints
                        );

                        if (newInstructionIndex !== currentInstructionIndex) {
                            setCurrentInstructionIndex(newInstructionIndex);
                        }

                        // Calculate distance to next turn
                        const distanceToNextTurn = calculateDistanceToNextTurn(
                            currentPosition,
                            routePoints,
                            closestPointIndex,
                            routeResult.routes[0].legs[0].steps,
                            newInstructionIndex
                        );

                        setNextTurnDistance(distanceToNextTurn);
                    }

                    // Check if we've reached the destination (within 50 meters)
                    if (remainingDist < 50) {
                        message.success('Bạn đã đến điểm đến!');
                        stopNavigation();
                    }
                },
                (error) => {
                    console.error('Error getting location during navigation:', error);
                    message.error('Không thể lấy vị trí hiện tại để dẫn đường');
                    stopNavigation();
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 5000
                }
            );
        } else {
            message.error('Trình duyệt không hỗ trợ định vị');
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

            userLocationMarkerRef.current = new maplibregl.Marker({
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

        // Center map on user location during navigation
        map.current.flyTo({
            center: position,
            zoom: 17,
            bearing: compassHeading !== null ? compassHeading : 0,
            pitch: 60, // Tilt the map for better navigation view
            duration: 500
        });
    };

    // Find the closest point on the route to the current position
    const findClosestPointOnRoute = (currentPosition: [number, number], routePoints: [number, number][]): number => {
        let minDistance = Infinity;
        let closestIndex = 0;

        routePoints.forEach((point, index) => {
            const distance = calculateDistance(
                currentPosition[1], currentPosition[0],
                point[1], point[0]
            );

            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = index;
            }
        });

        return closestIndex;
    };

    // Calculate remaining distance from current position to destination
    const calculateRemainingDistance = (currentPosition: [number, number], routePoints: [number, number][], closestPointIndex: number): number => {
        let remainingDistance = 0;

        // Add distance from current position to closest point on route
        remainingDistance += calculateDistance(
            currentPosition[1], currentPosition[0],
            routePoints[closestPointIndex][1], routePoints[closestPointIndex][0]
        ) * 1000; // Convert to meters

        // Add distances between remaining points on route
        for (let i = closestPointIndex; i < routePoints.length - 1; i++) {
            remainingDistance += calculateDistance(
                routePoints[i][1], routePoints[i][0],
                routePoints[i + 1][1], routePoints[i + 1][0]
            ) * 1000; // Convert to meters
        }

        return remainingDistance;
    };

    // Find the current instruction based on the closest point
    const findCurrentInstruction = (closestPointIndex: number, steps: any[], routePoints: [number, number][]): number => {
        // Since OpenMap API doesn't provide instruction intervals, we need to estimate
        // based on the step's start and end locations

        const currentPoint = routePoints[closestPointIndex];
        let minDistance = Infinity;
        let closestStepIndex = 0;

        steps.forEach((step, index) => {
            const stepStart = [step.start_location.lng, step.start_location.lat] as [number, number];
            const distance = calculateDistance(
                currentPoint[1], currentPoint[0],
                stepStart[1], stepStart[0]
            );

            if (distance < minDistance) {
                minDistance = distance;
                closestStepIndex = index;
            }
        });

        return closestStepIndex;
    };

    // Calculate distance to the next turn
    const calculateDistanceToNextTurn = (
        currentPosition: [number, number],
        routePoints: [number, number][],
        closestPointIndex: number,
        steps: any[],
        currentStepIndex: number
    ): number => {
        if (currentStepIndex >= steps.length - 1) {
            // If we're on the last step, return distance to destination
            return calculateRemainingDistance(currentPosition, routePoints, closestPointIndex);
        }

        const nextStep = steps[currentStepIndex + 1];
        const nextStepStart = [nextStep.start_location.lng, nextStep.start_location.lat];

        // Find the closest point on route to the next step start
        let minDistance = Infinity;
        let nextStepPointIndex = closestPointIndex;

        for (let i = closestPointIndex; i < routePoints.length; i++) {
            const distance = calculateDistance(
                nextStepStart[1], nextStepStart[0],
                routePoints[i][1], routePoints[i][0]
            );

            if (distance < minDistance) {
                minDistance = distance;
                nextStepPointIndex = i;
            }
        }

        // Calculate distance from current position to next step start
        let distanceToNextTurn = calculateDistance(
            currentPosition[1], currentPosition[0],
            nextStepStart[1], nextStepStart[0]
        ) * 1000; // Convert to meters

        return distanceToNextTurn;
    };

    // Pause navigation
    const pauseNavigation = () => {
        if (watchPositionRef.current !== null) {
            navigator.geolocation.clearWatch(watchPositionRef.current);
            watchPositionRef.current = null;
        }

        setIsNavigating(false);
    };

    // Resume navigation
    const resumeNavigation = () => {
        startNavigation();
    };

    // Stop navigation
    const stopNavigation = () => {
        // If simulation is running, stop it
        if (isSimulating) {
            stopSimulation();
            return;
        }

        // Original stop navigation code
        if (watchPositionRef.current !== null) {
            navigator.geolocation.clearWatch(watchPositionRef.current);
            watchPositionRef.current = null;
        }

        // Record end time and calculate trip stats
        const endTime = Date.now();
        const startTime = tripSummary.startTime || endTime;
        const actualTime = endTime - startTime;
        const distanceValue = routeResult?.routes[0].legs[0].distance.value || 0;
        const averageSpeed = distanceValue / 1000 / (actualTime / 3600000); // km/h

        setTripSummary(prev => ({
            ...prev,
            endTime: endTime,
            averageSpeed: averageSpeed
        }));

        setIsNavigating(false);
        setShowNavigationModal(false);
        setShowTripSummary(true);

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
            if (routeResult && routeResult.routes && routeResult.routes.length > 0) {
                const bounds = routeResult.routes[0].bounds;
                if (bounds) {
                    map.current.fitBounds([
                        [bounds.southwest.lng, bounds.southwest.lat], // Southwest corner
                        [bounds.northeast.lng, bounds.northeast.lat]  // Northeast corner
                    ], { padding: 50 });
                }
            }
        }

        // Show success message
        message.success('Hành trình đã kết thúc');
    };

    // Start simulation
    const startSimulation = () => {
        if (!routeResult || !routeResult.routes || routeResult.routes.length === 0) {
            message.error('Không có đường đi để bắt đầu mô phỏng');
            return;
        }

        setIsSimulating(true);
        setIsNavigating(true);
        setShowNavigationModal(true);
        setShowTripSummary(false);

        // Initial values
        const route = routeResult.routes[0];
        const routePoints = decodePolyline(route.overview_polyline.points);
        simulationRoutePointsRef.current = routePoints;
        simulationCurrentPointIndexRef.current = 0;

        setRemainingDistance(route.legs[0].distance.value);
        setRemainingTime(route.legs[0].duration.value);
        setCurrentInstructionIndex(0);

        // If there's a first instruction, set next turn distance
        if (route.legs[0].steps && route.legs[0].steps.length > 0) {
            setNextTurnDistance(route.legs[0].steps[0].distance.value);
        }

        // Record start time for trip summary
        setTripSummary(prev => ({
            ...prev,
            startTime: Date.now(),
            totalDistance: route.legs[0].distance.text,
            totalTime: route.legs[0].duration.text
        }));

        // Create simulation vehicle marker
        if (map.current) {
            // Remove existing marker if any
            if (simulationMarkerRef.current) {
                simulationMarkerRef.current.remove();
            }

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
            simulationMarkerRef.current = new maplibregl.Marker({
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
        if (simulationIntervalRef.current !== null) {
            window.clearInterval(simulationIntervalRef.current);
        }

        simulationIntervalRef.current = window.setInterval(() => {
            moveSimulationVehicle();
        }, 1000 / simulationSpeed);
    };

    // Move simulation vehicle along the route
    const moveSimulationVehicle = () => {
        const routePoints = simulationRoutePointsRef.current;
        const currentIndex = simulationCurrentPointIndexRef.current;

        if (currentIndex >= routePoints.length - 1) {
            // Reached the end of route
            stopSimulation();
            message.success('Mô phỏng hoàn tất! Đã đến điểm đến.');
            return;
        }

        // Move to next point
        const nextIndex = currentIndex + 1;
        simulationCurrentPointIndexRef.current = nextIndex;

        const currentPoint = routePoints[currentIndex];
        const nextPoint = routePoints[nextIndex];

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

            // Update map view to follow vehicle
            map.current.flyTo({
                center: nextPoint,
                bearing: bearing,
                pitch: 60,
                duration: 1000 / simulationSpeed
            });
        }

        // Calculate remaining distance
        let remainingDist = 0;
        for (let i = nextIndex; i < routePoints.length - 1; i++) {
            remainingDist += calculateDistance(
                routePoints[i][1], routePoints[i][0],
                routePoints[i + 1][1], routePoints[i + 1][0]
            ) * 1000; // Convert to meters
        }

        setRemainingDistance(remainingDist);

        // Calculate progress percentage
        const totalDistance = routeResult!.routes[0].legs[0].distance.value; // in meters
        const progress = 1 - (remainingDist / totalDistance);
        navigationProgressRef.current = progress;

        // Update remaining time based on progress
        const remainingTimeEstimate = routeResult!.routes[0].legs[0].duration.value * (1 - progress);
        setRemainingTime(remainingTimeEstimate);

        // Find current instruction
        if (routeResult!.routes[0].legs[0].steps && routeResult!.routes[0].legs[0].steps.length > 0) {
            const newInstructionIndex = findCurrentInstruction(
                nextIndex,
                routeResult!.routes[0].legs[0].steps,
                routePoints
            );

            if (newInstructionIndex !== currentInstructionIndex) {
                setCurrentInstructionIndex(newInstructionIndex);
            }

            // Calculate distance to next turn
            if (newInstructionIndex < routeResult!.routes[0].legs[0].steps.length - 1) {
                const nextStep = routeResult!.routes[0].legs[0].steps[newInstructionIndex + 1];
                const nextStepStart = [nextStep.start_location.lng, nextStep.start_location.lat];

                let distToNextTurn = calculateDistance(
                    nextPoint[1], nextPoint[0],
                    nextStepStart[1], nextStepStart[0]
                ) * 1000; // Convert to meters

                setNextTurnDistance(distToNextTurn);
            }
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

    // Stop simulation
    const stopSimulation = () => {
        if (simulationIntervalRef.current !== null) {
            window.clearInterval(simulationIntervalRef.current);
            simulationIntervalRef.current = null;
        }

        setIsSimulating(false);
        setIsNavigating(false);
        setShowNavigationModal(false);

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

        // Show trip summary
        setShowTripSummary(true);
    };

    // Change simulation speed
    const changeSimulationSpeed = (speed: number) => {
        setSimulationSpeed(speed);

        // Restart interval with new speed if simulation is running
        if (isSimulating && simulationIntervalRef.current !== null) {
            window.clearInterval(simulationIntervalRef.current);
            simulationIntervalRef.current = window.setInterval(() => {
                moveSimulationVehicle();
            }, 1000 / speed);
        }
    };

    // Reset trip and start a new one
    const resetTrip = () => {
        clearRoute();
        setShowTripSummary(false);
        setTripSummary({
            startTime: null,
            endTime: null,
            totalDistance: '0 km',
            totalTime: '0 min',
            averageSpeed: 0
        });
        setActiveTab('route');
    };

    // Start the same route again
    const startSameRouteAgain = () => {
        setShowTripSummary(false);
        startNavigation();
    };

    return (
        <div className="h-screen w-full relative">
            <div ref={mapContainer} className="h-full w-full" />

            {/* Control panel - Hidden when navigating */}
            {!isNavigating && (
                <Card className="absolute top-4 left-4 shadow-lg z-10 w-1/3 bg-white/90 backdrop-blur-sm">
                    <Title level={4}>Bản đồ OpenMap</Title>

                    {/* Trip summary display */}
                    {showTripSummary && (
                        <div className="mb-4">
                            <TripSummary
                                totalDistance={tripSummary.totalDistance}
                                totalTime={tripSummary.totalTime}
                                averageSpeed={tripSummary.averageSpeed}
                                formatDistance={formatDistanceStr}
                                formatTime={formatTimeStr}
                                resetTrip={resetTrip}
                                startSameRouteAgain={startSameRouteAgain}
                            />
                        </div>
                    )}

                    <Tabs activeKey={activeTab} onChange={handleTabChange}>
                        <TabPane tab="Tìm kiếm" key="search">
                            <Space direction="vertical" className="w-full">
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Địa chỉ hiện tại:</div>
                                    <div className="text-sm break-words font-medium">{currentAddress}</div>

                                    {addressDetails && (
                                        <div className="mt-2">
                                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                                                {addressDetails.name && (
                                                    <>
                                                        <div className="text-gray-600">Số nhà/Tên:</div>
                                                        <div>{addressDetails.name}</div>
                                                    </>
                                                )}

                                                {addressDetails.components && addressDetails.components.map((component: any, index: number) => (
                                                    <React.Fragment key={index}>
                                                        <div className="text-gray-600">{component.short_name}:</div>
                                                        <div>{component.long_name}</div>
                                                    </React.Fragment>
                                                ))}

                                                {addressDetails.exactPosition && (
                                                    <>
                                                        <div className="text-gray-600">Tọa độ:</div>
                                                        <div>{addressDetails.exactPosition}</div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="relative w-full">
                                    <AutoComplete
                                        className="w-full"
                                        options={options}
                                        onSelect={handleSelectPlace}
                                        onSearch={handleSearchChange}
                                        value={searchQuery}
                                        placeholder="Tìm kiếm địa điểm"
                                    />
                                    {searchQuery.length >= 2 && !isSearching && (
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<SearchOutlined />}
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10"
                                            onClick={() => handleSearchComplete(searchQuery)}
                                        />
                                    )}
                                    {isSearching && (
                                        <Spin
                                            size="small"
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10"
                                        />
                                    )}
                                </div>

                                <Button
                                    type="default"
                                    icon={<AimOutlined />}
                                    onClick={getCurrentLocation}
                                    className="w-full"
                                >
                                    Vị trí hiện tại
                                </Button>
                            </Space>
                        </TabPane>

                        <TabPane tab="Tìm đường" key="route">
                            <RoutePanel
                                selectedVehicle={selectedVehicle}
                                startPoint={startPoint}
                                endPoint={endPoint}
                                startSearchQuery={startSearchQuery}
                                endSearchQuery={endSearchQuery}
                                startOptions={startOptions}
                                endOptions={endOptions}
                                isStartSearching={isStartSearching}
                                isEndSearching={isEndSearching}
                                isRouteFinding={isRouteFinding}
                                routeResult={routeResult}
                                simulationSpeed={simulationSpeed}
                                isNavigating={isNavigating}
                                formatDistance={formatDistanceStr}
                                formatTime={formatTimeStr}
                                getVehicleIcon={getVehicleIcon}
                                handleStartSearchChange={handleStartSearchChange}
                                handleEndSearchChange={handleEndSearchChange}
                                handleSelectStartPlace={handleSelectStartPlace}
                                handleSelectEndPlace={handleSelectEndPlace}
                                useCurrentLocationAsStart={useCurrentLocationAsStart}
                                swapStartAndEndPoints={swapStartAndEndPoints}
                                findRouteBetweenPoints={findRouteBetweenPoints}
                                startNavigation={startNavigation}
                                startSimulation={startSimulation}
                                changeSimulationSpeed={changeSimulationSpeed}
                                clearRoute={clearRoute}
                                onVehicleChange={handleVehicleChange}
                            />
                        </TabPane>
                    </Tabs>
                </Card>
            )}

            {/* Navigation Modal - Improved version */}
            <div
                className={`fixed left-0 right-0 bottom-0 z-20 transition-all duration-300 ${showNavigationModal ? 'translate-y-0' : 'translate-y-full'}`}
                style={{ pointerEvents: showNavigationModal ? 'auto' : 'none' }}
            >
                <NavigationPanel
                    isNavigationPanelCollapsed={isNavigationPanelCollapsed}
                    isSimulating={isSimulating}
                    routeResult={routeResult}
                    currentInstructionIndex={currentInstructionIndex}
                    nextTurnDistance={nextTurnDistance}
                    remainingDistance={remainingDistance}
                    remainingTime={remainingTime}
                    simulationSpeed={simulationSpeed}
                    formatDistance={formatDistanceStr}
                    formatTime={formatTimeStr}
                    toggleNavigationPanel={toggleNavigationPanel}
                    stopNavigation={stopNavigation}
                    pauseNavigation={pauseNavigation}
                    resumeNavigation={resumeNavigation}
                    changeSimulationSpeed={changeSimulationSpeed}
                />
            </div>
        </div>
    );
};

export default OpenMapPage; 