import type { FormOrderDetails, OrderDetails } from "./orderDetails";

export interface Orders {
  id: string;
  notes: string;
  totalWeight: number;
  receiverName: string;
  receiverPhone: string;
  packageDescription: string;
  estimateStartTime: string;
  deliveryAddressId: string;
  pickupAddressId: string;
  senderId: string;
  categoryId: string;
  orderDetails: OrderDetails[];
}

export interface OrderRequest {
  notes: string;
  totalWeight: number;
  receiverName: string;
  receiverPhone: string;
  packageDescription: string;
  estimateStartTime: string;
  deliveryAddressId: string;
  pickupAddressId: string;
  senderId: string;
  categoryId: string;
}

export interface FormOrders {
  orderRequest: OrderRequest;
  orderDetails: FormOrderDetails[];
}
