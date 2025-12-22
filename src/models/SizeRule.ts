export interface SizeRuleCategory {
    id: string;
    categoryName: string;
    description: string;
}

export interface SizeRuleType {
    id: string;
    vehicleTypeName: string;
    description: string;
}

export interface DistanceRule {
    id: string;
    fromKm: number;
    toKm: number;
    displayOrder: number;
    displayName: string;
    isBasePrice: boolean;
    status: string;
}

export interface BasingPrice {
    id: string;
    basePrice: string;
    distanceRuleResponse: DistanceRule;
}

export interface SizeRule {
    id: string;
    sizeRuleName: string;
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
    category: SizeRuleCategory;
    vehicleTypeEntity: SizeRuleType;
    basingPrices: BasingPrice[];
}

export interface SizeRuleRequest {
    sizeRuleName: string;
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

export interface UpdateSizeRuleRequest {
    id: string;
    // sizeRuleName is not allowed to be updated
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