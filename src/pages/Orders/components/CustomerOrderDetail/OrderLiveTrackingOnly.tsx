import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Alert, message, Card } from 'antd';
import { WifiOutlined, DisconnectOutlined, LoadingOutlined, TruckOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { playImportantNotificationSound, initAudioContext } from '../../../../utils/notificationSound';
import SmoothVehicleMarker from '../../../../components/map/SmoothVehicleMarker';
import RoutePathRenderer from '../../../../components/map/RoutePathRenderer';
import RouteMarkersRenderer from '../../../../components/map/RouteMarkersRenderer';
import { useVehicleTracking, type VehicleLocationMessage } from '../../../../hooks/useVehicleTracking';
import { useVietMapRouting } from '../../../../hooks/useVietMapRouting';

interface OrderLiveTrackingOnlyProps {
  orderId: string;
  shouldShowRealTimeTracking: boolean;
  vehicleAssignments?: any[];
}

/**
 * Component hiển thị Live Tracking Map với routes
 * - Hiển thị tất cả routes từ vehicle assignments
 * - Hiển thị real-time vehicle markers
 * - Khi select vehicle: highlight route của vehicle đó, làm mờ các route khác
 */
const OrderLiveTrackingOnly: React.FC<OrderLiveTrackingOnlyProps> = ({
  orderId,
  shouldShowRealTimeTracking,
  vehicleAssignments = []
}) => {
  // console.log('🎯 [OrderLiveTrackingOnly] COMPONENT RENDERED');
  // console.log('Props:', { orderId, shouldShowRealTimeTracking, vehicleAssignmentsCount: vehicleAssignments.length });
  console.log('VehicleAssignments:', vehicleAssignments);
  
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [mapStyle, setMapStyle] = useState<any>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [showVehicleList, setShowVehicleList] = useState(true);
  const [isInitializingTracking, setIsInitializingTracking] = useState(false);
  const [hasShownTrackingNotification, setHasShownTrackingNotification] = useState(false);
  const [hasInitialFocus, setHasInitialFocus] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const componentRef = useRef<HTMLDivElement>(null);
  const hasFocusedSingleVehicle = useRef(false);
  const previousTrackingStateRef = useRef(shouldShowRealTimeTracking);

  // VietMap routing hook
  const { getMapStyle } = useVietMapRouting();

  // WebSocket tracking
  const {
    vehicleLocations,
    isConnected,
    isConnecting,
  } = useVehicleTracking({
    orderId: shouldShowRealTimeTracking ? orderId : undefined,
    autoConnect: shouldShowRealTimeTracking,
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
  });

  // Filter valid vehicles - memoize to prevent unnecessary marker recreation
  const validVehicles = React.useMemo(() => 
    vehicleLocations.filter((vehicle): vehicle is VehicleLocationMessage & { latitude: number; longitude: number } =>
      vehicle.latitude !== null && vehicle.longitude !== null &&
      !isNaN(vehicle.latitude) && !isNaN(vehicle.longitude) &&
      isFinite(vehicle.latitude) && isFinite(vehicle.longitude)
    ),
    [vehicleLocations]
  );

  // Get map style - ONCE only with cache
  useEffect(() => {
    const fetchMapStyle = async () => {
      try {
        // Check cache first
        const cachedStyle = localStorage.getItem('vietmap_style_cache');
        if (cachedStyle) {
          try {
            const parsed = JSON.parse(cachedStyle);
            // Validate cache: check if it has required properties
            if (parsed && typeof parsed === 'object' && parsed.version) {
              console.log('[OrderLiveTrackingOnly] ✅ Using cached map style');
              setMapStyle(parsed);
              return;
            } else {
              console.warn('[OrderLiveTrackingOnly] ⚠️ Cache invalid - missing required properties');
              localStorage.removeItem('vietmap_style_cache');
            }
          } catch (parseError) {
            console.warn('[OrderLiveTrackingOnly] ⚠️ Cache corrupted - removing and refetching');
            localStorage.removeItem('vietmap_style_cache');
          }
        }

        console.log('[OrderLiveTrackingOnly] 🔄 Fetching map style from API...');
        const result = await getMapStyle();
        if (result.success && result.style) {
          console.log('[OrderLiveTrackingOnly] ✅ Map style fetched successfully');
          // Cache the style
          localStorage.setItem('vietmap_style_cache', JSON.stringify(result.style));
          setMapStyle(result.style);
        } else {
          console.error('[OrderLiveTrackingOnly] ❌ Failed to get map style:', result.error);
        }
      } catch (error) {
        console.error('[OrderLiveTrackingOnly] ❌ Error fetching map style:', error);
      }
    };

    if (!mapStyle) {
      fetchMapStyle();
    }
  }, []); // Empty deps - only fetch once

  // Initialize map with initial bounds if vehicles exist
  useEffect(() => {
    if (!mapContainerRef.current || mapInstance || !window.vietmapgl || !mapStyle) {
      return;
    }

    console.log('[OrderLiveTrackingOnly] Initializing map...');

    let map: any = null;
    const initializeMap = () => {
      try {
        // Calculate initial bounds from vehicles if available
        let initialCenter = [106.6297, 10.8231]; // Default: Ho Chi Minh City
        let initialZoom = 12;

        if (validVehicles.length > 0) {
          const bounds = new window.vietmapgl.LngLatBounds();
          validVehicles.forEach((vehicle) => {
            bounds.extend([vehicle.longitude, vehicle.latitude]);
          });
          
          // Get center from bounds
          const center = bounds.getCenter();
          initialCenter = [center.lng, center.lat];
          initialZoom = 13;
        }

        map = new window.vietmapgl.Map({
          container: mapContainerRef.current,
          style: mapStyle,
          center: initialCenter,
          zoom: initialZoom,
          attributionControl: false
        });

        // Add controls
        map.addControl(new window.vietmapgl.NavigationControl(), 'top-right');
        map.addControl(new window.vietmapgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true
        }));

        map.on('load', () => {
          console.log('[OrderLiveTrackingOnly] Map loaded successfully');
          setMapInstance(map);
        });

        map.on('error', (e: any) => {
          console.error('[OrderLiveTrackingOnly] Map error:', e);
        });
      } catch (error) {
        console.error('[OrderLiveTrackingOnly] Error initializing map:', error);
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      if (map) {
        console.log('[OrderLiveTrackingOnly] Cleaning up map...');
        map.remove();
        setMapInstance(null);
      }
    };
  }, [mapStyle]); // Only re-initialize if map style changes

  // Initialize audio context on user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      initAudioContext();
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);
    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  // Detect when tracking becomes active
  useEffect(() => {
    const wasNotTracking = !previousTrackingStateRef.current;
    const isNowTracking = shouldShowRealTimeTracking;

    if (wasNotTracking && isNowTracking && !hasShownTrackingNotification) {
      console.log('[OrderLiveTrackingOnly] 🚀 Tracking activated!');
      
      message.success({
        content: (
          <span>
            <TruckOutlined className="mr-2" />
            Xe đã bắt đầu chuyến đi! Đang kết nối GPS...
          </span>
        ),
        duration: 5,
        icon: null,
      });

      playImportantNotificationSound();
      setHasShownTrackingNotification(true);
      
      // Scroll to component
      setTimeout(() => {
        if (componentRef.current) {
          componentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 800);
    }

    previousTrackingStateRef.current = shouldShowRealTimeTracking;
  }, [shouldShowRealTimeTracking, hasShownTrackingNotification]);

  // Handle initializing state
  useEffect(() => {
    const hasValidCoordinates = vehicleLocations.length > 0 && validVehicles.length > 0;
    
    if (shouldShowRealTimeTracking && isConnected && !hasValidCoordinates) {
      setIsInitializingTracking(true);
      
      const timeout = setTimeout(() => {
        setIsInitializingTracking(false);
        message.warning('Đang kết nối với xe... Vui lòng đợi trong giây lát.');
      }, 15000);
      
      return () => clearTimeout(timeout);
    } else if (hasValidCoordinates) {
      setIsInitializingTracking(false);
    }
  }, [shouldShowRealTimeTracking, isConnected, vehicleLocations.length, validVehicles.length]);

  // Focus vehicles before rendering markers to avoid "jumping"
  useEffect(() => {
    if (mapInstance && validVehicles.length > 0 && !hasInitialFocus) {
      console.log('[OrderLiveTrackingOnly] 🎯 Initial map focus for', validVehicles.length, 'vehicles');
      
      // For single vehicle: focus on the vehicle with higher zoom
      if (validVehicles.length === 1) {
        const vehicle = validVehicles[0];
        mapInstance.flyTo({
          center: [vehicle.longitude, vehicle.latitude],
          zoom: 15,
          duration: 1000
        });
      } else {
        // For multiple vehicles: fit bounds to show all vehicles
        const bounds = new window.vietmapgl.LngLatBounds();
        validVehicles.forEach((vehicle) => {
          bounds.extend([vehicle.longitude, vehicle.latitude]);
        });
        
        mapInstance.fitBounds(bounds, {
          padding: { top: 100, bottom: 100, left: 350, right: 100 },
          duration: 1000,
          maxZoom: 14
        });
      }
      
      // Mark that we've done initial focus
      setTimeout(() => {
        setHasInitialFocus(true);
      }, 1100);
    }
  }, [mapInstance, validVehicles.length, hasInitialFocus]);

  // Track if we've already done initial fit bounds
  const hasInitialFitBoundsRef = useRef(false);

  // Auto-fit bounds to show all vehicles AND their routes
  const fitBoundsToVehicles = useCallback(() => {
    if (!mapInstance || vehicleAssignments.length === 0) return;

    const bounds = new window.vietmapgl.LngLatBounds();
    let hasValidCoordinates = false;

    // Collect all route coordinates from vehicle assignments
    vehicleAssignments.forEach((va) => {
      if (!va.journeyHistories || va.journeyHistories.length === 0) return;

      va.journeyHistories.forEach((journey: any) => {
        if (!journey || !journey.journeySegments || journey.journeySegments.length === 0) return;

        journey.journeySegments.forEach((segment: any) => {
          // Add start point
          if (segment.startLatitude && segment.startLongitude &&
              !isNaN(segment.startLatitude) && !isNaN(segment.startLongitude) &&
              isFinite(segment.startLatitude) && isFinite(segment.startLongitude)) {
            bounds.extend([segment.startLongitude, segment.startLatitude]);
            hasValidCoordinates = true;
          }

          // Add end point
          if (segment.endLatitude && segment.endLongitude &&
              !isNaN(segment.endLatitude) && !isNaN(segment.endLongitude) &&
              isFinite(segment.endLatitude) && isFinite(segment.endLongitude)) {
            bounds.extend([segment.endLongitude, segment.endLatitude]);
            hasValidCoordinates = true;
          }

          // Add path coordinates
          if (segment.pathCoordinatesJson) {
            try {
              const pathCoords = JSON.parse(segment.pathCoordinatesJson);
              if (Array.isArray(pathCoords)) {
                pathCoords.forEach((coord: any) => {
                  const lng = Array.isArray(coord) ? coord[0] : coord.lng;
                  const lat = Array.isArray(coord) ? coord[1] : coord.lat;
                  
                  if (!isNaN(lng) && !isNaN(lat) && isFinite(lng) && isFinite(lat)) {
                    bounds.extend([lng, lat]);
                    hasValidCoordinates = true;
                  }
                });
              }
            } catch (error) {
              console.warn('[OrderLiveTrackingOnly] Error parsing path coordinates:', error);
            }
          }
        });
      });
    });

    // If no valid coordinates from routes, fall back to vehicle locations
    if (!hasValidCoordinates) {
      const validVehicles = vehicleLocations.filter((v): v is VehicleLocationMessage & { latitude: number; longitude: number } => {
        return v.latitude !== null && v.longitude !== null &&
          !isNaN(v.latitude as number) && !isNaN(v.longitude as number) &&
          isFinite(v.latitude as number) && isFinite(v.longitude as number);
      });

      if (validVehicles.length === 0) return;

      validVehicles.forEach(vehicle => {
        bounds.extend([vehicle.longitude, vehicle.latitude]);
      });
    }

    // Fit bounds with padding (left padding increased to avoid vehicle info panel)
    mapInstance.fitBounds(bounds, {
      padding: { top: 100, bottom: 100, left: 350, right: 100 },
      maxZoom: 14,
      duration: 1000
    });
  }, [mapInstance, vehicleAssignments, vehicleLocations]);

  // Auto-fit when vehicles first load - ONLY ONCE
  useEffect(() => {
    if (vehicleLocations.length > 0 && mapInstance && !hasInitialFitBoundsRef.current) {
      console.log('[OrderLiveTrackingOnly] 🎯 Initial fit bounds for', vehicleLocations.length, 'vehicles');
      hasInitialFitBoundsRef.current = true;
      setTimeout(() => fitBoundsToVehicles(), 500);
    }
  }, [mapInstance]); // Only depend on mapInstance, not vehicleLocations.length

  // Reset fit bounds when vehicle count changes (e.g., from 1 to 2 vehicles)
  // But only fit bounds ONCE when transitioning to 2+ vehicles
  const hasInitialMultiVehicleFitRef = useRef(false);
  
  useEffect(() => {
    if (vehicleLocations.length > 1 && !hasInitialMultiVehicleFitRef.current) {
      console.log('[OrderLiveTrackingOnly] Vehicle count changed to', vehicleLocations.length, '- fit bounds once');
      hasInitialMultiVehicleFitRef.current = true;
      hasInitialFitBoundsRef.current = false;
      hasFocusedSingleVehicle.current = false;
      
      // Fit bounds for multiple vehicles - ONLY ONCE
      if (mapInstance) {
        setTimeout(() => fitBoundsToVehicles(), 300);
      }
    }
    
    // Reset when back to single vehicle
    if (vehicleLocations.length === 1) {
      hasInitialMultiVehicleFitRef.current = false;
    }
  }, [vehicleLocations.length, mapInstance, fitBoundsToVehicles]);

  // Auto-focus on single vehicle when vehicle count changes to 1
  // This handles cases where vehicles load one by one
  useEffect(() => {
    if (vehicleLocations.length === 1 && mapInstance && hasInitialFocus && !selectedVehicleId) {
      const vehicle = vehicleLocations[0];
      if (vehicle.latitude !== null && vehicle.longitude !== null && !hasFocusedSingleVehicle.current) {
        console.log('[OrderLiveTrackingOnly] 🎯 Auto-focusing on single vehicle:', vehicle.vehicleId);
        mapInstance.flyTo({
          center: [vehicle.longitude, vehicle.latitude],
          zoom: 15,
          duration: 1000
        });
        hasFocusedSingleVehicle.current = true;
      }
    }
    
    // Reset flag when vehicle count changes
    if (vehicleLocations.length !== 1) {
      hasFocusedSingleVehicle.current = false;
    }
  }, [vehicleLocations.length, mapInstance, hasInitialFocus, selectedVehicleId]);

  // Focus on selected vehicle when user selects it
  useEffect(() => {
    if (!selectedVehicleId || !mapInstance) {
      return;
    }

    const vehicle = vehicleLocations.find(v => v.vehicleId === selectedVehicleId);
    if (!vehicle || vehicle.latitude === null || vehicle.longitude === null) return;

    console.log('[OrderLiveTrackingOnly] 🎯 Focusing on selected vehicle:', selectedVehicleId);
    
    mapInstance.flyTo({
      center: [vehicle.longitude, vehicle.latitude],
      zoom: 15,
      duration: 1200,
      easing: (t: number) => t * (2 - t)
    });
  }, [selectedVehicleId, mapInstance, vehicleLocations]);

  // Auto-follow single vehicle when it updates position
  useEffect(() => {
    // Only auto-follow when:
    // 1. Tracking is active and connected
    // 2. There's exactly one vehicle
    // 3. No vehicle is manually selected by user
    // 4. Map is ready and initial focus is done
    if (!shouldShowRealTimeTracking || !isConnected || !mapInstance || !hasInitialFocus) {
      return;
    }

    if (vehicleLocations.length === 1 && !selectedVehicleId) {
      const vehicle = vehicleLocations[0];
      if (vehicle.latitude !== null && vehicle.longitude !== null) {
        console.log('[OrderLiveTrackingOnly] 🎯 Auto-following single vehicle update:', vehicle.vehicleId);
        
        // Use easeTo for smooth following (less dramatic than flyTo)
        mapInstance.easeTo({
          center: [vehicle.longitude, vehicle.latitude],
          zoom: 15,
          duration: 800
        });
      }
    }
  }, [vehicleLocations, shouldShowRealTimeTracking, isConnected, mapInstance, hasInitialFocus, selectedVehicleId]);

  // Callback khi click vào marker xe
  const handleVehicleMarkerClick = useCallback((vehicle: VehicleLocationMessage) => {
    console.log('[OrderLiveTrackingOnly] Vehicle marker clicked:', vehicle);
    setSelectedVehicleId(vehicle.vehicleId);
    
    if (mapInstance && vehicle.latitude !== null && vehicle.longitude !== null) {
      mapInstance.easeTo({
        center: [vehicle.longitude, vehicle.latitude],
        zoom: 15,
        duration: 1200,
        easing: (t: number) => t * (2 - t)
      });
    }
  }, [mapInstance]);

  // Render connection status
  const renderConnectionStatus = () => {
    if (!shouldShowRealTimeTracking) return null;

    if (isConnected && vehicleLocations.length > 0) {
      const validVehicleCount = vehicleLocations.filter((vehicle): vehicle is VehicleLocationMessage & { latitude: number; longitude: number } =>
        vehicle.latitude !== null && vehicle.longitude !== null &&
        !isNaN(vehicle.latitude as number) && !isNaN(vehicle.longitude as number) &&
        isFinite(vehicle.latitude as number) && isFinite(vehicle.longitude as number)
      ).length;

      return (
        <Alert
          message={
            <span>
              <WifiOutlined className="mr-2" />
              Đang theo dõi {validVehicleCount} xe real-time
            </span>
          }
          type="success"
          showIcon
          className="mb-4"
        />
      );
    }
  };

  // Không hiển thị nếu không cần tracking
  if (!shouldShowRealTimeTracking) {
    return null;
  }

  return (
    <div ref={componentRef}>
      <Card 
        className="mb-6 shadow-md rounded-xl"
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <EnvironmentOutlined className="mr-2 text-blue-500" />
              <span className="font-semibold">Theo dõi GPS trực tiếp - Toàn bộ chuyến xe</span>
            </div>
          </div>
        }
      >
        {/* Connection status */}
        {renderConnectionStatus()}

        {/* Loading state when initializing tracking */}
        {isInitializingTracking && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 animate-pulse">
            <div className="flex items-center justify-center space-x-3">
              <LoadingOutlined className="text-2xl text-blue-500" />
              <div>
                <p className="text-blue-700 font-medium mb-1">
                  🚛 Đang kết nối với xe...
                </p>
                <p className="text-sm text-blue-600">
                  Xe đã bắt đầu chuyến đi. Đang nhận tín hiệu GPS...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div 
          id="customer-live-tracking-map"
          className="relative" 
          style={{ height: '600px', width: '100%' }} 
          ref={mapContainerRef}
        >
          {/* Vehicle List Panel - Absolute positioned inside map */}
          {vehicleLocations.length > 0 && (
            <div className={`absolute top-4 left-4 z-[400] transition-all duration-300 ${
              showVehicleList ? 'w-72' : 'w-auto'
            }`}>
              <div className="bg-white rounded-lg shadow-xl border border-gray-200">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                  {showVehicleList ? (
                    <>
                      <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <span>🚛</span>
                      <span>Xe đang chạy</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedVehicleId(null);
                          fitBoundsToVehicles();
                        }}
                        className="text-xs px-2 py-1.5 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors whitespace-nowrap h-7 flex items-center"
                      >
                        Xem tất cả
                      </button>
                      <button
                        onClick={() => setShowVehicleList(false)}
                        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors text-xl"
                      >
                        ×
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => setShowVehicleList(true)}
                    className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
                  >
                    🚛 {vehicleLocations.length}
                  </button>
                )}
              </div>

              {/* Vehicle List */}
              {showVehicleList && (
                <div className="max-h-96 overflow-y-auto p-2 space-y-2">
                  {vehicleLocations
                    .filter((v): v is VehicleLocationMessage & { latitude: number; longitude: number } =>
                      v.latitude !== null && v.longitude !== null &&
                      !isNaN(v.latitude as number) && !isNaN(v.longitude as number) &&
                      isFinite(v.latitude as number) && isFinite(v.longitude as number)
                    )
                    .map((vehicle) => {
                      const vaInfo = vehicleAssignments.find(
                        va => va.id === vehicle.vehicleAssignmentId
                      );

                      return (
                        <div
                          key={vehicle.vehicleId}
                          onClick={() => handleVehicleMarkerClick(vehicle)}
                          className={`p-2.5 rounded-md cursor-pointer transition-all ${
                            selectedVehicleId === vehicle.vehicleId
                              ? 'bg-blue-50 border-2 border-blue-400 shadow-sm'
                              : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base">🚛</span>
                              <span className="font-semibold text-sm text-gray-900">
                                {vehicle.licensePlateNumber}
                              </span>
                            </div>
                            {vehicle.speed !== null && vehicle.speed !== undefined && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-blue-100 text-blue-700">
                                {vehicle.speed.toFixed(0)} km/h
                              </span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="space-y-0.5 text-[11px] text-gray-600">
                            <div className="flex items-center gap-1">
                              <span>🏭</span>
                              <span>{vehicle.manufacturer} - {vehicle.vehicleTypeName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>📦</span>
                              <span className="truncate">{vehicle.trackingCode}</span>
                            </div>
                            {vaInfo?.primaryDriver && (
                              <div className="flex items-center gap-1">
                                <span>👤</span>
                                <span>{vaInfo.primaryDriver.fullName}</span>
                                {vaInfo.primaryDriver.phoneNumber && (
                                  <span className="text-gray-400">• {vaInfo.primaryDriver.phoneNumber}</span>
                                )}
                              </div>
                            )}
                            {vaInfo?.secondaryDriver && (
                              <div className="flex items-center gap-1">
                                <span>👥</span>
                                <span>{vaInfo.secondaryDriver.fullName}</span>
                                {vaInfo.secondaryDriver.phoneNumber && (
                                  <span className="text-gray-400">• {vaInfo.secondaryDriver.phoneNumber}</span>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1 pt-1 border-t border-gray-200">
                              <span>⏱️</span>
                              <span>{vehicle.lastUpdated ? new Date(vehicle.lastUpdated).toLocaleString('vi-VN') : 'Chưa cập nhật'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live tracking indicator */}
        <div className={`absolute bottom-4 right-4 z-[500] px-3 py-2 rounded-lg shadow-lg ${
          isConnected ? 'bg-green-100 border border-green-300' :
          isConnecting ? 'bg-blue-100 border border-blue-300' :
          'bg-yellow-100 border border-yellow-300'
        }`}>
          <div className="flex flex-col gap-1">
            <span className={`text-sm font-medium flex items-center ${
              isConnected ? 'text-green-700' : isConnecting ? 'text-blue-700' : 'text-yellow-700'
            }`}>
              {isConnecting ? (
                <LoadingOutlined className="mr-1" />
              ) : isConnected ? (
                <WifiOutlined className="mr-1" />
              ) : (
                <DisconnectOutlined className="mr-1" />
              )}
              {isConnecting ? 'Đang kết nối...' : isConnected ? 'Theo dõi trực tiếp' : 'Mất kết nối'}
            </span>
            {!isConnected && !isConnecting && vehicleLocations.length > 0 && (
              <span className="text-xs text-yellow-600">
                📍 Hiển thị vị trí cuối cùng
              </span>
            )}
          </div>
        </div>

        {/* Real-time vehicle markers - Render as soon as map and vehicles are available */}
        {shouldShowRealTimeTracking && mapInstance && vehicleLocations.length > 0 && (
          <div>
            {vehicleLocations
              .filter((vehicle): vehicle is VehicleLocationMessage & { latitude: number; longitude: number } =>
                vehicle.latitude !== null && vehicle.longitude !== null &&
                !isNaN(vehicle.latitude as number) && !isNaN(vehicle.longitude as number) &&
                isFinite(vehicle.latitude as number) && isFinite(vehicle.longitude as number)
              )
              .map((vehicle) => (
                <SmoothVehicleMarker
                  key={vehicle.vehicleId}
                  vehicle={vehicle}
                  map={mapInstance}
                  isSelected={selectedVehicleId === vehicle.vehicleId}
                  isHighlighted={true}
                  onMarkerClick={handleVehicleMarkerClick}
                />
              ))}
          </div>
        )}
        </div>
      </Card>

      {/* Routes and route markers - Rendered outside map container */}
      {console.log('[OrderLiveTrackingOnly] Checking route renderers:', {
        hasMapInstance: !!mapInstance,
        vaLength: vehicleAssignments.length,
        shouldRender: mapInstance && vehicleAssignments.length > 0
      })}
      {mapInstance && vehicleAssignments.length > 0 && (
        <>
          {console.log('[OrderLiveTrackingOnly] Rendering RoutePathRenderer and RouteMarkersRenderer')}
          <RoutePathRenderer
            map={mapInstance}
            vehicleAssignments={vehicleAssignments}
            selectedVehicleId={selectedVehicleId}
          />
          <RouteMarkersRenderer
            map={mapInstance}
            vehicleAssignments={vehicleAssignments}
            selectedVehicleId={selectedVehicleId}
          />
        </>
      )}
    </div>
  );
};

export default OrderLiveTrackingOnly;