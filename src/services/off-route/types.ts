/**
 * Types for Off-Route Warning System
 */

export interface LocationInfo {
  lat: number;
  lng: number;
  distanceFromRouteMeters: number;
}

export interface OffRouteWarningPayload {
  type: 'OFF_ROUTE_WARNING';
  severity: 'YELLOW' | 'RED';
  offRouteEventId: string;
  vehicleAssignmentId: string;
  orderId: string;
  offRouteDurationMinutes: number;
  lastKnownLocation: LocationInfo;
  driverName: string;
  driverPhone: string;
  driverLicenseNumber?: string;
  vehiclePlate: string;
  vehicleType?: string;
  vehicleManufacturer?: string;
  orderCode: string;
  packageCount: number;
  totalContractAmount: number;
  totalDeclaredValue: number;
  senderName?: string;
  senderPhone?: string;
  receiverName?: string;
  receiverPhone?: string;
  warningTime: string;
}

export interface RouteSegmentInfo {
  segmentOrder: number;
  startPointName: string;
  endPointName: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  pathCoordinatesJson?: string;
}

export interface TripInfo {
  vehicleAssignmentId: string;
  trackingCode: string;
  status: string;
  startTime?: string;
}

export interface DriverInfo {
  driverId?: string;
  userId?: string;
  fullName: string;
  phoneNumber: string;
  licenseNumber?: string;
  avatarUrl?: string;
}

export interface VehicleInfo {
  vehicleId?: string;
  licensePlate: string;
  vehicleType?: string;
  vehicleTypeDescription?: string;
  manufacturer?: string;
  loadCapacityKg?: number;
  model?: string;
  yearOfManufacture?: number;
}

export interface OrderInfo {
  orderId: string;
  orderCode: string;
  status: string;
  totalContractAmount?: number;
  totalDeclaredValueOfTrip?: number;
  // Sender (Customer/Company)
  senderName?: string;
  senderPhone?: string;
  senderCompanyName?: string;
  senderAddress?: string;
  senderProvince?: string;
  // Receiver
  receiverName?: string;
  receiverPhone?: string;
  receiverIdentity?: string; // CCCD
  receiverAddress?: string;
  receiverProvince?: string;
}

export interface PackageInfo {
  orderDetailId: string;
  trackingCode: string;
  description?: string;
  weight?: number;
  weightUnit?: string;
  status: string;
  declaredValue?: number;
}

export interface OffRouteEventDetail {
  id: string;
  warningStatus: string;
  offRouteDurationMinutes: number;
  offRouteStartTime: string;
  canContactDriver?: boolean;
  contactNotes?: string;
  currentLocation: LocationInfo;
  plannedRouteSegments: RouteSegmentInfo[];
  tripInfo: TripInfo;
  driverInfo: DriverInfo;
  // Both drivers
  driver1Info?: DriverInfo;
  driver2Info?: DriverInfo;
  vehicleInfo: VehicleInfo;
  orderInfo: OrderInfo;
  packages: PackageInfo[];
}

export interface ConfirmSafeRequest {
  offRouteEventId: string;
  notes?: string;
}

export interface CreateIssueRequest {
  offRouteEventId: string;
  description?: string;
  staffNotes?: string;
}
