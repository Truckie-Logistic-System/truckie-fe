export interface OffRouteEvent {
    id: string;
    vehicleAssignmentId: string;
    orderId?: string;
    offRouteStartTime: string;
    lastKnownLat: number;
    lastKnownLng: number;
    distanceFromRouteMeters: number;
    previousDistanceFromRouteMeters?: number;
    lastLocationUpdateAt: string;
    warningStatus: OffRouteWarningStatus;
    yellowWarningSentAt?: string;
    redWarningSentAt?: string;
    canContactDriver?: boolean;
    contactNotes?: string;
    // Contact confirmation fields
    contactedAt?: string;
    contactedBy?: string;
    gracePeriodExtended: boolean;
    gracePeriodExtensionCount: number;
    gracePeriodExtendedAt?: string;
    gracePeriodExpiresAt?: string;
    resolvedAt?: string;
    resolvedReason?: string;
    // Calculated fields
    offRouteDurationSeconds: number;
    // Nested vehicle assignment for driver info
    vehicleAssignment?: {
        id: string;
        driver1?: {
            fullName: string;
            phoneNumber: string;
        };
        driver2?: {
            fullName: string;
            phoneNumber: string;
        };
    };
}

export enum OffRouteWarningStatus {
    NONE = 'NONE',
    YELLOW_SENT = 'YELLOW_SENT',
    RED_SENT = 'RED_SENT',
    CONTACTED_WAITING_RETURN = 'CONTACTED_WAITING_RETURN',
    CONTACT_FAILED = 'CONTACT_FAILED',
    RESOLVED_SAFE = 'RESOLVED_SAFE',
    ISSUE_CREATED = 'ISSUE_CREATED',
    BACK_ON_ROUTE = 'BACK_ON_ROUTE'
}

export interface ContactConfirmationRequest {
    eventId: string;
    staffId: string;
    contactNotes?: string;
}

export interface GracePeriodExtensionRequest {
    eventId: string;
    staffId: string;
    extensionReason?: string;
}

export interface OffRouteEventResponse {
    event: OffRouteEvent;
    message: string;
}

// Helper functions for status display
export const getOffRouteStatusLabel = (status: OffRouteWarningStatus): string => {
    switch (status) {
        case OffRouteWarningStatus.NONE:
            return 'Chưa có cảnh báo';
        case OffRouteWarningStatus.YELLOW_SENT:
            return 'Cảnh báo vàng';
        case OffRouteWarningStatus.RED_SENT:
            return 'Cảnh báo đỏ';
        case OffRouteWarningStatus.CONTACTED_WAITING_RETURN:
            return 'Đã liên hệ - Chờ tài xế về tuyến';
        case OffRouteWarningStatus.CONTACT_FAILED:
            return 'Liên hệ thất bại';
        case OffRouteWarningStatus.RESOLVED_SAFE:
            return 'Đã giải quyết an toàn';
        case OffRouteWarningStatus.ISSUE_CREATED:
            return 'Đã tạo sự cố';
        case OffRouteWarningStatus.BACK_ON_ROUTE:
            return 'Đã về tuyến';
        default:
            return status;
    }
};

export const getOffRouteStatusColor = (status: OffRouteWarningStatus): string => {
    switch (status) {
        case OffRouteWarningStatus.NONE:
            return 'default';
        case OffRouteWarningStatus.YELLOW_SENT:
            return 'gold';
        case OffRouteWarningStatus.RED_SENT:
            return 'red';
        case OffRouteWarningStatus.CONTACTED_WAITING_RETURN:
            return 'blue';
        case OffRouteWarningStatus.CONTACT_FAILED:
            return 'volcano';
        case OffRouteWarningStatus.RESOLVED_SAFE:
            return 'green';
        case OffRouteWarningStatus.ISSUE_CREATED:
            return 'purple';
        case OffRouteWarningStatus.BACK_ON_ROUTE:
            return 'cyan';
        default:
            return 'default';
    }
};
