import React, { useEffect, useRef } from 'react';
import type { VehicleLocationMessage } from '../../hooks/useVehicleTracking';

interface RealTimeVehicleMarkerProps {
  vehicle: VehicleLocationMessage;
  map: any;
  onMarkerClick?: (vehicle: VehicleLocationMessage) => void;
  isSelected?: boolean;
  isHighlighted?: boolean;
}

/**
 * Component để hiển thị marker xe real-time trên bản đồ
 * Sử dụng imperative updates - marker NEVER recreated, only position updated
 */

// Helper function to validate if coordinates are valid and in Vietnam
const isValidVietnamCoordinates = (lat: number, lng: number): boolean => {
  // Check for NaN or Infinity
  if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
    return false;
  }
  
  // Block (0, 0) or near-zero
  if (Math.abs(lat) < 0.001 && Math.abs(lng) < 0.001) {
    return false;
  }
  
  // Block California GPS (emulator default)
  const isCaliforniaGPS = (lat >= 32.0 && lat <= 42.0) && (lng >= -125.0 && lng <= -114.0);
  if (isCaliforniaGPS) {
    return false;
  }
  
  // Only accept Vietnam coordinates (rough bounds)
  const isVietnamGPS = (lat >= 8.0 && lat <= 24.0) && (lng >= 102.0 && lng <= 110.0);
  return isVietnamGPS;
};

