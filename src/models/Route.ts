// Route model
export interface Route {
    id: string;
    startLocation: string;
    endLocation: string;
    distance: number; // in meters
    estimatedTime: number; // in seconds
    waypoints?: [number, number][]; // Array of [longitude, latitude] coordinates
    steps?: RouteStep[];
    polyline?: string;
}

export interface RouteStep {
    distance: number;
    duration: number;
    instruction: string;
    name?: string;
    type?: string;
    maneuver?: {
        type: string;
        modifier?: string;
        location: [number, number]; // [longitude, latitude]
    };
}

export interface RouteRequest {
    origin: [number, number]; // [longitude, latitude]
    destination: [number, number]; // [longitude, latitude]
    waypoints?: [number, number][]; // Array of [longitude, latitude] coordinates
}

export interface RouteResponse {
    id?: string;
    distance: number;
    duration: number;
    geometry?: {
        coordinates: [number, number][];
        type: string;
    };
    legs?: {
        steps: {
            distance: number;
            duration: number;
            geometry: {
                coordinates: [number, number][];
                type: string;
            };
            name: string;
            mode: string;
            maneuver: {
                type: string;
                modifier?: string;
                location: [number, number];
                instruction: string;
            };
        }[];
    }[];
}

// Chuyển đổi từ API response sang model
export const mapRouteResponseToModel = (response: RouteResponse, startLocation: string, endLocation: string): Route => {
    const steps = response.legs?.[0]?.steps.map(step => ({
        distance: step.distance,
        duration: step.duration,
        instruction: step.maneuver.instruction,
        name: step.name,
        type: step.maneuver.type,
        maneuver: {
            type: step.maneuver.type,
            modifier: step.maneuver.modifier,
            location: step.maneuver.location
        }
    })) || [];

    const waypoints = response.geometry?.coordinates || [];

    return {
        id: response.id || `route-${Date.now()}`,
        startLocation,
        endLocation,
        distance: response.distance,
        estimatedTime: response.duration,
        waypoints,
        steps
    };
};

// Tính toán thời gian dự kiến dưới dạng chuỗi
export const formatEstimatedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours} giờ ${minutes} phút`;
    }
    return `${minutes} phút`;
};

// Tính toán khoảng cách dưới dạng chuỗi
export const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
}; 