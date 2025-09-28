import React, { useRef, useEffect, useState } from 'react';
import trackasiaService from '../../services/map/trackasiaService';
import type { MapLocation } from '../../models/Map';

// Khai báo global cho trackasiagl
declare global {
    interface Window {
        trackasia?: any;
        trackasiagl?: any;
    }
}

interface AddressMapProps {
    mapLocation: MapLocation | null;
    onLocationChange: (location: MapLocation) => void;
}

const AddressMap: React.FC<AddressMapProps> = ({ mapLocation, onLocationChange }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const [isLocating, setIsLocating] = useState(false);

    // Hàm lấy vị trí hiện tại của người dùng
    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            console.log('Geolocation is not supported by your browser');
            return;
        }

        setIsLocating(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;

                if (mapRef.current && markerRef.current) {
                    updateMapLocation({ lat: latitude, lng: longitude });

                    // Reverse geocode để lấy thông tin địa chỉ
                    trackasiaService.reverseGeocode(`${latitude},${longitude}`)
                        .then(response => {
                            if (response && response.results && response.results.length > 0) {
                                const result = response.results[0];
                                onLocationChange({
                                    lat: latitude,
                                    lng: longitude,
                                    address: result.formatted_address
                                });
                            } else {
                                onLocationChange({
                                    lat: latitude,
                                    lng: longitude,
                                    address: `${latitude}, ${longitude}`
                                });
                            }
                        })
                        .catch(error => {
                            console.error('Error reverse geocoding:', error);
                            onLocationChange({
                                lat: latitude,
                                lng: longitude,
                                address: `${latitude}, ${longitude}`
                            });
                        })
                        .finally(() => {
                            setIsLocating(false);
                        });
                }
            },
            (error) => {
                console.error('Error getting current location:', error);
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    // Khởi tạo bản đồ
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        try {
            // Ưu tiên sử dụng trackasiagl từ import
            if (window.trackasiagl) {
                console.log('Initializing TrackAsia map with trackasiagl from NPM');
                mapRef.current = new window.trackasiagl.Map({
                    container: mapContainerRef.current,
                    style: trackasiaService.getMapStyle('streets', false), // Sử dụng URL trực tiếp
                    center: [106.6974, 10.7743], // Trung tâm TPHCM
                    zoom: 12
                });

                // Thêm marker mặc định
                markerRef.current = new window.trackasiagl.Marker()
                    .setLngLat([106.6974, 10.7743])
                    .addTo(mapRef.current);

                // Cập nhật vị trí khi click vào bản đồ
                mapRef.current.on('click', (e: any) => {
                    const coords = {
                        lng: e.lngLat.lng,
                        lat: e.lngLat.lat
                    };

                    updateMapLocation(coords);

                    // Reverse geocode để lấy thông tin địa chỉ
                    trackasiaService.reverseGeocode(`${coords.lat},${coords.lng}`)
                        .then(response => {
                            if (response && response.results && response.results.length > 0) {
                                const result = response.results[0];
                                onLocationChange({
                                    lat: coords.lat,
                                    lng: coords.lng,
                                    address: result.formatted_address
                                });
                            }
                        })
                        .catch(error => {
                            console.error('Error reverse geocoding:', error);
                        });
                });

                // Nếu có vị trí ban đầu, cập nhật marker
                if (mapLocation) {
                    updateMapLocation({
                        lat: mapLocation.lat,
                        lng: mapLocation.lng
                    });
                } else {
                    // Nếu không có vị trí ban đầu, lấy vị trí hiện tại
                    mapRef.current.on('load', () => {
                        getCurrentLocation();
                    });
                }
            }
            // Fallback to CDN version
            else if (window.trackasia) {
                console.log('Initializing TrackAsia map with CDN version');
                mapRef.current = new window.trackasia.Map({
                    container: mapContainerRef.current,
                    style: trackasiaService.getMapStyle('streets', false), // Sử dụng URL trực tiếp
                    center: [106.6974, 10.7743], // Trung tâm TPHCM
                    zoom: 12
                });

                // Thêm marker mặc định
                markerRef.current = new window.trackasia.Marker()
                    .setLngLat([106.6974, 10.7743])
                    .addTo(mapRef.current);

                // Cập nhật vị trí khi click vào bản đồ
                mapRef.current.on('click', (e: any) => {
                    const coords = {
                        lng: e.lngLat.lng,
                        lat: e.lngLat.lat
                    };

                    updateMapLocation(coords);

                    // Reverse geocode để lấy thông tin địa chỉ
                    trackasiaService.reverseGeocode(`${coords.lat},${coords.lng}`)
                        .then(response => {
                            if (response && response.results && response.results.length > 0) {
                                const result = response.results[0];
                                onLocationChange({
                                    lat: coords.lat,
                                    lng: coords.lng,
                                    address: result.formatted_address
                                });
                            }
                        })
                        .catch(error => {
                            console.error('Error reverse geocoding:', error);
                        });
                });

                // Nếu có vị trí ban đầu, cập nhật marker
                if (mapLocation) {
                    updateMapLocation({
                        lat: mapLocation.lat,
                        lng: mapLocation.lng
                    });
                } else {
                    // Nếu không có vị trí ban đầu, lấy vị trí hiện tại
                    mapRef.current.on('load', () => {
                        getCurrentLocation();
                    });
                }
            } else {
                console.error('TrackAsia library not found');
                console.log('window.trackasiagl:', typeof window.trackasiagl);
                console.log('window.trackasia:', typeof window.trackasia);
            }
        } catch (error) {
            console.error('Error initializing map:', error);
        }

        return () => {
            if (mapRef.current) {
                mapRef.current = null;
            }
        };
    }, []);

    // Cập nhật vị trí marker khi mapLocation thay đổi
    useEffect(() => {
        if (mapLocation && mapRef.current && markerRef.current) {
            updateMapLocation({
                lat: mapLocation.lat,
                lng: mapLocation.lng
            });
        }
    }, [mapLocation]);

    // Cập nhật vị trí trên bản đồ
    const updateMapLocation = (location: { lat: number; lng: number }) => {
        if (mapRef.current && markerRef.current) {
            markerRef.current.setLngLat([location.lng, location.lat]);
            mapRef.current.flyTo({
                center: [location.lng, location.lat],
                zoom: 15
            });
        }
    };

    return (
        <div
            ref={mapContainerRef}
            style={{
                height: '400px',
                width: '100%',
                borderRadius: '4px',
                border: '1px solid #d9d9d9',
                position: 'relative'
            }}
        >
            {isLocating && (
                <div
                    style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        zIndex: 1,
                        fontSize: '12px'
                    }}
                >
                    Đang xác định vị trí...
                </div>
            )}
        </div>
    );
};

export default AddressMap; 