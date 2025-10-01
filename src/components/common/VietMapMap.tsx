import React, { useEffect, useRef, useState } from 'react';
import { Spin } from 'antd';
import type { MapLocation } from '@/models/Map';
import vietmapService from '@/services/map/vietmapService';
import type { RouteSegment } from '@/models/RoutePoint';
import type { VietMapAutocompleteResult } from '@/models/VietMap';

// Định nghĩa interface cho window để thêm vietmapgl
declare global {
    interface Window {
        vietmapgl?: any;
    }
}

interface VietMapMapProps {
    mapLocation: MapLocation | null;
    onLocationChange: (location: MapLocation) => void;
    markers?: MapLocation[];
    showRouteLines?: boolean;
    routeSegments?: RouteSegment[];
}

// Khóa cho cache trong localStorage
const VIETMAP_STYLE_CACHE_KEY = 'vietmap_style_cache';
// Thời gian cache (1 tuần tính bằng milliseconds)
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

const VietMapMap: React.FC<VietMapMapProps> = ({
    mapLocation,
    onLocationChange,
    markers = [],
    showRouteLines = false,
    routeSegments = []
}) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const routeLayersRef = useRef<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapStyle, setMapStyle] = useState<any>(null);

    // Lấy style từ vietmapService hoặc từ cache
    useEffect(() => {
        const fetchMapStyle = async () => {
            try {
                // Kiểm tra cache trong localStorage
                const cachedData = localStorage.getItem(VIETMAP_STYLE_CACHE_KEY);

                if (cachedData) {
                    try {
                        const { style, timestamp } = JSON.parse(cachedData);
                        const now = Date.now();

                        // Kiểm tra xem cache có còn hiệu lực không (chưa quá 1 tuần)
                        if (style && timestamp && (now - timestamp < CACHE_DURATION)) {
                            console.log('Using cached VietMap style from localStorage');
                            setMapStyle(style);
                            return;
                        } else {
                            console.log('Cached VietMap style expired, fetching new data');
                        }
                    } catch (parseError) {
                        console.error('Error parsing cached VietMap style:', parseError);
                    }
                }

                // Nếu không có cache hoặc cache hết hạn, gọi API
                const style = await vietmapService.getMapStyles();
                if (style) {
                    // Lưu style vào state
                    setMapStyle(style);

                    // Lưu style và timestamp vào localStorage
                    const cacheData = {
                        style,
                        timestamp: Date.now()
                    };
                    localStorage.setItem(VIETMAP_STYLE_CACHE_KEY, JSON.stringify(cacheData));

                    console.log('Fetched and cached new VietMap style in localStorage');
                } else {
                    console.error('Failed to fetch map style from vietmapService');
                }
            } catch (error) {
                console.error('Error fetching map style:', error);
            }
        };

        fetchMapStyle();
    }, []);

    // Khởi tạo bản đồ
    useEffect(() => {
        if (!mapContainerRef.current || !mapStyle) return;

        // Kiểm tra xem script đã được tải chưa
        const existingScript = document.getElementById('vietmap-script');
        if (!existingScript) {
            // Tải script
            const script = document.createElement('script');
            script.id = 'vietmap-script';
            script.src = 'https://unpkg.com/@vietmap/vietmap-gl-js@6.0.0/dist/vietmap-gl.js';
            script.async = true;
            script.onload = initializeMap;

            // Tải CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/@vietmap/vietmap-gl-js@6.0.0/dist/vietmap-gl.css';

            document.head.appendChild(link);
            document.body.appendChild(script);
        } else {
            // Nếu script đã tải, khởi tạo bản đồ
            initializeMap();
        }

        return () => {
            // Dọn dẹp khi component unmount
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [mapStyle]);

    // Khởi tạo bản đồ
    const initializeMap = () => {
        if (!window.vietmapgl || !mapContainerRef.current || !mapStyle) {
            console.error('VietMap GL JS is not loaded or map style is not available');
            setLoading(false);
            return;
        }

        try {
            // Tạo bản đồ mới sử dụng style từ service
            const map = new window.vietmapgl.Map({
                container: mapContainerRef.current,
                style: mapStyle, // Sử dụng style từ service hoặc từ cache
                center: [106.675, 10.759], // Mặc định là TP.HCM
                zoom: 15,
                attributionControl: false
            });

            // Thêm controls
            map.addControl(new window.vietmapgl.NavigationControl(), 'top-right');
            map.addControl(new window.vietmapgl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true
                },
                trackUserLocation: true
            }));

            // Tạo marker chính
            const marker = new window.vietmapgl.Marker({
                draggable: true
            });

            // Xử lý khi marker được kéo
            marker.on('dragend', () => {
                const lngLat = marker.getLngLat();
                const newLocation: MapLocation = {
                    lat: lngLat.lat,
                    lng: lngLat.lng,
                    address: mapLocation?.address || ''
                };
                onLocationChange(newLocation);
            });

            // Xử lý khi click vào bản đồ
            map.on('click', (e: any) => {
                const { lng, lat } = e.lngLat;

                // Reverse geocoding để lấy địa chỉ
                vietmapService.reverseGeocode(lat, lng)
                    .then(results => {
                        let address = '';
                        if (results && results.length > 0) {
                            const result = results[0];
                            address = result.address || '';
                        }

                        // Cập nhật vị trí marker
                        marker.setLngLat([lng, lat]).addTo(map);

                        const newLocation: MapLocation = {
                            lat: lat,
                            lng: lng,
                            address: address
                        };
                        onLocationChange(newLocation);
                    })
                    .catch(error => {
                        console.error('Error in reverse geocoding:', error);
                        marker.setLngLat([lng, lat]).addTo(map);

                        const newLocation: MapLocation = {
                            lat: lat,
                            lng: lng,
                            address: ''
                        };
                        onLocationChange(newLocation);
                    });
            });

            // Lưu tham chiếu
            mapRef.current = map;
            markerRef.current = marker;

            // Đánh dấu bản đồ đã tải xong
            map.on('load', () => {
                setMapLoaded(true);
                setLoading(false);
            });
        } catch (error) {
            console.error('Error initializing VietMap:', error);
            setLoading(false);
        }
    };

    // Cập nhật vị trí marker chính khi mapLocation thay đổi
    useEffect(() => {
        if (!mapRef.current || !markerRef.current || !mapLocation || !mapLoaded) return;

        const { lat, lng } = mapLocation;

        // Cập nhật vị trí marker
        markerRef.current.setLngLat([lng, lat]).addTo(mapRef.current);

        // Cập nhật center của bản đồ
        mapRef.current.flyTo({
            center: [lng, lat],
            zoom: 15,
            essential: true
        });
    }, [mapLocation, mapLoaded]);

    // Hiển thị tất cả markers
    useEffect(() => {
        if (!mapRef.current || !mapLoaded || markers.length === 0) return;

        // Xóa các markers cũ
        markersRef.current.forEach(marker => {
            if (marker) marker.remove();
        });
        markersRef.current = [];

        // Tạo bounds để fit map
        const bounds = new window.vietmapgl.LngLatBounds();

        // Thêm markers mới
        markers.forEach(location => {
            // Tạo phần tử HTML cho marker
            const el = document.createElement('div');
            el.className = 'marker';
            el.style.width = '30px';
            el.style.height = '30px';
            el.style.borderRadius = '50%';

            // Set color based on point type
            let color = '#1677ff'; // Default blue
            if (location.type === 'carrier') {
                color = '#52c41a'; // Green for carrier
            } else if (location.type === 'pickup') {
                color = '#faad14'; // Yellow for pickup
            } else if (location.type === 'delivery') {
                color = '#f5222d'; // Red for delivery
            }

            el.style.backgroundColor = color;
            el.style.border = '2px solid white';
            el.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)';
            el.style.cursor = 'pointer';

            // Tạo popup
            const popup = new window.vietmapgl.Popup({ offset: 25 })
                .setHTML(`<strong>${location.name || 'Vị trí'}</strong><br>${location.address || ''}`);

            // Tạo marker
            const marker = new window.vietmapgl.Marker(el)
                .setLngLat([location.lng, location.lat])
                .setPopup(popup)
                .addTo(mapRef.current);

            // Thêm vào mảng markers
            markersRef.current.push(marker);

            // Mở rộng bounds
            bounds.extend([location.lng, location.lat]);
        });

        // Fit map to bounds
        if (markers.length > 1) {
            mapRef.current.fitBounds(bounds, { padding: 100 });
        }
    }, [markers, mapLoaded]);

    // Hiển thị route lines
    useEffect(() => {
        if (!mapRef.current || !mapLoaded || !showRouteLines || routeSegments.length === 0) return;

        // Xóa các route layers cũ
        routeLayersRef.current.forEach(id => {
            if (mapRef.current.getLayer(id)) {
                mapRef.current.removeLayer(id);
            }
            if (mapRef.current.getSource(id)) {
                mapRef.current.removeSource(id);
            }
        });
        routeLayersRef.current = [];

        // Thêm route layers mới
        routeSegments.forEach((segment, index) => {
            const sourceId = `route-source-${index}`;
            const layerId = `route-layer-${index}`;

            // Thêm source
            mapRef.current.addSource(sourceId, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: segment.path
                    }
                }
            });

            // Thêm layer
            mapRef.current.addLayer({
                id: layerId,
                type: 'line',
                source: sourceId,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#1677ff',
                    'line-width': 6,
                    'line-opacity': 0.8
                }
            });

            // Lưu ID để dọn dẹp sau này
            routeLayersRef.current.push(sourceId);
            routeLayersRef.current.push(layerId);
        });
    }, [routeSegments, showRouteLines, mapLoaded]);

    return (
        <div className="relative h-full w-full">
            <div ref={mapContainerRef} className="h-full w-full" />
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70">
                    <Spin tip="Đang tải bản đồ..." />
                </div>
            )}
        </div>
    );
};

export default VietMapMap; 