# WebSocket Order Status Updates - Implementation Summary

## Overview
Đã triển khai hệ thống WebSocket broadcasting toàn diện để tự động cập nhật UI khi order status thay đổi, bao gồm cả tính năng tự động chuyển tab phù hợp.

## Backend Changes

### 1. ContractServiceImpl.java
**File**: `d:\capstone\capstone-be\src\main\java\capstone_project\service\services\order\order\impl\ContractServiceImpl.java`

#### Thêm WebSocket Service
```java
import capstone_project.service.services.order.order.OrderStatusWebSocketService;

private final OrderStatusWebSocketService orderStatusWebSocketService;
```

#### API: `/contracts/upload-contract`
**Method**: `uploadContractFile()`
- **Status Change**: `PROCESSING` → `CONTRACT_DRAFT`
- **WebSocket Broadcasting**: ✅ Added
- **Use Case**: Khi staff upload contract file PDF

```java
OrderStatusEnum previousStatus = OrderStatusEnum.valueOf(order.getStatus());
order.setStatus(OrderStatusEnum.CONTRACT_DRAFT.name());
orderEntityService.save(order);

// Send WebSocket notification
orderStatusWebSocketService.sendOrderStatusChange(
    order.getId(),
    order.getOrderCode(),
    previousStatus,
    OrderStatusEnum.CONTRACT_DRAFT
);
```

#### API: `/contracts/both/for-cus`
**Method**: `createBothContractAndContractRuleForCus()`
- **Status Change**: `PENDING` → `PROCESSING`
- **WebSocket Broadcasting**: ✅ Added
- **Use Case**: Khi customer đồng ý với đề xuất phân xe

```java
OrderStatusEnum previousStatus = OrderStatusEnum.valueOf(order.getStatus());
order.setStatus(OrderStatusEnum.PROCESSING.name());
orderEntityService.save(order);

// Send WebSocket notification
orderStatusWebSocketService.sendOrderStatusChange(
    order.getId(),
    order.getOrderCode(),
    previousStatus,
    OrderStatusEnum.PROCESSING
);
```

### 2. OrderServiceImpl.java
**File**: `d:\capstone\capstone-be\src\main\java\capstone_project\service\services\order\order\impl\OrderServiceImpl.java`

#### Các API đã có WebSocket Broadcasting (đã tồn tại trước đó):
- ✅ `changeAStatusOrder()` - Thay đổi status đơn lẻ
- ✅ `changeStatusOrderWithAllOrderDetail()` - Thay đổi status order và tất cả order details
- ✅ `updateOrderStatus()` - Cập nhật status với validation
- ✅ `signContractAndOrder()` - Ký hợp đồng (gọi `changeAStatusOrder()`)

## Frontend Changes

### 1. Enhanced Order Status Notifications Utility
**File**: `d:\capstone\capstone-fe\src\utils\orderStatusNotifications.ts`

#### New Features:
1. **Tab Switching Support**: Tự động chuyển tab dựa trên order status
2. **Configurable Tab Mapping**: Có thể customize tab switching logic cho từng component

#### Tab Switching Rules:
```typescript
const tabSwitchingRules: Record<string, string> = {
  'CONTRACT_DRAFT': 'contract',      // Chuyển sang tab hợp đồng khi draft
  'CONTRACT_SIGNED': 'contract',     // Ở lại tab hợp đồng sau khi ký
  'FULLY_PAID': 'contract',          // Hiển thị thanh toán hoàn tất
  'ASSIGNED_TO_DRIVER': 'detail',    // Chuyển sang tab chi tiết khi phân tài xế
  'PICKING_UP': 'details',           // Chuyển sang tab chi tiết khi bắt đầu lấy hàng
  'IN_TRANSIT': 'details',           // Ở lại tab chi tiết khi đang vận chuyển
  'DELIVERED': 'details',            // Ở lại tab chi tiết khi đã giao
  'IN_TROUBLES': 'details',          // Chuyển sang tab chi tiết khi có sự cố
};
```

#### New Interface:
```typescript
export interface UseOrderStatusNotificationsOptions {
  orderId: string | undefined;
  refetch: () => void;
  messageApi: any;
  onStatusChange?: (message: OrderStatusChangeMessage) => void;
  customNotifications?: Partial<Record<string, (message: OrderStatusChangeMessage) => void>>;
  onTabSwitch?: (tabKey: string) => void; // NEW: Callback để chuyển tab
}
```

### 2. Updated Order Detail Components

