export interface VehicleRuleCategory {
    id: string;
    categoryName: string;
    description: string;
}

export interface VehicleRuleType {
    id: string;
    vehicleTypeName: string;
    description: string;
}

export interface DistanceRule {
    id: string;
    fromKm: number;
    toKm: number;
}

export interface BasingPrice {
    id: string;
    basePrice: string;
    distanceRuleResponse: DistanceRule;
}

export interface VehicleRule {
    id: string;
    vehicleRuleName: string;
    minWeight: number;
    maxWeight: number;
    minLength: number;
    maxLength: number;
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    status: string;
    effectiveFrom: string;
    effectiveTo: string | null;
    category: VehicleRuleCategory;
    vehicleTypeEntity: VehicleRuleType;
    basingPrices: BasingPrice[];
}

export interface VehicleRuleRequest {
    vehicleRuleName: string;
    minWeight: number;
    maxWeight: number;
    minLength: number;
    maxLength: number;
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    status: string;
    effectiveFrom: string;
    effectiveTo?: string;
    categoryId: string;
    vehicleTypeId: string;
    basingPrices?: BasingPrice[];
}

export interface UpdateVehicleRuleRequest extends VehicleRuleRequest {
    id: string;
} 