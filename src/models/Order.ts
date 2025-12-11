// Order model
export interface Order {
  id: string;
  totalPrice: number;
  notes?: string;
  totalQuantity: number;
  totalWeight?: number;
  orderCode: string;
  receiverName: string;
  receiverPhone: string;
  status: OrderStatus;
  packageDescription?: string;
  createdAt?: string;
  updatedAt?: string;
  senderId?: string;
  deliveryId?: string;
  pickupAddressId?: string;
  categoryId?: string;
  deliveryAddress?: Address;
  pickupAddress?: Address;
  sender?: Sender;
  orderDetails?: OrderDetail[];

  // Insurance fields
  hasInsurance?: boolean;           // Khách hàng có mua bảo hiểm hay không
  totalInsuranceFee?: number;       // Tổng phí bảo hiểm (đã bao gồm VAT)
  totalDeclaredValue?: number;      // Tổng giá trị khai báo của tất cả kiện hàng

  // New fields for enhanced order details
  depositAmount?: number;
  depositStatus?: "paid" | "pending" | "unpaid";
  depositPaidDate?: string;

  // Trip information
  outboundDepartureTime?: string;
  outboundArrivalTime?: string;
  outboundStatus?: "completed" | "in-progress" | "pending";
  returnDepartureTime?: string;
  returnArrivalTime?: string;
  returnStatus?: "completed" | "in-progress" | "pending";

  // Proof documentation
  deliveryProofImages?: DeliveryProofImage[];
  shippingProofDocuments?: ShippingProofDocument[];

  // Incident reports
  incidents?: Incident[];
}

export interface DeliveryProofImage {
  id: string;
  url: string;
  description?: string;
  timestamp?: string;
  orderId: string;
}

export interface ShippingProofDocument {
  id: string;
  fileName: string;
  url: string;
  documentType?: string;
  description?: string;
  uploadDate?: string;
  orderId: string;
}

export interface Incident {
  id: string;
  incidentType?: string;
  description?: string;
  severity?: "high" | "medium" | "low";
  reportedDate?: string;
  resolution?: string;
  status?: "open" | "investigating" | "resolved";
  orderId: string;
}

export interface OrderDetail {
  weight: number;
  weightBaseUnit: number;
  unit: string;
  description?: string;
  status: string;
  startTime?: string;
  estimatedStartTime?: string;
  endTime?: string;
  estimatedEndTime?: string;
  createdAt: string;
  updatedAt: string;
  trackingCode: string;
  orderId: string;
  declaredValue?: number;   // Giá trị khai báo của kiện hàng (VNĐ)
  orderSizeId?: {
    id: string;
    minWeight: number;
    maxWeight: number;
    minLength: number;
    maxLength: number;
    minHeight: number;
    maxHeight: number;
    minWidth: number;
    maxWidth: number;
    status: string;
    description: string;
  };
  vehicleAssignmentId?: {
    id: string;
    vehicleId: string;
    driverId: string;
    description: string;
    status: "assigned" | "in-transit" | "completed" | "cancelled";
    assignedDate?: string;
    priority?: "high" | "medium" | "low";
    vehicle?: {
      id: string;
      licensePlate?: string;
      vehicleType?: string;
    };
    driver?: {
      id: string;
      fullName?: string;
      phoneNumber?: string;
      experience?: string;
    };
  };
}

export interface OrderDetailCreateRequest {
  weight: number;
  weightBaseUnit?: number;
  unit: string;
  description?: string;
  orderSizeId: string;
  declaredValue: number;  // Giá trị khai báo của kiện hàng (VNĐ)
}

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "CANCELLED"
  | "CONTRACT_DRAFT"
  | "CONTRACT_DENIED"
  | "CONTRACT_SIGNED"
  | "ON_PLANNING"
  | "ASSIGNED_TO_DRIVER"
  | "DRIVER_CONFIRM"
  | "PICKING_UP"
  | "SEALED_COMPLETED"
  | "ON_DELIVERED"
  | "ONGOING_DELIVERED"
  | "IN_DELIVERED"
  | "IN_TROUBLES"
  | "RESOLVED"
  | "COMPENSATION"
  | "DELIVERED"
  | "SUCCESSFUL"
  | "REJECT_ORDER"
  | "RETURNING"
  | "RETURNED";

