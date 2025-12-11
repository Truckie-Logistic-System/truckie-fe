import httpClient from '../api/httpClient';
import { handleApiError } from '../api/errorHandler';

export type TimeRange = 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM';

export interface DashboardFilter {
  range: TimeRange;
  fromDate?: string;
  toDate?: string;
}

// Admin Dashboard Types
export interface AdminKpiSummary {
  totalOrders: number;
  totalOrderDetails: number;
  totalRevenue: number;
  onTimePercentage: number;
  issueRate: number;
  newCustomers: number;
  refundAmount: number;
  orderGrowth?: number;
  revenueGrowth?: number;
  onTimeGrowthChange?: number;
}

export interface TrendDataPoint {
  label: string;
  count: number;
  amount: number;
}

export interface DeliveryPerformance {
  onTimeCount: number;
  lateCount: number;
  onTimePercentage: number;
  latePercentage: number;
  trend?: TrendDataPoint[];
}

export interface IssueRefundSummary {
  totalIssues: number;
  openIssues: number;
  resolvedIssues: number;
  pendingRefunds: number;
  completedRefunds: number;
  totalRefundAmount: number;
  issuesByType: Record<string, number>;
}

export interface TopPerformer {
  id: string;
  name: string;
  companyName?: string;
  orderCount?: number;
  revenue?: number;
  onTimePercentage?: number;
  rank: number;
}

export interface MaintenanceAlert {
  vehicleId: string;
  licensePlate: string;
  maintenanceType: string;
  dueDate: string;
  isOverdue: boolean;
}

export interface FleetHealthSummary {
  totalVehicles: number;
  activeVehicles: number;
  inUseVehicles: number;
  inMaintenanceVehicles: number;
  pendingMaintenanceVehicles: number;
  overdueMaintenanceVehicles: number;
  averageFuelConsumption: number;
  upcomingMaintenances: MaintenanceAlert[];
}

export interface DeviceStatistics {
  totalDevices: number;
  activeDevices: number;
  inactiveDevices: number;
  assignedDevices: number;
  deltaPercent?: number;
}

export interface FuelConsumptionStatistics {
  totalFuelConsumed: number;
  averageFuelConsumption: number;
  deltaPercent?: number;
  fuelConsumptionTrend: TrendDataPoint[];
}

export interface PenaltiesStatistics {
  totalPenalties: number;
  unresolvedPenalties: number;
  deltaPercent?: number;
  penaltiesTrend: TrendDataPoint[];
}

export interface VehicleInspectionAlert {
  vehicleId: string;
  licensePlate: string;
  alertType: string;
  dueDate: string;
  daysUntilDue: number;
  isOverdue: boolean;
  description: string;
}

export interface RegistrationData {
  customerRegistrations: TrendDataPoint[];
  staffRegistrations: TrendDataPoint[];
  driverRegistrations: TrendDataPoint[];
}

export interface AdminDashboardResponse {
  aiSummary: string;
  kpiSummary: AdminKpiSummary;
  orderTrend: TrendDataPoint[];
  revenueTrend: TrendDataPoint[];
  deliveryPerformance: DeliveryPerformance;
  issueRefundSummary: IssueRefundSummary;
  topCustomers: TopPerformer[];
  topDrivers: TopPerformer[];
  topStaff: TopPerformer[];
  fleetHealth: FleetHealthSummary;
  deviceStatistics?: DeviceStatistics;
  fuelConsumptionStatistics?: FuelConsumptionStatistics;
  penaltiesStatistics?: PenaltiesStatistics;
  vehicleInspectionAlerts?: VehicleInspectionAlert[];
  orderStatusDistribution: Record<string, number>;
  registrationData: RegistrationData;
}

// Staff Dashboard Types
export interface OperationalSummary {
  totalTrips: number;
  activeTrips: number;
  completedTrips: number;
  delayedTrips: number;
  totalOrderDetails: number;
  pendingOrderDetails: number;
  deliveringOrderDetails: number;
  completedOrderDetails: number;
}

export interface TripAlert {
  tripId: string;
  trackingCode: string;
  vehiclePlate: string;
  driverName: string;
  status: string;
  alertType: string;
  message: string;
  estimatedDelay?: string;
  issueId?: string; // For navigation to issue detail
}

export interface StaffIssueSummary {
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  pendingRefunds: number;
  issuesByCategory: Record<string, number>;
}

export interface IssueItem {
  issueId: string;
  description: string;
  category: string;
  status: string;
  reportedAt: string;
  tripTrackingCode: string;
  orderCode?: string;
  isUrgent: boolean;
}

