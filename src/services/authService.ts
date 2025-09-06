import type { LoginRequest, LoginResponse } from "../types/users";
import api from "./api";

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post("/auths", credentials);
    return response.data.data;
  },
};
