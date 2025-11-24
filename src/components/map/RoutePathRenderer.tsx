import React, { useEffect, useRef } from 'react';

interface RoutePathRendererProps {
  map: any;
  vehicleAssignments: any[];
  selectedVehicleId?: string | null;
}

/**
 * Component để render tất cả routes từ vehicle assignments lên map
 * - Hiển thị tất cả routes
 * - Highlight route của selected vehicle
 * - Làm mờ các route khác
 */
const RoutePathRenderer: React.FC<RoutePathRendererProps> = ({
  map,
  vehicleAssignments,
  selectedVehicleId
}) => {
  const layersRef = useRef<string[]>([]);

  useEffect(() => {
    if (!map || !vehicleAssignments || vehicleAssignments.length === 0) {
      return;
    }

    // Render routes immediately - don't wait for map load
    // The map should already be loaded when this component is rendered

    // First pass: Create/update all routes from all journeys
    const createdLayers: string[] = [];
    vehicleAssignments.forEach((va, vaIndex) => {
      if (!va.journeyHistories || va.journeyHistories.length === 0) {
        return;
      }

      // Only render the latest ACTIVE journey history
      const activeJourneys = va.journeyHistories
        .filter((j: any) => j.status === 'ACTIVE')
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      if (activeJourneys.length === 0) {
        return;
      }

      const latestActiveJourney = activeJourneys[0];
      // Render only the latest ACTIVE journey
      [latestActiveJourney].forEach((journey: any, journeyIndex: number) => {
        if (!journey || !journey.journeySegments || journey.journeySegments.length === 0) {
          return;
        }

        // 🔧 FIX: Render EACH segment separately to avoid straight lines between segments
        journey.journeySegments.forEach((segment: any, segmentIndex: number) => {
          if (!segment.pathCoordinatesJson) {
            return;
          }

          const coordinates: [number, number][] = [];
          
          try {
            const pathCoords = JSON.parse(segment.pathCoordinatesJson);
            if (Array.isArray(pathCoords)) {
              pathCoords.forEach((coord: any) => {
                const lng = Array.isArray(coord) ? coord[0] : coord.lng;
                const lat = Array.isArray(coord) ? coord[1] : coord.lat;
                
                if (!isNaN(lng) && !isNaN(lat) && isFinite(lng) && isFinite(lat)) {
                  coordinates.push([lng, lat]);
                }
              });
            }
          } catch (error) {
            console.warn(`[RoutePathRenderer] Error parsing path coordinates for segment ${segmentIndex}:`, error);
            return;
          }

          if (coordinates.length < 2) {
            return;
          }

          // Create source and layer for THIS segment
          const sourceId = `route-source-${vaIndex}-${journeyIndex}-seg${segmentIndex}`;
          const layerId = `route-layer-${vaIndex}-${journeyIndex}-seg${segmentIndex}`;

          try {
            // Add source if not exists
            if (!map.getSource(sourceId)) {
              map.addSource(sourceId, {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  geometry: {
                    type: 'LineString',
                    coordinates: coordinates
                  },
                  properties: {
                    segmentOrder: segment.segmentOrder || segmentIndex + 1,
                    startPoint: segment.startPointName,
                    endPoint: segment.endPointName
                  }
                }
              });
            } else {
              // Update source data if exists
              map.getSource(sourceId).setData({
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: coordinates
                },
                properties: {
                  segmentOrder: segment.segmentOrder || segmentIndex + 1,
                  startPoint: segment.startPointName,
                  endPoint: segment.endPointName
                }
              });
            }

            // Add layer if not exists
            if (!map.getLayer(layerId)) {
              // Try to find a suitable layer to insert before
              let beforeLayer = undefined;
              const layers = map.getStyle().layers;
              if (layers) {
                // Find first symbol layer
                const symbolLayer = layers.find((l: any) => l.type === 'symbol');
                if (symbolLayer) {
                  beforeLayer = symbolLayer.id;
                }
              }

              map.addLayer({
                id: layerId,
                type: 'line',
                source: sourceId,
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round'
                },
                paint: {
                  'line-color': '#1677ff',
                  'line-width': 6,
                  'line-opacity': 0.9
                }
              }, beforeLayer); // Insert before first symbol layer if found
              
            } else {
              // Update paint properties if layer already exists
              map.setPaintProperty(layerId, 'line-color', '#1677ff');
              map.setPaintProperty(layerId, 'line-width', 6);
              map.setPaintProperty(layerId, 'line-opacity', 0.9);
            }

            createdLayers.push(sourceId, layerId);
          } catch (error) {
            console.error(`[RoutePathRenderer] Error rendering segment ${segmentIndex}:`, error);
          }
        });
      });
    });

    // Update ref with created layers
    layersRef.current = createdLayers;
    return () => {
      // Cleanup on unmount
      layersRef.current.forEach(id => {
        try {
          if (map.getLayer(id)) {
            map.removeLayer(id);
          }
          if (map.getSource(id)) {
            map.removeSource(id);
          }
        } catch (error) {
          console.warn(`[RoutePathRenderer] Error cleaning up ${id}:`, error);
        }
      });
      layersRef.current = [];
    };
  }, [map, vehicleAssignments.length, selectedVehicleId]);

  return null; // This component doesn't render anything directly
};

export default React.memo(RoutePathRenderer);