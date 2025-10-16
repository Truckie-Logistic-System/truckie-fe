import React, { useState, useEffect, useRef } from 'react';
import { Card, Typography, Empty, Tag, Descriptions, Tooltip, Divider, Alert } from 'antd';
import { EnvironmentOutlined, DollarCircleOutlined, InfoCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
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
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(timezone);
dayjs.locale('vi');

const { Title } = Typography;

interface RouteMapSectionProps {
    journeySegments: JourneySegmentModel[];
    journeyInfo?: Partial<JourneyHistory>;
    onMapReady?: (map: any) => void;
}

const RouteMapSection: React.FC<RouteMapSectionProps> = ({ journeySegments, journeyInfo, onMapReady }) => {
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
            .format("DD/MM/YYYY HH:mm:ss");
    };

    // Custom function to get map instance
    const handleMapInstance = (map: any) => {
        mapRef.current = map;
        
        // Notify parent component that map is ready
        if (onMapReady) {
            onMapReady(map);
        }

        // Apply closer zoom when map is loaded
        if (map && markers.length > 1) {
            setTimeout(() => {
                try {
                    const validMarkers = markers.filter(marker =>
                        !isNaN(marker.lng) && !isNaN(marker.lat) &&
                        isFinite(marker.lng) && isFinite(marker.lat)
                    );

                    // Only fit bounds if we have valid markers
                    if (validMarkers.length > 1) {
                        try {
                            // Initialize bounds with first marker to avoid NaN
                            const firstMarker = validMarkers[0];
                            const bounds = new window.vietmapgl.LngLatBounds(
                                [firstMarker.lng, firstMarker.lat],
                                [firstMarker.lng, firstMarker.lat]
                            );
                            
                            // Extend bounds with remaining markers
                            for (let i = 1; i < validMarkers.length; i++) {
                                const marker = validMarkers[i];
                                bounds.extend([marker.lng, marker.lat]);
                            }

                            // Fit map to bounds with balanced padding for better context
                            map.fitBounds(bounds, {
                                padding: 80,
                                maxZoom: 15,
                                duration: 1000
                            });
                        } catch (err) {
                            console.error('Error fitting bounds:', err);
                            // Fallback: center on first marker
                            const marker = validMarkers[0];
                            map.setCenter([marker.lng, marker.lat]);
                            map.setZoom(12);
                        }
                    } else if (validMarkers.length === 1) {
                        // If only one valid marker, center the map on it
                        const marker = validMarkers[0];
                        map.setCenter([marker.lng, marker.lat]);
                        map.setZoom(12);
                    }
                } catch (error) {
                    console.error("Error adjusting map zoom:", error);
                }
            }, 300);
        }
    };

    useEffect(() => {
        if (journeySegments && journeySegments.length > 0) {
            const newMarkers: MapLocation[] = [];
            const newRouteSegments: RouteSegment[] = [];
            let validRouteFound = false;

            journeySegments.forEach((segment, index) => {
                
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
                            const distance = segment.distanceMeters.toFixed(1);
                            newMarkers.push({
                                lat: segment.endLatitude,
                                lng: segment.endLongitude,
                                address: translatedEndName,
                                name: `${translatedEndName} (${distance} km)`,
                                type: segment.endPointName?.toLowerCase().includes('delivery') ? 'delivery' :
                                    segment.endPointName?.toLowerCase().includes('carrier') ? 'carrier' : 'stopover',
                            });
                        }

                        // Không hiển thị thông tin trạm thu phí cho khách hàng
                        // Vẫn giữ lại mảng rỗng để đảm bảo cấu trúc dữ liệu không bị thay đổi
                        const tolls: TollDetail[] = [];

                        // Create route segment
                        newRouteSegments.push({
                            segmentOrder: segment.segmentOrder || 0,
                            startName: translatePointName(segment.startPointName || 'Điểm đầu'),
                            endName: `${translatePointName(segment.endPointName || 'Điểm cuối')} (${segment.distanceMeters.toFixed(1)} km)`,
                            path: pathCoordinates,
                            tolls: tolls,
                            distance: segment.distanceMeters || 0, // Đã là km, không cần chia 1000
                            rawResponse: {},
                        });

                        validRouteFound = true;
                    } catch (error) {
                        console.error('Error processing journey segment:', error);
                    }
                }
            });

            // Set the map center to the first point if we have valid markers
            if (newMarkers.length > 0) {
                setMapLocation(newMarkers[0]);
            }

            // Update state
            setMarkers(newMarkers);
            setRouteSegments(newRouteSegments);
            setHasValidRoute(validRouteFound);
        }
    }, [journeySegments]);

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

                        {/* Journey statistics - Không hiển thị thông tin trạm thu phí */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
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
                                    <ClockCircleOutlined className="mr-1" /> Thời gian dự kiến
                                </span>
                                <span className="text-lg font-semibold text-blue-600">
                                    {Math.round((journeyInfo.totalDistance || 0) / 40 * 60)} phút
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
                    description="Thông tin khoảng cách được hiển thị trực tiếp trên bản đồ. Click vào các đoạn đường để xem chi tiết."
                    type="info"
                    showIcon
                    className="mb-4"
                />

                {!hasValidRoute && (
                    <Empty
                        description="Không có thông tin lộ trình"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                )}

                {hasValidRoute && (
                    <div className="h-[500px] rounded-lg overflow-hidden">
                        <VietMapMap
                            mapLocation={mapLocation}
                            onLocationChange={(location) => setMapLocation(location)}
                            markers={markers}
                            showRouteLines={true}
                            routeSegments={routeSegments}
                            animateRoute={false}
                            getMapInstance={handleMapInstance}
                        />
                    </div>
                )}
            </Card>
        </>
    );
};

export default RouteMapSection; 