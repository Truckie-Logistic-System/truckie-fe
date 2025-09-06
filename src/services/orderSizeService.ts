import type { OrderSize } from "../types";
import api from "./api";

export const orderSizeService = {
  getAllOrderSize: async (): Promise<OrderSize[]> => {
    const response = await api.get("/order-size");
    return response.data.data;
  },

  getOrderSizeById: async (id: string): Promise<OrderSize> => {
    const response = await api.get(`/order-size/${id}`);
    return response.data.data;
  },

  createOrderSize: async (
    orderSizeData: Omit<OrderSize, "id">
  ): Promise<OrderSize> => {
    const response = await api.post(`/order-size`, orderSizeData);
    return response.data.data;
  },

  updateOrderSize: async (
    id: string,
    orderSizeData: Partial<OrderSize>
  ): Promise<OrderSize> => {
    const response = await api.put(`/order-size/${id}`, orderSizeData);
    return response.data.data;
  },

  deleteOrderSize: async (id: string): Promise<boolean> => {
    const response = await api.delete(`/order-size/${id}`);
    return response.data.data;
  },
};