export interface StaffFinancialSummary {
  totalContracts: number;
  pendingContracts: number;
  paidContracts: number;  // Renamed from signedContracts
  completedContracts: number;
  totalContractValue: number;
  totalTransactions: number;
  pendingTransactions: number;
  completedTransactions: number;
  transactionAmount: number;
  totalRefunded: number;  // Total refunded amount for completed refunds
}

export interface StaffMaintenanceAlert {
  vehicleId: string;
  licensePlate: string;
  maintenanceType: string;
  scheduledDate: string;
  status: string;
  isOverdue: boolean;
}

export interface FuelAlert {
  vehicleId: string;
  licensePlate: string;
  tripTrackingCode: string;
  expectedConsumption: number;
  actualConsumption: number;
  deviationPercentage: number;
}

export interface FleetStatus {
  totalVehicles: number;
  availableVehicles: number;
  inUseVehicles: number;
  inMaintenanceVehicles: number;
  maintenanceAlerts: StaffMaintenanceAlert[];
  fuelAlerts: FuelAlert[];
}

// DriverPerformanceItem interface removed - no longer needed

// === NEW STAFF DASHBOARD TYPES ===

export interface StaffPackageSummary {
  totalOrderDetails: number;
  inTransitPackages: number;
  deliveredPackages: number;
  cancelledPackages: number;
  problemPackages: number;
  totalOrders: number;
  successRate: number;
}

export interface TripCompletionTrend {
  date: string;
  completedTrips: number;
  activeTrips: number;
  totalTrips: number;
}

export interface IssueTypeTrend {
  date: string;
  issueType: string;
  count: number;
}

export interface StaffContractTrend {
  date: string;
  createdCount: number;
  paidCount: number;
  cancelledCount: number;
  totalValue: number;
}

export interface StaffTransactionTrend {
  date: string;
  paidAmount: number;
  paidCount: number;
}

export interface RefundTrend {
  date: string;
  refundCount: number;
  refundAmount: number;
}

export interface StaffPackageStatusTrend {
  date: string;
  inTransit: number;
  delivered: number;
  cancelled: number;
  problem: number;
}

export interface RecentOrderItem {
  orderId: string;
  orderCode: string;
  senderName: string;
  senderCompany: string;
  totalPackages: number;
  deliveredPackages: number;
  status: string;
  hasIssue: boolean;
  createdAt: string;
}

export interface TopCustomerItem {
  customerId: string;
  customerName: string;
  companyName: string;
  totalOrders: number;
  totalPackages: number;
  totalRevenue: number;
  successRate: number;
}

export interface PendingOrderItem {
  orderId: string;
  orderCode: string;
  senderName: string;
  senderCompany: string;
  senderPhone: string;
  totalPackages: number;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  createdAt: string;
  note?: string;
}

export interface RevenueCompensationTrend {
  date: string;
  revenue: number;      // Tổng tiền thu
  compensation: number; // Tổng tiền đền bù
}

export interface TopDriverItem {
  driverId: string;
  driverName: string;
  phone: string;
  completedTrips: number;
  totalTrips: number;
  onTimePercentage: number;
  completionRate: number;
}

export interface StaffDashboardResponse {
  aiSummary: string;
  operationalSummary: OperationalSummary;
  tripStatusDistribution: Record<string, number>;
  tripAlerts: TripAlert[];
  issueSummary: StaffIssueSummary;
  pendingIssues: IssueItem[];
  financialSummary: StaffFinancialSummary;
  fleetStatus: FleetStatus;
  // Driver performance section removed
  // New fields for enhanced dashboard
  packageSummary?: StaffPackageSummary;
  tripCompletionTrend?: TripCompletionTrend[];
  issueTypeTrend?: IssueTypeTrend[];
  contractTrend?: StaffContractTrend[];
  transactionTrend?: StaffTransactionTrend[];
  refundTrend?: RefundTrend[];
  revenueCompensationTrend?: RevenueCompensationTrend[];
  packageStatusTrend?: StaffPackageStatusTrend[];
  recentOrders?: RecentOrderItem[];
  pendingOrders?: PendingOrderItem[];
  topCustomers?: TopCustomerItem[];
  topDrivers?: TopDriverItem[];
}

// Customer Dashboard Types
export interface CustomerOrderSummary {
  totalOrders: number;
  totalOrderDetails: number;
  inTransitPackages: number; // PICKING_UP, ON_DELIVERED, ONGOING_DELIVERED
  deliveredPackages: number; // DELIVERED
  cancelledPackages: number; // CANCELLED
  problemPackages: number; // IN_TROUBLES, COMPENSATION, RETURNING, RETURNED
  pendingOrders: number; // For active orders section
  inProgressOrders: number; // For active orders section
  successRate: number; // Delivered / (Delivered + Cancelled + Problem)
}

