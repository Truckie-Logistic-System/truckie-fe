import React, { useState, useEffect, useRef } from 'react';
import { Card, Typography, Empty, Tag, Divider, Alert } from 'antd';
import { EnvironmentOutlined, InfoCircleOutlined, ClockCircleOutlined, DollarCircleOutlined } from '@ant-design/icons';
import VietMapMap from '../../../../components/common/VietMapMap';
import type { MapLocation } from '@/models/Map';
import type { RouteSegment } from '@/models/RoutePoint';
import type { JourneyHistory, JourneySegment as JourneySegmentModel, TollDetail } from '@/models/JourneyHistory';
import {
    parseTollDetails,
    formatJourneyType,
    getJourneyStatusColor,
    formatJourneyStatus,
    translatePointName
} from '@/models/JourneyHistory';
import { TollInfoCard } from '@/components/features/order';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(timezone);
dayjs.locale('vi');

const { Title } = Typography;

interface RouteMapSectionProps {
    journeySegments: JourneySegmentModel[];
    journeyInfo?: Partial<JourneyHistory>;
    issues?: any[]; // Array of issues to display as markers on the map
    onMapReady?: (map: any) => void;
    children?: React.ReactNode;
    mapContainerRef?: React.RefObject<HTMLDivElement | null>; // Ref for map container div
}

