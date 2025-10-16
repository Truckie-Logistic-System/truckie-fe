import React, { useState } from 'react';
import { Card, Alert } from 'antd';
import { WifiOutlined, DisconnectOutlined, LoadingOutlined } from '@ant-design/icons';
import RouteMapSection from './RouteMapSection';
import RealTimeVehicleMarker from '../../../../components/map/RealTimeVehicleMarker';
import { useVehicleTracking, type VehicleLocationMessage } from '../../../../hooks/useVehicleTracking';
import type { JourneySegment, JourneyHistory } from '../../../../models/JourneyHistory';

interface RouteMapWithRealTimeTrackingProps {
  journeySegments: JourneySegment[];
  journeyInfo?: Partial<JourneyHistory>;
  orderId: string;
  shouldShowRealTimeTracking: boolean;
}

/**
 * Component kết hợp hiển thị lộ trình tĩnh và tracking xe real-time cho Customer
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
  console.log('🎯 [CustomerRouteMapWithRealTimeTracking] COMPONENT RENDERED/RE-RENDERED');
  console.log('Props:', { orderId, shouldShowRealTimeTracking, journeySegmentsCount: journeySegments?.length });
  
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

  console.log('=== [CustomerRouteMapWithRealTimeTracking] COMPONENT STATE ===');
  console.log('shouldShowRealTimeTracking:', shouldShowRealTimeTracking);
  console.log('orderId:', orderId);
  console.log('isConnected:', isConnected);
  console.log('isConnecting:', isConnecting);
  console.log('vehicleCount:', vehicleLocations.length);
  console.log('vehicleLocations:', vehicleLocations);
  console.log('trackingError:', trackingError);
  console.log('hasMap:', !!mapInstance);

  // Callback khi map được khởi tạo
  const handleMapReady = (map: any) => {
    console.log('=== [CustomerRouteMapWithRealTimeTracking] MAP READY ===');
    console.log('Map instance:', map);
    console.log('Map loaded:', map ? 'YES' : 'NO');
    console.log('VietMapGL available:', typeof window.vietmapgl !== 'undefined');
    setMapInstance(map);
  };

  // Callback khi click vào marker xe
  const handleVehicleMarkerClick = (vehicle: VehicleLocationMessage) => {
    console.log('[CustomerRouteMapWithRealTimeTracking] Vehicle marker clicked:', vehicle);
    
    // Center map to vehicle location
    if (mapInstance) {
      mapInstance.flyTo({
        center: [vehicle.longitude, vehicle.latitude],
        zoom: 15,
        duration: 1000
      });
    }
  };

  return (
    <>
      <div className="relative">
        {/* Live tracking indicator */}
        {shouldShowRealTimeTracking && (
          <div className={`absolute bottom-2 right-2 z-[2000] px-3 py-2 rounded-lg shadow-lg ${
            isConnected ? 'bg-green-100 border border-green-300' : 
            isConnecting ? 'bg-blue-100 border border-blue-300' : 
            'bg-red-100 border border-red-300'
          }`}>
            <span className={`text-sm font-medium flex items-center ${
              isConnected ? 'text-green-700' : isConnecting ? 'text-blue-700' : 'text-red-700'
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
          </div>
        )}

        {/* Hiển thị lỗi tracking nếu có */}
        {shouldShowRealTimeTracking && trackingError && (
          <Alert
            message="Lỗi theo dõi real-time"
            description={trackingError}
            type="warning"
            showIcon
            className="mb-4"
            action={
              <button
                onClick={reconnect}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Thử lại
              </button>
            }
          />
        )}

        {/* Hiển thị route map */}
        <RouteMapSection
          journeySegments={journeySegments}
          journeyInfo={journeyInfo}
          onMapReady={handleMapReady}
        />

        {/* Overlay real-time vehicle markers */}
        {(() => {
          const shouldRender = shouldShowRealTimeTracking && mapInstance && vehicleLocations.length > 0;
          console.log('=== [CustomerRouteMapWithRealTimeTracking] MARKER RENDER CHECK ===');
          console.log('shouldShowRealTimeTracking:', shouldShowRealTimeTracking);
          console.log('mapInstance exists:', !!mapInstance);
          console.log('vehicleLocations.length:', vehicleLocations.length);
          console.log('Will render markers:', shouldRender);
          
          if (!shouldRender) {
            if (!shouldShowRealTimeTracking) console.warn('❌ Tracking disabled');
            if (!mapInstance) console.warn('❌ Map instance not ready');
            if (vehicleLocations.length === 0) console.warn('❌ No vehicle locations');
          }
          
          return shouldRender ? (
            <div className="real-time-vehicles-overlay">
              {vehicleLocations
                .filter(vehicle =>
                  !isNaN(vehicle.latitude) && !isNaN(vehicle.longitude) &&
                  isFinite(vehicle.latitude) && isFinite(vehicle.longitude)
                )
                .map((vehicle) => {
                  console.log('=== [CustomerRouteMapWithRealTimeTracking] Rendering marker for vehicle:', vehicle.vehicleId);
                  return (
                    <RealTimeVehicleMarker
                      key={vehicle.vehicleId}
                      vehicle={vehicle}
                      map={mapInstance}
                      onMarkerClick={handleVehicleMarkerClick}
                    />
                  );
                })}
            </div>
          ) : null;
        })()}
      </div>

      {/* Debug info cho customer (chỉ hiển thị trong development) */}
      {process.env.NODE_ENV === 'development' && shouldShowRealTimeTracking && (
        <Card className="mt-4" size="small" title="Debug Info (Customer)">
          <pre className="text-xs">
            {JSON.stringify({
              isConnected,
              isConnecting,
              vehicleCount: vehicleLocations.length,
              hasMap: !!mapInstance,
              orderId,
              trackingError: trackingError ? trackingError.substring(0, 100) + '...' : null
            }, null, 2)}
          </pre>
        </Card>
      )}
    </>
  );
};

export default RouteMapWithRealTimeTracking;
