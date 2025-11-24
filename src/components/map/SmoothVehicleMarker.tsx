import React, { useEffect, useRef } from 'react';
import type { VehicleLocationMessage } from '../../hooks/useVehicleTracking';
import VehicleLocationCache from '../../utils/vehicleLocationCache';

interface SmoothVehicleMarkerProps {
  vehicle: VehicleLocationMessage;
  map: any;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onMarkerClick?: (vehicle: VehicleLocationMessage) => void;
  showOfflineStatus?: boolean;
}

const SmoothVehicleMarker: React.FC<SmoothVehicleMarkerProps> = ({
  vehicle,
  map,
  isSelected = false,
  isHighlighted = false,
  onMarkerClick,
  showOfflineStatus = true
}) => {
  const markerRef = useRef<any>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const cacheRef = useRef(VehicleLocationCache.getInstance());

  // Initialize marker - ONLY when map or vehicleId changes
  useEffect(() => {
    if (!map || !vehicle || !window.vietmapgl) return;
    if (markerRef.current) return;

    // Kiểm tra trạng thái online của vehicle
    const isOnline = showOfflineStatus ? cacheRef.current.isVehicleOnline(vehicle) : true;

    const el = document.createElement('div');
    el.style.cssText = `
      width: 40px;
      height: 40px;
      background-color: ${isOnline ? '#1890ff' : '#ff7875'};
      border: 3px solid white;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      opacity: ${isOnline ? '0.8' : '0.6'};
      pointer-events: auto !important;
      transform: none !important;
      transition: none !important;
      will-change: auto !important;
      position: absolute !important;
      ${!isOnline ? 'filter: grayscale(0.3);' : ''}
    `;
    el.innerHTML = '🚛';
    // el.title = `${vehicle.licensePlateNumber} ${!isOnline ? '(Offline)' : '(Online)'}`;

    el.addEventListener('click', () => {
      if (onMarkerClick) {
        onMarkerClick(vehicle);
      }
    });

    const marker = new window.vietmapgl.Marker({
      element: el,
      anchor: 'center',
      pitchAlignment: 'viewport',
      rotationAlignment: 'viewport',
      draggable: false,
      offset: [0, 0] // Force exact positioning, no collision avoidance
    })
      .setLngLat([vehicle.longitude, vehicle.latitude])
      .addTo(map);

    markerRef.current = marker;
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, [map, vehicle.vehicleId, vehicle.licensePlateNumber, onMarkerClick, showOfflineStatus]);

  // Update initial position when vehicle first loads
  useEffect(() => {
    if (!markerRef.current || !vehicle.latitude || !vehicle.longitude) return;

    // Only set initial position if marker was just created
    const currentPos = markerRef.current.getLngLat();
    if (currentPos.lat === 0 && currentPos.lng === 0) {
      markerRef.current.setLngLat([vehicle.longitude, vehicle.latitude]);
    }
  }, [vehicle.vehicleId]);

  // Update position when vehicle data changes
  useEffect(() => {
    if (!markerRef.current) return;

    const now = performance.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

    // Only update if enough time has passed (throttle updates)
    if (timeSinceLastUpdate < 100) return; // Max 10 FPS updates

    // CRITICAL: Check for null/undefined first
    if (vehicle.latitude == null || vehicle.longitude == null) {
      console.error(`❌ [VEHICLE] Null/undefined coordinates for vehicle ${vehicle.vehicleId}`, vehicle);
      return;
    }

    // Validate coordinates
    if (isNaN(vehicle.latitude) || isNaN(vehicle.longitude) ||
        !isFinite(vehicle.latitude) || !isFinite(vehicle.longitude)) {
      console.error(`❌ [VEHICLE] Invalid coordinates for vehicle ${vehicle.vehicleId}`, vehicle);
      return;
    }

    // Skip (0, 0) coordinates - likely bad data
    if (Math.abs(vehicle.latitude) < 0.001 && Math.abs(vehicle.longitude) < 0.001) {
      console.error(`🚫 [VEHICLE] Skipping (0, 0) coordinates for vehicle ${vehicle.vehicleId}`, vehicle);
      return;
    }

    // Jump directly to new position without animation
    // This prevents the "jumping" effect when camera pans/zooms
    markerRef.current.setLngLat([vehicle.longitude, vehicle.latitude]);
    

    lastUpdateTimeRef.current = now;
  }, [vehicle.latitude, vehicle.longitude, vehicle.vehicleId]);

  // Update marker styling when selection changes or online status changes
  useEffect(() => {
    if (!markerRef.current) return;

    const isOnline = showOfflineStatus ? cacheRef.current.isVehicleOnline(vehicle) : true;
    const element = markerRef.current.getElement();

    if (element) {
      // Ưu tiên trạng thái selected, sau đó đến online status
      if (isSelected) {
        element.style.backgroundColor = '#52c41a'; // Xanh lá khi được chọn
      } else if (!isOnline) {
        element.style.backgroundColor = '#ff7875'; // Đỏ khi offline
      } else {
        element.style.backgroundColor = '#1890ff'; // Xanh dương bình thường
      }

      element.style.opacity = isHighlighted ? '1' : (isOnline ? '0.8' : '0.6');
      element.style.borderWidth = isSelected ? '4px' : '3px';
      element.style.filter = !isOnline && !isSelected ? 'grayscale(0.3)' : 'none';
      // element.title = `${vehicle.licensePlateNumber} ${!isOnline ? '(Offline)' : '(Online)'}`;
    }
  }, [isSelected, isHighlighted, vehicle.lastUpdated, vehicle.licensePlateNumber, showOfflineStatus]);

  return null; // This component doesn't render anything directly
};

// Memoize to prevent unnecessary re-renders
export default React.memo(SmoothVehicleMarker, (prevProps, nextProps) => {
  return (
    prevProps.vehicle.vehicleId === nextProps.vehicle.vehicleId &&
    prevProps.vehicle.latitude === nextProps.vehicle.latitude &&
    prevProps.vehicle.longitude === nextProps.vehicle.longitude &&
    prevProps.vehicle.lastUpdated === nextProps.vehicle.lastUpdated &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.showOfflineStatus === nextProps.showOfflineStatus &&
    prevProps.map === nextProps.map
  );
});