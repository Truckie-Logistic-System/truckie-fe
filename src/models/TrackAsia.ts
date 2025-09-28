// TrackAsia API Models

export interface AutocompleteResult {
    place_id: string;
    reference: string;
    name: string;
    description: string;
    formatted_address: string;
    icon: string;
    matched_substrings: Array<{
        length: number;
        offset: number;
    }>;
    structured_formatting: {
        main_text: string;
        main_text_matched_substrings: Array<{
            length: number;
            offset: number;
        }>;
        secondary_text: string;
    };
    terms: Array<{
        offset: number;
        value: string;
    }>;
    types: string[];
    old_description?: string;
    old_formatted_address?: string;
}

export interface AutocompleteResponse {
    status: string;
    warning_message?: string;
    predictions: AutocompleteResult[];
}

export interface PlaceDetailResult {
    place_id: string;
    formatted_address: string;
    geometry: {
        location: {
            lat: number;
            lng: number;
        };
        viewport: {
            northeast: {
                lat: number;
                lng: number;
            };
            southwest: {
                lat: number;
                lng: number;
            };
        };
        location_type: string;
    };
    icon: string;
    name: string;
    socials?: string[];
    types: string[];
    url?: string;
    vicinity?: string;
    website?: string;
    subclass?: string;
    address_components: Array<{
        types: string[];
        id?: string;
        long_name: string;
        short_name: string;
        official_id?: string;
    }>;
    adr_address?: string;
    icon_background_color?: string;
    plus_code?: {
        compound_code: string;
        global_code: string;
    };
    utc_offset?: number;
    photos?: Array<{
        height: number;
        width: number;
        url: string;
        photo_reference: string;
        html_attributions: string[];
    }>;
    opening_hours?: {
        open_now: boolean;
        weekday_text: string[];
    };
    editorial_summary?: {
        overview: string;
    };
    class?: string;
}

export interface PlaceDetailResponse {
    status: string;
    result: PlaceDetailResult;
    html_attributions?: string[];
}

export interface ReverseGeocodingResult {
    name: string;
    types: string[];
    geometry: {
        location: {
            lat: number;
            lng: number;
        };
        location_type: string;
    };
    formatted_address: string;
    address_components: Array<{
        types: string[];
        short_name: string;
        long_name: string;
    }>;
}

export interface ReverseGeocodingResponse {
    plus_code?: any;
    status: string;
    results: ReverseGeocodingResult[];
}

export interface DirectionsLeg {
    distance: {
        text: string;
        value: number;
    };
    duration: {
        text: string;
        value: number;
    };
    start_address: string;
    start_location: {
        lat: number;
        lng: number;
    };
    end_address: string;
    end_location: {
        lat: number;
        lng: number;
    };
    steps: Array<{
        distance: {
            text: string;
            value: number;
        };
        duration: {
            text: string;
            value: number;
        };
        start_location: {
            lat: number;
            lng: number;
        };
        end_location: {
            lat: number;
            lng: number;
        };
        polyline: {
            points: string;
        };
        html_instructions: string;
        travel_mode: string;
        maneuver: string;
    }>;
}

export interface DirectionsRoute {
    summary: string;
    bounds: {
        northeast: {
            lat: number;
            lng: number;
        };
        southwest: {
            lat: number;
            lng: number;
        };
    };
    copyrights: string;
    legs: DirectionsLeg[];
    overview_polyline: {
        points: string;
    };
    waypoint_order: number[];
}

export interface DirectionsResponse {
    status: string;
    routes: DirectionsRoute[];
    geocoded_waypoints: Array<{
        geocoder_status: string;
        place_id: string;
        types: string[];
    }>;
} 