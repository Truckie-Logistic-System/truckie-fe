// Request DTO
export interface CreateRoomRequest {
  orderId?: string;
  userId: string;
}

// ParticipantResponse có thể cần định nghĩa thêm, ví dụ:
export interface ParticipantResponse {
  userId: string;
  roleName: string;
  
}

// Response DTO
export interface CreateRoomResponse {
  roomId: string;
  orderId: string;
  participants: ParticipantResponse[];
  status: string;
  type?: string;
}