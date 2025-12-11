/**
 * User-to-User Chat Models
 * For customer/driver/guest chatting with staff
 */

// ==================== Enums ====================

export enum ConversationType {
  CUSTOMER_SUPPORT = 'CUSTOMER_SUPPORT',
  DRIVER_SUPPORT = 'DRIVER_SUPPORT',
  GUEST_SUPPORT = 'GUEST_SUPPORT',
}

export enum ChatParticipantType {
  CUSTOMER = 'CUSTOMER',
  DRIVER = 'DRIVER',
  STAFF = 'STAFF',
  GUEST = 'GUEST',
  SYSTEM = 'SYSTEM',
}

export enum ChatMessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  SYSTEM = 'SYSTEM',
}

export enum ConversationStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

// ==================== Request DTOs ====================

export interface SendMessageRequest {
  conversationId: string;
  senderId?: string;
  guestSessionId?: string;
  senderName?: string;
  content: string;
  messageType?: string;
  imageUrl?: string;
}

export interface TypingIndicatorRequest {
  senderId?: string;
  senderName: string;
  senderType: string;
  isTyping: boolean;
}

// ==================== Response DTOs ====================

export interface ChatConversationResponse {
  id: string;
  conversationType: string;
  initiatorId?: string;
  initiatorType: string;
  initiatorName?: string;
  initiatorImageUrl?: string;
  guestSessionId?: string;
  guestName?: string;
  currentOrderId?: string;
  currentOrderCode?: string;
  currentVehicleAssignmentId?: string;
  currentTrackingCode?: string;
  trackingModifiedAt?: string;
  status: string;
  unreadCount: number;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  lastMessageSenderType?: string;
  createdAt: string;
  closedAt?: string;
  activeOrders?: ActiveOrderInfo[];
}

export interface ActiveOrderInfo {
  orderId: string;
  orderCode: string;
  status: string;
  receiverName: string;
  createdAt: string;
  modifiedAt?: string;
}

export interface ChatUserMessageResponse {
  id: string;
  conversationId: string;
  senderId?: string;
  senderType: string;
  senderName?: string;
  senderImageUrl?: string;
  content: string;
  messageType: string;
  imageUrl?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface ChatMessagesPageResponse {
  messages: ChatUserMessageResponse[];
  lastMessageId?: string;
  hasMore: boolean;
  totalCount: number;
}

export interface ChatStatisticsResponse {
  totalActiveConversations: number;
  customerSupportCount: number;
  driverSupportCount: number;
  guestSupportCount: number;
  totalUnreadMessages: number;
  closedToday: number;
  averageResponseTimeMinutes: number;
}

// ==================== Customer Overview ====================

export interface CustomerOverviewResponse {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  imageUrl?: string;
  gender?: boolean;
  dateOfBirth?: string;
  memberSince: string;
  customerId: string;
  companyName?: string;
  representativeName?: string;
  representativePhone?: string;
  businessLicenseNumber?: string;
  businessAddress?: string;
  customerStatus: string;
  totalOrders: number;
  successfulOrders: number;
  successRate: number;
  cancelledOrders: number;
  cancelRate: number;
  issuesCount: number;
  totalSpent?: number;
  recentOrders: RecentOrderInfo[];
  activeOrders: CustomerActiveOrderInfo[];
}

export interface RecentOrderInfo {
  orderId: string;
  orderCode: string;
  status: string;
  receiverName: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  totalQuantity: number;
  createdAt: string;
  isActive: boolean;
}

export interface CustomerActiveOrderInfo {
  orderId: string;
  orderCode: string;
  status: string;
  receiverName: string;
  driverName?: string;
  trackingCode?: string;
  createdAt: string;
}

// ==================== Driver Overview ====================

export interface DriverOverviewResponse {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  imageUrl?: string;
  gender?: boolean;
  dateOfBirth?: string;
  memberSince: string;
  driverId: string;
  identityNumber?: string;
  driverLicenseNumber?: string;
  licenseClass?: string;
  dateOfExpiry?: string;
  driverStatus: string;
  totalOrdersReceived: number;
  totalTripsCompleted: number;
  successfulDeliveries: number;
  successRate: number;
  cancelledDeliveries: number;
  cancelRate: number;
  issuesCount: number;
  penaltiesCount: number;
  recentTrips: RecentTripInfo[];
  activeTrips: ActiveTripInfo[];
}

export interface RecentTripInfo {
  vehicleAssignmentId: string;
  trackingCode: string;
  status: string;
  orderCode?: string;
  vehicleType?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export interface ActiveTripInfo {
  vehicleAssignmentId: string;
  trackingCode: string;
  orderCode?: string;
  status: string;
  receiverName?: string;
  receiverPhone?: string;
  currentLocation?: string;
  expectedDelivery?: string;
}

// ==================== Order Quick View ====================

export interface OrderQuickViewResponse {
  orderId: string;
  orderCode: string;
  status: string;
  notes?: string;
  totalQuantity: number;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
  companyName?: string;
  receiverName: string;
  receiverPhone: string;
  receiverIdentity?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  packageDescription?: string;
  categoryName?: string;
  categoryDescription?: string;
  hasInsurance: boolean;
  totalDeclaredValue?: number;
  contract?: ContractInfo;
  orderDetails: OrderDetailInfo[];
  vehicleAssignments: VehicleAssignmentInfo[];
  issues: IssueInfo[];
}

export interface ContractInfo {
  contractId: string;
  contractCode: string;
  status: string;
  totalAmount: number;
  depositAmount: number;
  paidAmount: number;
  signedAt?: string;
}

export interface OrderDetailInfo {
  id: string;
  trackingCode?: string;
  status: string;
  description?: string;
  weight?: number;
  weightBaseUnit?: number;
  unit?: string;
  length?: number;
  width?: number;
  height?: number;
  declaredValue?: number;
  isFragile: boolean;
}

export interface VehicleAssignmentInfo {
  id: string;
  trackingCode: string;
  status: string;
  vehicleType?: string;
  driverName?: string;
  driverPhone?: string;
  licensePlate?: string;
  startDate?: string;
  endDate?: string;
}

export interface IssueInfo {
  id: string;
  issueType: string;
  description: string;
  status: string;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

// ==================== WebSocket Messages ====================

export interface NewMessageNotification {
  conversationId: string;
  conversationType: string;
  initiatorName: string;
  message: ChatUserMessageResponse;
}

export interface ConversationClosedNotification {
  conversationId: string;
  closedBy: string;
  closedAt: string;
}

// ==================== Vehicle Assignment Quick View ====================

export interface VehicleAssignmentQuickViewResponse {
  vehicleAssignmentId: string;
  trackingCode: string;
  status: string;
  description?: string;
  createdAt: string;
  startDate?: string;
  endDate?: string;
  
