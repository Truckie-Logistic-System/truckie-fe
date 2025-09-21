import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Card, Typography, message, Tabs } from 'antd';
import { CarOutlined, EnvironmentOutlined, CompassOutlined } from '@ant-design/icons';
import { VIET_MAPS_API_KEY } from '../../config/env';
import vietmapService from '../../services/map/vietmapService';
import type { AutocompleteResult, RouteInstruction } from '../../services/map/vietmapService';

// Định nghĩa kiểu dữ liệu cho RouteResponse để tương thích với code cũ
interface RouteResponse {
    paths: Array<{
        distance: number;
        time: number;
        points: string;
        bbox: [number, number, number, number];
        instructions: RouteInstruction[];
    }>;
}

// Wrapper functions for API calls
const searchPlaces = async (query: string, focusParam?: string) => {
    // Không cần chuyển đổi focusParam vì vietmapService.searchPlaces đã nhận string
    return await vietmapService.searchPlaces(query, focusParam);
};

const getPlaceDetail = async (placeId: string) => {
    return await vietmapService.getPlaceDetail(placeId);
};

const findRoute = async (points: [number, number][], vehicle: string) => {
    if (points.length < 2) {
        throw new Error('Need at least origin and destination points');
    }

    const origin = points[0];
    const destination = points[points.length - 1];

    // Chuyển đổi từ [lat, lng] sang [lng, lat] nếu cần
    const originPoint = [origin[1], origin[0]]; // Đổi thứ tự nếu cần
    const destinationPoint = [destination[1], destination[0]]; // Đổi thứ tự nếu cần

    const result = await vietmapService.getRoute(originPoint as [number, number], destinationPoint as [number, number]);

    // Chuyển đổi kết quả từ API mới sang định dạng cũ
    if (result) {
        return {
            paths: [{
                distance: result.distance,
                time: result.duration,
                points: '', // Cần lấy points từ result nếu có
                bbox: [0, 0, 0, 0], // Cần lấy bbox từ result nếu có
                instructions: result.legs && result.legs[0] ? result.legs[0].steps.map(step => ({
                    distance: step.distance,
                    time: step.duration,
                    interval: [0, 0], // Cần tính toán interval nếu cần
                    text: step.maneuver.instruction,
                    street_name: step.name
                })) : []
            }]
        } as RouteResponse;
    }

    return null;
};

// Decode polyline function (if not available in vietmapService)
const decodePolyline = (encoded: string): [number, number][] => {
    // Implement polyline decoding or use from vietmapService
    // This is a simple implementation, might need to be adjusted
    const points: [number, number][] = [];
    let index = 0, lat = 0, lng = 0;

    while (index < encoded.length) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        points.push([lng * 1e-5, lat * 1e-5]);
    }

    return points;
};

// Import components
import SearchPanel from './components/SearchPanel';
import RoutePanel from './components/RoutePanel';
import NavigationPanel from './components/NavigationPanel';
import TripSummary from './components/TripSummary';

const { Title } = Typography;
const { TabPane } = Tabs;

// Caching configuration
const CACHE_NAME = 'vietmap-tiles-cache-v1';
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Vietnam boundaries
const VIETNAM_BOUNDS = {
    north: 23.393395, // Northernmost point
    south: 8.559615,  // Southernmost point
    west: 102.144033, // Westernmost point
    east: 109.469720  // Easternmost point
};

// Custom protocol handler for caching map tiles
const setupTileCache = () => {
    const urlProtocol = 'vietmap-cached://';
    const originalFetch = window.fetch;

    window.fetch = async function (url, options) {
        if (typeof url === 'string' && url.includes('maps.vietmap.vn/maps/tiles')) {
            try {
                // Open the cache
                const cache = await caches.open(CACHE_NAME);

                // Try to get from cache first
                const cachedResponse = await cache.match(url);
                if (cachedResponse) {
                    // Check if cache is still valid
                    const cachedDate = new Date(cachedResponse.headers.get('date') || 0);
                    const now = new Date();
                    if (now.getTime() - cachedDate.getTime() < CACHE_MAX_AGE) {
                        console.log('Cache hit:', url);
                        return cachedResponse;
                    }
                }

                // If not in cache or expired, fetch from network
                console.log('Cache miss, fetching from network:', url);
                const networkResponse = await originalFetch(url, options);

                // Clone the response before caching it
                const responseToCache = networkResponse.clone();

                // Store in cache
                cache.put(url, responseToCache);

                return networkResponse;
            } catch (error) {
                console.error('Error with tile caching:', error);
                // Fall back to original fetch
                return originalFetch(url, options);
            }
        }

        // For non-tile requests, use original fetch
        return originalFetch(url, options);
    };
};

