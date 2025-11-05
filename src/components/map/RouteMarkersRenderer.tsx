import React, { useEffect, useRef } from 'react';

interface RouteMarker {
  id: string;
  lat: number;
  lng: number;
  type: 'pickup' | 'delivery' | 'stopover' | 'carrier';
  name: string;
  vaIndex: number;
}

interface RouteMarkersRendererProps {
  map: any;
  vehicleAssignments: any[];
  selectedVehicleId?: string | null;
}

/**
 * Component để render route markers (pickup, delivery points) lên map
 * - Hiển thị markers cho tất cả routes
 * - Highlight markers của selected vehicle
 * - Làm mờ markers của các vehicle khác
 */
const RouteMarkersRenderer: React.FC<RouteMarkersRendererProps> = ({
  map,
  vehicleAssignments,
  selectedVehicleId
}) => {
  const markersRef = useRef<any[]>([]);
  const markerDataRef = useRef<Map<string, { marker: any, vaIndex: number }>>(new Map());

  // Effect 1: Create/update markers when vehicleAssignments change
  useEffect(() => {
    if (!map || !vehicleAssignments || vehicleAssignments.length === 0) {
      return;
    }

    const markers: RouteMarker[] = [];

    // Collect all markers from vehicle assignments
    vehicleAssignments.forEach((va, vaIndex) => {
      if (!va.journeyHistories || va.journeyHistories.length === 0) {
        return;
      }

      // Process ALL journeys for this vehicle assignment
      va.journeyHistories.forEach((journey: any, journeyIndex: number) => {
        if (!journey || !journey.journeySegments || journey.journeySegments.length === 0) {
          return;
        }

        // Add markers for each segment
        journey.journeySegments.forEach((segment: any, segmentIndex: number) => {
          // Parse path coordinates to get accurate positions on route
          let pathCoords: any[] = [];
          if (segment.pathCoordinatesJson) {
            try {
              pathCoords = JSON.parse(segment.pathCoordinatesJson);
            } catch (error) {
              console.warn('[RouteMarkersRenderer] Error parsing path coordinates:', error);
            }
          }

          // Start point - use FIRST coordinate from path if available, fallback to segment lat/lng
          let startLat = segment.startLatitude;
          let startLng = segment.startLongitude;
          
          if (pathCoords.length > 0) {
            const firstCoord = pathCoords[0];
            startLng = Array.isArray(firstCoord) ? firstCoord[0] : firstCoord.lng;
            startLat = Array.isArray(firstCoord) ? firstCoord[1] : firstCoord.lat;
          }

          if (startLat && startLng &&
              !isNaN(startLat) && !isNaN(startLng) &&
              isFinite(startLat) && isFinite(startLng)) {
            const startType = segment.startPointName?.toLowerCase().includes('carrier') ? 'carrier' :
                             segment.startPointName?.toLowerCase().includes('pickup') ? 'pickup' : 'stopover';
            
            markers.push({
              id: `${vaIndex}-${journeyIndex}-start-${segmentIndex}`,
              lat: startLat,
              lng: startLng,
              type: startType,
              name: segment.startPointName || 'Điểm đầu',
              vaIndex
            });
          }

          // End point (only for last segment to avoid duplicates)
          // Use LAST coordinate from path if available, fallback to segment lat/lng
          if (segmentIndex === journey.journeySegments.length - 1) {
            let endLat = segment.endLatitude;
            let endLng = segment.endLongitude;
            
            if (pathCoords.length > 0) {
              const lastCoord = pathCoords[pathCoords.length - 1];
              endLng = Array.isArray(lastCoord) ? lastCoord[0] : lastCoord.lng;
              endLat = Array.isArray(lastCoord) ? lastCoord[1] : lastCoord.lat;
            }

            if (endLat && endLng &&
                !isNaN(endLat) && !isNaN(endLng) &&
                isFinite(endLat) && isFinite(endLng)) {
              const endType = segment.endPointName?.toLowerCase().includes('delivery') ? 'delivery' :
                             segment.endPointName?.toLowerCase().includes('carrier') ? 'carrier' : 'stopover';
              
              markers.push({
                id: `${vaIndex}-${journeyIndex}-end-${segmentIndex}`,
                lat: endLat,
                lng: endLng,
                type: endType,
                name: segment.endPointName || 'Điểm cuối',
                vaIndex
              });
            }
          }
        });
      });
    });

    // Check if we need to recreate markers (only if marker IDs changed)
    const newMarkerIds = new Set(markers.map(m => m.id));
    const existingMarkerIds = new Set(markerDataRef.current.keys());
    const needsRecreate = markers.length !== markerDataRef.current.size ||
                          !Array.from(newMarkerIds).every(id => existingMarkerIds.has(id));

    if (!needsRecreate) {
      console.log('[RouteMarkersRenderer] Markers unchanged, skipping recreation');
      return;
    }

    console.log('[RouteMarkersRenderer] Recreating markers');

    // Clear previous markers
    markerDataRef.current.forEach(({ marker }) => {
      try {
        marker.remove();
      } catch (error) {
        console.warn('[RouteMarkersRenderer] Error removing marker:', error);
      }
    });
    markerDataRef.current.clear();
    markersRef.current = [];

    // Render markers
    markers.forEach(marker => {
      try {
        // Create marker element
        const el = document.createElement('div');
        el.style.cssText = `
          width: 32px;
          height: 32px;
          background-color: ${getMarkerColor(marker.type)};
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          opacity: 0.5;
          pointer-events: auto;
          transform: none;
          transition: none;
          will-change: auto;
        `;
        el.innerHTML = getMarkerIcon(marker.type);
        el.title = marker.name;

        // Create marker - it will stay fixed at geographic coordinates
        // Markers in VietMap GL are automatically positioned at their lng/lat
        // and will not move relative to the map when panning/zooming
        const vietMarker = new window.vietmapgl.Marker({
          element: el,
          anchor: 'center',
          pitchAlignment: 'viewport',
          rotationAlignment: 'viewport',
          draggable: false
        })
          .setLngLat([marker.lng, marker.lat])
          .addTo(map);

        markersRef.current.push(vietMarker);
        markerDataRef.current.set(marker.id, { marker: vietMarker, vaIndex: marker.vaIndex });

        console.log(`[RouteMarkersRenderer] Marker ${marker.id} created`);
      } catch (error) {
        console.error(`[RouteMarkersRenderer] Error rendering marker ${marker.id}:`, error);
      }
    });

    return () => {
      // Cleanup on unmount
      markerDataRef.current.forEach(({ marker }) => {
        try {
          marker.remove();
        } catch (error) {
          console.warn('[RouteMarkersRenderer] Error removing marker on cleanup:', error);
        }
      });
      markerDataRef.current.clear();
      markersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, vehicleAssignments.length, vehicleAssignments.map((va: any) => va.id).join(',')]);

  // Effect 2: Update marker opacity when selectedVehicleId changes
  useEffect(() => {
    if (!selectedVehicleId) {
      // Reset all markers to default opacity
      markerDataRef.current.forEach(({ marker }) => {
        const el = marker.getElement();
        if (el) {
          el.style.opacity = '0.5';
        }
      });
      return;
    }

    // Update opacity based on selection
    markerDataRef.current.forEach(({ marker, vaIndex }) => {
      const el = marker.getElement();
      if (el) {
        const isSelected = vehicleAssignments[vaIndex]?.id === selectedVehicleId;
        el.style.opacity = isSelected ? '1' : '0.5';
      }
    });
  }, [selectedVehicleId, vehicleAssignments]);

  return null; // This component doesn't render anything directly
};

function getMarkerColor(type: string): string {
  switch (type) {
    case 'pickup':
      return '#52c41a'; // Green
    case 'delivery':
      return '#f5222d'; // Red
    case 'carrier':
      return '#faad14'; // Orange
    case 'stopover':
      return '#1890ff'; // Blue
    default:
      return '#8c8c8c'; // Gray
  }
}

function getMarkerIcon(type: string): string {
  switch (type) {
    case 'pickup':
      return '📦'; // Package
    case 'delivery':
      return '🎯'; // Target
    case 'carrier':
      return '🏭'; // Factory
    case 'stopover':
      return '📍'; // Pin
    default:
      return '📍';
  }
}

export default React.memo(RouteMarkersRenderer);