/**
 * Status type for OrderDetail entity
 * Tracks the status of individual order details within a vehicle assignment (trip)
 * This allows multiple trips for the same order to have independent status tracking
 * 
 * Status flow:
 * ASSIGNED_TO_DRIVER → PICKING_UP → ON_DELIVERED → ONGOING_DELIVERED → DELIVERED → SUCCESSFUL
 * 
 * Alternative flows:
 * - Any status → IN_TROUBLES → RESOLVED → (resume normal flow)
 * - Any status → REJECTED (terminal)
 * - DELIVERED → RETURNING → RETURNED (return flow)
 */
export type OrderDetailStatus =
  | "ASSIGNED_TO_DRIVER" // OrderDetail has been assigned to a vehicle and driver
  | "PICKING_UP"         // Driver is on the way to pick up the goods
  | "ON_DELIVERED"       // Driver is transporting the goods
  | "ONGOING_DELIVERED"  // Driver is near delivery point (within 3km)
  | "DELIVERED"          // Goods have been delivered to customer
  | "SUCCESSFUL"         // Trip completed - driver has returned to warehouse
  | "IN_TROUBLES"        // OrderDetail has issues during delivery
  | "RESOLVED"           // Issues have been resolved
  | "REJECTED"           // OrderDetail/Trip has been rejected or cancelled
  | "RETURNING"          // Goods are being returned to sender
  | "RETURNED";          // Goods have been returned to sender

export interface OrderRequest {
  notes?: string;
  receiverName: string;
  receiverPhone: string;
  receiverIdentity: string;
  packageDescription: string;
  estimateStartTime?: string;
  deliveryAddressId: string;
  pickupAddressId: string;
  senderId?: string;
  categoryId: string;
  hasInsurance?: boolean;  // Khách hàng có mua bảo hiểm hay không
}

export interface OrderCreateRequest {
  orderRequest: OrderRequest;
  orderDetails: OrderDetailCreateRequest[];
}

export interface OrderUpdateRequest {
  status?: OrderStatus;
  notes?: string;
}

export interface OrderResponse {
  id: string;
  totalPrice: number;
  notes?: string;
  totalQuantity: number;
  totalWeight: number;
  orderCode: string;
  receiverName: string;
  receiverPhone: string;
  status: string;
  packageDescription?: string;
  createdAt: string;
  updatedAt: string;
  senderId?: string;
  deliveryId?: string;
  pickupAddressId?: string;
  categoryId?: string;
  orderDetails?: OrderDetail[];
  // Insurance fields
  hasInsurance?: boolean;
  totalInsuranceFee?: number;
  totalDeclaredValue?: number;
}

// Chuyển đổi từ API response sang model
export const mapOrderResponseToModel = (apiOrder: OrderResponse): Order => {
  return {
    ...apiOrder,
    status: apiOrder.status as OrderStatus,
  };
};

// Lọc orders theo status
export const filterOrdersByStatus = (
  orders: Order[],
  status: OrderStatus | "all"
): Order[] => {
  if (status === "all") return orders;
  return orders.filter((order) => order.status === status);
};

// Tính tổng doanh thu từ danh sách orders
export const calculateTotalRevenue = (orders: Order[]): number => {
  return orders.reduce((total, order) => total + (order.totalPrice || 0), 0);
};

// Kiểm tra xem order có thể hủy không
export const canCancelOrder = (order: Order): boolean => {
  const cancellableStatuses: OrderStatus[] = [
    "PENDING",
    "PROCESSING",
    "CONTRACT_DRAFT",
  ];
  return cancellableStatuses.includes(order.status);
};

/**
 * Get Vietnamese translation for OrderDetailStatus
 */
export const getOrderDetailStatusText = (status: OrderDetailStatus): string => {
  const statusMap: Record<OrderDetailStatus, string> = {
    ASSIGNED_TO_DRIVER: "Đã phân công",
    PICKING_UP: "Đang lấy hàng",
    ON_DELIVERED: "Đang vận chuyển",
    ONGOING_DELIVERED: "Sắp đến nơi giao",
    DELIVERED: "Đã giao hàng",
    SUCCESSFUL: "Hoàn thành",
    IN_TROUBLES: "Gặp sự cố",
    RESOLVED: "Đã giải quyết",
    REJECTED: "Đã từ chối",
    RETURNING: "Đang hoàn trả",
    RETURNED: "Đã trả hàng",
  };
  return statusMap[status] || status;
};

