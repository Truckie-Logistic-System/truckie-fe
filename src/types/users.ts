export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  authToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    imageUrl: string | null;
    status: string;
    role: {
      roleName: string;
      isActive: boolean;
    };
  };
}
