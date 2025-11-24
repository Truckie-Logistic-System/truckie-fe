export interface RoutePoint {
    name: string;
    type: 'carrier' | 'pickup' | 'delivery' | 'stopover';
    lat: number;
    lng: number;
    address: string;
    addressId: string;
    segmentIndex?: number; // Thêm trường để biết stopover thuộc về đoạn nào
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
    distance: number; // Thêm trường distance
    rawResponse: Record<string, any>;
    segmentColor?: string; // Custom color for this segment
    lineDasharray?: number[]; // Dash pattern for dashed lines [dash, gap]
    lineWidth?: number; // Custom line width
    lineOpacity?: number; // Custom line opacity
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
    totalTollAmount: number; // Thêm trường totalTollAmount
    totalTollCount: number; // Thêm trường totalTollCount
    totalDistance: number; // Thêm trường totalDistance
}

export interface RouteInfoFromAPI {
    totalDistance: number;
    totalTollAmount: number;
    totalTollCount: number;
}

export interface JourneyHistoryRequest {
    vehicleAssignmentId: string;
    orderId: string;
    segments: RouteSegment[];
} 