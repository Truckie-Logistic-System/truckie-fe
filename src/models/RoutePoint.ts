export interface RoutePoint {
    name: string;
    type: 'carrier' | 'pickup' | 'delivery' | 'stopover';
    lat: number;
    lng: number;
    address: string;
    addressId: string;
}

export interface OrderRoutePointsResponse {
    points: RoutePoint[];
}

export interface RouteSegment {
    segmentOrder: number;
    startName: string;
    endName: string;
    path: number[][];
    tolls: RouteToll[];
    rawResponse: Record<string, any>;
}

export interface RouteToll {
    name: string;
    address: string;
    type: string;
    amount: number;
}

export interface SuggestRouteRequest {
    points: [number, number][];
    pointTypes: ('carrier' | 'pickup' | 'delivery' | 'stopover')[];
    vehicleTypeId: string;
}

export interface SuggestRouteResponse {
    segments: RouteSegment[];
    totalToll: number;
}

export interface JourneyHistoryRequest {
    vehicleAssignmentId: string;
    orderId: string;
    segments: RouteSegment[];
} 