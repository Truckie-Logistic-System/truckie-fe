import { calculateDistance } from '../../../models/Map';

// Format time from seconds to string
export const formatTime = (totalSeconds: number): string => {
    if (totalSeconds < 60) {
        return `${Math.round(totalSeconds)} giây`;
    } else if (totalSeconds < 3600) {
        return `${Math.round(totalSeconds / 60)} phút`;
    } else {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.round((totalSeconds % 3600) / 60);
        return `${hours} giờ ${minutes > 0 ? `${minutes} phút` : ''}`;
    }
};

// Wrapper cho hàm calculateDistance để tương thích với code hiện tại
const calculateDistanceWrapper = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    // Tạo các đối tượng MapLocation
    const point1 = { lat: lat1, lng: lng1 };
    const point2 = { lat: lat2, lng: lng2 };

    // Gọi hàm calculateDistance từ model
    return calculateDistance(point1, point2);
};

// Calculate bearing between two points
export const calculateBearing = (startLat: number, startLng: number, destLat: number, destLng: number): number => {
    startLat = startLat * Math.PI / 180;
    startLng = startLng * Math.PI / 180;
    destLat = destLat * Math.PI / 180;
    destLng = destLng * Math.PI / 180;

    const y = Math.sin(destLng - startLng) * Math.cos(destLat);
    const x = Math.cos(startLat) * Math.sin(destLat) -
        Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    if (bearing < 0) {
        bearing += 360;
    }
    return bearing;
};

// Find closest point on route to current position
export const findClosestPointOnRoute = (
    currentPosition: { lat: number; lng: number },
    routeCoordinates: Array<[number, number]>
): { point: [number, number]; index: number; distance: number } => {
    let closestPoint: [number, number] = [0, 0];
    let closestDistance = Infinity;
    let closestIndex = 0;

    routeCoordinates.forEach((coord, index) => {
        const distance = calculateDistanceWrapper(
            currentPosition.lat,
            currentPosition.lng,
            coord[1],
            coord[0]
        );

        if (distance < closestDistance) {
            closestDistance = distance;
            closestPoint = coord;
            closestIndex = index;
        }
    });

    return {
        point: closestPoint,
        index: closestIndex,
        distance: closestDistance
    };
};

// Calculate remaining distance from current position to destination
export const calculateRemainingDistance = (
    currentPosition: { lat: number; lng: number },
    routeCoordinates: Array<[number, number]>,
    currentIndex: number
): number => {
    let remainingDistance = 0;

    // If we're at the last point, return 0
    if (currentIndex >= routeCoordinates.length - 1) {
        return 0;
    }

    // Add distance from current position to next point
    remainingDistance += calculateDistanceWrapper(
        currentPosition.lat,
        currentPosition.lng,
        routeCoordinates[currentIndex + 1][1],
        routeCoordinates[currentIndex + 1][0]
    );

    // Add distances between remaining points
    for (let i = currentIndex + 1; i < routeCoordinates.length - 1; i++) {
        remainingDistance += calculateDistanceWrapper(
            routeCoordinates[i][1],
            routeCoordinates[i][0],
            routeCoordinates[i + 1][1],
            routeCoordinates[i + 1][0]
        );
    }

    return remainingDistance;
};

// Find current instruction based on position
export const findCurrentInstruction = (
    currentIndex: number,
    steps: Array<{ interval: [number, number] }>
): number => {
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        if (currentIndex >= step.interval[0] && currentIndex <= step.interval[1]) {
            return i;
        }
    }
    return 0; // Default to first instruction if no match
};

// Calculate distance to next turn
export const calculateDistanceToNextTurn = (
    currentPosition: { lat: number; lng: number },
    routeCoordinates: Array<[number, number]>,
    currentIndex: number,
    nextTurnIndex: number
): number => {
    if (nextTurnIndex <= currentIndex || nextTurnIndex >= routeCoordinates.length) {
        return 0;
    }

    let distToNextTurn = calculateDistanceWrapper(
        currentPosition.lat,
        currentPosition.lng,
        routeCoordinates[currentIndex + 1][1],
        routeCoordinates[currentIndex + 1][0]
    );

    for (let i = currentIndex + 1; i < nextTurnIndex; i++) {
        distToNextTurn += calculateDistanceWrapper(
            routeCoordinates[i][1],
            routeCoordinates[i][0],
            routeCoordinates[i + 1][1],
            routeCoordinates[i + 1][0]
        );
    }

    return distToNextTurn;
};

// Parse time string to seconds
export const parseTimeStringToSeconds = (timeString: string): number => {
    let totalSeconds = 0;

    // Extract hours
    const hourMatch = timeString.match(/(\d+)\s*giờ/);
    if (hourMatch) {
        totalSeconds += parseInt(hourMatch[1]) * 3600;
    }

    // Extract minutes
    const minuteMatch = timeString.match(/(\d+)\s*phút/);
    if (minuteMatch) {
        totalSeconds += parseInt(minuteMatch[1]) * 60;
    }

    // Extract seconds
    const secondMatch = timeString.match(/(\d+)\s*giây/);
    if (secondMatch) {
        totalSeconds += parseInt(secondMatch[1]);
    }

    return totalSeconds;
};

// Get initial navigation state
export const getInitialNavigationState = () => {
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