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
      capacity?: string;
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
  unit: string;
  description?: string;
  orderSizeId: string;
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
  | "PICKED_UP"
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
  orderDetails: CustomerOrderDetailItem[];
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
  vehicleAssignment?: {
    id: string;
    vehicle: {
      id: string;
      manufacturer: string;
      model: string;
      licensePlateNumber: string;
      vehicleType: string;
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
    orderSeals?: {
      id: string;
      description: string;
      sealDate: string;
      status: string;
      sealId: string;
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
  };
}

export interface CustomerContract {
  id: string;
  contractName: string;
  effectiveDate: string;
  expirationDate: string;
  totalValue: string;
  supportedValue: string;
  description: string;
  attachFileUrl: string;
  status: string;
  staffName: string;
}

export interface CustomerTransaction {
  id: string;
  paymentProvider: string;
  orderCode: string;
  amount: number;
  currencyCode: string;
  status: string;
  paymentDate: string;
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
  totalPrice: number;
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
  orderDetails: StaffOrderDetailItem[];
}

export interface StaffOrderDetailItem {
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
  vehicleAssignment?: {
    id: string;
    vehicle: {
      id: string;
      manufacturer: string;
      model: string;
      licensePlateNumber: string;
      vehicleType: string;
    };
    primaryDriver?: {
      id: string;
      fullName: string;
      phoneNumber: string;
      email: string;
      imageUrl: string;
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
      address: string;
      createdAt: string;
    };
    secondaryDriver?: {
      id: string;
      fullName: string;
      phoneNumber: string;
      email: string;
      imageUrl: string;
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
      address: string;
      createdAt: string;
    };
    status: string;
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
    cameraTrackings?: {
      id: string;
      videoUrl: string;
      trackingAt: string;
      status: string;
      vehicleAssignmentId: string;
      deviceName: string;
    }[];
    fuelConsumption?: {
      id: string;
      odometerReadingAtRefuel: number;
      odometerAtStartUrl: string;
      odometerAtFinishUrl: string;
      odometerAtEndUrl: string;
      dateRecorded: string;
      notes: string;
      fuelTypeName: string;
      fuelTypeDescription: string;
    };
    orderSeals?: {
      id: string;
      description: string;
      sealDate: string;
      status: string;
      sealId: string;
    }[];
    journeyHistories?: {
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
    photoCompletions?: string[];
    issues?: {
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
    }[];
  };
}
