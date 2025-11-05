export interface AssignedDetail {
  id: string;
  weight: number;
  weightBaseUnit: number;
  unit: string;
  trackingCode: string;
}

export interface PackedDetail {
  orderDetailId: string;
  x: number;
  y: number;
  z: number;
  length: number;
  width: number;
  height: number;
  orientation: string;
}

export interface SuggestAssignVehicle {
  vehicleIndex: number;
  vehicleRuleId: string;
  vehicleRuleName: string;
  currentLoad: number;
  currentLoadUnit: string;
  assignedDetails: AssignedDetail[];
  packedDetailDetails?: PackedDetail[];
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
  totalValue: number;
  adjustedValue: number | null;
  description: string;
  attachFileUrl: string;
  status: string;
  orderId: string;
  staffId: string;
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
