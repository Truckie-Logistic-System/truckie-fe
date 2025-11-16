import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card, Alert, Empty, Tag } from 'antd';
import { WifiOutlined, DisconnectOutlined, LoadingOutlined, TruckOutlined, EnvironmentOutlined } from '@ant-design/icons';
import RealTimeVehicleMarker from '../../../../components/map/RealTimeVehicleMarker';
import { useVehicleTracking } from '../../../../hooks/useVehicleTracking';
import { useVietMapRouting } from '../../../../hooks/useVietMapRouting';

interface OrderLiveTrackingMapProps {
  orderId: string;
  shouldShowRealTimeTracking: boolean;
  vehicleAssignments?: any[];
}

/**
 * Component hiển thị Live Tracking Map cho toàn bộ ORDER
 * - Hiển thị tất cả xe đang vận chuyển trong order
 * - Real-time GPS tracking qua WebSocket
 * - Không hiển thị route chi tiết (route chi tiết ở từng vehicle assignment)
 */
const OrderLiveTrackingMap: React.FC<OrderLiveTrackingMapProps> = ({
  orderId,
  shouldShowRealTimeTracking,
  vehicleAssignments = []
}) => {
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // VietMap routing hook
  const { getMapStyle } = useVietMapRouting();

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
  });

  // Filter valid vehicles
  const validVehicles = vehicleLocations.filter(vehicle =>
    vehicle.latitude !== null && vehicle.longitude !== null &&
    !isNaN(vehicle.latitude) && !isNaN(vehicle.longitude) &&
    isFinite(vehicle.latitude) && isFinite(vehicle.longitude)
  );

  // Get map style - ONCE only with cache
  useEffect(() => {
    const fetchMapStyle = async () => {
      try {
        // Check cache first
        const cachedStyle = localStorage.getItem('vietmap_style_cache');
        if (cachedStyle) {
          console.log('[OrderLiveTrackingMap] Using cached map style');
          setMapStyle(JSON.parse(cachedStyle));
          return;
        }

        const result = await getMapStyle();
        if (result.success && result.style) {
          console.log('[OrderLiveTrackingMap] Map style fetched successfully');
          // Cache the style
          localStorage.setItem('vietmap_style_cache', JSON.stringify(result.style));
          setMapStyle(result.style);
        } else {
          console.error('[OrderLiveTrackingMap] Failed to get map style:', result.error);
        }
      } catch (error) {
        console.error('[OrderLiveTrackingMap] Error fetching map style:', error);
      }
    };

    if (!mapStyle) {
      fetchMapStyle();
    }
  }, []); // Empty deps - only fetch once

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstance || !window.vietmapgl || !mapStyle) {
      return;
    }

    console.log('[OrderLiveTrackingMap] Initializing map...');

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

        map.on('load', () => {
          console.log('[OrderLiveTrackingMap] Map loaded successfully');
          setMapInstance(map);
        });

        map.on('error', (e: any) => {
          console.error('[OrderLiveTrackingMap] Map error:', e);
        });
      } catch (error) {
        console.error('[OrderLiveTrackingMap] Error initializing map:', error);
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      if (map) {
        console.log('[OrderLiveTrackingMap] Cleaning up map...');
        map.remove();
        setMapInstance(null);
      }
    };
  }, [mapStyle, validVehicles.length]); // Re-initialize if vehicles change

  // Auto-fit bounds when vehicles update
  useEffect(() => {
    if (!mapInstance || validVehicles.length === 0) {
      return;
    }

    const bounds = new window.vietmapgl.LngLatBounds();
    validVehicles.forEach(vehicle => {
      if (vehicle.latitude && vehicle.longitude) {
        bounds.extend([vehicle.longitude, vehicle.latitude]);
      }
    });

    mapInstance.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15,
    });
  }, [mapInstance, validVehicles]);

  // Vehicle selection handler
  const handleVehicleClick = useCallback((vehicle: any) => {
    setSelectedVehicleId(vehicle.vehicleId);
  }, []);

  // Không hiển thị nếu không cần tracking
  if (!shouldShowRealTimeTracking) {
    return null;
  }

  return (
    <Card 
      className="mb-6 shadow-md rounded-xl"
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <EnvironmentOutlined className="mr-2 text-blue-500" />
            <span className="font-semibold">Theo dõi GPS trực tiếp</span>
          </div>
          <div className="flex items-center gap-2">
            {isConnecting && (
              <Tag icon={<LoadingOutlined />} color="processing">
                Đang kết nối...
              </Tag>
            )}
            {isConnected && !isConnecting && (
              <Tag icon={<WifiOutlined />} color="success">
                Đã kết nối
              </Tag>
            )}
            {!isConnected && !isConnecting && (
              <Tag icon={<DisconnectOutlined />} color="error">
                Mất kết nối
              </Tag>
            )}
            {validVehicles.length > 0 && (
              <Tag icon={<TruckOutlined />} color="blue">
                {validVehicles.length} xe đang vận chuyển
              </Tag>
            )}
          </div>
        </div>
      }
    >
      {/* Connection Error */}
      {trackingError && (
        <Alert
          message="Lỗi kết nối GPS"
          description={trackingError}
          type="error"
          showIcon
          closable
          className="mb-4"
          action={
            <button
              onClick={reconnect}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Thử lại
            </button>
          }
        />
      )}

      {/* Map Container */}
      <div className="relative" style={{ height: '500px', width: '100%' }}>
        {validVehicles.length === 0 ? (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                isConnecting
                  ? "Đang kết nối GPS..."
                  : isConnected
                  ? "Chưa có dữ liệu GPS từ xe"
                  : "Không thể kết nối đến hệ thống GPS"
              }
            >
              {!isConnected && !isConnecting && (
                <button
                  onClick={reconnect}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Kết nối lại
                </button>
              )}
            </Empty>
          </div>
        ) : (
          <>
            <div ref={mapContainerRef} style={{ height: '100%', width: '100%', borderRadius: '8px' }} />
            
            {/* Real-time Vehicle Markers - Only render after map is ready */}
            {mapInstance && validVehicles.map((vehicle) => (
              <RealTimeVehicleMarker
                key={vehicle.vehicleId}
                vehicle={vehicle}
                map={mapInstance}
                onMarkerClick={handleVehicleClick}
                isSelected={selectedVehicleId === vehicle.vehicleId}
              />
            ))}
          </>
        )}
      </div>

      {/* Vehicle List */}
      {validVehicles.length > 0 && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {validVehicles.map((vehicle) => {
            // Use vehicleAssignmentId from WebSocket as primary key for accurate matching
            const vaInfo = vehicleAssignments.find(
              va => va.id === vehicle.vehicleAssignmentId
            );
            
            return (
              <div
                key={vehicle.vehicleId}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedVehicleId === vehicle.vehicleId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => setSelectedVehicleId(vehicle.vehicleId)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <TruckOutlined className="text-blue-500 mr-2" />
                    <span className="font-semibold">
                      {vehicle.licensePlateNumber || vaInfo?.vehicle?.licensePlateNumber || 'Xe không xác định'}
                    </span>
                  </div>
                  {vehicle.speed !== null && vehicle.speed !== undefined && (
                    <Tag color="blue">{vehicle.speed.toFixed(0)} km/h</Tag>
                  )}
                </div>
                
                {vaInfo && (
                  <div className="text-xs text-gray-600 space-y-1">
                    {vaInfo.primaryDriver && (
                      <div>Tài xế: {vaInfo.primaryDriver.fullName}</div>
                    )}
                    {vaInfo.trackingCode && (
                      <div>Mã: {vaInfo.trackingCode}</div>
                    )}
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-2">
                  Cập nhật: {vehicle.lastUpdated ? new Date(vehicle.lastUpdated).toLocaleTimeString('vi-VN') : 'Chưa cập nhật'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default OrderLiveTrackingMap;