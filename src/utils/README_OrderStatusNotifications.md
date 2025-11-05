# Real-Time Order Status Notifications

This document describes the implementation of real-time order status updates across customer, staff, and admin order detail pages.

## Overview

The system uses WebSocket connections to receive real-time order status changes and automatically refreshes the order data on detail pages. This ensures users always see the most up-to-date information without manual page refreshes.

## Architecture

### Core Components

1. **useOrderStatusTracking Hook** (`src/hooks/useOrderStatusTracking.ts`)
   - Manages WebSocket connection to `/topic/orders/{orderId}/status`
   - Handles connection lifecycle (connect, disconnect, error handling)
   - Provides standardized interface for status change callbacks

2. **Order Status Notifications Utility** (`src/utils/orderStatusNotifications.ts`)
   - Standardized notification handling across all user roles
   - Role-specific notification behaviors
   - Automatic data refetching with debouncing
   - Sound notifications for important status changes

3. **Integration Points**
   - Customer Order Detail: `src/pages/Orders/components/CustomerOrderDetail.tsx`
   - Staff Order Detail: `src/pages/Staff/Order/components/OrderDetail.tsx`
   - Admin Order Detail: `src/pages/Admin/Order/components/StaffOrderDetail.tsx`

## Features

### Real-Time Data Fetching
- Automatic order data refresh when status changes occur
- 500ms debouncing to prevent excessive API calls
- WebSocket message validation for order ID matching

### Role-Specific Notifications

#### Customer Notifications
- Auto-switch to "Chi tiết vận chuyển" tab when pickup starts
- Sound notifications for important status changes
- Customer-friendly message formatting

#### Staff Notifications
- Comprehensive status change notifications
- Sound alerts for critical updates
- Focus on operational status changes

#### Admin Notifications
- All staff notifications plus admin-specific updates
- Contract draft notifications
- Enhanced monitoring capabilities

### Status Change Handling

The system handles these key status transitions:
- `FULLY_PAID` → `PICKING_UP`: Driver started pickup
- `PICKING_UP` → `IN_TRANSIT`: Package in transit
- `IN_TRANSIT` → `DELIVERED`: Order delivered successfully
- Any status → `IN_TROUBLES`: Order issues/exceptions
- Any status → `CANCELLED`: Order cancellation
- `ASSIGNED_TO_DRIVER`: Driver assignment
- `CONTRACT_DRAFT`: Contract created (admin only)

## Implementation Details

### WebSocket Configuration
```typescript
// Connection endpoint
const topicPath = `/topic/orders/${orderId}/status`;

// Connection headers
connectHeaders: {
  Authorization: `Bearer ${token}`,
}

// Reconnection settings
reconnectDelay: 5000,
heartbeatIncoming: 4000,
heartbeatOutgoing: 4000,
```

### Standardized Handler Usage
```typescript
const handleOrderStatusChange = createOrderStatusChangeHandler({
  orderId: id,
  refetch: refetch,
  messageApi: messageApi,
  onStatusChange: (statusChange) => {
    notificationHandlers.customer(statusChange, messageApi, setActiveMainTab);
  },
});

useOrderStatusTracking({
  orderId: id,
  autoConnect: true,
  onStatusChange: handleOrderStatusChange,
});
```

### Message Structure
```typescript
interface OrderStatusChangeMessage {
  orderId: string;
  orderCode: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
  message: string;
}
```

## Backend Requirements

### WebSocket Topic
The backend should broadcast order status changes to:
```
/topic/orders/{orderId}/status
```

### Message Format
```json
{
  "orderId": "string",
  "orderCode": "string", 
  "previousStatus": "string",
  "newStatus": "string",
  "timestamp": "string",
  "message": "string"
}
```

### Status Flow
Typical order status flow:
1. `PENDING` → `CONFIRMED`
2. `CONFIRMED` → `FULLY_PAID`
3. `FULLY_PAID` → `ASSIGNED_TO_DRIVER`
4. `ASSIGNED_TO_DRIVER` → `PICKING_UP`
5. `PICKING_UP` → `IN_TRANSIT`
6. `IN_TRANSIT` → `DELIVERED`

Exception flows:
- Any status → `IN_TROUBLES`
- Any status → `CANCELLED`

## Performance Considerations

### Debouncing
- 500ms delay before data refetch to prevent API spikes
- Allows WebSocket broadcasts to settle

### Connection Management
- Automatic cleanup on component unmount
- Error handling with reconnection logic
- Connection status monitoring

### Memory Management
- Proper subscription cleanup
- Reference management for callbacks
- State cleanup on unmount

## Troubleshooting

### Common Issues

1. **No Real-Time Updates**
   - Check WebSocket connection status in browser dev tools
   - Verify authentication token is valid
   - Ensure backend is broadcasting to correct topic

2. **Excessive API Calls**
   - Verify debouncing is working (500ms delay)
   - Check for multiple component instances
   - Monitor WebSocket message frequency

3. **Notification Sound Not Playing**
   - Check browser audio permissions
   - Verify user interaction requirement for autoplay
   - Check sound file availability

### Debug Logging
Enable debug logging by checking browser console for:
- `[OrderStatusTracking]` prefix messages
- WebSocket connection status
- Message parsing results
- Order ID matching validation

## Future Enhancements

### Potential Improvements
1. **Offline Support**: Cache status changes for when connection is restored
2. **Notification Preferences**: User-configurable notification settings
3. **Batch Updates**: Group multiple status changes for better performance
4. **Analytics**: Track notification effectiveness and user engagement
5. **Mobile Push Notifications**: Native mobile app notifications

### Scalability Considerations
1. **Connection Pooling**: Efficient WebSocket connection management
2. **Message Queuing**: Handle high-volume status updates
3. **Load Balancing**: Distribute WebSocket connections across servers
4. **Monitoring**: Real-time connection health monitoring

## Security Notes

- All WebSocket connections require valid JWT tokens
- Order ID validation prevents cross-order data access
- Message sanitization prevents XSS attacks
- Rate limiting can be implemented for notification sounds

## Dependencies

- `@stomp/stompjs`: WebSocket STOMP client
- `sockjs-client`: WebSocket fallback transport
- React hooks: `useState`, `useEffect`, `useCallback`
- Ant Design: `message` API for notifications

This system provides a robust, scalable solution for real-time order status updates across all user roles in the transportation management system.
