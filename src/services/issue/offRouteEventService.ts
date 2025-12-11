import httpClient from '../api/httpClient';

export interface OffRouteEventListItem {
  id: string;
  offRouteStartTime: string;
  lastKnownLat?: number;
  lastKnownLng?: number;
  distanceFromRouteMeters?: number;
  warningStatus: string;
  yellowWarningSentAt?: string;
  redWarningSentAt?: string;
  canContactDriver?: boolean;
  contactedAt?: string;
  resolvedAt?: string;
  resolvedReason?: string;
  gracePeriodExpiresAt?: string;
  gracePeriodExtensionCount?: number;
  createdAt: string;
  vehicleAssignment?: {
    id: string;
    trackingCode?: string;
    status?: string;
    vehiclePlateNumber?: string;
    driverName?: string;
    driverPhone?: string;
  };
  order?: {
    id: string;
    orderCode?: string;
    status?: string;
    senderName?: string;
    receiverName?: string;
  };
  issue?: {
    id: string;
    issueTypeName?: string;
    status?: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  code: number;
  data: T;
}

const offRouteEventService = {
  /**
   * Get all off-route events for staff (sorted by createdAt DESC)
   */
  getAllOffRouteEvents: async (): Promise<OffRouteEventListItem[]> => {
    try {
      const response = await httpClient.get<ApiResponse<OffRouteEventListItem[]>>('/off-route-events/staff/list');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching off-route events:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách cảnh báo lệch tuyến');
    }
  },

  /**
   * Get off-route event detail by ID
   */
  getOffRouteEventDetail: async (eventId: string): Promise<any> => {
    try {
      const response = await httpClient.get(`/off-route-events/${eventId}/detail`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching off-route event detail:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải chi tiết cảnh báo lệch tuyến');
    }
  },
};

export default offRouteEventService;
