import React, { useEffect, useRef, useState } from 'react';
import { Spin } from 'antd';
import type { MapLocation } from '@/models/Map';
import { useVietMapRouting } from '@/hooks/useVietMapRouting';
import type { RouteSegment } from '@/models/RoutePoint';

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
    getMapInstance?: (map: any) => void;
    children?: React.ReactNode; // Support overlay components
}

// Khóa cho cache trong localStorage
const VIETMAP_STYLE_CACHE_KEY = 'vietmap_style_cache';
// Thời gian cache (1 tuần tính bằng milliseconds)
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

// CSS cho popup
const POPUP_STYLE = `
.route-popup .vietmapgl-popup-content {
    padding: 0;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    max-width: 280px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: white;
    overflow: hidden;
}
.route-popup .vietmapgl-popup-close-button {
    display: none; /* Ẩn nút close mặc định */
}
.popup-header {
    position: relative;
    background-color: #f5f5f5;
    padding: 8px 12px;
    border-bottom: 1px solid #eaeaea;
}
.popup-close-button {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: white;
    color: #333;
    font-size: 14px;
    line-height: 20px;
    text-align: center;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
}
.popup-close-button:hover {
    background-color: #f0f0f0;
}
.popup-content {
    padding: 12px;
}
.popup-title {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    padding-right: 24px;
}
.popup-distance {
    font-size: 13px;
    color: #1677ff;
    font-weight: 500;
}
.popup-toll-title {
    font-size: 13px;
    font-weight: 600;
    margin-top: 12px;
    margin-bottom: 6px;
    color: #1677ff;
}
.popup-toll-item {
    background-color: #f5f5f5;
    border-radius: 4px;
    padding: 6px 8px;
    margin-bottom: 6px;
}
.popup-toll-name {
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 2px;
}
.popup-toll-address {
    font-size: 11px;
    color: #666;
    margin-bottom: 2px;
}
.popup-toll-fee {
    font-size: 12px;
    color: #1677ff;
    font-weight: 500;
}
`;

