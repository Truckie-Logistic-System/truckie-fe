import React, { useState } from 'react';
import { Card, Alert } from 'antd';
import { EnvironmentOutlined, WifiOutlined, DisconnectOutlined, LoadingOutlined } from '@ant-design/icons';
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
  const [mapInstance, setMapInstance] = useState<any>(null);

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

  console.log('[RouteMapWithRealTimeTracking] State:', {
    shouldShowRealTimeTracking,
    orderId,
    isConnected,
    isConnecting,
    vehicleCount: vehicleLocations.length,
    validVehicleCount: vehicleLocations.filter(vehicle =>
      !isNaN(vehicle.latitude) && !isNaN(vehicle.longitude) &&
      isFinite(vehicle.latitude) && isFinite(vehicle.longitude)
    ).length,
    trackingError,
    hasMap: !!mapInstance
  });

  // Callback khi map được khởi tạo
  const handleMapReady = (map: any) => {
    console.log('[RouteMapWithRealTimeTracking] Map instance ready');
    setMapInstance(map);
  };

  // Callback khi click vào marker xe
  const handleVehicleMarkerClick = (vehicle: VehicleLocationMessage) => {
    console.log('[RouteMapWithRealTimeTracking] Vehicle marker clicked:', vehicle);
    
    // Center map to vehicle location
    if (mapInstance) {
      mapInstance.flyTo({
        center: [vehicle.longitude, vehicle.latitude],
        zoom: 15,
        duration: 1000
      });
    }
  };

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
    <div className="route-map-with-tracking">
      {/* Connection status */}
      {renderConnectionStatus()}

      {/* Route map với journey segments */}
      <Card
        title={
          <div className="flex items-center justify-between">
            <span>
              <EnvironmentOutlined className="mr-2" />
              Bản đồ lộ trình vận chuyển
            </span>
            {shouldShowRealTimeTracking && isConnected && (
              <span className="text-sm font-normal text-green-600">
                <WifiOutlined className="mr-1" />
                Live Tracking
              </span>
            )}
          </div>
        }
        className="shadow-md"
      >
        {/* Hiển thị route map */}
        <RouteMapSection
          journeySegments={journeySegments}
          journeyInfo={journeyInfo}
          onMapReady={handleMapReady}
        />

        {/* Overlay real-time vehicle markers */}
        {shouldShowRealTimeTracking && mapInstance && vehicleLocations.length > 0 && (
          <div className="real-time-vehicles-overlay">
            {vehicleLocations
              .filter(vehicle =>
                !isNaN(vehicle.latitude) && !isNaN(vehicle.longitude) &&
                isFinite(vehicle.latitude) && isFinite(vehicle.longitude)
              )
              .map((vehicle) => (
                <RealTimeVehicleMarker
                  key={vehicle.vehicleId}
                  vehicle={vehicle}
                  map={mapInstance}
                  onMarkerClick={handleVehicleMarkerClick}
                />
              ))}
          </div>
        )}
      </Card>

      {/* Debug info (chỉ hiển thị trong development) */}
      {process.env.NODE_ENV === 'development' && shouldShowRealTimeTracking && (
        <Card className="mt-4" size="small" title="Debug Info">
          <pre className="text-xs">
            {JSON.stringify({
              isConnected,
              isConnecting,
              vehicleCount: vehicleLocations.length,
              validVehicleCount: vehicleLocations.filter(vehicle =>
                !isNaN(vehicle.latitude) && !isNaN(vehicle.longitude) &&
                isFinite(vehicle.latitude) && isFinite(vehicle.longitude)
              ).length,
              hasMap: !!mapInstance,
              error: trackingError
            }, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
};

export default RouteMapWithRealTimeTracking;
