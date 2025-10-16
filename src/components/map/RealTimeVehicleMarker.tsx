import React, { useEffect, useRef } from 'react';
import type { VehicleLocationMessage } from '../../hooks/useVehicleTracking';

interface RealTimeVehicleMarkerProps {
  vehicle: VehicleLocationMessage;
  map: any;
  onMarkerClick?: (vehicle: VehicleLocationMessage) => void;
}

/**
 * Component để hiển thị marker xe real-time trên bản đồ
 * Marker sẽ tự động cập nhật vị trí khi nhận được dữ liệu mới
 */
const RealTimeVehicleMarker: React.FC<RealTimeVehicleMarkerProps> = ({
  vehicle,
  map,
  onMarkerClick
}) => {
  const markerRef = useRef<any>(null);
  const popupRef = useRef<any>(null);

  useEffect(() => {
    console.log('=== [RealTimeVehicleMarker] EFFECT TRIGGERED ===');
    console.log('map:', map ? 'EXISTS' : 'NULL');
    console.log('vehicle:', vehicle);
    console.log('window.vietmapgl:', typeof window.vietmapgl !== 'undefined' ? 'AVAILABLE' : 'NOT AVAILABLE');
    
    if (!map) {
      console.warn('[RealTimeVehicleMarker] Map not available yet');
      return;
    }
    
    if (!vehicle) {
      console.warn('[RealTimeVehicleMarker] Vehicle data not available');
      return;
    }
    
    if (!window.vietmapgl) {
      console.error('[RealTimeVehicleMarker] VietMapGL not loaded!');
      return;
    }

    console.log('=== [RealTimeVehicleMarker] CREATING/UPDATING MARKER ===');
    console.log('Vehicle ID:', vehicle.vehicleId);
    console.log('License Plate:', vehicle.licensePlateNumber);
    console.log('Position:', { lat: vehicle.latitude, lng: vehicle.longitude });
    console.log('[RealTimeVehicleMarker] Creating/updating marker for vehicle:', vehicle.vehicleId);

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

    // Tạo custom marker element với animation
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
    `;
    el.innerHTML = '🚛';
    el.title = vehicle.licensePlateNumber;

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
      .real-time-vehicle-marker:hover {
        transform: scale(1.2);
        z-index: 1000;
      }
    `;
    if (!document.getElementById('vehicle-marker-styles')) {
      style.id = 'vehicle-marker-styles';
      document.head.appendChild(style);
    }

    // Nếu marker đã tồn tại, chỉ cập nhật vị trí
    if (markerRef.current) {
      console.log('=== [RealTimeVehicleMarker] UPDATING EXISTING MARKER ===');
      console.log('Old position:', markerRef.current.getLngLat());
      console.log('New position:', [vehicle.longitude, vehicle.latitude]);
      markerRef.current.setLngLat([vehicle.longitude, vehicle.latitude]);
      console.log('Marker position updated successfully');
      
      // Cập nhật popup content
      if (popupRef.current) {
        popupRef.current.setHTML(popupContent);
      }
    } else {
      // Tạo marker mới
      console.log('=== [RealTimeVehicleMarker] CREATING NEW MARKER ===');
      console.log('Position:', [vehicle.longitude, vehicle.latitude]);
      console.log('Vehicle:', vehicle);
      
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
      console.log('Marker created and added to map successfully');
      console.log('Marker reference:', markerRef.current);

      // Thêm event click
      el.addEventListener('click', () => {
        console.log('=== [RealTimeVehicleMarker] MARKER CLICKED ===');
        console.log('Vehicle ID:', vehicle.vehicleId);
        console.log('Vehicle:', vehicle);
        if (onMarkerClick) {
          onMarkerClick(vehicle);
        }
        // Mở popup
        marker.togglePopup();
      });
    }

    // Cleanup function
    return () => {
      if (markerRef.current) {
        console.log('=== [RealTimeVehicleMarker] CLEANUP - REMOVING MARKER ===');
        console.log('Vehicle ID:', vehicle.vehicleId);
        markerRef.current.remove();
        markerRef.current = null;
        console.log('Marker removed successfully');
      }
      if (popupRef.current) {
        popupRef.current = null;
      }
    };
  }, [vehicle, map, onMarkerClick]);

  return null; // Component không render gì, chỉ quản lý marker
};

export default RealTimeVehicleMarker;