export interface CustomerDeliveryPerformance {
  successfulDeliveries: number;
  failedDeliveries: number;
  successRate: number;
  issueCount: number;
  issueRate: number;
  trendData: { date: string; deliveredCount: number; onTimePercentage: number }[];
}

export interface ContractValueTrend {
  date: string;
  contractCount: number;
  totalValue: number;
}

export interface TransactionTrend {
  date: string;
  amount: number;
  transactionCount: number;
}

export interface CustomerFinancialSummary {
  totalPaid: number;
  pendingPayment: number;
  totalRefunded: number;
  totalContractValue: number;
  contractsPendingSignature: number;
  contractsAwaitingDeposit: number;
  contractsAwaitingFullPayment: number;
  contractsAwaitingReturnFee: number;
  contractsSigned: number;
  contractsCancelled: number;
  contractValueTrend: ContractValueTrend[];
  transactionTrend: TransactionTrend[];
}

export interface ActiveOrderItem {
  orderId: string;
  orderCode: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  totalPackages: number;
  deliveredPackages: number;
  estimatedDelivery?: string;
  currentLocation?: string;
  hasIssue: boolean;
}

export interface ActionItem {
  type: string;
  id: string;
  orderId: string;
  orderCode: string;
  title: string;
  description: string;
  deadline?: string;
  urgency: string;
  amount?: number;
}

export interface ActionsSummary {
  contractsToSign: number;
  paymentsNeeded: number;
  issuesNeedingResponse: number;
  actionItems: ActionItem[];
}

export interface ActivityItem {
  type: string;
  title: string;
  description: string;
  timestamp: string;
  orderId?: string;
  relatedOrderCode?: string;
  orderStatus?: string;
}

export interface PackageStatusTrend {
  date: string;
  inTransit: number;
  delivered: number;
  cancelled: number;
  problem: number;
  total: number;
}

export interface RecentIssue {
  issueId: string;
  issueType: string;
  description: string;
  status: string;
  reportedAt: string;
  orderCode: string;
}

export interface TopRecipient {
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  totalPackages: number;
  successfulPackages: number;
  failedPackages: number;
  successRate: number;
}

export interface CustomerDashboardResponse {
  aiSummary: string;
  orderSummary: CustomerOrderSummary;
  orderStatusDistribution: Record<string, number>;
  orderDetailStatusDistribution: Record<string, number>;
  deliveryPerformance: CustomerDeliveryPerformance;
  financialSummary: CustomerFinancialSummary;
  activeOrders: ActiveOrderItem[];
  actionsSummary: ActionsSummary;
  recentActivity: ActivityItem[];
  recentIssues: RecentIssue[];
  topRecipients: TopRecipient[];
  packageStatusTrend: PackageStatusTrend[];
}

// Driver Dashboard Types
export interface DriverTodaySummary {
  totalTrips: number;
  completedTrips: number;
  remainingTrips: number;
  totalPackages: number;
  deliveredPackages: number;
  remainingPackages: number;
  completionPercentage: number;
  estimatedFinishTime?: string;
}

export interface StopInfo {
  order: number;
  type: string;
  address: string;
  contactName: string;
  contactPhone: string;
  status: string;
  estimatedTime?: string;
  packageCount: number;
}

export interface CurrentTrip {
  tripId: string;
  trackingCode: string;
  status: string;
  currentStop?: string;
  nextStop?: string;
  totalStops: number;
  completedStops: number;
  estimatedArrival?: string;
  packagesRemaining: number;
  stops: StopInfo[];
}

export interface ScheduleItem {
  tripId: string;
  trackingCode: string;
  status: string;
  startTime?: string;
  endTime?: string;
  route: string;
  packageCount: number;
  isDelayed: boolean;
  delayReason?: string;
}

export interface KpiTrendPoint {
  date: string;
  tripsCompleted: number;
  onTimePercentage: number;
}

