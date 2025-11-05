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
  console.log('[RoutePathRenderer] Component rendered with:', {
    hasMap: !!map,
    vaCount: vehicleAssignments?.length || 0,
    selectedVehicleId
  });

  const layersRef = useRef<string[]>([]);

  useEffect(() => {
    if (!map || !vehicleAssignments || vehicleAssignments.length === 0) {
      console.log('[RoutePathRenderer] Skipping - no map or vehicleAssignments', {
        hasMap: !!map,
        vaCount: vehicleAssignments?.length || 0
      });
      return;
    }

    // Render routes immediately - don't wait for map load
    // The map should already be loaded when this component is rendered
    console.log('[RoutePathRenderer] Starting render with', vehicleAssignments.length, 'vehicle assignments');
    console.log('[RoutePathRenderer] VehicleAssignments data:', JSON.stringify(vehicleAssignments.map((va, i) => ({
      index: i,
      id: va.id,
      hasJourneyHistories: !!va.journeyHistories,
      journeyCount: va.journeyHistories?.length || 0
    }))));

    // First pass: Create/update all routes from all journeys
    const createdLayers: string[] = [];
    vehicleAssignments.forEach((va, vaIndex) => {
      console.log(`[RoutePathRenderer] Processing VA ${vaIndex}:`, {
        id: va.id,
        hasJourneyHistories: !!va.journeyHistories,
        journeyCount: va.journeyHistories?.length || 0
      });

      if (!va.journeyHistories || va.journeyHistories.length === 0) {
        console.log(`[RoutePathRenderer] VA ${vaIndex} has no journeyHistories`);
        return;
      }

      // Render ALL journeys for this vehicle assignment
      va.journeyHistories.forEach((journey: any, journeyIndex: number) => {
        console.log(`[RoutePathRenderer] Processing VA ${vaIndex} Journey ${journeyIndex}:`, {
          id: journey.id,
          status: journey.status,
          hasSegments: !!journey.journeySegments,
          segmentCount: journey.journeySegments?.length || 0
        });

        if (!journey || !journey.journeySegments || journey.journeySegments.length === 0) {
          console.log(`[RoutePathRenderer] VA ${vaIndex} Journey ${journeyIndex} has no segments`);
          return;
        }

        // Collect all coordinates from journey segments
        const coordinates: [number, number][] = [];

        journey.journeySegments.forEach((segment: any) => {
          if (segment.pathCoordinatesJson) {
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
              console.warn(`[RoutePathRenderer] Error parsing path coordinates:`, error);
            }
          }
        });

        if (coordinates.length < 2) {
          console.log(`[RoutePathRenderer] VA ${vaIndex} Journey ${journeyIndex} has only ${coordinates.length} coordinates`);
          return;
        }

        console.log(`[RoutePathRenderer] VA ${vaIndex} Journey ${journeyIndex} has ${coordinates.length} coordinates`);

        // Create source and layer for this journey route
        const sourceId = `route-source-${vaIndex}-${journeyIndex}`;
        const layerId = `route-layer-${vaIndex}-${journeyIndex}`;

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
                properties: {}
              }
            });
            console.log(`[RoutePathRenderer] Created source ${sourceId}`);
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
            console.log(`[RoutePathRenderer] Created layer ${layerId} (before: ${beforeLayer || 'top'})`);
          } else {
            // Update paint properties if layer already exists
            map.setPaintProperty(layerId, 'line-color', '#1677ff');
            map.setPaintProperty(layerId, 'line-width', 6);
            map.setPaintProperty(layerId, 'line-opacity', 0.9);
            console.log(`[RoutePathRenderer] Updated layer ${layerId}`);
          }

          createdLayers.push(sourceId, layerId);
        } catch (error) {
          console.error(`[RoutePathRenderer] Error rendering route ${vaIndex}-${journeyIndex}:`, error);
        }
      });
    });

    // Update ref with created layers
    layersRef.current = createdLayers;
    console.log('[RoutePathRenderer] Render complete with', createdLayers.length, 'layers');

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