/**
 * Get color for OrderDetailStatus badge
 */
export const getOrderDetailStatusColor = (status: OrderDetailStatus): string => {
  const colorMap: Record<OrderDetailStatus, string> = {
    ASSIGNED_TO_DRIVER: "blue",
    PICKING_UP: "cyan",
    ON_DELIVERED: "orange",
    ONGOING_DELIVERED: "gold",
    DELIVERED: "green",
    SUCCESSFUL: "success",
    IN_TROUBLES: "red",
    RESOLVED: "lime",
    REJECTED: "error",
    RETURNING: "warning",
    RETURNED: "default",
  };
  return colorMap[status] || "default";
};

export interface Address {
  id: string;
  province: string;
  ward: string;
  street: string;
  addressType: boolean;
  latitude: number;
  longitude: number;
  customerId: string;
}

export interface Sender {
  id: string;
  companyName?: string;
  representativeName?: string;
  representativePhone?: string;
  businessLicenseNumber?: string;
  businessAddress?: string;
  status?: string;
  userResponse?: UserResponse;
}

export interface UserResponse {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  gender: boolean;
  dateOfBirth: string;
  imageUrl: string;
  status: string;
  role: Role;
}

export interface Role {
  id: string;
  roleName: string;
  description: string;
  isActive: boolean;
}

// DTO models moved from types.ts
export interface OrderUpdateDto {
  status?: string;
  notes?: string;
}

export interface OrderTrackingResponse {
  orderId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  heading?: number;
}

export interface CustomerOrder {
  id: string;
  orderCode: string;
  totalPrice: number | null;
  totalQuantity: number;
  status: string;
  notes: string;
  packageDescription: string;
  receiverName: string;
  receiverPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  deliveryAddressId: string;
  createdAt: string;
}

export interface CustomerOrderDetail {
  id: string;
  totalPrice: number;
  depositAmount?: number;
  notes: string;
  totalQuantity: number;
  orderCode: string;
  receiverName: string;
  receiverPhone: string;
  receiverIdentity?: string;
  packageDescription: string;
  createdAt: string;
  status: string;
  deliveryAddress: string;
  pickupAddress: string;
  senderName: string;
  senderPhone: string;
  senderCompanyName: string;
  categoryName: string;
  categoryDescription?: string; // Category description from backend
  hasInsurance?: boolean; // Insurance status
  totalInsuranceFee?: number; // Insurance fee amount
  totalDeclaredValue?: number; // Total declared value for insurance
  orderDetails: CustomerOrderDetailItem[];
  vehicleAssignments?: CustomerVehicleAssignment[];  // Moved from orderDetail level
}

export interface CustomerOrderDetailItem {
  id: string;
  weightBaseUnit: number;
  unit: string;
  description: string;
  status: string;
  startTime: string;
  estimatedStartTime: string;
  endTime: string;
  estimatedEndTime: string;
  createdAt: string;
  trackingCode: string;
  orderSize?: {
    id: string;
    description: string;
    minLength: number;
    maxLength: number;
    minHeight: number;
    maxHeight: number;
    minWidth: number;
    maxWidth: number;
  };
  vehicleAssignmentId?: string;  // Changed from full object to ID reference
}

