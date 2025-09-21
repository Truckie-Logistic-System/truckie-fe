// Map model
export interface MapLocation {
    lat: number;
    lng: number;
    address?: string;
    name?: string;
    placeId?: string;
}

export interface MapBounds {
    north: number;
    south: number;
    east: number;
    west: number;
}

export interface MapStyle {
    id: string;
    name: string;
    url: string;
}

export interface MapProvider {
    name: string;
    apiKey?: string;
    baseUrl?: string;
    styles: MapStyle[];
}

export interface GeocodingResult {
    placeId: string;
    formattedAddress: string;
    name?: string;
    location: {
        lat: number;
        lng: number;
    };
    addressComponents?: {
        long_name: string;
        short_name: string;
        types: string[];
    }[];
}

export interface GeocodingResponse {
    results: GeocodingResult[];
    status: string;
}

export interface NavigationState {
    isNavigating: boolean;
    isSimulating: boolean;
    isPaused: boolean;
    showNavigationModal: boolean;
    showTripSummary: boolean;
    remainingDistance: string;
    remainingTime: string;
    currentInstructionIndex: number;
    nextTurnDistance: number;
    compassHeading: number | null;
    tripSummary: {
        startTime: number | null;
        endTime: number | null;
        totalDistance: number;
        totalTime: number;
        averageSpeed: number;
    };
    simulationSpeed: number;
    showControlPanel: boolean;
}

// Chuyển đổi từ độ sang radian
export const degreesToRadians = (degrees: number): number => {
    return degrees * Math.PI / 180;
};

// Tính khoảng cách giữa hai điểm trên bản đồ (theo công thức Haversine)
export const calculateDistance = (point1: MapLocation, point2: MapLocation): number => {
    const earthRadius = 6371000; // Bán kính trái đất (mét)

    const lat1Rad = degreesToRadians(point1.lat);
    const lat2Rad = degreesToRadians(point2.lat);
    const deltaLat = degreesToRadians(point2.lat - point1.lat);
    const deltaLng = degreesToRadians(point2.lng - point1.lng);

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) *
        Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadius * c;
};

// Tính góc bearing giữa hai điểm
export const calculateBearing = (start: MapLocation, end: MapLocation): number => {
    const startLat = degreesToRadians(start.lat);
    const startLng = degreesToRadians(start.lng);
    const endLat = degreesToRadians(end.lat);
    const endLng = degreesToRadians(end.lng);

    const y = Math.sin(endLng - startLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) -
        Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);

    let bearing = Math.atan2(y, x);
    bearing = bearing * 180 / Math.PI;
    bearing = (bearing + 360) % 360;

    return bearing;
};

// Lấy trạng thái navigation ban đầu
export const getInitialNavigationState = (): NavigationState => {
    return {
        isNavigating: false,
        isSimulating: false,
        isPaused: false,
        showNavigationModal: false,
        showTripSummary: false,
        remainingDistance: '',
        remainingTime: '',
        currentInstructionIndex: 0,
        nextTurnDistance: 0,
        compassHeading: null,
        tripSummary: {
            startTime: null,
            endTime: null,
            totalDistance: 0,
            totalTime: 0,
            averageSpeed: 0
        },
        simulationSpeed: 1,
        showControlPanel: true
    };
}; 