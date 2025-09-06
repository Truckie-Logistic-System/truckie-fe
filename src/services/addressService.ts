import type { Address, FormAddress } from "../types";
import api from "./api";

export const addressService = {
  getAllAddress: async (): Promise<Address[]> => {
    const response = await api.get("/address");
    return response.data.data;
  },

  addAddress: async (addressData: FormAddress): Promise<Address> => {
    const response = await api.post("/address", addressData);
    return response.data.data;
  },

  getAddressById: async (id: string): Promise<Address> => {
    const response = await api.get(`/address/${id}`);
    return response.data.data;
  },

  updateAddress: async (
    id: string,
    addressData: FormAddress
  ): Promise<Address> => {
    const response = await api.put(`/address/${id}`, addressData);
    return response.data.data;
  },
};