export interface PersonalKpi {
  totalTripsThisPeriod: number;
  onTimeTrips: number;
  lateTrips: number;
  onTimePercentage: number;
  totalDistance: number;
  issueCount: number;
  complaintCount: number;
  rating: number;
  trendData: KpiTrendPoint[];
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

export interface VehicleStatus {
  vehicleId: string;
  licensePlate: string;
  model: string;
  currentFuelLevel: number;
  fuelCapacity: number;
  nextMaintenanceDate?: string;
  maintenanceStatus: string;
  odometerReading: number;
}

export interface DriverDashboardResponse {
  aiSummary: string;
  todaySummary: DriverTodaySummary;
  currentTrip?: CurrentTrip;
  todaySchedule: ScheduleItem[];
  personalKpi: PersonalKpi;
  notifications: NotificationItem[];
  vehicleStatus?: VehicleStatus;
}

// Dashboard Service
const dashboardService = {
  // Admin Dashboard - Single API call
  getAdminDashboard: async (filter: DashboardFilter): Promise<AdminDashboardResponse> => {
    try {
      const response = await httpClient.get('/dashboard/admin', {
        params: {
          range: filter.range,
          fromDate: filter.fromDate,
          toDate: filter.toDate,
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching admin dashboard:', error);
      throw handleApiError(error, 'Không thể tải dashboard quản trị');
    }
  },

  /**
   * Get Staff Dashboard
   */
  getStaffDashboard: async (filter: DashboardFilter): Promise<StaffDashboardResponse> => {
    try {
      const params = new URLSearchParams({
        range: filter.range,
        ...(filter.fromDate && { fromDate: filter.fromDate }),
        ...(filter.toDate && { toDate: filter.toDate }),
      });
      
      const response = await httpClient.get<{ data: StaffDashboardResponse }>(`/dashboard/staff?${params}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching staff dashboard:', error);
      throw handleApiError(error, 'Không thể tải dữ liệu dashboard');
    }
  },

  /**
   * Get Staff Dashboard AI Summary
   */
  getStaffAiSummary: async (filter: DashboardFilter, signal?: AbortSignal): Promise<string> => {
    try {
      const params = new URLSearchParams({
        range: filter.range,
        ...(filter.fromDate && { fromDate: filter.fromDate }),
        ...(filter.toDate && { toDate: filter.toDate }),
      });
      
      const response = await httpClient.get<{ data: string }>(
        `/dashboard/staff/ai-summary?${params}`,
        { signal } // Pass abort signal to request
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching staff AI summary:', error);
      throw handleApiError(error, 'Không thể tải tóm tắt AI');
    }
  },

  /**
   * Get Customer Dashboard
   */
  getCustomerDashboard: async (filter: DashboardFilter): Promise<CustomerDashboardResponse> => {
    try {
      const params = new URLSearchParams({
        range: filter.range,
        ...(filter.fromDate && { fromDate: filter.fromDate }),
        ...(filter.toDate && { toDate: filter.toDate }),
      });
      
      const response = await httpClient.get<{ data: CustomerDashboardResponse }>(`/dashboard/customer?${params}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching customer dashboard:', error);
      throw handleApiError(error, 'Không thể tải dữ liệu dashboard');
    }
  },

  /**
   * Get Customer Dashboard AI Summary
   */
  getCustomerAiSummary: async (filter: DashboardFilter, signal?: AbortSignal): Promise<string> => {
    try {
      const params = new URLSearchParams({
        range: filter.range,
        ...(filter.fromDate && { fromDate: filter.fromDate }),
        ...(filter.toDate && { toDate: filter.toDate }),
      });
      
      const response = await httpClient.get<{ data: string }>(
        `/dashboard/customer/ai-summary?${params}`,
        { signal } // Pass abort signal to request
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching customer AI summary:', error);
      throw handleApiError(error, 'Không thể tải tóm tắt AI');
    }
  },

  /**
   * Get Driver Dashboard
   */
  getDriverDashboard: async (filter: DashboardFilter): Promise<DriverDashboardResponse> => {
    try {
      const params = new URLSearchParams({
        range: filter.range,
        ...(filter.fromDate && { fromDate: filter.fromDate }),
        ...(filter.toDate && { toDate: filter.toDate }),
      });
      
      const response = await httpClient.get<{ data: DriverDashboardResponse }>(`/dashboard/driver?${params}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching driver dashboard:', error);
      throw handleApiError(error, 'Không thể tải dữ liệu dashboard');
    }
  },

  /**
   * Get Driver Dashboard AI Summary
   */
  getDriverAiSummary: async (filter: DashboardFilter, signal?: AbortSignal): Promise<string> => {
    try {
      const params = new URLSearchParams({
        range: filter.range,
        ...(filter.fromDate && { fromDate: filter.fromDate }),
        ...(filter.toDate && { toDate: filter.toDate }),
      });
      
      const response = await httpClient.get<{ data: string }>(
        `/dashboard/driver/ai-summary?${params}`,
        { signal } // Pass abort signal to request
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching driver AI summary:', error);
      throw handleApiError(error, 'Không thể tải tóm tắt AI');
    }
  },
};

export default dashboardService;
