import httpClient from '../api/httpClient';

export interface FuelConsumptionListItem {
  id: string;
  fuelVolumeLiters?: number;
  odometerAtStartUrl?: string;
  odometerAtEndUrl?: string;
  companyInvoiceImageUrl?: string;
  odometerStartKm?: number;
  odometerEndKm?: number;
  distanceTraveledKm?: number;
  dateRecorded?: string;
  notes?: string;
  createdAt: string;
  vehicleAssignment?: {
    id: string;
    trackingCode?: string;
    status?: string;
  };
  vehicle?: {
    id: string;
    licensePlateNumber?: string;
    vehicleType?: string;
    brand?: string;
    model?: string;
  };
  driver?: {
    id: string;
    fullName?: string;
    phoneNumber?: string;
  };
  fuelType?: {
    id: string;
    name?: string;
    description?: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  code: number;
  data: T;
}

const fuelConsumptionService = {
  /**
   * Get all vehicle fuel consumptions for staff (sorted by createdAt DESC)
   */
  getAllFuelConsumptions: async (): Promise<FuelConsumptionListItem[]> => {
    try {
      const response = await httpClient.get<ApiResponse<FuelConsumptionListItem[]>>('/vehicle-fuel-consumptions/staff/list');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching fuel consumptions:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách tiêu thụ nhiên liệu');
    }
  },
};

export default fuelConsumptionService;