#### Admin Order Detail
**File**: `d:\capstone\capstone-fe\src\pages\Admin\Order\components\StaffOrderDetail.tsx`

```typescript
const handleOrderStatusChange = createOrderStatusChangeHandler({
  orderId: id,
  refetch: refetch,
  messageApi: messageApi,
  onStatusChange: (statusChange: any) => {
    notificationHandlers.admin(statusChange, messageApi);
  },
  onTabSwitch: (tabKey: string) => {
    setActiveMainTab(tabKey); // Tự động chuyển tab
  },
});
```

**Tab Keys**: `basic`, `detail`, `contract`

#### Customer Order Detail
**File**: `d:\capstone\capstone-fe\src\pages\Orders\components\CustomerOrderDetail.tsx`

```typescript
const handleOrderStatusChange = createOrderStatusChangeHandler({
  orderId: id,
  refetch: refetch,
  messageApi: messageApi,
  onStatusChange: (statusChange: any) => {
    notificationHandlers.customer(statusChange, messageApi, setActiveMainTab);
  },
  onTabSwitch: (tabKey: string) => {
    setActiveMainTab(tabKey); // Tự động chuyển tab
  },
});
```

**Tab Keys**: `basic`, `details`, `contract`

#### Staff Order Detail
**File**: `d:\capstone\capstone-fe\src\pages\Staff\Order\components\OrderDetail.tsx`

```typescript
const handleOrderStatusChange = createOrderStatusChangeHandler({
  orderId: id,
  refetch: refetch,
  messageApi: messageApi,
  onTabSwitch: (tabKey: string) => {
    // Map tab keys to staff order detail tabs
    const tabMapping: Record<string, string> = {
      'contract': 'contract',
      'detail': 'info',
      'details': 'info',
    };
    const mappedTab = tabMapping[tabKey] || tabKey;
    setActiveTab(mappedTab);
  },
});
```

**Tab Keys**: `info`, `contract`, `history`

## User Experience Flow

### Scenario 1: Customer Accepts Vehicle Suggestion
1. **Action**: Customer clicks "Đồng ý với đề xuất phân xe"
2. **API Call**: `POST /contracts/both/for-cus`
3. **Backend**: 
   - Tạo contract và contract rules
   - Cập nhật order status: `PENDING` → `PROCESSING`
   - Broadcast WebSocket message
4. **Frontend**:
   - Nhận WebSocket message
   - Refetch order data (500ms delay)
   - Hiển thị notification: "📦 Trạng thái đơn hàng đã thay đổi"
   - **Không chuyển tab** (PROCESSING không có trong tab switching rules)

### Scenario 2: Staff Uploads Contract PDF
1. **Action**: Staff uploads contract PDF file
2. **API Call**: `POST /contracts/upload-contract`
3. **Backend**:
   - Upload file to Cloudinary
   - Cập nhật contract details
   - Cập nhật order status: `PROCESSING` → `CONTRACT_DRAFT`
   - Broadcast WebSocket message
4. **Frontend**:
   - Nhận WebSocket message
   - Refetch order data (500ms delay)
   - Hiển thị notification: "📦 Trạng thái đơn hàng đã thay đổi"
   - **Tự động chuyển sang tab "Hợp đồng & Thanh toán"** (600ms delay)

### Scenario 3: Customer Signs Contract
1. **Action**: Customer clicks "Ký hợp đồng"
2. **API Call**: `POST /orders/{orderId}/sign-contract`
3. **Backend**:
   - Cập nhật contract status: `CONTRACT_SIGNED`
   - Cập nhật order status: `CONTRACT_DRAFT` → `CONTRACT_SIGNED`
   - Broadcast WebSocket message (via `changeAStatusOrder()`)
4. **Frontend**:
   - Nhận WebSocket message
   - Refetch order data (500ms delay)
   - Hiển thị notification: "📦 Trạng thái đơn hàng đã thay đổi"
   - **Ở lại tab "Hợp đồng & Thanh toán"**

### Scenario 4: Driver Starts Pickup
1. **Action**: Driver clicks "Bắt đầu lấy hàng"
2. **API Call**: `PUT /orders/{orderId}/status` (newStatus=PICKING_UP)
3. **Backend**:
   - Cập nhật order status: `FULLY_PAID` → `PICKING_UP`
   - Broadcast WebSocket message (via `updateOrderStatus()`)
