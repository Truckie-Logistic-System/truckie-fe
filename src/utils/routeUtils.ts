import type { RouteSegment } from '../models/RoutePoint';
import type { RouteInfo, RouteSegmentInfo } from '../models/VehicleAssignment';

/**
 * Chuyển đổi từ RouteSegment (từ API route) sang RouteSegmentInfo (cho API vehicle assignment)
 * @param segment Segment từ API route
 * @returns RouteSegmentInfo cho API vehicle assignment
 */
export const convertRouteSegmentToRouteSegmentInfo = (
    segment: RouteSegment,
    segmentOrder: number
): RouteSegmentInfo => {
    // Lấy điểm đầu và điểm cuối từ path
    const startPoint = segment.path[0] || [0, 0];
    const endPoint = segment.path[segment.path.length - 1] || [0, 0];

    // Tính tổng phí đường
    const totalToll = segment.tolls.reduce((sum, toll) => sum + toll.amount, 0);

    return {
        segmentOrder,
        startPointName: segment.startName,
        endPointName: segment.endName,
        startLatitude: startPoint[1], // [lng, lat] -> lat
        startLongitude: startPoint[0], // [lng, lat] -> lng
        endLatitude: endPoint[1], // [lng, lat] -> lat
        endLongitude: endPoint[0], // [lng, lat] -> lng
        distanceKilometers: segment.distance, // Distance in kilometers
        pathCoordinates: segment.path,
        estimatedTollFee: totalToll,
        tollDetails: segment.tolls.map(toll => ({
            name: toll.name,
            address: toll.address,
            type: toll.type,
            amount: toll.amount
        })),
        rawResponse: segment.rawResponse || {}
    };
};

/**
 * Chuyển đổi từ danh sách RouteSegment sang RouteInfo
 * @param segments Danh sách segment từ API route
 * @returns RouteInfo cho API vehicle assignment
 */
export const convertRouteSegmentsToRouteInfo = (segments: RouteSegment[]): RouteInfo => {
    // Đảm bảo segments có đủ thông tin
    const validSegments = segments.map(segment => ({
        ...segment,
        tolls: segment.tolls || [],
        distance: segment.distance || 0
    }));

    // Chuyển đổi từng segment
    const routeSegments = validSegments.map((segment, index) =>
        convertRouteSegmentToRouteSegmentInfo(segment, segment.segmentOrder || index + 1)
    );

    // Tính tổng phí đường
    const totalTollFee = routeSegments.reduce((sum, segment) => sum + segment.estimatedTollFee, 0);

    // Tính tổng số trạm thu phí
    const totalTollCount = routeSegments.reduce((sum, segment) => sum + (segment.tollDetails?.length || 0), 0);

    // Tính tổng khoảng cách
    const totalDistance = routeSegments.reduce((sum, segment) => sum + segment.distanceKilometers, 0);

    return {
        segments: routeSegments,
        totalTollFee,
        totalTollCount,
        totalDistance
    };
};

/**
 * Sắp xếp segments theo thứ tự đúng: Carrier→Pickup→Delivery→Carrier
 * Dựa vào point names thay vì segmentOrder (vì FE có thể gửi sai thứ tự)
 * @param segments Danh sách segments cần sắp xếp
 * @returns Danh sách segments đã sắp xếp và re-assign segmentOrder
 */
export const sortAndNormalizeRouteSegments = (segments: RouteSegmentInfo[]): RouteSegmentInfo[] => {
    if (!segments || segments.length === 0) {
        return segments;
    }

    // Sắp xếp dựa vào point names
    const pointOrder = ["Carrier", "Pickup", "Delivery", "Carrier"];
    
    const sortedSegments = [...segments].sort((s1, s2) => {
        // Tìm vị trí của s1 trong pointOrder
        let s1Pos = -1;
        for (let i = 0; i < pointOrder.length - 1; i++) {
            if (pointOrder[i] === s1.startPointName && pointOrder[i + 1] === s1.endPointName) {
                s1Pos = i;
                break;
            }
        }

        // Tìm vị trí của s2 trong pointOrder
        let s2Pos = -1;
        for (let i = 0; i < pointOrder.length - 1; i++) {
            if (pointOrder[i] === s2.startPointName && pointOrder[i + 1] === s2.endPointName) {
                s2Pos = i;
                break;
            }
        }

        // Nếu không tìm được, dùng segmentOrder làm fallback
        if (s1Pos === -1 || s2Pos === -1) {
            return (s1.segmentOrder || 0) - (s2.segmentOrder || 0);
        }

        return s1Pos - s2Pos;
    });

    // Re-assign segmentOrder để đảm bảo đúng thứ tự
    return sortedSegments.map((segment, index) => ({
        ...segment,
        segmentOrder: index + 1
    }));
};