// Clean up old caches
const cleanupOldCaches = async () => {
    try {
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name =>
            name.startsWith('vietmap-tiles-cache') && name !== CACHE_NAME
        );

        await Promise.all(oldCaches.map(cacheName => caches.delete(cacheName)));
        console.log('Old caches cleaned up');
    } catch (error) {
        console.error('Error cleaning up caches:', error);
    }
};

// Function to calculate tile coordinates from lat/lng
const getTileCoordinates = (lat: number, lng: number, zoom: number) => {
    const n = Math.pow(2, zoom);
    const x = Math.floor((lng + 180) / 360 * n);
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
    return { x, y, z: zoom };
};

// Function to generate tile URLs for a given area
const generateTileUrls = (
    bounds: { north: number; south: number; west: number; east: number },
    minZoom: number,
    maxZoom: number,
    apiKey: string
) => {
    const urls = [];

    for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
        // Calculate tile coordinates for the corners
        const nwTile = getTileCoordinates(bounds.north, bounds.west, zoom);
        const seTile = getTileCoordinates(bounds.south, bounds.east, zoom);

        // Loop through the tile coordinates
        for (let x = nwTile.x; x <= seTile.x; x++) {
            for (let y = nwTile.y; y <= seTile.y; y++) {
                const url = `https://maps.vietmap.vn/maps/tiles/tm/${zoom}/${x}/${y}@2x.png?apikey=${apiKey}`;
                urls.push(url);
            }
        }
    }

    return urls;
};

