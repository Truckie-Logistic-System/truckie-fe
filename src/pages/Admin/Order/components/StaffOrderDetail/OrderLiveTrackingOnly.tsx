import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import { playImportantNotificationSound } from '../../../../../utils/notificationSound';
import SmoothVehicleMarker from '../../../../../components/map/SmoothVehicleMarker';
import RoutePathRenderer from '../../../../../components/map/RoutePathRenderer';
import RouteMarkersRenderer from '../../../../../components/map/RouteMarkersRenderer';
import { useVehicleTracking, type VehicleLocationMessage } from '../../../../../hooks/useVehicleTracking';
import VehicleLocationCache from '../../../../../utils/vehicleLocationCache';
import { useVietMapRouting } from '../../../../../hooks/useVietMapRouting';
import { mapCache } from '../../../../../utils/mapCache';
import LiveTrackingErrorBoundary from '../../../../../components/common/LiveTrackingErrorBoundary';

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
  // 
  // 
  
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [mapStyle, setMapStyle] = useState<any>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [showVehicleList, setShowVehicleList] = useState(true);
  const [isInitializingTracking, setIsInitializingTracking] = useState(false);
  const [hasShownTrackingNotification, setHasShownTrackingNotification] = useState(false);
  const [hasInitialFocus, setHasInitialFocus] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const hasFocusedSingleVehicle = useRef(false);
  const previousTrackingStateRef = useRef(shouldShowRealTimeTracking);

  // VietMap routing hook
  const { getMapStyle } = useVietMapRouting();

  // WebSocket tracking
  const {
    vehicleLocations,
    isConnected,
    isConnecting,
    disconnect: disconnectTracking,
  } = useVehicleTracking({
    orderId: shouldShowRealTimeTracking ? orderId : undefined,
    autoConnect: shouldShowRealTimeTracking,
    reconnectInterval: 5000,
  });

  // Cache instance để kiểm tra trạng thái vehicle
  const cacheRef = React.useRef(VehicleLocationCache.getInstance());
  
  // Filter valid vehicles - memoize to prevent unnecessary marker recreation
  const validVehicles = React.useMemo(() => 
    vehicleLocations.filter((vehicle): vehicle is VehicleLocationMessage & { latitude: number; longitude: number } =>
      vehicle.latitude !== null && vehicle.longitude !== null &&
      !isNaN(vehicle.latitude) && !isNaN(vehicle.longitude) &&
      isFinite(vehicle.latitude) && isFinite(vehicle.longitude)
    ),
    [vehicleLocations]
  );

  // Get map style - ONCE only with cache - using ref to prevent multiple requests
  const fetchMapStyleRef = useRef(false);
  
  useEffect(() => {
    if (fetchMapStyleRef.current || mapStyle) return;
    fetchMapStyleRef.current = true;
    
    const fetchMapStyle = async () => {
      try {
        // Check cache first
        const cachedStyle = localStorage.getItem('vietmap_style_cache');
        if (cachedStyle) {
          try {
            const parsed = JSON.parse(cachedStyle);
            // Validate cache: check if it has required properties
            if (parsed && typeof parsed === 'object' && parsed.version) {
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
        const result = await getMapStyle();
        if (result.success && result.style) {
          // Cache the style
          localStorage.setItem('vietmap_style_cache', JSON.stringify(result.style));
          setMapStyle(result.style);
        } else {
          console.error('[OrderLiveTrackingOnly] ❌ Failed to get map style:', result.error);
        }
      } catch (error) {
        console.error('[OrderLiveTrackingOnly] ❌ Error fetching map style:', error);
        fetchMapStyleRef.current = false; // Allow retry on error
      }
    };

    fetchMapStyle();
  }, []); // Empty deps - only fetch once

  // Initialize map with initial bounds if vehicles exist - using ref to prevent double initialization
  const mapInitializedRef = useRef(false);
  const mapInstanceRef = useRef<any>(null);
  
  useEffect(() => {
    if (!mapContainerRef.current || !window.vietmapgl || !mapStyle || mapInitializedRef.current) {
      return;
    }
    mapInitializedRef.current = true;

    let map: any = null;
    let isDestroyed = false;
    
    const initializeMap = () => {
      try {
        if (isDestroyed) return;
        
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

        // Store reference
        mapInstanceRef.current = map;

        // Add controls
        map.addControl(new window.vietmapgl.NavigationControl(), 'top-right');
        map.addControl(new window.vietmapgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true
        }));

        map.on('load', () => {
          if (isDestroyed) return;
          setMapInstance(map);
        });

        map.on('error', (e: any) => {
          if (isDestroyed) return;
          console.error('[OrderLiveTrackingOnly] Map error:', e);
          // Reset initialization flag to allow retry
          mapInitializedRef.current = false;
        });
      } catch (error) {
        console.error('[OrderLiveTrackingOnly] Error initializing map:', error);
        mapInitializedRef.current = false; // Allow retry
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      isDestroyed = true;
      if (map && map.remove) {
        try {
          map.remove();
        } catch (error) {
          console.warn('[OrderLiveTrackingOnly] Error removing map:', error);
        }
      }
      mapInstanceRef.current = null;
      setMapInstance(null);
      mapInitializedRef.current = false;
    };
  }, [mapStyle]); // Only re-initialize if map style changes

  // ZZFX doesn't require audio context initialization

  // Detect when tracking becomes active
  useEffect(() => {
    const wasNotTracking = !previousTrackingStateRef.current;
    const isNowTracking = shouldShowRealTimeTracking;

    if (wasNotTracking && isNowTracking && !hasShownTrackingNotification) {
      playImportantNotificationSound();
      setHasShownTrackingNotification(true);
      
      // Scroll to center map
      setTimeout(() => {
        if (mapContainerRef.current) {
          const headerHeight = 64;
          const mapElement = mapContainerRef.current;
          const mapRect = mapElement.getBoundingClientRect();
          const mapHeight = mapRect.height;
          const viewportHeight = window.innerHeight;
          
          const visibleViewportCenter = headerHeight + (viewportHeight - headerHeight) / 2;
          const mapCenter = mapRect.top + mapHeight / 2;
          const scrollOffset = mapCenter - visibleViewportCenter;
          
          window.scrollTo({
            top: window.pageYOffset + scrollOffset,
            behavior: 'smooth'
          });
        }
      }, 800);
    }

    previousTrackingStateRef.current = shouldShowRealTimeTracking;
  }, [shouldShowRealTimeTracking, hasShownTrackingNotification]);

  // Auto-disconnect GPS tracking for Staff (extended permissions)
  // Disconnect when: All OrderDetails in final states OR All VehicleAssignments COMPLETED
  useEffect(() => {
    if (!vehicleAssignments || vehicleAssignments.length === 0) return;
    
    // Define final states for OrderDetails
    const FINAL_STATES = ['DELIVERED', 'COMPENSATION', 'IN_TROUBLES', 'RETURNED', 'CANCELLED', 'SUCCESSFUL'];
    
    // Check if all OrderDetails across all vehicle assignments are in final states
    const allOrderDetailsInFinalState = vehicleAssignments.every((va: any) => {
      const vaOrderDetails = va.orderDetails || [];
      if (vaOrderDetails.length === 0) return false;
      return vaOrderDetails.every((od: any) => FINAL_STATES.includes(od.status));
    });
    
    // Check if all vehicle assignments have COMPLETED status (Staff extended permission)
    const allTripsCompleted = vehicleAssignments.every((va: any) => va.status === 'COMPLETED');
    
    // Disconnect GPS tracking if either condition is met
    const shouldDisconnect = allOrderDetailsInFinalState || allTripsCompleted;
    
    if (shouldDisconnect && isConnected && disconnectTracking) {
      const reason = allTripsCompleted 
        ? 'All VehicleAssignments COMPLETED (staff extended view)' 
        : 'All OrderDetails in final states';
      disconnectTracking();
    }
  }, [vehicleAssignments, isConnected, disconnectTracking]);

  // Handle initializing state - Cải thiện UX bằng cách giảm thời gian hiển thị loading
  useEffect(() => {
    const hasValidCoordinates = vehicleLocations.length > 0 && validVehicles.length > 0;
    
    if (shouldShowRealTimeTracking && isConnected && !hasValidCoordinates) {
      setIsInitializingTracking(true);
      
      // Giảm thời gian từ 15s xuống 5s để cải thiện UX
      const timeout = setTimeout(() => {
        setIsInitializingTracking(false);
        // Không hiển thị warning nếu đã có cached data
        if (vehicleLocations.length === 0) {
          // message.info('Kết nối GPS đang được thiết lập...');
        }
      }, 5000);
      
      return () => clearTimeout(timeout);
    } else if (hasValidCoordinates || vehicleLocations.length > 0) {
      // Tắt loading ngay khi có dữ liệu (kể cả cached data)
      setIsInitializingTracking(false);
    }
  }, [shouldShowRealTimeTracking, isConnected, vehicleLocations.length, validVehicles.length]);

  // Track if we've already done initial fit bounds
  const hasInitialFitBoundsRef = useRef(false);

  // Focus vehicles before rendering markers to avoid "jumping"
  useEffect(() => {
    if (mapInstance && validVehicles.length > 0 && !hasInitialFocus) {
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

  // Auto-fit when vehicles first load - ONLY ONCE - Fixed dependency
  useEffect(() => {
    if (vehicleLocations.length > 0 && mapInstance && !hasInitialFitBoundsRef.current) {
      hasInitialFitBoundsRef.current = true;
      const timeoutId = setTimeout(() => {
        if (mapInstance && mapInstanceRef.current === mapInstance) {
          fitBoundsToVehicles();
        }
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [mapInstance, vehicleLocations.length]); // Fixed: Include vehicleLocations.length but use ref to prevent infinite loop

  // Reset fit bounds when vehicle count changes (e.g., from 1 to 2 vehicles)
  // But only fit bounds ONCE when transitioning to 2+ vehicles
  const hasInitialMultiVehicleFitRef = useRef(false);
  const lastVehicleCountRef = useRef(0);
  
  useEffect(() => {
    const currentCount = vehicleLocations.length;
    const previousCount = lastVehicleCountRef.current;
    
    if (currentCount > 1 && previousCount <= 1 && !hasInitialMultiVehicleFitRef.current) {
      hasInitialMultiVehicleFitRef.current = true;
      hasInitialFitBoundsRef.current = false;
      hasFocusedSingleVehicle.current = false;
      
      // Fit bounds for multiple vehicles - ONLY ONCE
      if (mapInstance && mapInstanceRef.current === mapInstance) {
        const timeoutId = setTimeout(() => {
          if (mapInstance && mapInstanceRef.current === mapInstance) {
            fitBoundsToVehicles();
          }
        }, 300);
        
        return () => clearTimeout(timeoutId);
      }
    }
    
    // Reset when back to single vehicle
    if (currentCount === 1 && previousCount > 1) {
      hasInitialMultiVehicleFitRef.current = false;
    }
    
    lastVehicleCountRef.current = currentCount;
  }, [vehicleLocations.length, mapInstance]); // Removed fitBoundsToVehicles from deps to prevent infinite loop

  // Auto-focus on single vehicle when vehicle count changes to 1
  // This handles cases where vehicles load one by one
  useEffect(() => {
    if (vehicleLocations.length === 1 && mapInstance && hasInitialFocus && !selectedVehicleId) {
      const vehicle = vehicleLocations[0];
      if (vehicle.latitude !== null && vehicle.longitude !== null && !hasFocusedSingleVehicle.current) {
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
    setSelectedVehicleId(vehicle.vehicleId);
    
    if (mapInstance && vehicle.latitude !== null && vehicle.longitude !== null) {
      mapInstance.flyTo({
        center: [vehicle.longitude, vehicle.latitude],
        zoom: 15,
        duration: 1200,
        easing: (t: number) => t * (2 - t)
      });
    }
  }, [mapInstance]);

  // Không hiển thị nếu không cần tracking
  if (!shouldShowRealTimeTracking) {
    return null;
  }

  return (
    <LiveTrackingErrorBoundary>
      <div>
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
      {/* Map Container */}
      <div 
        id="staff-live-tracking-map"
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
                            {/* {vehicle.speed !== null && vehicle.speed !== undefined && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-blue-100 text-blue-700">
                                {vehicle.speed.toFixed(0)} km/h
                              </span>
                            )} */}
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
      {mapInstance && vehicleAssignments.length > 0 && (
        <>
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
    </LiveTrackingErrorBoundary>
  );
};

export default OrderLiveTrackingOnly;