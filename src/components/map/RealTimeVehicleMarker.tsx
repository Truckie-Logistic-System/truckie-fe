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
 * Marker sẽ tự động cập nhật vị trí khi nhận được dữ liệu mới
 */
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
  const isCleaningUpRef = useRef(false); // Track if we're in cleanup phase

  // Effect 1: Create marker ONCE - never remove until component unmounts
  useEffect(() => {
    // Debug logging disabled for performance
    // console.log('=== [RealTimeVehicleMarker] CREATE MARKER EFFECT ===');
    // console.log('map:', map ? 'EXISTS' : 'NULL');
    // console.log('vehicle:', vehicle);
    // console.log('isCleaningUp:', isCleaningUpRef.current);
    
    if (!map || !vehicle || !window.vietmapgl) {
      return;
    }

    // Skip creation if we're in cleanup phase (StrictMode remount)
    if (isCleaningUpRef.current) {
      // Reset flag and reuse existing marker
      isCleaningUpRef.current = false;
      return;
    }

    // Only create if marker doesn't exist
    if (markerRef.current) {
      return;
    }

    // Creating marker for vehicle: vehicle.vehicleId

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
              ${vehicle.latitude.toFixed(6)}, ${vehicle.longitude.toFixed(6)}
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
      transition: all 0.3s ease;
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

    // Tạo marker
    const marker = new window.vietmapgl.Marker({
      element: el,
      anchor: 'center'
    })
      .setLngLat([vehicle.longitude, vehicle.latitude])
      .setPopup(popup)
      .addTo(map);

    markerRef.current = marker;
    // Marker created successfully

    // Thêm event click
    el.addEventListener('click', () => {
      if (onMarkerClick) {
        onMarkerClick(vehicle);
      }
      marker.togglePopup();
    });

    // Cleanup - Mark that we're cleaning up (for StrictMode double-mount handling)
    return () => {
      isCleaningUpRef.current = true;
      
      // Don't actually remove marker immediately - let it persist for remount
      // Only remove if this is a real unmount (not StrictMode test)
      setTimeout(() => {
        if (isCleaningUpRef.current && markerRef.current) {
          markerRef.current.remove();
          markerRef.current = null;
          popupRef.current = null;
          markerElementRef.current = null;
        }
      }, 100); // Small delay to allow remount to cancel cleanup
    };
  }, [vehicle.vehicleId, map]); // Only depend on vehicleId and map - NEVER recreate for position changes

  // Effect 2: Update marker position and styling - NO cleanup, just updates
  useEffect(() => {
    if (!markerRef.current || !vehicle) return;

    // Validate position before updating
    if (isNaN(vehicle.latitude) || isNaN(vehicle.longitude) ||
        !isFinite(vehicle.latitude) || !isFinite(vehicle.longitude)) {
      console.error('❌ Invalid position data, skipping update');
      return;
    }

    // Update position
    markerRef.current.setLngLat([vehicle.longitude, vehicle.latitude]);

    // Update styling based on selection state
    const markerElement = markerRef.current.getElement();
    if (markerElement) {
      const backgroundColor = isSelected ? '#52c41a' : '#1890ff';
      const opacity = isHighlighted ? '1' : '0.4';
      const scale = isSelected ? '1.2' : '1';
      const zIndex = isSelected ? '1000' : '100';
      const animation = isSelected ? 'pulse-selected' : 'pulse';

      markerElement.style.backgroundColor = backgroundColor;
      markerElement.style.opacity = opacity;
      markerElement.style.transform = `scale(${scale})`;
      markerElement.style.zIndex = zIndex;
      markerElement.style.animation = `${animation} 2s infinite`;
    }

    // Update popup content
    if (popupRef.current) {
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
                ${vehicle.latitude.toFixed(6)}, ${vehicle.longitude.toFixed(6)}
              </div>
            </div>
            <div style="color: #999; font-size: 11px; margin-top: 4px;">
              ⏱️ Cập nhật: ${new Date(vehicle.lastUpdated).toLocaleString('vi-VN')}
            </div>
          </div>
        </div>
      `;
      popupRef.current.setHTML(popupContent);
    }

    // Marker updated
    // NO cleanup - marker stays alive
  }, [vehicle, isSelected, isHighlighted, onMarkerClick]); // Update when these change

  return null; // Component không render gì, chỉ quản lý marker
};

export default RealTimeVehicleMarker;