const VietMapPage = () => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const [lng, setLng] = useState<number>(105.85);
    const [lat, setLat] = useState<number>(21.0);
    const [zoom, setZoom] = useState<number>(13);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isCacheEnabled, setIsCacheEnabled] = useState<boolean>(true);
    const [isPreloading, setIsPreloading] = useState<boolean>(false);
    const [preloadProgress, setPreloadProgress] = useState<number>(0);
    const [messageApi, contextHolder] = message.useMessage();
    const preloadStartedRef = useRef<boolean>(false);
    const [options, setOptions] = useState<{ value: string; label: React.ReactNode }[]>([]);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [selectedPlace, setSelectedPlace] = useState<AutocompleteResult | null>(null);
    const [currentAddress, setCurrentAddress] = useState<string>('');
    const [addressDetails, setAddressDetails] = useState<any>(null);
    // State để lưu tọa độ đã chọn (từ tìm kiếm hoặc vị trí hiện tại)
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const markersRef = useRef<maplibregl.Marker[]>([]);

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
    const [routeResult, setRouteResult] = useState<RouteResponse | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<'car' | 'bike' | 'foot' | 'motorcycle'>('car');
    const [isRouteFinding, setIsRouteFinding] = useState<boolean>(false);
    const [routePolyline, setRoutePolyline] = useState<maplibregl.Map | null>(null);
    const routeLayerRef = useRef<string | null>(null);
    const routeSourceRef = useRef<string | null>(null);
    const startMarkerRef = useRef<maplibregl.Marker | null>(null);
    const endMarkerRef = useRef<maplibregl.Marker | null>(null);

    // Preload Vietnam map tiles
    const preloadVietnamTiles = async () => {
        if (!('caches' in window)) {
            // messageApi.error('Trình duyệt của bạn không hỗ trợ caching');
            return;
        }

        // Prevent multiple preload operations
        if (preloadStartedRef.current) {
            return;
        }

        preloadStartedRef.current = true;

        try {
            setIsPreloading(true);
            // messageApi.info('Đang tải trước bản đồ Việt Nam...');

            // Generate tile URLs for Vietnam at zoom levels 5-10
            // Higher zoom levels would generate too many tiles
            const minZoom = 5;
            const maxZoom = 10; // Limiting to zoom level 10 to avoid too many tiles
            const apiKey = VIET_MAPS_API_KEY;
            const tileUrls = generateTileUrls(VIETNAM_BOUNDS, minZoom, maxZoom, apiKey);

            // Open the cache
            const cache = await caches.open(CACHE_NAME);

            // Preload tiles in batches to avoid overwhelming the browser
            const batchSize = 10;
            let completed = 0;

            for (let i = 0; i < tileUrls.length; i += batchSize) {
                const batch = tileUrls.slice(i, i + batchSize);

                await Promise.all(batch.map(async (url) => {
                    try {
                        // Check if already in cache
                        const cachedResponse = await cache.match(url);
                        if (!cachedResponse) {
                            // If not in cache, fetch and cache
                            const response = await fetch(url);
                            if (response.ok) {
                                await cache.put(url, response);
                            }
                        }
                    } catch (error) {
                        console.error(`Error preloading tile ${url}:`, error);
                    }
                }));

                completed += batch.length;
                const progress = Math.round((completed / tileUrls.length) * 100);
                setPreloadProgress(progress);
            }

            // messageApi.success('Tải trước bản đồ Việt Nam hoàn tất!');
        } catch (error) {
            console.error('Error preloading tiles:', error);
            // messageApi.error('Lỗi khi tải trước bản đồ');
        } finally {
            setIsPreloading(false);
        }
    };

    // Initialize caching
    useEffect(() => {
        if (isCacheEnabled && 'caches' in window) {
            setupTileCache();
            cleanupOldCaches();
        }
    }, [isCacheEnabled]);

    // Auto-start preloading and get current location when component mounts
    useEffect(() => {
        // Small delay to ensure the map is loaded first
        const timer = setTimeout(() => {
            preloadVietnamTiles();
            // Auto get current location when page loads
            getCurrentLocation();
        }, 2000);

        return () => clearTimeout(timer);
    }, []); // Empty dependency array means this runs once on mount

    useEffect(() => {
        if (map.current) return; // Initialize map only once

        if (mapContainer.current) {
            map.current = new maplibregl.Map({
                container: mapContainer.current,
                style: {
                    version: 8,
                    sources: {
                        raster_vm: {
                            type: 'raster',
                            tiles: [
                                'https://maps.vietmap.vn/maps/tiles/tm/{z}/{x}/{y}@2x.png?apikey=df5d9a3fffec4d07c7e3710bd0caf8181945d446509a3d42'
                            ],
                            tileSize: 256,
                            attribution: '@2025 Vietmap'
                        }
                    },
                    layers: [
                        {
                            id: 'layer_raster_vm',
                            type: 'raster',
                            source: 'raster_vm',
                            minzoom: 0,
                            maxzoom: 20
                        }
                    ]
                },
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
                new maplibregl.Marker()
                    .setLngLat([e.lngLat.lng, e.lngLat.lat])
                    .addTo(map.current!);
            });
        }

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []); // Empty dependency array - only run once on mount

    // Get current location and reverse geocode to get address
    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { longitude, latitude } = position.coords;
                    setLng(longitude);
                    setLat(latitude);
                    setCurrentAddress('Đang tải địa chỉ...');

                    // Lưu tọa độ đã chọn vào state
                    setSelectedLocation({ lat: latitude, lng: longitude });
                    console.log('Vị trí hiện tại đã chọn:', { lat: latitude, lng: longitude });

                    if (map.current) {
                        map.current.flyTo({
                            center: [longitude, latitude],
                            zoom: 15
                        });

                        // Add marker at current location
                        new maplibregl.Marker({ color: '#1677ff' })
                            .setLngLat([longitude, latitude])
                            .addTo(map.current);

                        // Get address from coordinates using Vietmap API Reverse 3.0
                        try {
                            const response = await fetch(
                                `https://maps.vietmap.vn/api/reverse/v3?apikey=${VIET_MAPS_API_KEY}&lng=${longitude}&lat=${latitude}`
                            );

                            if (response.ok) {
                                const data = await response.json();
                                if (data && data.length > 0) {
                                    const addressInfo = data[0];
                                    setCurrentAddress(addressInfo.display);
                                    setAddressDetails(addressInfo);

                                    // Nếu đang ở tab tìm đường và chưa có điểm xuất phát, tự động đặt vị trí hiện tại làm điểm xuất phát
                                    if (activeTab === 'route' && !startPoint) {
                                        setStartPoint({
                                            lat: latitude,
                                            lng: longitude,
                                            address: addressInfo.display
                                        });
                                        setStartSearchQuery(addressInfo.display);
                                    }
                                } else {
                                    setCurrentAddress('Không tìm thấy địa chỉ');
                                    setAddressDetails(null);
                                }
                            } else {
                                setCurrentAddress('Không thể lấy thông tin địa chỉ');
                                setAddressDetails(null);
                            }
                        } catch (error) {
                            console.error('Error getting address:', error);
                            setCurrentAddress('Lỗi khi lấy địa chỉ');
                            setAddressDetails(null);
                        }
                    }
                },
                (error) => {
                    console.error('Error getting location:', error);
                    setCurrentAddress('Không thể lấy vị trí hiện tại');
                }
            );
        } else {
            console.error('Geolocation is not supported by this browser.');
            setCurrentAddress('Trình duyệt không hỗ trợ định vị');
        }
    };

    // Clear all markers from the map
    const clearMarkers = () => {
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
    };

    // Handle search with place detail
    const handleSelectPlace = async (value: string, option: any) => {
        if (!map.current) return;

        try {
            // Get place detail
            const placeDetail = await getPlaceDetail(option.key);

            if (placeDetail) {
                // Clear previous markers
                clearMarkers();

                // Lưu tọa độ đã chọn vào state
                setSelectedLocation({ lat: placeDetail.lat, lng: placeDetail.lng });
                console.log('Địa điểm đã chọn:', { lat: placeDetail.lat, lng: placeDetail.lng });

                // Add marker for the selected place
                const marker = new maplibregl.Marker({ color: '#1677ff' })
                    .setLngLat([placeDetail.lng, placeDetail.lat])
                    .addTo(map.current);

                markersRef.current.push(marker);

                // Fly to the selected place
                map.current.flyTo({
                    center: [placeDetail.lng, placeDetail.lat],
                    zoom: 16
                });

                // Show success message
                // messageApi.success(`Đã tìm thấy: ${placeDetail.display}`);
            }
        } catch (error) {
            console.error('Error handling place selection:', error);
            // messageApi.error('Không thể tìm thấy thông tin chi tiết của địa điểm');
        }
    };

    // Format distance to show in km or m
    const formatDistance = (distanceInKm: number) => {
        if (distanceInKm < 1) {
            // Nếu nhỏ hơn 1km, hiển thị theo mét
            return `${(distanceInKm * 1000).toFixed(0)} m`;
        } else if (distanceInKm < 10) {
            // Nếu từ 1km đến 10km, hiển thị 2 số thập phân
            return `${distanceInKm.toFixed(2)} km`;
        } else {
            // Nếu lớn hơn 10km, hiển thị 1 số thập phân
            return `${distanceInKm.toFixed(1)} km`;
        }
    };

    // Format search results
    const formatSearchResults = (results: AutocompleteResult[]) => {
        if (results && results.length > 0) {
            return results.map(result => ({
                key: result.ref_id,
                value: result.display,
                label: (
                    <div>
                        <div className="font-medium">{result.name}</div>
                        <div className="text-xs text-gray-500">{result.address}</div>
                        {result.distance && (
                            <div className="text-xs text-blue-500">
                                {formatDistance(result.distance)}
                            </div>
                        )}
                    </div>
                ),
                result: result
            }));
        }
        return [];
    };

    // Log search results for debugging
    const logSearchResults = (query: string, results: any) => {
        console.log(`Search query: "${query}"`, results);
    };

    // Perform search with the given query
    const performSearch = async (value: string) => {
        if (value.length < 2) {
            setOptions([]);
            return;
        }

        try {
            // Use current map center as focus point for better local results
            const focusParam = map.current
                ? `${map.current.getCenter().lat},${map.current.getCenter().lng}`
                : undefined;

            const results = await searchPlaces(value, focusParam);
            // logSearchResults(value, results);
            setOptions(formatSearchResults(results));
        } catch (error) {
            console.error('Error searching places:', error);
            setOptions([]);
        } finally {
            setIsSearching(false);
        }
    };



    // Biến để lưu trữ timeout ID
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Handle search input change
    const handleSearchChange = (value: string) => {
        // Cập nhật giá trị tìm kiếm
        setSearchQuery(value);

        // Nếu giá trị trống, xóa kết quả
        if (!value || value.length < 2) {
            setOptions([]);
            return;
        }

        // Hủy timeout trước đó nếu có
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Đặt trạng thái đang tìm kiếm nếu đủ ký tự
        if (value.length >= 2) {
            setIsSearching(true);
        }

        // Sử dụng giá trị hiện tại của value, không phụ thuộc vào state
        const currentValue = value;

        // Đặt timeout mới để gọi API sau khi người dùng ngừng nhập
        searchTimeoutRef.current = setTimeout(() => {
            // console.log("Timeout triggered for:", currentValue);
            if (currentValue.length >= 2) {
                performSearch(currentValue);
            }
        }, 400); // Đợi 1 giây sau khi người dùng ngừng nhập
    };

    // Handle search when input is complete (Enter key or search button)
    const handleSearchComplete = (value: string) => {
        // Immediately search when user explicitly completes input
        // (pressing Enter or clicking search button)
        if (value.length >= 2) {
            // Hủy timeout đang chờ nếu có
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
                searchTimeoutRef.current = null;
            }

            // Perform search immediately only for explicit user actions
            setIsSearching(true);
            performSearch(value);
        }
    };

    // Format time from milliseconds to minutes and seconds
    const formatTime = (milliseconds: number) => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        if (hours > 0) {
            return `${hours} giờ ${minutes} phút`;
        } else {
            return `${minutes} phút`;
        }
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

    // Find route between two points
    const findRouteBetweenPoints = async () => {
        if (!startPoint || !endPoint) {
            messageApi.error('Vui lòng chọn điểm xuất phát và điểm đến');
            return;
        }

        setIsRouteFinding(true);
        clearRoute();

        try {
            const points: [number, number][] = [
                [startPoint.lat, startPoint.lng],
                [endPoint.lat, endPoint.lng]
            ];

            const result = await findRoute(points, selectedVehicle);

            if (result && result.paths && result.paths.length > 0) {
                setRouteResult(result);

                // Decode polyline and draw route on map
                const path = result.paths[0];
                const decodedPoints = decodePolyline(path.points);

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
                    const bounds = path.bbox;
                    map.current.fitBounds([
                        [bounds[0], bounds[1]], // Southwest corner [lng, lat]
                        [bounds[2], bounds[3]]  // Northeast corner [lng, lat]
                    ], { padding: 50 });
                }

                messageApi.success('Đã tìm thấy đường đi');
            } else {
                messageApi.error('Không tìm thấy đường đi phù hợp');
            }
        } catch (error) {
            console.error('Error finding route:', error);
            messageApi.error('Lỗi khi tìm đường đi');
        } finally {
            setIsRouteFinding(false);
        }
    };

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
                    lat: placeDetail.lat,
                    lng: placeDetail.lng,
                    address: placeDetail.display
                });

                // Clear any existing route when changing start/end points
                clearRoute();
            }
        } catch (error) {
            console.error('Error handling start place selection:', error);
            messageApi.error('Không thể tìm thấy thông tin chi tiết của địa điểm');
        }
    };

    // Handle selection of end point
    const handleSelectEndPlace = async (value: string, option: any) => {
        if (!map.current) return;

        try {
            const placeDetail = await getPlaceDetail(option.key);

            if (placeDetail) {
                setEndPoint({
                    lat: placeDetail.lat,
                    lng: placeDetail.lng,
                    address: placeDetail.display
                });

                // Clear any existing route when changing start/end points
                clearRoute();
            }
        } catch (error) {
            console.error('Error handling end place selection:', error);
            messageApi.error('Không thể tìm thấy thông tin chi tiết của địa điểm');
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

    // Get vehicle icon based on selected vehicle
    const getVehicleIcon = () => {
        switch (selectedVehicle) {
            case 'car':
                return <CarOutlined />;
            case 'foot':
                return <EnvironmentOutlined />;
            case 'bike':
            case 'motorcycle':
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

    // Navigation states
    const [isNavigating, setIsNavigating] = useState<boolean>(false);
    const [remainingDistance, setRemainingDistance] = useState<number>(0);
    const [remainingTime, setRemainingTime] = useState<number>(0);
    const [currentInstructionIndex, setCurrentInstructionIndex] = useState<number>(0);
    const [nextTurnDistance, setNextTurnDistance] = useState<number>(0);
    const [showNavigationModal, setShowNavigationModal] = useState<boolean>(false);
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

    // UI states
    const [isNavigationPanelCollapsed, setIsNavigationPanelCollapsed] = useState<boolean>(false);
    const [showTripSummary, setShowTripSummary] = useState<boolean>(false);
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

    // Clear navigation when component unmounts
    useEffect(() => {
        return () => {
            if (watchPositionRef.current !== null) {
                navigator.geolocation.clearWatch(watchPositionRef.current);
                watchPositionRef.current = null;
            }
        };
    }, []);

    // Clear simulation when component unmounts
    useEffect(() => {
        return () => {
            if (simulationIntervalRef.current !== null) {
                window.clearInterval(simulationIntervalRef.current);
                simulationIntervalRef.current = null;
            }
        };
    }, []);

    // Calculate distance between two points using Haversine formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
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
        );

        // Add distances between remaining points on route
        for (let i = closestPointIndex; i < routePoints.length - 1; i++) {
            remainingDistance += calculateDistance(
                routePoints[i][1], routePoints[i][0],
                routePoints[i + 1][1], routePoints[i + 1][0]
            );
        }

        return remainingDistance;
    };

    // Find the current instruction based on the closest point
    const findCurrentInstruction = (closestPointIndex: number, instructions: RouteInstruction[]): number => {
        for (let i = 0; i < instructions.length; i++) {
            const instruction = instructions[i];
            const [start, end] = instruction.interval;

            if (closestPointIndex >= start && closestPointIndex <= end) {
                return i;
            }

            // If we've passed this instruction's end point
            if (closestPointIndex > end) {
                // Return the next instruction if available
                if (i < instructions.length - 1) {
                    continue;
                }
            }
        }

        // If no match found, return the last instruction
        return instructions.length - 1;
    };

    // Calculate distance to the next turn
    const calculateDistanceToNextTurn = (currentPosition: [number, number], routePoints: [number, number][], closestPointIndex: number, instructions: RouteInstruction[], currentInstructionIndex: number): number => {
        if (currentInstructionIndex >= instructions.length - 1) {
            // If we're on the last instruction, return distance to destination
            return calculateRemainingDistance(currentPosition, routePoints, closestPointIndex);
        }

        const nextInstruction = instructions[currentInstructionIndex + 1];
        const nextTurnPointIndex = nextInstruction.interval[0];

        let distanceToNextTurn = 0;

        // Add distance from current position to closest point on route
        distanceToNextTurn += calculateDistance(
            currentPosition[1], currentPosition[0],
            routePoints[closestPointIndex][1], routePoints[closestPointIndex][0]
        );

        // Add distances between points on route until next turn
        for (let i = closestPointIndex; i < nextTurnPointIndex; i++) {
            distanceToNextTurn += calculateDistance(
                routePoints[i][1], routePoints[i][0],
                routePoints[i + 1][1], routePoints[i + 1][0]
            );
        }

        return distanceToNextTurn;
    };

    // Start navigation (modified to include simulation option)
    const startNavigation = () => {
        if (!routeResult || !routeResult.paths || routeResult.paths.length === 0) {
            messageApi.error('Không có đường đi để bắt đầu dẫn đường');
            return;
        }

        // If simulation is enabled, start simulation instead of real navigation
        if (isSimulating) {
            stopSimulation();
            return;
        }

        // Original navigation code
        setIsNavigating(true);
        setShowNavigationModal(true);
        setShowTripSummary(false);

        // Record start time for trip summary
        setTripSummary(prev => ({
            ...prev,
            startTime: Date.now(),
            totalDistance: routeResult.paths[0].distance / 1000,
            totalTime: routeResult.paths[0].time
        }));

        // Initial values
        const path = routeResult.paths[0];
        const routePoints = decodePolyline(path.points);
        setRemainingDistance(path.distance / 1000); // Convert to km
        setRemainingTime(path.time);
        setCurrentInstructionIndex(0);

        // If there's a first instruction, set next turn distance
        if (path.instructions && path.instructions.length > 0) {
            setNextTurnDistance(path.instructions[0].distance / 1000); // Convert to km
        }

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
                    const routePoints = decodePolyline(routeResult.paths[0].points);
                    const closestPointIndex = findClosestPointOnRoute(currentPosition, routePoints);
                    const remainingDist = calculateRemainingDistance(currentPosition, routePoints, closestPointIndex);

                    // Update remaining distance and time
                    setRemainingDistance(remainingDist);

                    // Calculate progress percentage
                    const totalDistance = routeResult.paths[0].distance / 1000; // in km
                    const progress = 1 - (remainingDist / totalDistance);
                    navigationProgressRef.current = progress;

                    // Update remaining time based on progress
                    const remainingTimeEstimate = routeResult.paths[0].time * (1 - progress);
                    setRemainingTime(remainingTimeEstimate);

                    // Find current instruction
                    if (routeResult.paths[0].instructions && routeResult.paths[0].instructions.length > 0) {
                        const newInstructionIndex = findCurrentInstruction(
                            closestPointIndex,
                            routeResult.paths[0].instructions
                        );

                        if (newInstructionIndex !== currentInstructionIndex) {
                            setCurrentInstructionIndex(newInstructionIndex);
                        }

                        // Calculate distance to next turn
                        const distanceToNextTurn = calculateDistanceToNextTurn(
                            currentPosition,
                            routePoints,
                            closestPointIndex,
                            routeResult.paths[0].instructions,
                            newInstructionIndex
                        );

                        setNextTurnDistance(distanceToNextTurn);
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

    // Stop navigation (modified to handle simulation)
    const stopNavigation = () => {
        // Record end time and calculate trip stats
        const endTime = Date.now();
        const startTime = tripSummary.startTime || endTime;
        const actualTime = endTime - startTime;
        const averageSpeed = tripSummary.totalDistance / (actualTime / 3600000); // km/h

        setTripSummary(prev => ({
            ...prev,
            endTime: endTime,
            averageSpeed: isSimulating ? prev.totalDistance / (prev.totalTime / 3600000) : averageSpeed
        }));

        // If simulation is running, stop it
        if (isSimulating) {
            stopSimulation();
        } else {
            // Original stop navigation code
            if (watchPositionRef.current !== null) {
                navigator.geolocation.clearWatch(watchPositionRef.current);
                watchPositionRef.current = null;
            }

            // Remove user location marker
            if (userLocationMarkerRef.current) {
                userLocationMarkerRef.current.remove();
                userLocationMarkerRef.current = null;
            }
        }

        // Reset map view
        if (map.current) {
            map.current.setPitch(0);
            map.current.setBearing(0);

            // Fit map to route bounds if route exists
            if (routeResult && routeResult.paths && routeResult.paths.length > 0) {
                const bounds = routeResult.paths[0].bbox;
                map.current.fitBounds([
                    [bounds[0], bounds[1]], // Southwest corner [lng, lat]
                    [bounds[2], bounds[3]]  // Northeast corner [lng, lat]
                ], { padding: 50 });
            }
        }

        setIsNavigating(false);
        setShowNavigationModal(false);
        setShowTripSummary(true);

        // Show success message
        messageApi.success('Hành trình đã kết thúc');
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

    // Start simulation
    const startSimulation = () => {
        if (!routeResult || !routeResult.paths || routeResult.paths.length === 0) {
            messageApi.error('Không có đường đi để bắt đầu mô phỏng');
            return;
        }

        setIsSimulating(true);
        setIsNavigating(true);
        setShowNavigationModal(true);
        setShowTripSummary(false);

        // Record start time for trip summary
        setTripSummary(prev => ({
            ...prev,
            startTime: Date.now(),
            totalDistance: routeResult.paths[0].distance / 1000,
            totalTime: routeResult.paths[0].time
        }));

        // Initial values
        const path = routeResult.paths[0];
        const routePoints = decodePolyline(path.points);
        simulationRoutePointsRef.current = routePoints;
        simulationCurrentPointIndexRef.current = 0;

        setRemainingDistance(path.distance / 1000); // Convert to km
        setRemainingTime(path.time);
        setCurrentInstructionIndex(0);

        // If there's a first instruction, set next turn distance
        if (path.instructions && path.instructions.length > 0) {
            setNextTurnDistance(path.instructions[0].distance / 1000); // Convert to km
        }

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
            messageApi.success('Mô phỏng hoàn tất! Đã đến điểm đến.');
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
            );
        }

        setRemainingDistance(remainingDist);

        // Calculate progress percentage
        const totalDistance = routeResult!.paths[0].distance / 1000; // in km
        const progress = 1 - (remainingDist / totalDistance);
        navigationProgressRef.current = progress;

        // Update remaining time based on progress
        const remainingTimeEstimate = routeResult!.paths[0].time * (1 - progress);
        setRemainingTime(remainingTimeEstimate);

        // Find current instruction
        if (routeResult!.paths[0].instructions && routeResult!.paths[0].instructions.length > 0) {
            const newInstructionIndex = findCurrentInstruction(
                nextIndex,
                routeResult!.paths[0].instructions
            );

            if (newInstructionIndex !== currentInstructionIndex) {
                setCurrentInstructionIndex(newInstructionIndex);
            }

            // Calculate distance to next turn
            if (newInstructionIndex < routeResult!.paths[0].instructions.length - 1) {
                const nextInstruction = routeResult!.paths[0].instructions[newInstructionIndex + 1];
                const nextTurnPointIndex = nextInstruction.interval[0];

                let distToNextTurn = 0;
                for (let i = nextIndex; i < nextTurnPointIndex; i++) {
                    distToNextTurn += calculateDistance(
                        routePoints[i][1], routePoints[i][0],
                        routePoints[i + 1][1], routePoints[i + 1][0]
                    );
                }

                setNextTurnDistance(distToNextTurn);
            }
        }
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

    // Toggle navigation panel collapse
    const toggleNavigationPanel = () => {
        setIsNavigationPanelCollapsed(!isNavigationPanelCollapsed);
    };

    // Reset trip and start a new one
    const resetTrip = () => {
        clearRoute();
        setShowTripSummary(false);
        setTripSummary({
            startTime: null,
            endTime: null,
            totalDistance: 0,
            totalTime: 0,
            averageSpeed: 0
        });
        setActiveTab('route');
    };

    // Start the same route again
    const startSameRouteAgain = () => {
        setShowTripSummary(false);
        startNavigation();
    };

    // Handle vehicle change
    const handleVehicleChange = (vehicle: 'car' | 'bike' | 'foot' | 'motorcycle') => {
        setSelectedVehicle(vehicle);
        // Clear existing route when changing vehicle
        clearRoute();
    };

    return (
        <div className="h-screen w-full relative">
            {contextHolder}
            <div ref={mapContainer} className="h-full w-full" />

            {/* Control panel - Hidden when navigating */}
            {!isNavigating && (
                <Card className="absolute top-4 left-4 shadow-lg z-10 w-1/3 bg-white/90 backdrop-blur-sm">
                    <Title level={4}>Bản đồ VietMap</Title>

                    {/* Trip summary display */}
                    {showTripSummary && (
                        <div className="mb-4">
                            <TripSummary
                                totalDistance={tripSummary.totalDistance}
                                totalTime={tripSummary.totalTime}
                                averageSpeed={tripSummary.averageSpeed}
                                formatDistance={formatDistance}
                                formatTime={formatTime}
                                resetTrip={resetTrip}
                                startSameRouteAgain={startSameRouteAgain}
                            />
                        </div>
                    )}

                    <Tabs activeKey={activeTab} onChange={handleTabChange}>
                        <TabPane tab="Tìm kiếm" key="search">
                            <SearchPanel
                                currentAddress={currentAddress}
                                addressDetails={addressDetails}
                                searchQuery={searchQuery}
                                options={options}
                                isSearching={isSearching}
                                formatDistance={formatDistance}
                                handleSearchChange={handleSearchChange}
                                handleSearchComplete={handleSearchComplete}
                                handleSelectPlace={handleSelectPlace}
                                getCurrentLocation={getCurrentLocation}
                            />
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
                                formatDistance={formatDistance}
                                formatTime={formatTime}
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
                    formatDistance={formatDistance}
                    formatTime={formatTime}
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

export default VietMapPage; 