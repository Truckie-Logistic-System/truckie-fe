// Notification types
export enum NotificationType {
    SEAL_ASSIGNMENT = 'SEAL_ASSIGNMENT',
    ISSUE_CREATED = 'ISSUE_CREATED',
    ISSUE_RESOLVED = 'ISSUE_RESOLVED',
    ORDER_ASSIGNED = 'ORDER_ASSIGNED',
    ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED'
}

// Notification priority
export enum NotificationPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    URGENT = 'URGENT'
}

// Notification entity
export interface Notification {
    id: string;
    type: NotificationType;
    priority: NotificationPriority;
    title: string;
    message: string;
    data?: any; // Additional data (issue, order, etc.)
    recipientId: string; // User ID who should receive this
    isRead: boolean;
    createdAt: string;
}

// Seal assignment notification data
export interface SealAssignmentNotificationData {
    issueId: string;
    oldSealCode: string;
    newSealCode: string;
    vehicleLicensePlate: string;
    staffName: string;
    instructions: string;
}
