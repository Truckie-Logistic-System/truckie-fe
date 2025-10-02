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
    animateRoute?: boolean;
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
    routeSegments = [],
    animateRoute = true
}) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    // Xóa markerRef vì không cần thiết nữa
    const markersRef = useRef<any[]>([]);
    const routeLayersRef = useRef<string[]>([]);
    const animationRef = useRef<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapStyle, setMapStyle] = useState<any>(null);
    const [isAnimating, setIsAnimating] = useState(false);

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
                // Xóa tất cả layers và sources trước khi xóa map
                try {
                    cleanupLayers();
                } catch (error) {
                    console.error('Error cleaning up layers:', error);
                }

                mapRef.current.remove();
                mapRef.current = null;
            }

            // Hủy animation nếu đang chạy
            if (animationRef.current !== null) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
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
                zoom: 13,
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

            // Không cần tạo marker chính nữa
            // Xử lý khi click vào bản đồ
            map.on('click', (e: any) => {
                const { lng, lat } = e.lngLat;
                // console.log(`Map clicked at [${lng}, ${lat}]`);

                // Reverse geocoding để lấy địa chỉ
                vietmapService.reverseGeocode(lat, lng)
                    .then(results => {
                        let address = '';
                        if (results && results.length > 0) {
                            const result = results[0];
                            address = result.address || '';
                        }

                        // console.log(`Found address: "${address}" for location [${lat}, ${lng}]`);

                        // Không cần cập nhật marker chính, chỉ gửi vị trí mới
                        const newLocation: MapLocation = {
                            lat: lat,
                            lng: lng,
                            address: address
                        };
                        onLocationChange(newLocation);
                    })
                    .catch(error => {
                        console.error('Error in reverse geocoding:', error);

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
            // Không cần lưu tham chiếu marker chính nữa
            // markerRef.current = marker;

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

    // Cập nhật center của bản đồ khi mapLocation thay đổi
    useEffect(() => {
        if (!mapRef.current || !mapLoaded || !mapLocation) return;

        const { lat, lng } = mapLocation;

        // Cập nhật center của bản đồ
        mapRef.current.flyTo({
            center: [lng, lat],
            zoom: 13,
            essential: true
        });
    }, [mapLocation, mapLoaded]);

    // Hiển thị tất cả markers
    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return;

        // console.log("Updating markers with length:", markers.length);

        try {
            // Xóa tất cả markers cũ khỏi map
            const markersToRemove = [...markersRef.current];
            markersRef.current = [];

            // Xóa tất cả markers cũ khỏi map
            markersToRemove.forEach(marker => {
                if (marker) {
                    // console.log("Removing marker from map");
                    marker.remove();
                }
            });

            // Xóa trực tiếp tất cả các phần tử DOM có class 'marker'
            const mapContainer = mapRef.current.getContainer();
            if (mapContainer) {
                const markerElements = mapContainer.querySelectorAll('.marker');
                markerElements.forEach((el: Element) => {
                    if (el && el.parentNode) {
                        el.parentNode.removeChild(el);
                    }
                });
            }

            // Xóa trực tiếp các phần tử marker từ DOM
            document.querySelectorAll('.mapboxgl-marker, .vietmapgl-marker').forEach((el: Element) => {
                if (el && el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            });

            // Nếu không có markers mới, dừng lại
            if (!markers || markers.length === 0) {
                // console.log("No markers to add");
                return;
            }

            // console.log(`Adding ${markers.length} new markers`);

            // Tạo bounds để fit map
            const bounds = new window.vietmapgl.LngLatBounds();

            // Thêm markers mới
            markers.forEach((location, index) => {
                // Tạo phần tử HTML cho marker
                const el = document.createElement('div');
                el.className = 'marker';
                el.style.width = '30px';
                el.style.height = '30px';
                el.style.borderRadius = '50%';

                // Lưu id của marker vào element để có thể tìm lại sau này
                if (location.id) {
                    el.setAttribute('data-marker-id', location.id);
                }

                // Set color based on point type
                let color = '#1677ff'; // Default blue
                if (location.type === 'carrier') {
                    if (location.name?.startsWith('Quay về')) {
                        color = '#52c41a'; // Green for return carrier
                    } else {
                        color = '#52c41a'; // Green for carrier
                    }
                } else if (location.type === 'pickup') {
                    color = '#faad14'; // Yellow for pickup
                } else if (location.type === 'delivery') {
                    color = '#f5222d'; // Red for delivery
                }

                el.style.backgroundColor = color;
                el.style.border = '2px solid white';
                el.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)';
                el.style.cursor = 'pointer';

                // Thêm text để dễ nhận diện
                const textEl = document.createElement('div');
                textEl.style.position = 'absolute';
                textEl.style.top = '50%';
                textEl.style.left = '50%';
                textEl.style.transform = 'translate(-50%, -50%)';
                textEl.style.color = 'white';
                textEl.style.fontWeight = 'bold';
                textEl.style.fontSize = '12px';
                textEl.textContent = `${index + 1}`;
                el.appendChild(textEl);

                // Tạo popup
                const popup = new window.vietmapgl.Popup({ offset: 25 })
                    .setHTML(`<strong>${location.name || 'Vị trí'}</strong><br>${location.address || ''}`);

                // Tạo marker
                const marker = new window.vietmapgl.Marker(el)
                    .setLngLat([location.lng, location.lat])
                    .setPopup(popup)
                    .addTo(mapRef.current);

                // console.log(`Added marker at ${location.lat},${location.lng} with type ${location.type}${location.id ? `, id: ${location.id}` : ''}`);

                // Thêm vào mảng markers
                markersRef.current.push(marker);

                // Mở rộng bounds
                bounds.extend([location.lng, location.lat]);
            });

            // Fit map to bounds
            if (markers.length > 1) {
                mapRef.current.fitBounds(bounds, {
                    padding: 150, // Tăng padding từ 100 lên 150 để hiển thị rộng hơn
                    maxZoom: 13
                });
            }
        } catch (error) {
            console.error("Error updating markers:", error);
        }
    }, [markers, mapLoaded]);

    // Helper function để xác định màu sắc của đường đi
    const getRouteColor = (segment: RouteSegment, index: number): string => {
        // Màu xanh lá cho đoạn từ pickup đến delivery và các đoạn liên quan
        if (
            // Pickup đến Delivery
            (segment.startName === 'Pickup' && segment.endName === 'Delivery') ||
            // Pickup đến Stopover
            (segment.startName === 'Pickup' && segment.endName === 'Stopover') ||
            // Stopover đến Delivery
            (segment.startName === 'Stopover' && segment.endName === 'Delivery') ||
            // Điểm lấy hàng đến Điểm giao hàng
            (segment.startName === 'Điểm lấy hàng' && segment.endName === 'Điểm giao hàng') ||
            // Điểm lấy hàng đến Stopover
            (segment.startName === 'Điểm lấy hàng' && (segment.endName === 'Stopover' || segment.endName.includes('trung gian'))) ||
            // Stopover đến Điểm giao hàng
            ((segment.startName === 'Stopover' || segment.startName.includes('trung gian')) && segment.endName === 'Điểm giao hàng') ||
            // Kiểm tra bằng lowercase
            (segment.startName.toLowerCase().includes('pickup') && segment.endName.toLowerCase().includes('delivery')) ||
            (segment.startName.toLowerCase().includes('pickup') && segment.endName.toLowerCase().includes('stopover')) ||
            (segment.startName.toLowerCase().includes('stopover') && segment.endName.toLowerCase().includes('delivery')) ||
            // Kiểm tra bằng tiếng Việt lowercase
            (segment.startName.toLowerCase().includes('lấy hàng') && segment.endName.toLowerCase().includes('giao hàng')) ||
            (segment.startName.toLowerCase().includes('lấy hàng') && segment.endName.toLowerCase().includes('trung gian')) ||
            (segment.startName.toLowerCase().includes('trung gian') && segment.endName.toLowerCase().includes('giao hàng'))
        ) {
            return '#52c41a'; // Màu xanh lá cho đoạn từ pickup đến delivery và các đoạn liên quan
        }
        // Màu tím cho đoạn từ delivery về carrier (bao gồm cả các đoạn qua stopover)
        else if (
            // Delivery đến Carrier trực tiếp
            (segment.startName === 'Delivery' && segment.endName.includes('Carrier')) ||
            (segment.startName === 'Điểm giao hàng' && (segment.endName === 'ĐVVC' || segment.endName.includes('Quay về'))) ||

            // Delivery đến Stopover (sau khi đã giao hàng)
            (segment.startName === 'Delivery' && segment.endName === 'Stopover') ||
            (segment.startName === 'Điểm giao hàng' && segment.endName.includes('trung gian')) ||

            // Stopover đến Carrier (sau khi đã giao hàng)
            (segment.startName === 'Stopover' && segment.endName.includes('Carrier')) ||
            (segment.startName.includes('trung gian') && (segment.endName === 'ĐVVC' || segment.endName.includes('Quay về'))) ||

            // Stopover đến Stopover (sau khi đã giao hàng)
            (segment.startName === 'Stopover' && segment.endName === 'Stopover' && segment.segmentOrder > 1) ||
            (segment.startName.includes('trung gian') && segment.endName.includes('trung gian') && segment.segmentOrder > 1) ||

            // Kiểm tra bằng lowercase
            (segment.startName.toLowerCase().includes('delivery') && segment.endName.toLowerCase().includes('carrier')) ||
            (segment.startName.toLowerCase().includes('delivery') && segment.endName.toLowerCase().includes('stopover')) ||
            (segment.startName.toLowerCase().includes('stopover') && segment.endName.toLowerCase().includes('carrier')) ||

            // Kiểm tra bằng tiếng Việt lowercase
            (segment.startName.toLowerCase().includes('giao hàng') && segment.endName.toLowerCase().includes('đvvc')) ||
            (segment.startName.toLowerCase().includes('giao hàng') && segment.endName.toLowerCase().includes('trung gian')) ||
            (segment.startName.toLowerCase().includes('trung gian') && segment.endName.toLowerCase().includes('đvvc'))
        ) {
            return '#722ed1'; // Màu tím cho đoạn từ delivery về carrier
        }
        // Màu xanh dương cho đoạn từ carrier đến pickup
        else if (
            // Carrier đến Pickup
            (segment.startName.includes('Carrier') && segment.endName === 'Pickup') ||
            // ĐVVC đến Điểm lấy hàng
            (segment.startName === 'ĐVVC' && segment.endName === 'Điểm lấy hàng') ||
            // Carrier đến Stopover (trước pickup)
            (segment.startName.includes('Carrier') && segment.endName === 'Stopover') ||
            // ĐVVC đến điểm trung gian (trước pickup)
            (segment.startName === 'ĐVVC' && segment.endName.includes('trung gian')) ||
            // Stopover đến Pickup
            (segment.startName === 'Stopover' && segment.endName === 'Pickup') ||
            // Điểm trung gian đến Điểm lấy hàng
            (segment.startName.includes('trung gian') && segment.endName === 'Điểm lấy hàng') ||
            // Stopover đến Stopover (trước pickup)
            (segment.startName === 'Stopover' && segment.endName === 'Stopover' && segment.segmentOrder === 0) ||
            (segment.startName.includes('trung gian') && segment.endName.includes('trung gian') && segment.segmentOrder === 0) ||
            // Kiểm tra bằng lowercase
            (segment.startName.toLowerCase().includes('carrier') && segment.endName.toLowerCase().includes('pickup')) ||
            (segment.startName.toLowerCase().includes('đvvc') && segment.endName.toLowerCase().includes('lấy hàng'))
        ) {
            return '#1677ff'; // Màu xanh dương cho đoạn từ carrier đến pickup
        } else {
            // Kiểm tra segmentOrder để xác định đoạn đường nằm giữa đâu và đâu
            if (segment.segmentOrder === 0) {
                return '#1677ff'; // Đoạn từ carrier đến pickup (xanh dương)
            } else if (segment.segmentOrder === 1) {
                return '#52c41a'; // Đoạn từ pickup đến delivery (xanh lá)
            } else if (segment.segmentOrder >= 2) {
                return '#722ed1'; // Đoạn từ delivery về carrier (tím)
            }

            return '#1677ff'; // Mặc định là xanh dương
        }
    };

    // Helper function để xóa layers và sources an toàn
    const cleanupLayers = () => {
        if (!mapRef.current) return;

        // Tạo danh sách layers và sources cần xóa
        const layerIds = routeLayersRef.current.filter(id => id.startsWith('route-layer-'));
        const sourceIds = routeLayersRef.current.filter(id => id.startsWith('route-source-'));

        // Xóa tất cả layers trước
        layerIds.forEach(id => {
            if (mapRef.current.getLayer(id)) {
                mapRef.current.removeLayer(id);
            }
        });

        // Sau đó xóa tất cả sources
        sourceIds.forEach(id => {
            if (mapRef.current.getSource(id)) {
                mapRef.current.removeSource(id);
            }
        });

        // Reset danh sách
        routeLayersRef.current = [];
    };

    // Hiển thị route lines
    useEffect(() => {
        if (!mapRef.current || !mapLoaded || !showRouteLines || routeSegments.length === 0) return;

        // Hủy animation cũ nếu có
        if (animationRef.current !== null) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        // Xóa các route layers cũ một cách an toàn
        cleanupLayers();

        // Đợi một chút để map đã render xong các markers
        setTimeout(() => {
            if (animateRoute && routeSegments.length > 0) {
                // Bắt đầu animation với segment đầu tiên
                setIsAnimating(true);
                animationRef.current = requestAnimationFrame(() =>
                    animateRoutePath(0, routeSegments[0].path)
                );
            } else {
                // Hiển thị tất cả route không có animation
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
                            'line-color': getRouteColor(segment, index),
                            'line-width': 6,
                            'line-opacity': 0.8
                        }
                    });

                    // Lưu ID để dọn dẹp sau này
                    routeLayersRef.current.push(sourceId);
                    routeLayersRef.current.push(layerId);
                });
            }
        }, 100);

        return () => {
            // Hủy animation khi unmount hoặc khi routeSegments thay đổi
            if (animationRef.current !== null) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
        };
    }, [routeSegments, showRouteLines, mapLoaded, animateRoute]);

    // Hàm để tạo animation cho route
    const animateRoutePath = (segmentIndex: number, coordinates: number[][], step: number = 0) => {
        if (!mapRef.current || !mapLoaded) return;

        // Nếu đang chuyển sang segment mới
        if (step === 0) {
            // Xóa layer và source cũ nếu có
            const sourceId = `route-source-${segmentIndex}`;
            const layerId = `route-layer-${segmentIndex}`;

            // Xóa layer trước nếu tồn tại
            if (mapRef.current.getLayer(layerId)) {
                mapRef.current.removeLayer(layerId);
            }

            // Sau đó xóa source nếu tồn tại
            if (mapRef.current.getSource(sourceId)) {
                mapRef.current.removeSource(sourceId);
            }

            try {
                // Tạo source mới
                mapRef.current.addSource(sourceId, {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: []
                        }
                    }
                });

                // Tạo layer mới
                mapRef.current.addLayer({
                    id: layerId,
                    type: 'line',
                    source: sourceId,
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': getRouteColor(routeSegments[segmentIndex], segmentIndex),
                        'line-width': 6,
                        'line-opacity': 0.8
                    }
                });

                // Lưu ID để dọn dẹp sau này
                routeLayersRef.current.push(layerId);
                routeLayersRef.current.push(sourceId);
            } catch (error) {
                console.error('Error adding layer or source:', error);
                return;
            }
        }

        try {
            // Tính toán số điểm cần hiển thị trong frame này
            const animationSpeed = 2;
            const nextStep = Math.min(step + animationSpeed, coordinates.length);
            const currentCoordinates = coordinates.slice(0, nextStep);

            // Cập nhật source với các điểm mới
            if (mapRef.current.getSource(`route-source-${segmentIndex}`)) {
                mapRef.current.getSource(`route-source-${segmentIndex}`).setData({
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: currentCoordinates
                    }
                });
            }

            // Nếu chưa hoàn thành segment hiện tại
            if (nextStep < coordinates.length) {
                // Tiếp tục animation cho segment hiện tại
                animationRef.current = requestAnimationFrame(() => animateRoutePath(segmentIndex, coordinates, nextStep));
            } else {
                // Chuyển sang segment tiếp theo nếu có
                if (segmentIndex + 1 < routeSegments.length) {
                    setTimeout(() => {
                        animationRef.current = requestAnimationFrame(() =>
                            animateRoutePath(segmentIndex + 1, routeSegments[segmentIndex + 1].path)
                        );
                    }, 200); // Giảm delay giữa các segments (từ 300ms xuống 200ms)
                } else {
                    // Đã hoàn thành tất cả segments
                    setIsAnimating(false);
                }
            }
        } catch (error) {
            console.error('Error during route animation:', error);
            setIsAnimating(false);
        }
    };

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