  // Tab 1: Vehicle & Driver
  vehicleInfo?: VehicleInfoDetail;
  primaryDriver?: DriverInfoDetail;
  secondaryDriver?: DriverInfoDetail;
  
  // Tab 2: Orders & Packages
  orders: TripOrderInfo[];
  
  // Tab 3: Issues
  issues: TripIssueInfo[];
  
  // Tab 4: Proofs & Seals
  packingProofs: ProofInfo[];
  photoCompletions: ProofInfo[];
  seals: SealInfo[];
  
  // Tab 5: Journey & Route
  journeyHistory: JourneyHistoryInfo[];
  journeySegments: JourneySegmentInfo[];
  fuelConsumption?: FuelConsumptionInfo;
}

export interface VehicleInfoDetail {
  vehicleId: string;
  licensePlateNumber: string;
  model?: string;
  manufacturer?: string;
  year?: number;
  capacity?: number;
  status: string;
  vehicleTypeName?: string;
  fuelTypeName?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  lastUpdated?: string;
}

export interface DriverInfoDetail {
  driverId: string;
  userId: string;
  fullName: string;
  phoneNumber?: string;
  email?: string;
  imageUrl?: string;
  identityNumber?: string;
  driverLicenseNumber?: string;
  licenseClass?: string;
  status: string;
}

export interface TripOrderInfo {
  orderId: string;
  orderCode: string;
  status: string;
  categoryName?: string;
  categoryDescription?: string;
  senderName?: string;
  senderPhone?: string;
  pickupAddress?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  receiverName?: string;
  receiverPhone?: string;
  deliveryAddress?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  packages: PackageInfo[];
}

export interface PackageInfo {
  orderDetailId: string;
  trackingCode: string;
  status: string;
  description?: string;
  weightTons?: number;
  weightUnit?: string;
  declaredValue?: number;
  sizeName?: string;
  sizeDescription?: string;
}

export interface TripIssueInfo {
  issueId: string;
  issueTypeName?: string;
  issueCategory?: string;
  description?: string;
  status: string;
  reportedAt: string;
  resolvedAt?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  issueImages?: string[];
  resolutionNote?: string;
  oldSealCode?: string;
  newSealCode?: string;
  sealRemovalImage?: string;
}

export interface ProofInfo {
  id: string;
  type: string;
  imageUrl: string;
  description?: string;
  capturedAt?: string;
  capturedBy?: string;
}

export interface SealInfo {
  sealId: string;
  sealCode: string;
  status: string;
  sealType?: string;
  assignedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  imageUrl?: string;
}

export interface JourneyHistoryInfo {
  journeyId: string;
  status: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  notes?: string;
}

export interface JourneySegmentInfo {
  segmentId: string;
  sequenceOrder: number;
  startLocationName?: string;
  startLatitude?: number;
  startLongitude?: number;
  endLocationName?: string;
  endLatitude?: number;
  endLongitude?: number;
  distanceKm?: number;
  estimatedDurationMinutes?: number;
  status: string;
  startedAt?: string;
  completedAt?: string;
}

export interface FuelConsumptionInfo {
  totalDistanceKm?: number;
  estimatedFuelLiters?: number;
  actualFuelLiters?: number;
  fuelEfficiency?: number;
  fuelCost?: number;
}