export interface CustomerVehicleAssignment {
    id: string;
    vehicle: {
      id: string;
      manufacturer: string;
      model: string;
      licensePlateNumber: string;
      vehicleType: string;
      vehicleTypeDescription?: string; // Vehicle type description from backend
    };
    primaryDriver?: {
      id: string;
      fullName: string;
      phoneNumber: string;
    };
    secondaryDriver?: {
      id: string;
      fullName: string;
      phoneNumber: string;
    };
    status: string;
    trackingCode?: string;
    issue?: {
      issue: {
        id: string;
        description: string;
        locationLatitude: number;
        locationLongitude: number;
        status: string;
        vehicleAssignmentId: string;
        staff: {
          id: string;
          name: string;
          phone: string;
        };
        issueTypeName: string;
      };
      imageUrls: string[];
    };
    photoCompletions?: string[];
    seals?: {
      id: string;
      description: string;
      sealDate: string;
      status: string;
      sealId: string;
      sealCode: string;
      sealAttachedImage: string;
      sealRemovalTime: string;
      sealRemovalReason: string;
    }[];
    journeyHistories?: {
      id: string;
      journeyName: string;
      journeyType: string;
      status: string;
      totalTollFee: number;
      totalTollCount: number;
      reasonForReroute: string | null;
      vehicleAssignmentId: string;
      createdAt: string;
      modifiedAt: string;
      journeySegments: {
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
      }[];
    }[];
    journeyHistory?: {
      id: string;
      startLocation: number;
      endLocation: number;
      startTime: string;
      endTime: string;
      status: string;
      totalDistance: number;
      isReportedIncident: boolean;
      createdAt: string;
      modifiedAt: string;
    }[];
}

export interface CustomerContract {
  id: string;
  contractName: string;
  effectiveDate: string;
  expirationDate: string;
  totalValue: number;
  adjustedValue: number;
  description: string;
  attachFileUrl: string;
  status: string;
  staffName: string;
}

export interface CustomerTransaction {
  id: string;
  paymentProvider: string;
  gatewayOrderCode: string;
  amount: number;
  currencyCode: string;
  status: string;
  paymentDate: string;
  transactionType?: string; // DEPOSIT, FULL_PAYMENT, RETURN_SHIPPING
}

export interface RecentReceiverSuggestion {
  orderId: string;
  receiverName: string;
  receiverPhone: string;
  receiverIdentity: string;
  partialAddress: string;
  orderDate: string;
}

export interface StaffOrderDetail {
  id: string;
  depositAmount?: number;
  notes: string;
  totalQuantity: number;
  orderCode: string;
  receiverName: string;
  receiverPhone: string;
  receiverIdentity: string;
  packageDescription: string;
  createdAt: string;
  status: string;
  deliveryAddress: string;
  pickupAddress: string;
  senderRepresentativeName: string;
  senderRepresentativePhone: string;
  senderCompanyName: string;
  categoryName: string;
  categoryDescription?: string; // Category description from backend
  hasInsurance?: boolean; // Insurance status
  totalInsuranceFee?: number; // Insurance fee amount
  totalDeclaredValue?: number; // Total declared value for insurance
  orderDetails: StaffOrderDetailItem[];
  vehicleAssignments?: StaffVehicleAssignment[];  // Moved from orderDetail level
}

export interface StaffOrderDetailItem {
  id: string;
  weightBaseUnit: number;
  unit: string;
  description: string;
  status: string;
  startTime: string | null;
  estimatedStartTime: string | null;
  endTime: string | null;
  estimatedEndTime: string | null;
  createdAt: string;
  trackingCode: string;
  orderSize?: {
    id: string;
    description: string;
    minLength: number;
    maxLength: number;
    minHeight: number;
    maxHeight: number;
    minWidth: number;
    maxWidth: number;
  };
  vehicleAssignmentId?: string;  // Changed from full object to ID reference
}

