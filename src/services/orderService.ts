import api from "./api";
import type { FormOrders, Orders } from "../types";

export const orderService = {
  // Get all orders
  getAllOrders: async (): Promise<Orders[]> => {
    const response = await api.get("/orders");
    return response.data.data;
  },

  // Get order by ID
  getOrderById: async (id: string): Promise<Orders> => {
    const response = await api.get(`/orders/${id}`);
    return response.data.data;
  },

  // Create new order
  createOrder: async (orderData: FormOrders): Promise<Orders> => {
    console.log("=== ORDER SERVICE DEBUG ===");
    console.log("Input orderData type:", typeof orderData);
    console.log("Input orderData keys:", Object.keys(orderData));
    console.log("Input orderData:", JSON.stringify(orderData, null, 2));

    // Validate the structure
    console.log("=== STRUCTURE VALIDATION ===");
    console.log("Has orderRequest:", !!orderData.orderRequest);
    console.log("Has orderDetails:", !!orderData.orderDetails);
    console.log(
      "OrderDetails is array:",
      Array.isArray(orderData.orderDetails)
    );

    if (orderData.orderRequest) {
      console.log("OrderRequest type:", typeof orderData.orderRequest);
      console.log("OrderRequest keys:", Object.keys(orderData.orderRequest));
    }

    if (orderData.orderDetails) {
      console.log("OrderDetails length:", orderData.orderDetails.length);
      console.log("First detail:", orderData.orderDetails[0]);
    }
    console.log("=== END ORDER SERVICE DEBUG ===");

    const response = await api.post("/orders", orderData);
    return response.data.data;
  },

  // Update order
  updateOrder: async (
    id: string,
    orderData: Partial<Orders>
  ): Promise<Orders> => {
    const response = await api.put(`/orders/${id}`, orderData);
    return response.data.data;
  },

  // Delete order
  deleteOrder: async (id: string): Promise<void> => {
    await api.delete(`/orders/${id}`);
  },

  // Track order location
  trackOrder: async (
    id: string
  ): Promise<{ latitude: number; longitude: number }> => {
    const response = await api.get(`/orders/${id}/track`);
    return response.data.data;
  },
};