const RouteMapSection: React.FC<RouteMapSectionProps> = ({ journeySegments, journeyInfo, issues, onMapReady, children, mapContainerRef }) => {
    const [mapLocation, setMapLocation] = useState<MapLocation | null>(null);
    const [markers, setMarkers] = useState<MapLocation[]>([]);
    const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([]);
    const [hasValidRoute, setHasValidRoute] = useState<boolean>(false);
    const mapRef = useRef<any>(null);

    // Format date helper
    const formatDate = (dateString?: string) => {
        if (!dateString) return "Chưa có thông tin";
        return dayjs(dateString)
            .tz("Asia/Ho_Chi_Minh")
            .format("DD/MM/YYYY");
    };

    // Custom function to get map instance - STABLE VERSION
    const handleMapInstance = (map: any) => {
        // Map instance received
        
        if (!map) {
            console.error('[RouteMapSection] Map instance is null');
            return;
        }

        mapRef.current = map;

        // Wait for map to be fully loaded before notifying parent
        if (map.loaded()) {
            // Map loaded, calling onMapReady
            if (onMapReady) {
                onMapReady(map);
            }
        } else {
            // Waiting for map load event
            map.on('load', () => {
                // Map load event fired
                if (onMapReady) {
                    onMapReady(map);
                }
            });
        }

        // Apply closer zoom when map is loaded - using route path coordinates
        if (routeSegments.length > 0) {
            setTimeout(() => {
                try {
                    // Double check map still exists
                    if (!mapRef.current || mapRef.current._removed) {
                        console.warn('[RouteMapSection] Map was removed, skipping fitBounds');
                        return;
                    }

                    // Collect all coordinates from route paths
                    const allCoordinates: [number, number][] = [];
                    
                    routeSegments.forEach(segment => {
                        if (segment.path && Array.isArray(segment.path)) {
                            segment.path.forEach((coord: any) => {
                                // Handle different coordinate formats: [lng, lat] or {lng, lat}
                                const lng = Array.isArray(coord) ? coord[0] : coord.lng;
                                const lat = Array.isArray(coord) ? coord[1] : coord.lat;
                                
                                if (!isNaN(lng) && !isNaN(lat) && isFinite(lng) && isFinite(lat)) {
                                    allCoordinates.push([lng, lat]);
                                }
                            });
                        }
                    });

                    if (allCoordinates.length > 1) {
                        try {
                            // Initialize bounds with first coordinate
                            const bounds = new window.vietmapgl.LngLatBounds(
                                allCoordinates[0],
                                allCoordinates[0]
                            );
                            
                            // Extend bounds with all route coordinates
                            allCoordinates.forEach(coord => {
                                bounds.extend(coord);
                            });

                            // Calling fitBounds
                            // Fit map to bounds with generous padding for full route overview
                            mapRef.current.fitBounds(bounds, {
                                padding: {
                                    top: 80,
                                    bottom: 80,
                                    left: 80,
                                    right: 80
                                },
                                duration: 1000
                            });
                        } catch (err) {
                            console.error('[RouteMapSection] Error fitting bounds:', err);
                            // Fallback: center on first coordinate
                            if (allCoordinates.length > 0 && mapRef.current && !mapRef.current._removed) {
                                mapRef.current.setCenter(allCoordinates[0]);
                                mapRef.current.setZoom(12);
                            }
                        }
                    } else if (allCoordinates.length === 1) {
                        // If only one coordinate, center the map on it
                        if (mapRef.current && !mapRef.current._removed) {
                            mapRef.current.setCenter(allCoordinates[0]);
                            mapRef.current.setZoom(12);
                        }
                    }
                } catch (error) {
                    console.error('[RouteMapSection] Error adjusting map zoom:', error);
                }
            }, 500); // Increased delay for stability
        }
    };

    useEffect(() => {
        if (journeySegments && journeySegments.length > 0) {
            const newMarkers: MapLocation[] = [];
            const newRouteSegments: RouteSegment[] = [];
            let validRouteFound = false;

            journeySegments.forEach((segment) => {
                
                if (segment.pathCoordinatesJson) {
                    try {
                        // Parse path coordinates
                        const pathCoordinates = JSON.parse(segment.pathCoordinatesJson);

                        // Add start point marker
                        if (segment.startLatitude && segment.startLongitude &&
                            !isNaN(segment.startLatitude) && !isNaN(segment.startLongitude) &&
                            isFinite(segment.startLatitude) && isFinite(segment.startLongitude)) {
                            const translatedStartName = translatePointName(segment.startPointName || '');
                            newMarkers.push({
                                lat: segment.startLatitude,
                                lng: segment.startLongitude,
                                address: translatedStartName,
                                name: `${translatedStartName}`,
                                type: segment.startPointName?.toLowerCase().includes('carrier') ? 'carrier' :
                                    segment.startPointName?.toLowerCase().includes('pickup') ? 'pickup' : 'stopover',
                            });
                        }

                        // Add end point marker
                        if (segment.endLatitude && segment.endLongitude &&
                            !isNaN(segment.endLatitude) && !isNaN(segment.endLongitude) &&
                            isFinite(segment.endLatitude) && isFinite(segment.endLongitude)) {
                            const translatedEndName = translatePointName(segment.endPointName || '');
                            const distance = segment.distanceKilometers.toFixed(1);
                            newMarkers.push({
                                lat: segment.endLatitude,
                                lng: segment.endLongitude,
                                address: translatedEndName,
                                name: `${translatedEndName} (${distance} km)`,
                                type: segment.endPointName?.toLowerCase().includes('delivery') ? 'delivery' :
                                    segment.endPointName?.toLowerCase().includes('carrier') ? 'carrier' : 'stopover',
                            });
                        }

                        // Parse toll details if available
                        const tolls = parseTollDetails(segment.tollDetailsJson);

                        // Create route segment
                        newRouteSegments.push({
                            segmentOrder: segment.segmentOrder || 0,
                            startName: translatePointName(segment.startPointName || 'Điểm đầu'),
                            endName: `${translatePointName(segment.endPointName || 'Điểm cuối')} (${segment.distanceKilometers.toFixed(1)} km)`,
                            path: pathCoordinates,
                            tolls: tolls,
                            distance: segment.distanceKilometers || 0,
                            rawResponse: {},
                        });

                        validRouteFound = true;
                    } catch (error) {
                        console.error('Error processing journey segment:', error);
                    }
                }
            });

            // Add issue markers if issues are provided (filter out PENALTY for customer view)
            if (issues && issues.length > 0) {
                issues
                    .filter((issue) => issue.issueCategory !== 'PENALTY') // Filter PENALTY issues
                    .forEach((issue) => {
                        if (issue.locationLatitude && issue.locationLongitude &&
                            !isNaN(issue.locationLatitude) && !isNaN(issue.locationLongitude) &&
                            isFinite(issue.locationLatitude) && isFinite(issue.locationLongitude)) {
                            
                            // Get issue icon and color based on category
                            let issueIcon = '⚠️';
                            let issueColor = 'orange';
                            
                            switch(issue.issueCategory) {
                                case 'ORDER_REJECTION':
                                    issueIcon = '📦';
                                    issueColor = 'red';
                                    break;
                                case 'SEAL_REPLACEMENT':
                                    issueIcon = '🔒';
                                    issueColor = 'yellow';
                                    break;
                                case 'DAMAGE':
                                    issueIcon = '⚠️';
                                    issueColor = 'orange';
                                    break;
                                case 'PENALTY':
                                    issueIcon = '🚨';
                                    issueColor = 'red';
                                    break;
                                default:
                                    issueIcon = '❗';
                                    issueColor = 'blue';
                            }
                            
                            // Create marker label with issue type name and reported time
                            const issueTypeName = issue.issueTypeName || issue.issueCategory || 'Sự cố';
                            
                            // Format reported time
                            let reportedTime = '';
                            if (issue.reportedAt) {
                                try {
                                    const date = new Date(issue.reportedAt);
                                    reportedTime = ` - ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                                } catch (e) {
                                    reportedTime = '';
                                }
                            }
                            
                            newMarkers.push({
                                lat: issue.locationLatitude,
                                lng: issue.locationLongitude,
                                address: `${issueTypeName}${reportedTime}`,
                                name: `${issueIcon} ${issueTypeName}`,
                                type: 'stopover', // Use stopover type (icon/color will be different via issueCategory)
                                issueCategory: issue.issueCategory, // Pass issueCategory for proper icon/color selection
                            });
                        }
                    });
            }

            // Set the map center to the first point if we have valid markers
            if (newMarkers.length > 0) {
                setMapLocation(newMarkers[0]);
            }

            // Update state
            setMarkers(newMarkers);
            setRouteSegments(newRouteSegments);
            setHasValidRoute(validRouteFound);
        }
    }, [journeySegments, issues]);

    // Auto-fit bounds when routeSegments are ready and map is loaded
    useEffect(() => {
        if (!mapRef.current || routeSegments.length === 0) return;

        const fitBoundsToRoute = () => {
            try {
                if (mapRef.current._removed) {
                    console.warn('[RouteMapSection] Map was removed, skipping fitBounds');
                    return;
                }

                // Collect all coordinates from route paths
                const allCoordinates: [number, number][] = [];
                
                routeSegments.forEach(segment => {
                    if (segment.path && Array.isArray(segment.path)) {
                        segment.path.forEach((coord: any) => {
                            // Handle different coordinate formats: [lng, lat] or {lng, lat}
                            const lng = Array.isArray(coord) ? coord[0] : coord.lng;
                            const lat = Array.isArray(coord) ? coord[1] : coord.lat;
                            
                            if (!isNaN(lng) && !isNaN(lat) && isFinite(lng) && isFinite(lat)) {
                                allCoordinates.push([lng, lat]);
                            }
                        });
                    }
                });

                if (allCoordinates.length > 1) {
                    // Initialize bounds with first coordinate
                    const bounds = new window.vietmapgl.LngLatBounds(
                        allCoordinates[0],
                        allCoordinates[0]
                    );
                    
                    // Extend bounds with all route coordinates
                    allCoordinates.forEach(coord => {
                        bounds.extend(coord);
                    });

                    // Fit map to bounds with generous padding for full route overview
                    mapRef.current.fitBounds(bounds, {
                        padding: {
                            top: 80,
                            bottom: 80,
                            left: 80,
                            right: 80
                        },
                        duration: 1000
                    });
                }
            } catch (error) {
                console.error('[RouteMapSection] Error fitting bounds to route:', error);
            }
        };

        // Delay to ensure map is fully loaded
        setTimeout(fitBoundsToRoute, 500);
    }, [routeSegments, mapRef.current]);

    return (
        <>
            <Card className="mb-6 shadow-md rounded-lg border-t-4 border-t-blue-500">
                {/* Journey information header */}
                {journeyInfo && (
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <Title level={5} className="flex items-center m-0">
                                <EnvironmentOutlined className="mr-2 text-blue-500" /> Bản đồ lộ trình
                            </Title>
                            {journeyInfo.journeyType && (
                                <Tag color="blue" className="ml-2">
                                    {formatJourneyType(journeyInfo.journeyType)}
                                </Tag>
                            )}
                            {journeyInfo.status && (
                                <Tag color={getJourneyStatusColor(journeyInfo.status)} className="ml-1">
                                    {formatJourneyStatus(journeyInfo.status)}
                                </Tag>
                            )}
                        </div>

                        <Divider className="my-3" />

                        {/* Journey statistics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                            <div className="bg-gray-50 p-3 rounded-md flex flex-col">
                                <span className="text-gray-600 text-sm flex items-center">
                                    <EnvironmentOutlined className="mr-1" /> Tổng quãng đường
                                </span>
                                <span className="text-lg font-semibold text-blue-600">
                                    {journeyInfo.totalDistance ? `${journeyInfo.totalDistance.toFixed(1)} km` : '0 km'}
                                </span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-md flex flex-col">
                                <span className="text-gray-600 text-sm flex items-center">
                                    <DollarCircleOutlined className="mr-1" /> Số trạm thu phí
                                </span>
                                <span className="text-lg font-semibold text-blue-600">
                                    {journeyInfo.totalTollCount || 0}
                                </span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-md flex flex-col">
                                <span className="text-gray-600 text-sm flex items-center">
                                    <DollarCircleOutlined className="mr-1" /> Tổng phí đường
                                </span>
                                <span className="text-lg font-semibold text-blue-600">
                                    {journeyInfo.totalTollFee ? `${journeyInfo.totalTollFee.toLocaleString('vi-VN')} VND` : '0 VND'}
                                </span>
                            </div>
                        </div>

                        {/* Journey time information */}
                        {(journeyInfo.startTime || journeyInfo.endTime || journeyInfo.createdAt) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                {journeyInfo.endTime && (
                                    <div className="bg-gray-50 p-3 rounded-md flex flex-col">
                                        <span className="text-gray-600 text-sm flex items-center">
                                            <ClockCircleOutlined className="mr-1" /> Thời gian kết thúc
                                        </span>
                                        <span className="text-md font-medium">
                                            {formatDate(journeyInfo.endTime)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Reason for reroute if available */}
                        {journeyInfo.reasonForReroute && (
                            <div className="bg-yellow-50 p-3 rounded-md mb-3">
                                <div className="flex items-center">
                                    <InfoCircleOutlined className="mr-2 text-yellow-500" />
                                    <span className="font-medium mr-1">Lý do định tuyến lại:</span>
                                    <span>{journeyInfo.reasonForReroute}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Thông báo hướng dẫn */}
                <Alert
                    message="Thông tin chi tiết"
                    description="Thông tin khoảng cách và trạm thu phí được hiển thị trực tiếp trên bản đồ. Click vào các đoạn đường để xem chi tiết."
                    type="info"
                    showIcon
                    className="mb-4"
                />

                {/* Add TollInfoCard component */}
                {journeySegments && journeySegments.length > 0 && (
                    <TollInfoCard journeySegments={journeySegments} />
                )}

                {!hasValidRoute && (
                    <Empty
                        description="Không có thông tin lộ trình"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                )}

                {hasValidRoute && (
                    <div className="h-[500px] rounded-lg overflow-hidden" ref={mapContainerRef}>
                        <VietMapMap
                            mapLocation={mapLocation}
                            onLocationChange={(location: any) => setMapLocation(location)}
                            markers={markers}
                            showRouteLines={true}
                            routeSegments={routeSegments}
                            animateRoute={false}
                            getMapInstance={handleMapInstance}
                        >
                            {children}
                        </VietMapMap>
                    </div>
                )}
            </Card>
        </>
    );
};

export default RouteMapSection; 