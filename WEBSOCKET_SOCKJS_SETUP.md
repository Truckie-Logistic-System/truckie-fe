# WebSocket với SockJS - Hướng dẫn triển khai

## 📋 Tổng quan

Dự án sử dụng **SockJS** làm transport layer cho WebSocket để hỗ trợ gửi JWT token trong STOMP CONNECT headers. Raw WebSocket không cho phép custom headers trong browser, nên SockJS là giải pháp tối ưu.

## 🔧 Cấu hình Frontend

### 1. Dependencies đã cài đặt

```json
{
  "@stomp/stompjs": "^7.2.0",
  "sockjs-client": "^1.6.1",
  "@types/sockjs-client": "^1.5.4"
}
```

### 2. Các WebSocket Endpoints

#### A. Vehicle Tracking WebSocket
- **File**: `src/hooks/useVehicleTracking.ts`
- **Endpoint**: `http://localhost:8080/vehicle-tracking-browser`
- **Authentication**: JWT token trong `connectHeaders.Authorization`
- **Topics**:
  - Subscribe: `/topic/orders/{orderId}/vehicles`
  - Subscribe: `/topic/vehicles/{vehicleId}`
  - Publish: `/app/order/{orderId}/get-locations`
  - Publish: `/app/vehicle/{vehicleId}/get-location`

```typescript
const client = new Client({
  webSocketFactory: () => {
    return new SockJS(`http://${window.location.hostname}:8080/vehicle-tracking-browser`);
  },
  connectHeaders: {
    Authorization: `Bearer ${token}`,
  },
  reconnectDelay: 5000,
  heartbeatIncoming: 4000,
  heartbeatOutgoing: 4000,
});
```

#### B. Chat WebSocket
- **File**: `src/context/ChatContext.tsx`
- **Endpoint**: `http://localhost:8080/chat-browser`
- **Topics**:
  - Subscribe: `/topic/room/{roomId}`
  - Publish: `/app/chat.sendMessage/{roomId}`

```typescript
const stompClient = new Client({
  webSocketFactory: () => {
    return new SockJS(`http://${host}:8080/chat-browser`);
  },
  reconnectDelay: 5000,
});
```

## 🖥️ Yêu cầu Backend

### 1. CORS Configuration

Backend cần cấu hình CORS cho phép origin của frontend:

```java
@Configuration
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Vehicle Tracking endpoint
        registry.addEndpoint("/vehicle-tracking-browser")
                .setAllowedOrigins("http://localhost:5173", "http://localhost:3000")
                .withSockJS();
        
        // Chat endpoint
        registry.addEndpoint("/chat-browser")
                .setAllowedOrigins("http://localhost:5173", "http://localhost:3000")
                .withSockJS();
    }
    
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }
}
```

### 2. JWT Authentication Interceptor

```java
@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {
    
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authToken = accessor.getFirstNativeHeader("Authorization");
            if (authToken != null && authToken.startsWith("Bearer ")) {
                String token = authToken.substring(7);
                // Validate JWT token
                // Set authentication in SecurityContext
            }
        }
        
        return message;
    }
}
```

### 3. Message Handlers

```java
@Controller
public class VehicleTrackingController {
    
    @MessageMapping("/order/{orderId}/get-locations")
    public void getOrderVehicleLocations(@DestinationVariable String orderId) {
        // Get all vehicles for order
        // Send to /topic/orders/{orderId}/vehicles
    }
    
    @MessageMapping("/vehicle/{vehicleId}/get-location")
    public void getVehicleLocation(@DestinationVariable String vehicleId) {
        // Get vehicle location
        // Send to /topic/vehicles/{vehicleId}
    }
}

@Controller
public class ChatController {
    
    @MessageMapping("/chat.sendMessage/{roomId}")
    public void sendMessage(@DestinationVariable String roomId, @Payload MessageRequest message) {
        // Process message
        // Send to /topic/room/{roomId}
    }
}
```

## 🔒 Security (CSP)

File `index.html` đã có CSP policy cho phép WebSocket:

```html
<meta http-equiv="Content-Security-Policy" content="
  connect-src 'self' http://localhost:* ws://localhost:* ws://* https://* wss://*;
">
```

## 🚀 Cách sử dụng

### Vehicle Tracking

```typescript
import { useVehicleTracking } from '@/hooks/useVehicleTracking';

const { vehicleLocations, isConnected, error } = useVehicleTracking({
  orderId: order.id,
  autoConnect: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
});
```

### Chat

```typescript
import { useChatContext } from '@/context/ChatContext';

const { connectWebSocket, sendMessage } = useChatContext();

// Connect
connectWebSocket(userId, roomId);

// Send message
sendMessage({
  roomId,
  senderId: userId,
  message: "Hello",
  type: "TEXT"
});
```

## 🐛 Troubleshooting

### Lỗi: WebSocket connection failed

**Nguyên nhân**: Backend server không chạy hoặc endpoint không đúng

**Giải pháp**:
1. Kiểm tra backend server đang chạy trên port 8080
2. Kiểm tra endpoint `/vehicle-tracking-browser` và `/chat-browser` có tồn tại
3. Kiểm tra CORS configuration

### Lỗi: STOMP error - Unauthorized

**Nguyên nhân**: JWT token không hợp lệ hoặc hết hạn

**Giải pháp**:
1. Kiểm tra token trong `connectHeaders.Authorization`
2. Đảm bảo token chưa hết hạn
3. Kiểm tra backend JWT validation

### Lỗi: Cannot connect to SockJS

**Nguyên nhân**: SockJS endpoint không được cấu hình đúng

**Giải pháp**:
1. Đảm bảo backend có `.withSockJS()` trong endpoint registration
2. Kiểm tra CORS allowedOrigins
3. Kiểm tra network tab trong DevTools

## 📝 Notes

- **SockJS vs Raw WebSocket**: SockJS cho phép gửi custom headers (JWT token) trong browser
- **Endpoint naming**: Backend endpoints phải có suffix `-browser` cho SockJS
- **Reconnection**: Cả hai implementations đều có auto-reconnect logic
- **Token refresh**: Khi token hết hạn, cần disconnect và reconnect với token mới