const VietMapMap: React.FC<VietMapMapProps> = ({
    mapLocation,
    onLocationChange,
    markers = [],
    showRouteLines = false,
    routeSegments = [],
    animateRoute = false,
    getMapInstance,
    children
}) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const popupsRef = useRef<any[]>([]);
    const routeLayersRef = useRef<string[]>([]);
    const animationRef = useRef<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapStyle, setMapStyle] = useState<any>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [activePopupIndex, setActivePopupIndex] = useState<number | null>(null);
    const { getMapStyle, reverseGeocode } = useVietMapRouting();

    // Inject CSS cho popup
    useEffect(() => {
        // Kiểm tra xem style đã tồn tại chưa
        const existingStyle = document.getElementById('vietmap-popup-style');
        if (!existingStyle) {
            const styleElement = document.createElement('style');
            styleElement.id = 'vietmap-popup-style';
            styleElement.textContent = POPUP_STYLE;
            document.head.appendChild(styleElement);
        }
    }, []);

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
                            console.log('[VietMapMap] Using cached VietMap style from localStorage');
                            console.log('[VietMapMap] Cache age:', Math.floor((now - timestamp) / (1000 * 60 * 60)), 'hours');
                            setMapStyle(style);
                            return;
                        } else {
                            console.log('[VietMapMap] Cached VietMap style expired, fetching new data');
                            // Clear expired cache
                            localStorage.removeItem(VIETMAP_STYLE_CACHE_KEY);
                        }
                    } catch (parseError) {
                        console.error('[VietMapMap] Error parsing cached VietMap style:', parseError);
                        // Clear corrupted cache
                        localStorage.removeItem(VIETMAP_STYLE_CACHE_KEY);
                    }
                }

                // Nếu không có cache hoặc cache hết hạn, gọi API
                console.log('[VietMapMap] Fetching map style from backend...');
                const result = await getMapStyle();
                const style = result.success ? result.style : null;
                if (style) {
                    console.log('[VietMapMap] Successfully fetched map style from backend');
                    
                    // Lưu style vào state
                    setMapStyle(style);

                    // Lưu style và timestamp vào localStorage
                    const cacheData = {
                        style,
                        timestamp: Date.now()
                    };
                    try {
                        localStorage.setItem(VIETMAP_STYLE_CACHE_KEY, JSON.stringify(cacheData));
                        console.log('[VietMapMap] Cached new VietMap style in localStorage');
                    } catch (storageError) {
                        console.error('[VietMapMap] Failed to cache style in localStorage:', storageError);
                        // Continue anyway, map will still work without cache
                    }
                } else {
                    console.error('[VietMapMap] Failed to fetch map style from backend - style is null');
                }
            } catch (error) {
                console.error('[VietMapMap] Error fetching map style:', error);
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
                    // Xóa tất cả popups
                    popupsRef.current.forEach(popup => {
                        if (popup) popup.remove();
                    });
                    popupsRef.current = [];
                } catch (error) {
                    console.error('Error cleaning up:', error);
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
                reverseGeocode(lat, lng)
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

                // Call getMapInstance if provided
                if (getMapInstance) {
                    getMapInstance(map);
                }
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

            // Early return if no markers
            if (!markers || markers.length === 0) {
                console.log('[VietMapMap] No markers provided, skipping');
                return;
            }

            console.log('[VietMapMap] Processing', markers.length, 'markers');

            // Filter out markers with invalid coordinates (exactly like Staff)
            const validMarkers = markers.filter(marker => {
                const isValid = marker && 
                               typeof marker.lat === 'number' && 
                               typeof marker.lng === 'number' &&
                               !isNaN(marker.lat) && !isNaN(marker.lng) &&
                               isFinite(marker.lat) && isFinite(marker.lng);
                
                if (!isValid) {
                    console.warn('[VietMapMap] Invalid marker:', marker);
                }
                return isValid;
            });

            console.log('[VietMapMap] Valid markers:', validMarkers.length, 'out of', markers.length);

            if (validMarkers.length === 0) {
                console.warn('[VietMapMap] No valid markers to display');
                return;
            }

            // Add markers to map
            validMarkers.forEach((location, index) => {
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

                // Tạo marker
                const marker = new window.vietmapgl.Marker(el)
                    .setLngLat([location.lng, location.lat])
                    .addTo(mapRef.current);

                // Thêm vào mảng markers
                markersRef.current.push(marker);
            });

            // Fit bounds exactly like Staff version
            if (validMarkers.length > 1) {
                setTimeout(() => {
                    try {
                        console.log('[VietMapMap] Attempting fitBounds with', validMarkers.length, 'markers');
                        
                        // WORKAROUND: Skip fitBounds if causing issues, just center on first marker
                        const SKIP_FIT_BOUNDS = false; // Set to true if still having issues
                        
                        if (SKIP_FIT_BOUNDS) {
                            console.log('[VietMapMap] Skipping fitBounds, centering on first marker');
                            const marker = validMarkers[0];
                            mapRef.current.setCenter([marker.lng, marker.lat]);
                            mapRef.current.setZoom(12);
                            return;
                        }

                        // Initialize bounds with first marker to avoid NaN
                        const firstMarker = validMarkers[0];
                        const bounds = new window.vietmapgl.LngLatBounds(
                            [firstMarker.lng, firstMarker.lat],
                            [firstMarker.lng, firstMarker.lat]
                        );
                        
                        // Extend bounds with remaining markers
                        for (let i = 1; i < validMarkers.length; i++) {
                            const marker = validMarkers[i];
                            bounds.extend([marker.lng, marker.lat]);
                        }

                        console.log('[VietMapMap] Bounds ready, calling fitBounds');

                        // Fit map to bounds with generous padding for full route overview
                        mapRef.current.fitBounds(bounds, {
                            padding: {
                                top: 100,
                                bottom: 100,
                                left: 100,
                                right: 100
                            },
                            maxZoom: 13, // Lower zoom for better overview
                            duration: 1000
                        });
                        
                        console.log('[VietMapMap] fitBounds completed successfully');
                    } catch (err) {
                        console.error('[VietMapMap] Error fitting bounds:', err);
                        // Fallback: center on first marker
                        const marker = validMarkers[0];
                        mapRef.current.setCenter([marker.lng, marker.lat]);
                        mapRef.current.setZoom(12);
                    }
                }, 300);
            } else if (validMarkers.length === 1) {
                // If only one valid marker, center the map on it
                const marker = validMarkers[0];
                mapRef.current.setCenter([marker.lng, marker.lat]);
                mapRef.current.setZoom(12);
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

    // Tính toán vị trí offset cho popup để tránh đè lên nhau
    const calculatePopupOffset = (index: number, total: number): [number, number] => {
        // Nếu chỉ có 1-2 segment, sử dụng offset cố định
        if (total <= 2) {
            return [0, -15];
        }

        // Với nhiều segment, tính toán offset để phân bố đều
        // Segment đầu tiên: bên trái, segment cuối cùng: bên phải, các segment giữa: phân bố đều
        if (index === 0) {
            return [-50, -15]; // Đầu tiên: lệch trái
        } else if (index === total - 1) {
            return [50, -15];  // Cuối cùng: lệch phải
        } else {
            // Các segment ở giữa: phân bố đều
            const step = 100 / (total - 1);
            const xOffset = -50 + (step * index);
            return [xOffset, -15];
        }
    };

    // Tạo popup cho từng segment
    const createSegmentPopup = (segment: RouteSegment, index: number, totalSegments: number) => {
        if (!mapRef.current || !segment.path || segment.path.length === 0) return null;

        // Tính toán vị trí trung tâm của segment để đặt popup
        const midPointIndex = Math.floor(segment.path.length / 2);
        const popupCoordinates = segment.path[midPointIndex];

        // Lấy tên điểm đầu và điểm cuối (loại bỏ phần khoảng cách trong ngoặc)
        const startName = segment.startName;
        const endName = segment.endName.split('(')[0].trim();

        // Tạo nội dung cho popup với cấu trúc mới
        let popupContent = `
            <div>
                <div class="popup-header">
                    <div class="popup-title">${startName} → ${endName}</div>
                    <div class="popup-close-button" onclick="this.closest('.vietmapgl-popup').remove()">×</div>
                </div>
                <div class="popup-content">
                    <div class="popup-distance">Khoảng cách: ${segment.distance.toFixed(1)} km</div>
        `;

        // Thêm thông tin trạm thu phí nếu có
        if (segment.tolls && segment.tolls.length > 0) {
            popupContent += '<div class="popup-toll-title">Trạm thu phí:</div>';
            segment.tolls.forEach(toll => {
                popupContent += `
                    <div class="popup-toll-item">
                        <div class="popup-toll-name">${toll.name}</div>
                        <div class="popup-toll-address">${toll.address}</div>
                        <div class="popup-toll-fee">Phí: ${toll.amount.toLocaleString('vi-VN')} VND</div>
                    </div>
                `;
            });
        }

        popupContent += '</div></div>';

        // Tính toán offset để tránh đè lên nhau
        const offset = calculatePopupOffset(index, totalSegments);

        // Tạo popup
        const popup = new window.vietmapgl.Popup({
            closeButton: false, // Tắt nút close mặc định
            closeOnClick: false,
            maxWidth: '280px',
            className: 'route-popup',
            offset: offset
        })
            .setLngLat(popupCoordinates)
            .setHTML(popupContent);

        // Thêm sự kiện khi popup đóng
        popup.on('close', () => {
            if (activePopupIndex === index) {
                setActivePopupIndex(null);
            }
        });

        // Lưu popup để có thể xóa sau này
        popupsRef.current[index] = popup;

        return popup;
    };

    // Hiển thị route lines và popups
    useEffect(() => {
        if (!mapRef.current || !mapLoaded || !showRouteLines || routeSegments.length === 0) return;

        // Hủy animation cũ nếu có
        if (animationRef.current !== null) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        // Xóa các route layers cũ một cách an toàn
        cleanupLayers();

        // Xóa tất cả popups cũ
        popupsRef.current.forEach(popup => {
            if (popup) popup.remove();
        });
        popupsRef.current = [];
        setActivePopupIndex(null);

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

                    // Tạo popup cho segment này
                    const popup = createSegmentPopup(segment, index, routeSegments.length);

                    // Không tự động hiển thị popup khi load map
                    // User sẽ click vào route để xem thông tin

                    // Thêm sự kiện click vào route để hiển thị/ẩn popup
                    mapRef.current.on('click', layerId, (e: any) => {
                        // Ngăn sự kiện lan truyền
                        e.originalEvent.stopPropagation();

                        // Đóng tất cả các popup khác
                        popupsRef.current.forEach((p, i) => {
                            if (p && i !== index) p.remove();
                        });

                        // Tìm popup tương ứng với segment này
                        const popup = popupsRef.current[index];
                        if (popup) {
                            if (popup.isOpen()) {
                                popup.remove();
                                setActivePopupIndex(null);
                            } else {
                                popup.addTo(mapRef.current);
                                setActivePopupIndex(index);
                            }
                        }
                    });

                    // Thay đổi con trỏ khi hover vào route
                    mapRef.current.on('mouseenter', layerId, () => {
                        mapRef.current.getCanvas().style.cursor = 'pointer';
                    });

                    mapRef.current.on('mouseleave', layerId, () => {
                        mapRef.current.getCanvas().style.cursor = '';
                    });
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
            {/* Render overlay components (vehicle list, indicators, etc.) */}
            {children}
        </div>
    );
};

export default VietMapMap; 