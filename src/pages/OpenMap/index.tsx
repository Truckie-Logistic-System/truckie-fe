import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button, Card, Space, Typography, Spin, AutoComplete, Divider, Tag } from 'antd';
import { SearchOutlined, AimOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { OPEN_MAP_API_KEY } from '../../config/env';
import { searchPlaces, getPlaceDetail, getReverseGeocode } from '../../services/openmap.service';
import type { AutocompleteResult } from '../../services/openmap.service';

const { Title, Text } = Typography;

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

    // Get current location and reverse geocode to get address
    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { longitude, latitude } = position.coords;
                    setLng(longitude);
                    setLat(latitude);
                    setCurrentAddress('Đang tải địa chỉ...');
                    setIsLoadingAddress(true);

                    // Lưu tọa độ đã chọn vào state
                    setSelectedLocation({ lat: latitude, lng: longitude });
                    console.log('Vị trí hiện tại đã chọn:', { lat: latitude, lng: longitude });

                    if (map.current) {
                        map.current.flyTo({
                            center: [longitude, latitude],
                            zoom: 15
                        });

                        // Clear previous markers
                        clearMarkers();

                        // Add marker at current location
                        const marker = new maplibregl.Marker({ color: '#1677ff' })
                            .setLngLat([longitude, latitude])
                            .addTo(map.current);
                        markersRef.current.push(marker);

                        // Get address from coordinates
                        getReverseGeocodeFromCoordinates(longitude, latitude);
                    }
                },
                (error) => {
                    console.error('Error getting location:', error);
                    setCurrentAddress('Không thể lấy vị trí hiện tại');
                    setIsLoadingAddress(false);
                }
            );
        } else {
            console.error('Geolocation is not supported by this browser.');
            setCurrentAddress('Trình duyệt không hỗ trợ định vị');
        }
    };

    // Get address from coordinates using reverse geocoding
    const getReverseGeocodeFromCoordinates = async (lng: number, lat: number) => {
        try {
            setIsLoadingAddress(true);
            const addressInfo = await getReverseGeocode(lng, lat);

            if (addressInfo) {
                setCurrentAddress(addressInfo.display);
                setAddressDetails(addressInfo);
            } else {
                setCurrentAddress('Không tìm thấy địa chỉ');
                setAddressDetails(null);
            }
        } catch (error) {
            console.error('Error getting address:', error);
            setCurrentAddress('Lỗi khi lấy địa chỉ');
            setAddressDetails(null);
        } finally {
            setIsLoadingAddress(false);
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
            setIsLoadingAddress(true);
            // Get place detail
            const placeDetail = await getPlaceDetail(option.key);

            if (placeDetail && placeDetail.geometry && placeDetail.geometry.location) {
                // Clear previous markers
                clearMarkers();

                const { lat, lng } = placeDetail.geometry.location;

                // Lưu tọa độ đã chọn vào state
                setSelectedLocation({ lat, lng });
                console.log('Địa điểm đã chọn:', { lat, lng });

                // Add marker for the selected place
                const marker = new maplibregl.Marker({ color: '#1677ff' })
                    .setLngLat([lng, lat])
                    .addTo(map.current);

                markersRef.current.push(marker);

                // Fly to the selected place
                map.current.flyTo({
                    center: [lng, lat],
                    zoom: 16
                });

                // Update address information
                setCurrentAddress(placeDetail.formatted_address);
                setAddressDetails({
                    display: placeDetail.formatted_address,
                    name: placeDetail.name,
                    address: placeDetail.formatted_address,
                    components: placeDetail.address_components,
                    place_id: placeDetail.place_id,
                    types: placeDetail.types
                });
            }
        } catch (error) {
            console.error('Error handling place selection:', error);
        } finally {
            setIsLoadingAddress(false);
        }
    };

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
                                {formatDistance(result.distance_meters / 1000)}
                            </div>
                        )}
                    </div>
                ),
                result: result
            }));
        }
        return [];
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
            setOptions(formatSearchResults(results));
        } catch (error) {
            console.error('Error searching places:', error);
            setOptions([]);
        } finally {
            setIsSearching(false);
        }
    };

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
            if (currentValue.length >= 2) {
                performSearch(currentValue);
            }
        }, 400); // Đợi 400ms sau khi người dùng ngừng nhập
    };

    // Handle search when input is complete (Enter key or search button)
    const handleSearchComplete = (value: string) => {
        // Immediately search when user explicitly completes input
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

    return (
        <div className="h-screen w-full relative">
            <div ref={mapContainer} className="h-full w-full" />

            {/* Control panel */}
            <Card className="absolute top-4 left-4 shadow-lg z-10 w-1/3 bg-white/90 backdrop-blur-sm">
                <Title level={4}>Bản đồ OpenMap</Title>
                <Space direction="vertical" className="w-full">
                    <div>
                        <div className="text-sm text-gray-600 mb-1">Tọa độ hiện tại:</div>
                        <div>
                            <span className="font-medium">Kinh độ:</span> {lng} | <span className="font-medium">Vĩ độ:</span> {lat}
                        </div>
                        <div>
                            <span className="font-medium">Mức độ phóng to:</span> {zoom}x
                        </div>

                        {/* Hiển thị địa chỉ hiện tại */}
                        <Divider className="my-2" />
                        <div className="text-sm text-gray-600 mb-1">
                            <Space>
                                <EnvironmentOutlined />
                                <span>Địa chỉ hiện tại:</span>
                                {isLoadingAddress && <Spin size="small" />}
                            </Space>
                        </div>

                        {currentAddress && !isLoadingAddress ? (
                            <div className="mt-2">
                                <div className="text-sm break-words font-medium">{currentAddress}</div>

                                {/* Hiển thị thông tin chi tiết về địa điểm */}
                                {addressDetails && (
                                    <div className="mt-2">
                                        {addressDetails.name && addressDetails.name !== addressDetails.address && (
                                            <div className="font-medium text-blue-600 mb-1">{addressDetails.name}</div>
                                        )}

                                        {/* Hiển thị loại địa điểm nếu có */}
                                        {addressDetails.types && renderPlaceTypes(addressDetails.types)}
                                    </div>
                                )}
                            </div>
                        ) : !isLoadingAddress ? (
                            <div className="text-sm text-gray-500">Chưa có thông tin địa chỉ</div>
                        ) : null}
                    </div>

                    <Divider className="my-2" />

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
                </Space>
            </Card>
        </div>
    );
};

export default OpenMapPage; 