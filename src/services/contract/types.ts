export interface SuggestAssignVehicle {
  vehicleIndex: number;
  vehicleRuleId: string;
  vehicleRuleName: string;
  currentLoad: number;
  assignedDetails: string[];
}

export interface SuggestAssignVehiclesResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: SuggestAssignVehicle[];
}

export interface CreateContractRequest {
  contractName: string;
  effectiveDate: string;
  expirationDate: string;
  description: string;
  attachFileUrl: string;
  orderId: string;
}

export interface Contract {
  id: string;
  contractName: string;
  effectiveDate: string;
  expirationDate: string;
  totalValue: string;
  description: string;
  attachFileUrl: string;
  status: string;
  orderId: string;
}

export interface CreateContractResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: Contract;
}

export interface GeneratePdfResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: {
    pdfUrl: string;
    contractId: string;
    message: string;
  };
}
