import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Tag, Alert, Spin } from 'antd';
import { WifiOutlined, DisconnectOutlined, EnvironmentOutlined, TruckOutlined } from '@ant-design/icons';
import VietMapMap from '../common/VietMapMap';
import SmoothVehicleMarker from '../map/SmoothVehicleMarker';
import { useVehicleTracking } from '../../hooks/useVehicleTracking';
import type { MapLocation } from '@/models/Map';
import type { RouteSegment } from '@/models/RoutePoint';
import type { RouteSegmentInfo, LocationInfo } from '../../services/off-route/types';
import { translatePointName } from '@/models/JourneyHistory';

interface OffRouteMapViewProps {
  orderId: string;
  vehicleAssignmentId: string;
  currentLocation: LocationInfo | null;
  plannedRouteSegments: RouteSegmentInfo[];
  distanceFromRoute?: number;
}

/**
 * Map component for Off-Route Warning Modal
 * Shows:
 * - Planned route with markers
 * - Current vehicle position
 * - Deviation line from vehicle to closest point on route
 */
const OffRouteMapView: React.FC<OffRouteMapViewProps> = ({
  orderId,
  vehicleAssignmentId,
  currentLocation,
  plannedRouteSegments,
  distanceFromRoute,
}) => {
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [markers, setMarkers] = useState<MapLocation[]>([]);
  const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([]);
  const deviationLayerAdded = useRef(false);
  const mapRef = useRef<any>(null);

  // WebSocket tracking for real-time vehicle position
  const {
    vehicleLocations,
    isConnected,
    isConnecting,
  } = useVehicleTracking({
    orderId: orderId,
    autoConnect: true,
    reconnectInterval: 5000,
  });

  // Get active vehicle from tracking
  const activeVehicle = vehicleLocations.find(v => 
    v.vehicleAssignmentId === vehicleAssignmentId ||
    v.latitude !== null && v.longitude !== null
  );

  // Process planned route segments into map format
  useEffect(() => {
    if (!plannedRouteSegments || plannedRouteSegments.length === 0) return;

    const newMarkers: MapLocation[] = [];
    const newRouteSegments: RouteSegment[] = [];

    plannedRouteSegments.forEach((segment) => {
      if (segment.pathCoordinatesJson) {
        try {
          const pathCoordinates = JSON.parse(segment.pathCoordinatesJson);

          // Add start point marker
          if (segment.startLat && segment.startLng) {
            const translatedStartName = translatePointName(segment.startPointName || '');
            newMarkers.push({
              lat: Number(segment.startLat),
              lng: Number(segment.startLng),
              address: translatedStartName,
              name: translatedStartName,
              type: segment.startPointName?.toLowerCase().includes('carrier') ? 'carrier' :
                segment.startPointName?.toLowerCase().includes('pickup') ? 'pickup' : 'stopover',
            });
          }

          // Add end point marker
          if (segment.endLat && segment.endLng) {
            const translatedEndName = translatePointName(segment.endPointName || '');
            newMarkers.push({
              lat: Number(segment.endLat),
              lng: Number(segment.endLng),
              address: translatedEndName,
              name: translatedEndName,
              type: segment.endPointName?.toLowerCase().includes('delivery') ? 'delivery' :
                segment.endPointName?.toLowerCase().includes('carrier') ? 'carrier' : 'stopover',
            });
          }

          // Create route segment
          newRouteSegments.push({
            segmentOrder: segment.segmentOrder || 0,
            startName: translatePointName(segment.startPointName || 'Điểm đầu'),
            endName: translatePointName(segment.endPointName || 'Điểm cuối'),
            path: pathCoordinates,
            tolls: [],
            distance: 0,
            rawResponse: {},
          });
        } catch (error) {
          console.error('[OffRouteMapView] Error processing segment:', error);
        }
      }
    });

    setMarkers(newMarkers);
    setRouteSegments(newRouteSegments);
  }, [plannedRouteSegments]);

  // Handle map instance and add deviation line
  const handleMapReady = useCallback((map: any) => {
    setMapInstance(map);
    mapRef.current = map;
  }, []);

  // Add deviation line when vehicle position and route are available
  useEffect(() => {
    if (!mapRef.current || !currentLocation || deviationLayerAdded.current) return;

    const vehicleLat = activeVehicle?.latitude || currentLocation.lat;
    const vehicleLng = activeVehicle?.longitude || currentLocation.lng;

    if (!vehicleLat || !vehicleLng) return;

    try {
      // Find closest point on route
      let closestPoint: [number, number] | null = null;
      let minDistance = Infinity;

      routeSegments.forEach(segment => {
        if (segment.path && Array.isArray(segment.path)) {
          segment.path.forEach((coord: any) => {
            const lng = Array.isArray(coord) ? coord[0] : coord.lng;
            const lat = Array.isArray(coord) ? coord[1] : coord.lat;
            
            if (!isNaN(lng) && !isNaN(lat)) {
              const dist = Math.sqrt(
                Math.pow(Number(vehicleLat) - lat, 2) + 
                Math.pow(Number(vehicleLng) - lng, 2)
              );
              if (dist < minDistance) {
                minDistance = dist;
                closestPoint = [lng, lat];
              }
            }
          });
        }
      });

      if (closestPoint) {
        // Remove existing deviation layer if any
        if (mapRef.current.getLayer('deviation-line')) {
          mapRef.current.removeLayer('deviation-line');
        }
        if (mapRef.current.getSource('deviation-source')) {
          mapRef.current.removeSource('deviation-source');
        }

        // Add deviation line
        mapRef.current.addSource('deviation-source', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [Number(vehicleLng), Number(vehicleLat)],
                closestPoint
              ]
            }
          }
        });

        mapRef.current.addLayer({
          id: 'deviation-line',
          type: 'line',
          source: 'deviation-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#ef4444', // Red color for deviation
            'line-width': 3,
            'line-dasharray': [2, 2], // Dashed line
          }
        });

        deviationLayerAdded.current = true;
      }
    } catch (error) {
      console.error('[OffRouteMapView] Error adding deviation line:', error);
    }
  }, [currentLocation, activeVehicle, routeSegments, mapInstance]);

  // Update deviation line when vehicle moves
  useEffect(() => {
    if (!mapRef.current || !deviationLayerAdded.current) return;

    const vehicleLat = activeVehicle?.latitude || currentLocation?.lat;
    const vehicleLng = activeVehicle?.longitude || currentLocation?.lng;

    if (!vehicleLat || !vehicleLng) return;

    try {
      // Find closest point on route
      let closestPoint: [number, number] | null = null;
      let minDistance = Infinity;

      routeSegments.forEach(segment => {
        if (segment.path && Array.isArray(segment.path)) {
          segment.path.forEach((coord: any) => {
            const lng = Array.isArray(coord) ? coord[0] : coord.lng;
            const lat = Array.isArray(coord) ? coord[1] : coord.lat;
            
            if (!isNaN(lng) && !isNaN(lat)) {
              const dist = Math.sqrt(
                Math.pow(Number(vehicleLat) - lat, 2) + 
                Math.pow(Number(vehicleLng) - lng, 2)
              );
              if (dist < minDistance) {
                minDistance = dist;
                closestPoint = [lng, lat];
              }
            }
          });
        }
      });

      if (closestPoint && mapRef.current.getSource('deviation-source')) {
        mapRef.current.getSource('deviation-source').setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [Number(vehicleLng), Number(vehicleLat)],
              closestPoint
            ]
          }
        });
      }
    } catch (error) {
      // Ignore errors during updates
    }
  }, [activeVehicle?.latitude, activeVehicle?.longitude]);

  // Format distance for display
  const formatDistance = (meters: number | undefined) => {
    if (!meters) return 'N/A';
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  // Focus map on deviation area between truck and route
  const focusOnDeviation = useCallback(() => {
    if (!mapRef.current || !currentLocation) return;

    const vehicleLat = activeVehicle?.latitude || currentLocation.lat;
    const vehicleLng = activeVehicle?.longitude || currentLocation.lng;

    if (!vehicleLat || !vehicleLng) return;

    try {
      // Find closest point on route for focus bounds
      let closestPoint: [number, number] | null = null;
      let minDistance = Infinity;

      routeSegments.forEach(segment => {
        if (segment.path && Array.isArray(segment.path)) {
          segment.path.forEach((coord: any) => {
            const lng = Array.isArray(coord) ? coord[0] : coord.lng;
            const lat = Array.isArray(coord) ? coord[1] : coord.lat;
            
            if (!isNaN(lng) && !isNaN(lat)) {
              const dist = Math.sqrt(
                Math.pow(Number(vehicleLat) - lat, 2) + 
                Math.pow(Number(vehicleLng) - lng, 2)
              );
              if (dist < minDistance) {
                minDistance = dist;
                closestPoint = [lng, lat];
              }
            }
          });
        }
      });

      if (closestPoint) {
        // Create bounds that include both vehicle position and closest route point
        const bounds = [
          [Number(vehicleLng), Number(vehicleLat)], // Vehicle position
          closestPoint // Closest point on route
        ];

        // Fit map to bounds with padding to show deviation clearly
        mapRef.current.fitBounds(bounds, {
          padding: 50, // 50px padding around bounds
          maxZoom: 16, // Limit zoom level for better context
          duration: 1000 // Smooth animation
        });
      }
    } catch (error) {
      console.error('[OffRouteMapView] Error focusing on deviation:', error);
    }
  }, [currentLocation, activeVehicle, routeSegments]);

  // Auto-focus on deviation when map is ready and data is loaded
  useEffect(() => {
    if (mapInstance && currentLocation && deviationLayerAdded.current) {
      // Small delay to ensure all layers are rendered
      setTimeout(focusOnDeviation, 500);
    }
  }, [mapInstance, currentLocation, focusOnDeviation]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-2">
        {/* Row 1: Title */}
        <div className="flex items-center gap-2 mb-2">
          <EnvironmentOutlined />
          <span className="font-semibold">Theo dõi GPS trực tiếp</span>
        </div>
        {/* Row 2: Status and Vehicle Info */}
        <div className="flex items-center gap-2">
          {isConnecting ? (
            <Tag color="orange" icon={<Spin size="small" />}>Đang kết nối...</Tag>
          ) : isConnected ? (
            <Tag color="green" icon={<WifiOutlined />}>Đã kết nối</Tag>
          ) : (
            <Tag color="red" icon={<DisconnectOutlined />}>Mất kết nối</Tag>
          )}
          {activeVehicle && (
            <Tag color="blue" icon={<TruckOutlined />}>1 xe đang vận chuyển</Tag>
          )}
        </div>
      </div>

      {/* Distance from route indicator */}
      {distanceFromRoute && distanceFromRoute > 0 && (
        <Alert
          message={
            <span>
              Khoảng cách lệch tuyến: <strong className="text-red-600">{formatDistance(distanceFromRoute)}</strong>
            </span>
          }
          type="warning"
          showIcon
          banner
          className="rounded-none"
        />
      )}

      {/* Map */}
      <div className="flex-1 relative">
        <VietMapMap
          mapLocation={null}
          onLocationChange={() => {}}
          markers={markers}
          routeSegments={routeSegments}
          showRouteLines={true}
          animateRoute={false}
          getMapInstance={handleMapReady}
        />

        {/* Vehicle markers overlay */}
        {mapInstance && activeVehicle && (
          <SmoothVehicleMarker
            vehicle={activeVehicle}
            map={mapInstance}
            isSelected={true}
            onMarkerClick={() => {}}
          />
        )}

        {/* No tracking data fallback - show last known position */}
        {mapInstance && !activeVehicle && currentLocation && (
          <div 
            className="absolute z-10"
            style={{
              // This is a simple indicator; real implementation would use map markers
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Position will be handled by map markers */}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-gray-100 p-2 flex items-center gap-4 text-xs border-t">
        <div className="flex items-center gap-1">
          <div className="w-4 h-1 bg-blue-500 rounded"></div>
          <span>Tuyến đường</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-0 border-t-2 border-dashed border-red-500"></div>
          <span className="text-red-600 font-medium">Độ lệch tuyến</span>
        </div>
        <div className="flex items-center gap-1">
          <TruckOutlined className="text-blue-600" />
          <span>Vị trí xe</span>
        </div>
      </div>
    </div>
  );
};

export default OffRouteMapView;
