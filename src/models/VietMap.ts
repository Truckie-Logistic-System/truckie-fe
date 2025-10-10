export interface VietMapAutocompleteResult {
    ref_id: string;
    distance: number;
    address: string;
    name: string;
    display: string;
    boundaries: VietMapBoundary[];
    categories: any[];
    entry_points: any[];
    lat?: number; // Optional lat property for reverse geocoding results
    lng?: number; // Optional lng property for reverse geocoding results
}

export interface VietMapBoundary {
    type: number;
    id: number;
    name: string;
    prefix: string;
    full_name: string;
}

export interface VietMapPlaceDetail {
    display: string;
    name: string;
    hs_num: string;
    street: string;
    address: string;
    city_id: number;
    city: string;
    district_id: number;
    district: string;
    ward_id: number;
    ward: string;
    lat: number;
    lng: number;
}

export interface VietMapRouteInstruction {
    distance: number;
    heading: number;
    sign: number;
    interval: number[];
    text: string;
    time: number;
    street_name: string;
    last_heading: number | null;
}

export interface VietMapRoutePath {
    distance: number;
    weight: number;
    time: number;
    transfers: number;
    points_encoded: boolean;
    bbox: number[];
    points: string;
    instructions: VietMapRouteInstruction[];
    snapped_waypoints: string;
}

export interface VietMapRouteResponse {
    license: string;
    code: string;
    messages: string | null;
    paths: VietMapRoutePath[];
}

export interface VietMapTollItem {
    name: string;
    address: string;
    type: string;
    amount: number;
}

export interface VietMapRouteTollsRequest {
    path: [number, number][];
    tolls?: VietMapTollItem[];
}

export interface VietMapStyle {
    version: number;
    sources: {
        [key: string]: {
            type: string;
            tiles: string[];
            tileSize: number;
            attribution: string;
        };
    };
    layers: {
        id: string;
        type: string;
        source: string;
        minzoom: number;
        maxzoom: number;
    }[];
} 