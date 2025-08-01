import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button, Card, Input, Space, Typography, Progress, message, AutoComplete, Spin } from 'antd';
import { SearchOutlined, AimOutlined, EnvironmentOutlined, CloudDownloadOutlined } from '@ant-design/icons';
import { VIET_MAPS_API_KEY } from '../../config/env';
import { searchPlaces, getPlaceDetail } from '../../services/vietmap.service';
import type { AutocompleteResult } from '../../services/vietmap.service';


const { Title } = Typography;

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

    return (
        <div className="h-screen w-full relative">
            {contextHolder}
            <div ref={mapContainer} className="h-full w-full" />

            {/* Control panel */}
            <Card className="absolute top-4 left-4 shadow-lg z-10 w-1/3 bg-white/90 backdrop-blur-sm">
                <Title level={4}>Bản đồ VietMap</Title>
                <Space direction="vertical" className="w-full">
                    <div>
                        <div className="text-sm text-gray-600 mb-1">Tọa độ hiện tại:</div>
                        <div>
                            <span className="font-medium">Kinh độ:</span> {lng} | <span className="font-medium">Vĩ độ:</span> {lat}
                        </div>
                        <div>
                            <span className="font-medium">Mức độ phóng to:</span> {zoom}x
                        </div>
                        {currentAddress && (
                            <div className="mt-2 border-t pt-2">
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

                                            {addressDetails.boundaries && addressDetails.boundaries.map((boundary: any, index: number) => (
                                                <React.Fragment key={index}>
                                                    <div className="text-gray-600">{boundary.prefix}:</div>
                                                    <div>{boundary.name}</div>
                                                </React.Fragment>
                                            ))}

                                            {addressDetails.distance && (
                                                <>
                                                    <div className="text-gray-600">Khoảng cách:</div>
                                                    <div>{formatDistance(addressDetails.distance)}</div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="relative w-full">
                        <AutoComplete
                            className="w-full"
                            options={options}
                            onSelect={handleSelectPlace}
                            onSearch={handleSearchChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearchComplete(searchQuery);
                                }
                            }}
                            value={searchQuery}
                            placeholder="Tìm kiếm địa điểm"
                            notFoundContent={isSearching ? <Spin size="small" /> : (searchQuery.length >= 2 ? "Không tìm thấy kết quả" : null)}
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

                    {/* {isPreloading && (
                        <div>
                            <div className="text-sm mb-1">Đang tải bản đồ Việt Nam: {preloadProgress}%</div>
                            <Progress percent={preloadProgress} status="active" />
                        </div>
                    )} */}
                </Space>
            </Card>
        </div>
    );
};

export default VietMapPage; 