// JourneyHistory model definitions
export interface JourneyHistory {
    id: string;
    journeyName: string;
    journeyType: string;
    status: string;
    totalTollFee: number;
    totalTollCount: number;
    totalDistance?: number;
    reasonForReroute: string | null;
    vehicleAssignmentId: string;
    isReportedIncident?: boolean;
    startTime?: string;
    endTime?: string;
    createdAt: string;
    modifiedAt: string;
    journeySegments: JourneySegment[];
}

export interface JourneySegment {
    id: string;
    segmentOrder: number;
    startPointName: string;
    endPointName: string;
    startLatitude: number;
    startLongitude: number;
    endLatitude: number;
    endLongitude: number;
    distanceKilometers: number;
    pathCoordinatesJson: string;
    tollDetailsJson: string | null;
    status: string;
    createdAt: string;
    modifiedAt: string;
}

export interface TollDetail {
    name: string;
    address: string;
    type: string;
    amount: number;
}

export type JourneyType = "INITIAL" | "REROUTED" | "OPTIMIZED" | "MANUAL";
export type JourneyStatus = "ACTIVE" | "COMPLETED" | "CANCELLED" | "PENDING";

// Helper function to parse toll details from JSON string
export const parseTollDetails = (tollDetailsJson: string | null): TollDetail[] => {
    if (!tollDetailsJson) return [];

    try {
        return JSON.parse(tollDetailsJson);
    } catch (error) {
        console.error("Error parsing toll details:", error);
        return [];
    }
};

// Helper function to get the total toll fee from toll details
export const calculateTotalTollFee = (tollDetails: TollDetail[]): number => {
    return tollDetails.reduce((sum, toll) => sum + (toll.amount || 0), 0);
};

// Helper function to format journey type for display
export const formatJourneyType = (journeyType?: string): string => {
    if (!journeyType) return "Không xác định";

    switch (journeyType) {
        case "INITIAL":
            return "Ban đầu";
        case "REROUTED":
            return "Định tuyến lại";
        case "OPTIMIZED":
            return "Tối ưu";
        case "MANUAL":
            return "Thủ công";
        default:
            return journeyType;
    }
};

// Helper function to get status color
export const getJourneyStatusColor = (status?: string): string => {
    if (!status) return "default";

    switch (status) {
        case "ACTIVE":
            return "green";
        case "COMPLETED":
            return "blue";
        case "CANCELLED":
            return "red";
        case "PENDING":
            return "orange";
        default:
            return "default";
    }
};

// Helper function to format journey status to Vietnamese
export const formatJourneyStatus = (status: string): string => {
    switch (status) {
        case 'ACTIVE':
            return 'Đang hoạt động';
        case 'COMPLETED':
            return 'Đã hoàn thành';
        case 'CANCELLED':
            return 'Đã hủy';
        case 'PENDING':
            return 'Đang chờ';
        default:
            return status;
    }
};

// Helper function to translate segment point names to Vietnamese
export const translatePointName = (pointName: string): string => {
    switch (pointName) {
        case 'Carrier':
            return 'Đơn vị vận chuyển';
        case 'Pickup':
            return 'Điểm lấy hàng';
        case 'Delivery':
            return 'Điểm giao hàng';
        default:
            return pointName;
    }
};

// Helper function to format journey segment status to Vietnamese
export const formatSegmentStatus = (status: string): string => {
    switch (status) {
        case 'PENDING':
            return 'Đang chờ';
        case 'ACTIVE':
            return 'Đang hoạt động';
        case 'COMPLETED':
            return 'Đã hoàn thành';
        case 'CANCELLED':
            return 'Đã hủy';
        default:
            return status;
    }
};

// Helper function to format seal status to Vietnamese
export const formatSealStatus = (status: string): string => {
    switch (status) {
        case 'ACTIVE':
            return 'Đang hoạt động';
        case 'IN_USE':
            return 'Đang sử dụng';
        case 'REMOVED':
            return 'Đã gỡ';
        case 'USED':
            return 'Đã sử dụng';
        default:
            return status;
    }
};

// Note: getSealStatusColor is already exported from constants/enums/sealStatus.ts
// Import it from there if needed