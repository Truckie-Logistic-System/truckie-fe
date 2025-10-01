import React, { useEffect, useState } from 'react';
import { Button, Card, Spin, Typography, App } from 'antd';
import routeService from '../../../../services/route';
import type { RoutePoint, RouteSegment, SuggestRouteRequest } from '../../../../models/RoutePoint';
import type { Vehicle } from '../../../../models';
import type { MapLocation } from '@/models/Map';
import VietMapMap from '../../../../components/common/VietMapMap';

const { Title, Text } = Typography;

interface RoutePlanningStepProps {
    orderId: string;
    vehicleId: string;
    vehicle?: Vehicle;
    onComplete: (segments: RouteSegment[]) => void;
    onBack: () => void;
}

const RoutePlanningStep: React.FC<RoutePlanningStepProps> = ({
    orderId,
    vehicleId,
    vehicle,
    onComplete,
    onBack,
}) => {
    const { message } = App.useApp();
    const [loading, setLoading] = useState<boolean>(true);
    const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
    const [segments, setSegments] = useState<RouteSegment[]>([]);
    const [customPoints, setCustomPoints] = useState<RoutePoint[]>([]);
    const [isGeneratingRoute, setIsGeneratingRoute] = useState<boolean>(false);
    const [currentMapLocation, setCurrentMapLocation] = useState<MapLocation | null>(null);
    const [markers, setMarkers] = useState<MapLocation[]>([]);

    // Fetch route points
    useEffect(() => {
        const fetchRoutePoints = async () => {
            try {
                setLoading(true);
                const response = await routeService.getOrderPoints(orderId);
                setRoutePoints(response.data.points);

                // Convert route points to map markers
                const mapMarkers = response.data.points.map(point => ({
                    lat: point.lat,
                    lng: point.lng,
                    address: point.address,
                    name: point.name,
                    type: point.type
                }));

                setMarkers(mapMarkers);

                // Set initial map location to first point (usually carrier)
                if (response.data.points.length > 0) {
                    const firstPoint = response.data.points[0];
                    setCurrentMapLocation({
                        lat: firstPoint.lat,
                        lng: firstPoint.lng,
                        address: firstPoint.address
                    });
                }
            } catch (error) {
                console.error('Error fetching route points:', error);
                message.error('Không thể lấy thông tin điểm đường đi');
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            fetchRoutePoints();
        }
    }, [orderId, message]);

    // Handle map location change (when user clicks on map)
    const handleLocationChange = (location: MapLocation) => {
        setCurrentMapLocation(location);

        // Create a new custom point
        const newCustomPoint: RoutePoint = {
            name: `Điểm trung gian ${customPoints.length + 1}`,
            type: 'stopover',
            lat: location.lat,
            lng: location.lng,
            address: location.address || `Điểm trung gian ${customPoints.length + 1}`,
            addressId: '',
        };

        // Add to custom points
        setCustomPoints(prev => [...prev, newCustomPoint]);

        // Add to markers
        setMarkers(prev => [...prev, {
            lat: location.lat,
            lng: location.lng,
            address: location.address || `Điểm trung gian ${customPoints.length + 1}`,
            name: `Điểm trung gian ${customPoints.length + 1}`,
            type: 'stopover'
        }]);

        // Generate route with new point
        generateRoute();
    };

    // Function to generate route
    const generateRoute = async () => {
        if (routePoints.length === 0) return;

        try {
            setIsGeneratingRoute(true);

            // Prepare points for route generation
            // Start with carrier, then any custom points, then pickup and delivery
            const allPoints = [...routePoints];
            const carrierPoints = allPoints.filter(p => p.type === 'carrier');
            const pickupPoints = allPoints.filter(p => p.type === 'pickup');
            const deliveryPoints = allPoints.filter(p => p.type === 'delivery');

            // Create ordered points array
            let orderedPoints: RoutePoint[] = [];
            if (carrierPoints.length > 0) orderedPoints.push(carrierPoints[0]);
            if (customPoints.length > 0) orderedPoints.push(...customPoints);
            if (pickupPoints.length > 0) orderedPoints.push(pickupPoints[0]);
            if (deliveryPoints.length > 0) orderedPoints.push(deliveryPoints[0]);

            // Create request for route suggestion
            const points: [number, number][] = orderedPoints.map(p => [p.lng, p.lat]);
            const pointTypes = orderedPoints.map(p => p.type);

            const requestData: SuggestRouteRequest = {
                points,
                pointTypes,
                vehicleTypeId: vehicle?.vehicleTypeId || '',
            };

            // Call API to get suggested route
            const response = await routeService.suggestRoute(requestData);
            setSegments(response.data.segments);

        } catch (error) {
            console.error('Error generating route:', error);
            message.error('Không thể tạo tuyến đường');
        } finally {
            setIsGeneratingRoute(false);
        }
    };

    // Handle completion
    const handleComplete = () => {
        if (segments.length === 0) {
            message.warning('Vui lòng tạo tuyến đường trước khi hoàn thành');
            return;
        }
        onComplete(segments);
    };

    return (
        <div className="route-planning-step">
            <Title level={4}>Lập kế hoạch tuyến đường</Title>
            <Text>Chọn vị trí trên bản đồ để thêm điểm trung gian</Text>

            <div className="mb-4 flex justify-end space-x-2">
                <Button onClick={generateRoute} loading={isGeneratingRoute}>
                    Tạo lại tuyến đường
                </Button>
            </div>

            <Card className="mb-4">
                {loading ? (
                    <div className="flex justify-center items-center h-96">
                        <Spin size="large" />
                    </div>
                ) : (
                    <div className="h-96">
                        <VietMapMap
                            mapLocation={currentMapLocation}
                            onLocationChange={handleLocationChange}
                            markers={markers}
                            showRouteLines={segments.length > 0}
                            routeSegments={segments}
                        />
                    </div>
                )}
            </Card>

            {segments.length > 0 && (
                <div className="mb-4">
                    <Title level={5}>Thông tin tuyến đường</Title>
                    {segments.map((segment, index) => (
                        <Card key={index} size="small" className="mb-2">
                            <div className="flex justify-between">
                                <div>
                                    <Text strong>Đoạn {index + 1}: </Text>
                                    <Text>{segment.startName} → {segment.endName}</Text>
                                </div>
                                {segment.tolls.length > 0 && (
                                    <div>
                                        <Text strong>Phí đường: </Text>
                                        <Text>{segment.tolls.reduce((sum, toll) => sum + toll.amount, 0).toLocaleString('vi-VN')} VND</Text>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <div className="flex justify-between mt-4">
                <Button onClick={onBack}>Quay lại</Button>
                <Button type="primary" onClick={handleComplete}>
                    Hoàn thành
                </Button>
            </div>
        </div>
    );
};

export default RoutePlanningStep; 