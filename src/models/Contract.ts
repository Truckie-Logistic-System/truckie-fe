export interface Contract {
  id: string;
  contractName: string;
  effectiveDate: string;
  expirationDate: string;
  adjustedValue: number;
  description: string;
  orderId: string;
  staffId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateContractRequest {
  contractName: string;
  effectiveDate: string;
  expirationDate: string;
  adjustedValue: number;
  description: string;
  orderId: string;
  staffId: string;
}

export interface CreateContractResponse {
  success: boolean;
  message: string;
  data?: Contract;
}