export interface StaffVehicleAssignment {
    id: string;
    vehicle: {
      id: string;
      manufacturer: string;
      model: string;
      licensePlateNumber: string;
      vehicleType: string;
      vehicleTypeDescription?: string; // Vehicle type description from backend
    };
    primaryDriver?: {
      id: string | null;
      fullName: string;
      phoneNumber: string;
      email: string;
      imageUrl: string | null;
      gender: boolean;
      dateOfBirth: string;
      identityNumber: string;
      driverLicenseNumber: string;
      cardSerialNumber: string;
      placeOfIssue: string;
      dateOfIssue: string;
      dateOfExpiry: string;
      licenseClass: string;
      dateOfPassing: string;
      status: string;
      address: string | null;
      createdAt: string;
    };
    secondaryDriver?: {
      id: string | null;
      fullName: string;
      phoneNumber: string;
      email: string;
      imageUrl: string | null;
      gender: boolean;
      dateOfBirth: string;
      identityNumber: string;
      driverLicenseNumber: string;
      cardSerialNumber: string;
      placeOfIssue: string;
      dateOfIssue: string;
      dateOfExpiry: string;
      licenseClass: string;
      dateOfPassing: string;
      status: string;
      address: string | null;
      createdAt: string;
    };
    status: string;
    trackingCode?: string;
    penalties?: {
      id: string;
      violationType: string;
      violationDescription: string;
      penaltyAmount: number;
      penaltyDate: string;
      location: string;
      status: string;
      paymentDate: string;
      disputeReason: string;
      driverId: string;
      vehicleAssignmentId: string;
    }[];
    fuelConsumption?: {
      id: string;
      odometerReadingAtStart: number;
      odometerReadingAtEnd: number;
      odometerAtStartUrl: string;
      odometerAtEndUrl: string;
      distanceTraveled: number;
      dateRecorded: string;
      notes: string;
      fuelVolume: number;
      companyInvoiceImageUrl: string;
    };
    seals?: {
      id: string;
      description: string;
      sealDate: string;
      status: string;
      sealId: string;
      sealCode: string;
      sealAttachedImage: string;
      sealRemovalTime: string;
      sealRemovalReason: string;
    }[];
    journeyHistories?: {
      id: string;
      journeyName?: string;
      journeyType?: string;
      startLocation?: number;
      endLocation?: number;
      startTime?: string;
      endTime?: string;
      status: string;
      totalDistance?: number;
      totalTollFee?: number;
      totalTollCount?: number;
      reasonForReroute?: string | null;
      vehicleAssignmentId?: string;
      isReportedIncident?: boolean;
      createdAt: string;
      modifiedAt: string;
      journeySegments?: {
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
      }[];
    }[];
    photoCompletions?: any[];
    issues?: {
      id: string;
      description: string;
      locationLatitude: number | null;
      locationLongitude: number | null;
      status: string;
      vehicleAssignmentId: string;
      staff: {
        id: string;
        name: string;
        phone: string;
      } | null;
      issueTypeName: string;
      issueTypeDescription: string | null;
      reportedAt: string | null;
      issueCategory: string;
      issueImages: string[];
      oldSeal: {
        id: string;
        sealCode: string;
        description: string;
      } | null;
      newSeal: {
        id: string;
        sealCode: string;
        description: string;
      } | null;
      sealRemovalImage: string | null;
      newSealAttachedImage: string | null;
      newSealConfirmedAt: string | null;
      paymentDeadline: string | null;
      calculatedFee: number | null;
      adjustedFee: number | null;
      finalFee: number | null;
      affectedOrderDetails: any | null;
      refund: any | null;
      transaction: any | null;
    }[];
}

// Additional types from order service
export interface UnitsListResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: string[];
}

export interface ReceiverDetailsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: {
    receiverName: string;
    receiverPhone: string;
    receiverIdentity: string;
    pickupAddressId: string;
    deliveryAddressId: string;
    pickupAddress: {
      id: string;
      province: string;
      ward: string;
      street: string;
      addressType: boolean;
      latitude: number;
      longitude: number;
      customerId: string;
    };
    deliveryAddress: {
      id: string;
      province: string;
      ward: string;
      street: string;
      addressType: boolean;
      latitude: number;
      longitude: number;
      customerId: string;
    };
  };
}

export interface VehicleSuggestion {
  vehicleIndex: number;
  sizeRuleId: string;
  sizeRuleName: string;
  currentLoad: number;
  currentLoadUnit: string;
  assignedDetails: AssignedDetail[];
  packedDetailDetails: PackedDetail[];
}

export interface PackedDetail {
  orderDetailId: string;
  x: number;
  y: number;
  z: number;
  length: number;
  width: number;
  height: number;
  orientation: string;
}

export interface AssignedDetail {
  id: string;
  weight: number;
  weightBaseUnit: number;
  unit: string;
  trackingCode: string;
}

export interface VehicleSuggestionsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: VehicleSuggestion[];
}

export interface BillOfLadingPreviewResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: {
    fileName: string;
    base64Content: string;
    mimeType: string;
  }[];
}

export interface BothOptimalAndRealisticVehicleSuggestionsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: BothOptimalAndRealisticVehicle[];
}

export interface BothOptimalAndRealisticVehicle {
  optimal: VehicleSuggestion[];
  realistic: VehicleSuggestion[];
}