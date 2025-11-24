/**
 * Decode an encoded polyline string into an array of [lat, lng] coordinates
 * Algorithm based on Google's Polyline Encoding Algorithm
 * @param encoded - The encoded polyline string
 * @param precision - Precision level (default 5 for standard, 6 for higher precision)
 * @returns Array of [latitude, longitude] pairs
 */
export function decodePolyline(encoded: string, precision: number = 5): [number, number][] {
    if (!encoded || typeof encoded !== 'string') {
        return [];
    }

    const coordinates: [number, number][] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;
    const factor = Math.pow(10, precision);

    while (index < encoded.length) {
        // Decode latitude
        let result = 0;
        let shift = 0;
        let byte: number;

        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        const deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += deltaLat;

        // Decode longitude
        result = 0;
        shift = 0;

        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        const deltaLng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += deltaLng;

        coordinates.push([lat / factor, lng / factor]);
    }

    return coordinates;
}

/**
 * Encode an array of coordinates into a polyline string
 * @param coordinates - Array of [latitude, longitude] pairs
 * @param precision - Precision level (default 5)
 * @returns Encoded polyline string
 */
export function encodePolyline(coordinates: [number, number][], precision: number = 5): string {
    if (!coordinates || coordinates.length === 0) {
        return '';
    }

    const factor = Math.pow(10, precision);
    let encoded = '';
    let prevLat = 0;
    let prevLng = 0;

    for (const [lat, lng] of coordinates) {
        const latE5 = Math.round(lat * factor);
        const lngE5 = Math.round(lng * factor);

        const deltaLat = latE5 - prevLat;
        const deltaLng = lngE5 - prevLng;

        encoded += encodeValue(deltaLat);
        encoded += encodeValue(deltaLng);

        prevLat = latE5;
        prevLng = lngE5;
    }

    return encoded;
}

function encodeValue(num: number): string {
    let encoded = '';
    let value = num < 0 ? ~(num << 1) : (num << 1);

    while (value >= 0x20) {
        encoded += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
        value >>= 5;
    }

    encoded += String.fromCharCode(value + 63);
    return encoded;
}
