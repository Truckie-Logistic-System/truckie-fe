export interface OrderDetails {
  weight: number;
  description: string;
  status: string;
  startTime: string;
  estimatedStartTime: string;
  endTime: string;
  estimatedEndTime: string;
  createdAt: string;
  updatedAt: string;
  trackingCode: string;
  orderId: string;
  orderSizeId: string;
  vehicleAssignmentId: string;
}

export interface FormOrderDetails {
  weight: number;
  description: string;
  orderSizeId: string;
}