4. **Frontend**:
   - Nhận WebSocket message
   - Refetch order data (500ms delay)
   - Hiển thị notification: "🚛 Tài xế đã bắt đầu lấy hàng!"
   - Play sound notification
   - **Tự động chuyển sang tab "Chi tiết vận chuyển"** (600ms delay)

## Benefits

### 1. Real-Time Updates
- ✅ Tất cả users nhìn thấy status changes ngay lập tức
- ✅ Không cần refresh trang thủ công
- ✅ Đồng bộ data giữa multiple tabs/devices

### 2. Better UX
- ✅ Tự động chuyển đến tab phù hợp với status mới
- ✅ User không bị lost khi status thay đổi
- ✅ Contextual notifications với sound alerts

### 3. Consistency
- ✅ Tất cả order detail pages sử dụng cùng logic
- ✅ Standardized notification handling
- ✅ Centralized tab switching rules

### 4. Performance
- ✅ Debounced refetch (500ms) tránh API spam
- ✅ WebSocket failure không ảnh hưởng business logic
- ✅ Efficient data updates chỉ khi cần thiết

## Testing Checklist

### Backend Testing
- [ ] Test `/contracts/upload-contract` sends WebSocket message
- [ ] Test `/contracts/both/for-cus` sends WebSocket message
- [ ] Verify WebSocket message format is correct
- [ ] Check logs for WebSocket broadcasting

### Frontend Testing
- [ ] Test tab switching when contract is drafted
- [ ] Test tab switching when driver assigned
- [ ] Test tab switching when pickup starts
- [ ] Verify notifications display correctly
- [ ] Check sound notifications play
- [ ] Test with multiple browser tabs open
- [ ] Verify refetch happens after status change

### Integration Testing
- [ ] Customer accepts vehicle suggestion → UI updates
- [ ] Staff uploads contract → Customer sees update
- [ ] Customer signs contract → Staff sees update
- [ ] Driver starts pickup → All parties see update

## Configuration

### Disable Tab Switching
Nếu muốn tắt tab switching cho một component cụ thể:

```typescript
const handleOrderStatusChange = createOrderStatusChangeHandler({
  orderId: id,
  refetch: refetch,
  messageApi: messageApi,
  // Don't provide onTabSwitch callback
});
```

### Custom Tab Switching Logic
```typescript
const handleOrderStatusChange = createOrderStatusChangeHandler({
  orderId: id,
  refetch: refetch,
  messageApi: messageApi,
  onTabSwitch: (tabKey: string) => {
    // Custom logic
    if (tabKey === 'contract') {
      // Do something special
      setActiveMainTab('custom-tab');
    } else {
      setActiveMainTab(tabKey);
    }
  },
});
```

## Troubleshooting

### WebSocket Messages Not Received
1. Check WebSocket connection status in browser DevTools
2. Verify authentication token is valid
3. Check backend logs for WebSocket broadcasting
4. Ensure orderId matches exactly (string vs UUID)

### Tab Not Switching
1. Check console logs for tab switching messages
2. Verify tab key exists in component
3. Check tab switching rules in `orderStatusNotifications.ts`
4. Ensure `onTabSwitch` callback is provided

### Multiple Refetches
1. Check for duplicate WebSocket subscriptions
2. Verify debouncing is working (500ms delay)
3. Look for multiple component instances

## Future Enhancements

1. **Configurable Tab Switching Rules**: Allow per-component customization
2. **Animation**: Add smooth transitions when switching tabs
3. **Notification History**: Track all status changes
4. **Offline Support**: Queue status changes when offline
5. **Mobile Push Notifications**: Native notifications for mobile apps

## Related Files

### Backend
- `ContractServiceImpl.java` - Contract operations with WebSocket
- `OrderServiceImpl.java` - Order status updates with WebSocket
- `OrderStatusWebSocketService.java` - WebSocket broadcasting service

### Frontend
- `orderStatusNotifications.ts` - Centralized notification handling
- `useOrderStatusTracking.ts` - WebSocket connection hook
- `StaffOrderDetail.tsx` - Admin order detail with tab switching
- `CustomerOrderDetail.tsx` - Customer order detail with tab switching
- `OrderDetail.tsx` - Staff order detail with tab switching

## Conclusion

Hệ thống WebSocket order status updates đã được triển khai toàn diện với:
- ✅ Backend broadcasting cho tất cả status changes
- ✅ Frontend auto-refresh và tab switching
- ✅ Consistent UX across all user roles
- ✅ Performance optimization với debouncing
- ✅ Error handling và fallback logic

System giờ đây cung cấp real-time updates mượt mà và intuitive cho tất cả users!
