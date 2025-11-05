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

export interface ContractSettings {
  id: string;
  depositPercent: number;
  expiredDepositDate: number;
  insuranceRate: number;
  vatRate: number;
}

export interface ContractSettingsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: ContractSettings[];
}