const RealTimeVehicleMarker: React.FC<RealTimeVehicleMarkerProps> = ({
  vehicle,
  map,
  onMarkerClick,
  isSelected = false,
  isHighlighted = true
}) => {
  const markerRef = useRef<any>(null);
  const popupRef = useRef<any>(null);
  const markerElementRef = useRef<HTMLDivElement | null>(null);
  const lastValidPositionRef = useRef<{lat: number, lng: number} | null>(null);
  const targetPositionRef = useRef<{lat: number, lng: number} | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const vehicleIdRef = useRef<string>(vehicle.vehicleId);

  // EFFECT 1: Create marker once on mount
  useEffect(() => {
    if (!map || !window.vietmapgl) {
      return;
    }

    console.log(`🎯 [${vehicle.vehicleId}] Initializing marker...`);
    
    // Find first valid position to create marker
    let initialLat = vehicle.latitude;
    let initialLng = vehicle.longitude;
    
    // If initial position is invalid, use default Vietnam center and wait for valid data
    if (!isValidVietnamCoordinates(initialLat, initialLng)) {
      console.warn(`⚠️ [${vehicle.vehicleId}] Initial position invalid, using Vietnam center temporarily`);
      initialLat = 10.8231; // Ho Chi Minh City
      initialLng = 106.6297;
    } else {
      lastValidPositionRef.current = { lat: initialLat, lng: initialLng };
      console.log(`✅ [${vehicle.vehicleId}] Initial valid position: [${initialLat.toFixed(6)}, ${initialLng.toFixed(6)}]`);
    }

    // Tạo HTML cho popup thông tin xe
    const popupContent = `
      <div class="vehicle-popup" style="min-width: 280px; padding: 8px;">
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #1890ff; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 18px;">🚛</span>
          <span>${vehicle.licensePlateNumber}</span>
          <span style="background: #1890ff; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">
            ${vehicle.assignmentStatus}
          </span>
        </div>
        
        <div style="border-top: 1px solid #e8e8e8; padding-top: 8px; margin-top: 8px;">
          <div style="margin-bottom: 6px;">
            <span style="color: #666; font-size: 12px;">🏭 Hãng:</span>
            <span style="margin-left: 4px; font-weight: 500;">${vehicle.manufacturer}</span>
          </div>
          <div style="margin-bottom: 6px;">
            <span style="color: #666; font-size: 12px;">🚚 Loại xe:</span>
            <span style="margin-left: 4px; font-weight: 500;">${vehicle.vehicleTypeName}</span>
          </div>
          <div style="margin-bottom: 6px;">
            <span style="color: #666; font-size: 12px;">📦 Mã:</span>
            <span style="margin-left: 4px; font-weight: 500;">${vehicle.trackingCode}</span>
          </div>
        </div>

        <div style="border-top: 1px solid #e8e8e8; padding-top: 8px; margin-top: 8px;">
          <div style="margin-bottom: 6px;">
            <span style="color: #666; font-size: 12px;">👤 Tài xế chính:</span>
            <div style="margin-left: 16px; margin-top: 2px;">
              <div style="font-weight: 500;">${vehicle.driver1Name || 'Chưa có'}</div>
              ${vehicle.driver1Phone ? `<div style="color: #666; font-size: 11px;">📞 ${vehicle.driver1Phone}</div>` : ''}
            </div>
          </div>
          ${vehicle.driver2Name ? `
            <div style="margin-bottom: 6px;">
              <span style="color: #666; font-size: 12px;">👥 Tài xế phụ:</span>
              <div style="margin-left: 16px; margin-top: 2px;">
                <div style="font-weight: 500;">${vehicle.driver2Name}</div>
                ${vehicle.driver2Phone ? `<div style="color: #666; font-size: 11px;">📞 ${vehicle.driver2Phone}</div>` : ''}
              </div>
            </div>
          ` : ''}
        </div>

        <div style="border-top: 1px solid #e8e8e8; padding-top: 8px; margin-top: 8px;">
          <div style="margin-bottom: 4px;">
            <span style="color: #666; font-size: 12px;">📍 Vị trí:</span>
            <div style="margin-left: 16px; margin-top: 2px; font-family: monospace; font-size: 11px; color: #666;">
              ${vehicle.latitude != null ? vehicle.latitude.toFixed(6) : 'N/A'}, ${vehicle.longitude != null ? vehicle.longitude.toFixed(6) : 'N/A'}
            </div>
          </div>
          <div style="color: #999; font-size: 11px; margin-top: 4px;">
            ⏱️ Cập nhật: ${new Date(vehicle.lastUpdated).toLocaleString('vi-VN')}
          </div>
        </div>
      </div>
    `;

    // Tạo custom marker element
    const el = document.createElement('div');
    el.className = 'real-time-vehicle-marker';
    el.style.cssText = `
      width: 40px;
      height: 40px;
      background-color: #1890ff;
      border: 3px solid white;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transition: transform 0.3s ease-out, background-color 0.2s ease;
      position: relative;
      animation: pulse 2s infinite;
      opacity: 1;
      transform: scale(1);
      z-index: 100;
    `;
    el.innerHTML = '🚛';
    el.title = vehicle.licensePlateNumber;
    
    markerElementRef.current = el;

    // Thêm animation pulse
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% {
          box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 0 rgba(24, 144, 255, 0.7);
        }
        50% {
          box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 10px rgba(24, 144, 255, 0);
        }
        100% {
          box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 0 rgba(24, 144, 255, 0);
        }
      }
      @keyframes pulse-selected {
        0% {
          box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 0 rgba(82, 196, 26, 0.7);
        }
        50% {
          box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 15px rgba(82, 196, 26, 0);
        }
        100% {
          box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 0 rgba(82, 196, 26, 0);
        }
      }
      .real-time-vehicle-marker:hover {
        transform: scale(1.3) !important;
        z-index: 1001 !important;
      }
    `;
    if (!document.getElementById('vehicle-marker-styles')) {
      style.id = 'vehicle-marker-styles';
      document.head.appendChild(style);
    }

    // Tạo popup
    const popup = new window.vietmapgl.Popup({
      offset: 25,
      closeButton: true,
      closeOnClick: false,
      maxWidth: '320px'
    }).setHTML(popupContent);

    popupRef.current = popup;

    // Tạo marker với initial valid position
    const marker = new window.vietmapgl.Marker({
      element: el,
      anchor: 'center'
    })
      .setLngLat([initialLng, initialLat])
      .setPopup(popup)
      .addTo(map);

      markerRef.current = marker;
      markerElementRef.current = el;
      console.log(`✅ [${vehicle.vehicleId}] Marker created at [${initialLat.toFixed(6)}, ${initialLng.toFixed(6)}]`);

      // Thêm event click
      el.addEventListener('click', () => {
        if (onMarkerClick) {
          onMarkerClick(vehicle);
        }
        marker.togglePopup();
      });

    // CLEANUP: Only remove marker on component unmount
    return () => {
      console.log(`🗑️ [${vehicleIdRef.current}] Removing marker`);
      
      // Cancel animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      popupRef.current = null;
      markerElementRef.current = null;
      lastValidPositionRef.current = null;
      targetPositionRef.current = null;
    };
  }, [map]); // Only run once on mount

  // EFFECT 2: Update marker position when coordinates change
  useEffect(() => {
    if (!markerRef.current) {
      return;
    }

    const newLat = vehicle.latitude;
    const newLng = vehicle.longitude;
    
    // Only update target if coordinates are valid
    if (isValidVietnamCoordinates(newLat, newLng)) {
      const lastValidPos = lastValidPositionRef.current;
      
      // Check if position actually changed
      if (lastValidPos) {
        const latDiff = Math.abs(lastValidPos.lat - newLat);
        const lngDiff = Math.abs(lastValidPos.lng - newLng);
        
        // Only update if position changed significantly (> 1 meter)
        if (latDiff >= 0.00001 || lngDiff >= 0.00001) {
          // Log significant moves
          if (latDiff > 0.0001 || lngDiff > 0.0001) {
            console.log(`📍 [${vehicle.vehicleId}] New target: [${lastValidPos.lat.toFixed(6)}, ${lastValidPos.lng.toFixed(6)}] → [${newLat.toFixed(6)}, ${newLng.toFixed(6)}]`);
          }
          
          // Set new target position for animation
          targetPositionRef.current = { lat: newLat, lng: newLng };
        }
      } else {
        // First valid position after creation with default center
        console.log(`✅ [${vehicle.vehicleId}] First valid position received: [${newLat.toFixed(6)}, ${newLng.toFixed(6)}]`);
        targetPositionRef.current = { lat: newLat, lng: newLng };
        lastValidPositionRef.current = { lat: newLat, lng: newLng };
        markerRef.current.setLngLat([newLng, newLat]);
      }
    } else {
      // Invalid coordinates - keep marker at last valid position
      if (lastValidPositionRef.current) {
        console.warn(`⚠️ [${vehicle.vehicleId}] Invalid coords [${newLat}, ${newLng}], keeping at last valid position`);
      }
    }
    
    // ANIMATE MARKER to target position using requestAnimationFrame
    const animateMarker = () => {
      if (!markerRef.current || !targetPositionRef.current || !lastValidPositionRef.current) {
        return;
      }
      
      const current = lastValidPositionRef.current;
      const target = targetPositionRef.current;
      
      // Calculate distance to target
      const latDiff = target.lat - current.lat;
      const lngDiff = target.lng - current.lng;
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      
      // If close enough to target, snap to it
      if (distance < 0.000001) {
        markerRef.current.setLngLat([target.lng, target.lat]);
        lastValidPositionRef.current = { ...target };
        return;
      }
      
      // Smooth interpolation: move 10% of the distance each frame
      const step = 0.1;
      const newLatInterp = current.lat + latDiff * step;
      const newLngInterp = current.lng + lngDiff * step;
      
      // Update marker position
      markerRef.current.setLngLat([newLngInterp, newLatInterp]);
      lastValidPositionRef.current = { lat: newLatInterp, lng: newLngInterp };
      
      // Continue animation
      animationFrameRef.current = requestAnimationFrame(animateMarker);
    };
    
    // Start animation if marker exists
    if (markerRef.current && targetPositionRef.current) {
      // Cancel previous animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Start new animation
      animationFrameRef.current = requestAnimationFrame(animateMarker);
    }
  }, [vehicle.vehicleId, vehicle.latitude, vehicle.longitude]);

  // EFFECT 3: Update styling when selection state changes
  useEffect(() => {
    if (!markerElementRef.current) {
      return;
    }

    const backgroundColor = isSelected ? '#52c41a' : '#1890ff';
    const opacity = isHighlighted ? '1' : '0.4';
    const scale = isSelected ? '1.2' : '1';
    const zIndex = isSelected ? '1000' : '100';
    const animation = isSelected ? 'pulse-selected' : 'pulse';

    markerElementRef.current.style.backgroundColor = backgroundColor;
    markerElementRef.current.style.opacity = opacity;
    markerElementRef.current.style.transform = `scale(${scale})`;
    markerElementRef.current.style.zIndex = zIndex;
    markerElementRef.current.style.animation = `${animation} 2s infinite`;
  }, [isSelected, isHighlighted]);

  // EFFECT 4: Update popup content when vehicle data changes
  useEffect(() => {
    if (!popupRef.current) {
      return;
    }

    const popupContent = `
      <div class="vehicle-popup" style="min-width: 280px; padding: 8px;">
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #1890ff; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 18px;">🚛</span>
          <span>${vehicle.licensePlateNumber}</span>
          <span style="background: #1890ff; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">
            ${vehicle.assignmentStatus}
          </span>
        </div>
        <div style="border-top: 1px solid #e8e8e8; padding-top: 8px; margin-top: 8px;">
          <div style="margin-bottom: 6px;">
            <span style="color: #666; font-size: 12px;">🏭 Hãng:</span>
            <span style="margin-left: 4px; font-weight: 500;">${vehicle.manufacturer}</span>
          </div>
          <div style="margin-bottom: 6px;">
            <span style="color: #666; font-size: 12px;">🚚 Loại xe:</span>
            <span style="margin-left: 4px; font-weight: 500;">${vehicle.vehicleTypeName}</span>
          </div>
          <div style="margin-bottom: 6px;">
            <span style="color: #666; font-size: 12px;">📦 Mã:</span>
            <span style="margin-left: 4px; font-weight: 500;">${vehicle.trackingCode}</span>
          </div>
        </div>
        <div style="border-top: 1px solid #e8e8e8; padding-top: 8px; margin-top: 8px;">
          <div style="margin-bottom: 6px;">
            <span style="color: #666; font-size: 12px;">👤 Tài xế 1:</span>
            <span style="margin-left: 4px; font-weight: 500;">${vehicle.driver1Name || 'Chưa có'}</span>
            ${vehicle.driver1Phone ? `<span style="margin-left: 4px; color: #666;">${vehicle.driver1Phone}</span>` : ''}
          </div>
          ${vehicle.driver2Name ? `
            <div style="margin-bottom: 6px;">
              <span style="color: #666; font-size: 12px;">👥 Tài xế 2:</span>
              <span style="margin-left: 4px; font-weight: 500;">${vehicle.driver2Name}</span>
              ${vehicle.driver2Phone ? `<span style="margin-left: 4px; color: #666;">${vehicle.driver2Phone}</span>` : ''}
            </div>
          ` : ''}
        </div>
        <div style="border-top: 1px solid #e8e8e8; padding-top: 8px; margin-top: 8px;">
          <div style="margin-bottom: 6px;">
            <span style="color: #666; font-size: 12px;">📍 Vị trí:</span>
            <div style="margin-left: 16px; margin-top: 2px; font-family: monospace; font-size: 11px; color: #666;">
              ${vehicle.latitude != null ? vehicle.latitude.toFixed(6) : 'N/A'}, ${vehicle.longitude != null ? vehicle.longitude.toFixed(6) : 'N/A'}
            </div>
          </div>
          <div style="color: #999; font-size: 11px; margin-top: 4px;">
            ⏱️ Cập nhật: ${new Date(vehicle.lastUpdated).toLocaleString('vi-VN')}
          </div>
        </div>
      </div>
    `;
    popupRef.current.setHTML(popupContent);
  }, [vehicle]);

  return null; // Component không render gì, chỉ quản lý marker
};

// Memoize component to prevent unnecessary recreations
// Only re-render if vehicle.vehicleId, vehicle.latitude, vehicle.longitude, isSelected, or isHighlighted changes
export default React.memo(RealTimeVehicleMarker, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render)
  // Return false if props changed (re-render)
  
  const vehicleEqual = 
    prevProps.vehicle.vehicleId === nextProps.vehicle.vehicleId &&
    prevProps.vehicle.latitude === nextProps.vehicle.latitude &&
    prevProps.vehicle.longitude === nextProps.vehicle.longitude;
  
  const propsEqual = 
    vehicleEqual &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.map === nextProps.map;
  
  // Only log if actually re-rendering (props changed)
  // Remove this log in production - too verbose
  // if (!propsEqual) {
  //   console.log(`🔄 RealTimeVehicleMarker re-rendering for vehicle ${nextProps.vehicle.vehicleId}`);
  // }
  
  return propsEqual;
});
