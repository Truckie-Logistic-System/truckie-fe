import React from 'react';
import RouteMapWithRealTimeTracking from './RouteMapWithRealTimeTracking';
import { OrderStatusEnum } from '../../../../constants/enums';

interface JourneyMapItemProps {
    journey: any;
    journeyIdx: number;
    orderId: string;
    orderStatus: string;
    onTrackingActive: () => void;
}

const REAL_TIME_TRACKING_STATUSES = [
    OrderStatusEnum.PICKING_UP,
    OrderStatusEnum.ON_DELIVERED,
    OrderStatusEnum.ONGOING_DELIVERED,
    OrderStatusEnum.DELIVERED,
    OrderStatusEnum.IN_TROUBLES,
    OrderStatusEnum.RESOLVED,
    OrderStatusEnum.COMPENSATION,
    OrderStatusEnum.SUCCESSFUL,
    OrderStatusEnum.RETURNING,
    OrderStatusEnum.RETURNED
];

// Memoized component to prevent unnecessary re-renders
const JourneyMapItem: React.FC<JourneyMapItemProps> = React.memo(({
    journey,
    journeyIdx,
    orderId,
    orderStatus,
    onTrackingActive
}) => {
    if (!journey.journeySegments || journey.journeySegments.length === 0) {
        return null;
    }

    return (
        <div
            key={journey.id || `journey-${journeyIdx}`}
            className={journeyIdx > 0 ? "mt-4 pt-4 border-t border-gray-200" : ""}
        >
            <RouteMapWithRealTimeTracking
                journeySegments={journey.journeySegments}
                journeyInfo={journey}
                orderId={orderId}
                shouldShowRealTimeTracking={REAL_TIME_TRACKING_STATUSES.includes(orderStatus as OrderStatusEnum)}
                onTrackingActive={onTrackingActive}
            />
        </div>
    );
}, (prevProps, nextProps) => {
    // Return TRUE to SKIP re-render, FALSE to DO re-render
    if (prevProps.journey?.id !== nextProps.journey?.id) return false;
    if (prevProps.orderId !== nextProps.orderId) return false;
    if (prevProps.orderStatus !== nextProps.orderStatus) return false;
    if (prevProps.onTrackingActive !== nextProps.onTrackingActive) return false;
    
    // All checks passed - props are the same, SKIP re-render
    return true;
});

JourneyMapItem.displayName = 'JourneyMapItem';

export default JourneyMapItem;
