import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Alert } from 'antd';
import { WifiOutlined, DisconnectOutlined, LoadingOutlined } from '@ant-design/icons';
import RouteMapSection from './RouteMapSection';
import RealTimeVehicleMarker from '../../../../../components/map/RealTimeVehicleMarker';
import { useVehicleTracking, type VehicleLocationMessage } from '../../../../../hooks/useVehicleTracking';
import type { JourneySegment, JourneyHistory } from '../../../../../models/JourneyHistory';

interface RouteMapWithRealTimeTrackingProps {
  journeySegments: JourneySegment[];
  journeyInfo?: Partial<JourneyHistory>;
  orderId: string;
  shouldShowRealTimeTracking: boolean;
}

/**
 * Component kết hợp hiển thị lộ trình tĩnh và tracking xe real-time
 * - Hiển thị route từ journey segments
 * - Overlay các marker xe đang di chuyển real-time
 * - Tự động cập nhật vị trí xe khi nhận WebSocket message
 */
const RouteMapWithRealTimeTracking: React.FC<RouteMapWithRealTimeTrackingProps> = ({
  journeySegments,
  journeyInfo,
  orderId,
  shouldShowRealTimeTracking
}) => {
  console.log('🎯 [RouteMapWithRealTimeTracking] COMPONENT RENDERED/RE-RENDERED');
  console.log('Props:', { orderId, shouldShowRealTimeTracking, journeySegmentsCount: journeySegments?.length });
  
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [showVehicleList, setShowVehicleList] = useState(true);
  const mapSectionRef = useRef<HTMLDivElement>(null);
  const hasFocusedSingleVehicle = useRef(false);

  // WebSocket tracking
  const {
    vehicleLocations,
    isConnected,
    isConnecting,
    error: trackingError,
    reconnect,
  } = useVehicleTracking({
    orderId: shouldShowRealTimeTracking ? orderId : undefined,
    autoConnect: shouldShowRealTimeTracking,
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
  });

  console.log('=== [RouteMapWithRealTimeTracking] COMPONENT STATE ===');
  console.log('shouldShowRealTimeTracking:', shouldShowRealTimeTracking);
  console.log('orderId:', orderId);
  console.log('isConnected:', isConnected);
  console.log('isConnecting:', isConnecting);
  console.log('vehicleCount:', vehicleLocations.length);
  console.log('vehicleLocations:', vehicleLocations);
  console.log('validVehicleCount:', vehicleLocations.filter(vehicle =>
    !isNaN(vehicle.latitude) && !isNaN(vehicle.longitude) &&
    isFinite(vehicle.latitude) && isFinite(vehicle.longitude)
  ).length);
  console.log('trackingError:', trackingError);
  console.log('hasMap:', !!mapInstance);
  console.log('mapInstance:', mapInstance);
  console.log('================================================');

  // Callback khi map được khởi tạo
  const handleMapReady = (map: any) => {
    console.log('=== [RouteMapWithRealTimeTracking] MAP READY ===');
    console.log('Map instance:', map);
    console.log('Map loaded:', map ? 'YES' : 'NO');
    console.log('VietMapGL available:', typeof window.vietmapgl !== 'undefined');
    setMapInstance(map);
  };

  // Auto-fit bounds to show all vehicles
  const fitBoundsToVehicles = useCallback(() => {
    if (!mapInstance || vehicleLocations.length === 0) return;

    const validVehicles = vehicleLocations.filter(v =>
      !isNaN(v.latitude) && !isNaN(v.longitude) &&
      isFinite(v.latitude) && isFinite(v.longitude)
    );

    if (validVehicles.length === 0) return;

    if (validVehicles.length === 1) {
      // Single vehicle - center on it
      const vehicle = validVehicles[0];
      mapInstance.flyTo({
        center: [vehicle.longitude, vehicle.latitude],
        zoom: 14,
        duration: 1000
      });
    } else {
      // Multiple vehicles - fit bounds
      const bounds = new window.vietmapgl.LngLatBounds();
      validVehicles.forEach(vehicle => {
        bounds.extend([vehicle.longitude, vehicle.latitude]);
      });

      mapInstance.fitBounds(bounds, {
        padding: { top: 100, bottom: 100, left: 350, right: 100 }, // Extra padding on left for vehicle list
        maxZoom: 14,
        duration: 1000
      });
    }
  }, [mapInstance, vehicleLocations]);

  // Auto-fit when vehicles first load
  useEffect(() => {
    if (vehicleLocations.length > 0 && mapInstance) {
      // Delay to ensure map is fully loaded
      setTimeout(() => fitBoundsToVehicles(), 500);
    }
  }, [vehicleLocations.length, mapInstance, fitBoundsToVehicles]);

  // Auto-focus on single vehicle - only ONCE on initial load
  useEffect(() => {
    if (vehicleLocations.length === 1 && mapInstance && !selectedVehicleId && !hasFocusedSingleVehicle.current) {
      const vehicle = vehicleLocations[0];
      console.log('[RouteMapWithRealTimeTracking] Auto-focusing on single vehicle (first time):', vehicle.vehicleId);
      mapInstance.flyTo({
        center: [vehicle.longitude, vehicle.latitude],
        zoom: 15,
        duration: 1000
      });
      hasFocusedSingleVehicle.current = true;
    }
    
    // Reset flag when vehicle count changes or selection is made
    if (vehicleLocations.length !== 1 || selectedVehicleId) {
      hasFocusedSingleVehicle.current = false;
    }
  }, [vehicleLocations.length, mapInstance, selectedVehicleId]); // Only depend on LENGTH, not full array

  // Focus on selected vehicle - ONLY when selection changes, not on position updates
  useEffect(() => {
    if (selectedVehicleId && mapInstance) {
      const vehicle = vehicleLocations.find(v => v.vehicleId === selectedVehicleId);
      if (vehicle) {
        console.log('[RouteMapWithRealTimeTracking] Focusing on selected vehicle:', selectedVehicleId);
        mapInstance.flyTo({
          center: [vehicle.longitude, vehicle.latitude],
          zoom: 15,
          duration: 1000
        });
      }
    }
  }, [selectedVehicleId, mapInstance]); // Remove vehicleLocations dependency!

  // Auto-scroll to map when tracking becomes active
  useEffect(() => {
    if (shouldShowRealTimeTracking && isConnected && mapSectionRef.current) {
      setTimeout(() => {
        mapSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 300);
    }
  }, [shouldShowRealTimeTracking, isConnected]);

  // Callback khi click vào marker xe
  const handleVehicleMarkerClick = useCallback((vehicle: VehicleLocationMessage) => {
    console.log('[RouteMapWithRealTimeTracking] Vehicle marker clicked:', vehicle);
    console.log('Vehicle position:', { lat: vehicle.latitude, lng: vehicle.longitude });
    console.log('Is valid position?', {
      latValid: !isNaN(vehicle.latitude) && isFinite(vehicle.latitude),
      lngValid: !isNaN(vehicle.longitude) && isFinite(vehicle.longitude)
    });
    setSelectedVehicleId(vehicle.vehicleId);
    
    // Focus on selected vehicle
    if (mapInstance) {
      mapInstance.flyTo({
        center: [vehicle.longitude, vehicle.latitude],
        zoom: 15,
        duration: 1000
      });
    }
  }, [mapInstance]);

  // Render connection status
  const renderConnectionStatus = () => {
    if (!shouldShowRealTimeTracking) return null;

    if (isConnecting) {
      return (
        <Alert
          message="Đang kết nối WebSocket..."
          type="info"
          icon={<LoadingOutlined />}
          showIcon
          className="mb-4"
        />
      );
    }

    if (trackingError) {
      return (
        <Alert
          message="Lỗi kết nối WebSocket"
          description={trackingError}
          type="error"
          showIcon
          className="mb-4"
          action={
            <a onClick={reconnect} className="text-blue-600 hover:text-blue-800">
              Thử lại
            </a>
          }
        />
      );
    }

    if (isConnected && vehicleLocations.length > 0) {
      const validVehicleCount = vehicleLocations.filter(vehicle =>
        !isNaN(vehicle.latitude) && !isNaN(vehicle.longitude) &&
        isFinite(vehicle.latitude) && isFinite(vehicle.longitude)
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

    if (isConnected && vehicleLocations.length === 0) {
      return (
        <Alert
          message="Đã kết nối WebSocket"
          description="Đang chờ dữ liệu vị trí xe..."
          type="info"
          showIcon
          className="mb-4"
        />
      );
    }

    return (
      <Alert
        message="Mất kết nối WebSocket"
        type="warning"
        icon={<DisconnectOutlined />}
        showIcon
        className="mb-4"
        action={
          <a onClick={reconnect} className="text-blue-600 hover:text-blue-800">
            Kết nối lại
          </a>
        }
      />
    );
  };

  return (
    <div className="route-map-with-tracking" ref={mapSectionRef}>
      {/* Connection status */}
      {renderConnectionStatus()}

      {/* Hiển thị route map */}
      <div className="relative">
        <RouteMapSection
          journeySegments={journeySegments}
          journeyInfo={journeyInfo}
          onMapReady={handleMapReady}
        >
          {/* Vehicle List Panel - Absolute positioned inside map */}
          {shouldShowRealTimeTracking && vehicleLocations.length > 0 && (
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
                      <span>Xe đang chạy ({vehicleLocations.length})</span>
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
                    .filter(v =>
                      !isNaN(v.latitude) && !isNaN(v.longitude) &&
                      isFinite(v.latitude) && isFinite(v.longitude)
                    )
                    .map((vehicle) => (
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
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            vehicle.assignmentStatus === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {vehicle.assignmentStatus}
                          </span>
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
                          <div className="flex items-center gap-1">
                            <span>👤</span>
                            <span>{vehicle.driver1Name || 'Chưa có'}</span>
                            {vehicle.driver1Phone && (
                              <span className="text-gray-400">• {vehicle.driver1Phone}</span>
                            )}
                          </div>
                          {vehicle.driver2Name && (
                            <div className="flex items-center gap-1">
                              <span>👥</span>
                              <span>{vehicle.driver2Name}</span>
                              {vehicle.driver2Phone && (
                                <span className="text-gray-400">• {vehicle.driver2Phone}</span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1 pt-1 border-t border-gray-200">
                            <span>⏱️</span>
                            <span>{new Date(vehicle.lastUpdated).toLocaleString('vi-VN')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
          )}

          {/* Live tracking indicator - Absolute position inside map */}
          {shouldShowRealTimeTracking && (
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
          )}

          {/* Overlay real-time vehicle markers - Always show if we have data */}
          {shouldShowRealTimeTracking && mapInstance && vehicleLocations.length > 0 && (
            <div className="real-time-vehicles-overlay">
              {vehicleLocations
                .filter(vehicle =>
                  !isNaN(vehicle.latitude) && !isNaN(vehicle.longitude) &&
                  isFinite(vehicle.latitude) && isFinite(vehicle.longitude)
                )
                .map((vehicle) => {
                  console.log('=== [RouteMapWithRealTimeTracking] Rendering marker for vehicle:', vehicle.vehicleId);
                  return (
                    <RealTimeVehicleMarker
                      key={vehicle.vehicleId}
                      vehicle={vehicle}
                      map={mapInstance}
                      onMarkerClick={handleVehicleMarkerClick}
                      isSelected={selectedVehicleId === vehicle.vehicleId}
                      isHighlighted={!selectedVehicleId || selectedVehicleId === vehicle.vehicleId}
                    />
                  );
                })}
            </div>
          )}
        </RouteMapSection>
      </div>
    </div>
  );
};

export default RouteMapWithRealTimeTracking;
