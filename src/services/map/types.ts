import type {
    MapLocation,
    MapStyle,
    MapProvider,
    GeocodingResult
} from '../../models/Map';
import type { RouteResponse } from '../../models/Route';
import type { ApiResponse } from '../api/types';

// VietMap types
export interface VietMapSearchResponse {
    type: string;
    features: {
        id: string;
        type: string;
        place_type: string[];
        relevance: number;
        properties: {
            name: string;
            mapbox_id: string;
        };
        text: string;
        place_name: string;
        center: [number, number]; // [longitude, latitude]
        geometry: {
            type: string;
            coordinates: [number, number]; // [longitude, latitude]
        };
    }[];
    attribution: string;
}

export interface VietMapRouteResponse {
    code: string;
    routes: {
        geometry: {
            coordinates: [number, number][];
            type: string;
        };
        legs: {
            steps: {
                geometry: {
                    coordinates: [number, number][];
                    type: string;
                };
                maneuver: {
                    bearing_after: number;
                    bearing_before: number;
                    location: [number, number];
                    modifier?: string;
                    type: string;
                    instruction: string;
                };
                mode: string;
                driving_side: string;
                name: string;
                intersections: {
                    location: [number, number];
                    bearings: number[];
                    entry: boolean[];
                    in?: number;
                    out?: number;
                }[];
                duration: number;
                distance: number;
            }[];
            summary: string;
            weight: number;
            duration: number;
            distance: number;
        }[];
        weight_name: string;
        weight: number;
        duration: number;
        distance: number;
    }[];
    waypoints: {
        name: string;
        location: [number, number];
    }[];
}

// OpenMap types
export interface OpenMapSearchResponse {
    status: string;
    results: {
        placeId: string;
        formattedAddress: string;
        location: {
            lat: number;
            lng: number;
        };
        name: string;
        addressComponents: {
            long_name: string;
            short_name: string;
            types: string[];
        }[];
    }[];
}

export interface OpenMapRouteResponse {
    status: string;
    routes: {
        legs: {
            distance: {
                text: string;
                value: number;
            };
            duration: {
                text: string;
                value: number;
            };
            steps: {
                distance: {
                    text: string;
                    value: number;
                };
                duration: {
                    text: string;
                    value: number;
                };
                instructions: string;
                maneuver: string;
                polyline: string;
            }[];
        }[];
        polyline: string;
        distance: {
            text: string;
            value: number;
        };
        duration: {
            text: string;
            value: number;
        };
    }[];
}

// TrackAsia types
export interface TrackAsiaSearchResponse {
    type: string;
    features: {
        id: string;
        type: string;
        place_type: string[];
        relevance: number;
        properties: {
            name: string;
        };
        text: string;
        place_name: string;
        center: [number, number]; // [longitude, latitude]
        geometry: {
            type: string;
            coordinates: [number, number]; // [longitude, latitude]
        };
    }[];
}

export interface TrackAsiaRouteResponse {
    routes: {
        geometry: {
            coordinates: [number, number][];
            type: string;
        };
        legs: {
            steps: {
                geometry: {
                    coordinates: [number, number][];
                    type: string;
                };
                maneuver: {
                    bearing_after: number;
                    bearing_before: number;
                    location: [number, number];
                    modifier?: string;
                    type: string;
                    instruction: string;
                };
                name: string;
                duration: number;
                distance: number;
            }[];
            summary: string;
            duration: number;
            distance: number;
        }[];
        duration: number;
        distance: number;
    }[];
    waypoints: {
        name: string;
        location: [number, number];
    }[];
}

// Generic map service response types
export type GeocodingApiResponse = ApiResponse<GeocodingResult[]>;
export type RouteApiResponse = ApiResponse<RouteResponse>; 