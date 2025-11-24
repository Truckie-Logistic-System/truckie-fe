/**
 * Weight conversion utilities for order forms
 * Ensures consistent unit conversion across all validation points
 */

export type WeightUnit = 'Tấn' | 'Kí' | 'Kilogram' | 'Tạ' | 'Yến';

export interface WeightValidation {
  min: number;
  max: number;
  message: string;
  step: number;
  precision: number;
  placeholder: string;
}

/**
 * Convert weight to tons based on unit
 * @param weight - Weight value in original unit
 * @param unit - Original unit ('Tấn', 'Kí', 'Kilogram', 'Tạ', 'Yến')
 * @returns Weight in tons
 */
export const convertWeightToTons = (weight: number, unit: WeightUnit): number => {
  // Defensive checks for invalid inputs
  if (weight === null || weight === undefined || isNaN(weight)) {
    return 0;
  }
  
  const numericWeight = Number(weight);
  if (numericWeight < 0) {
    return 0;
  }
  
  switch (unit) {
    case 'Kí':
    case 'Kilogram':
      return numericWeight / 1000; // kg to tons
    case 'Tạ':
      return numericWeight / 10; // Tạ to tons (1 Tạ = 100kg = 0.1 tấn)
    case 'Yến':
      return numericWeight / 100; // Yến to tons (1 Yến = 10kg = 0.01 tấn)
    case 'Tấn':
    default:
      return numericWeight; // Already in tons
  }
};

/**
 * Get dynamic validation rules based on unit
 * @param unit - Selected unit
 * @returns Validation configuration
 */
export const getWeightValidation = (unit: WeightUnit): WeightValidation => {
  switch (unit) {
    case 'Kí':
    case 'Kilogram':
      return {
        min: 10,      // 10kg = 0.01 tons
        max: 10000,   // 10000kg = 10 tons
        message: 'Trọng lượng phải từ 10 đến 10,000 kg',
        step: 1,
        precision: 0,
        placeholder: 'Nhập trọng lượng (kg)'
      };
    case 'Tạ':
      return {
        min: 0.1,     // 0.1 Tạ = 10kg = 0.01 tons
        max: 100,     // 100 Tạ = 10000kg = 10 tons
        message: 'Trọng lượng phải từ 0.1 đến 100 Tạ',
        step: 0.1,
        precision: 1,
        placeholder: 'Nhập trọng lượng (Tạ)'
      };
    case 'Yến':
      return {
        min: 1,       // 1 Yến = 10kg = 0.01 tons
        max: 1000,    // 1000 Yến = 10000kg = 10 tons
        message: 'Trọng lượng phải từ 1 đến 1,000 Yến',
        step: 1,
        precision: 0,
        placeholder: 'Nhập trọng lượng (Yến)'
      };
    case 'Tấn':
    default:
      return {
        min: 0.01,    // 0.01 tons
        max: 10,      // 10 tons
        message: 'Trọng lượng phải từ 0.01 đến 10 tấn',
        step: 0.01,
        precision: 2,
        placeholder: 'Nhập trọng lượng (tấn)'
      };
  }
};

/**
 * Get display label for weight range based on unit
 * @param unit - Selected unit
 * @returns Display string for weight range
 */
export const getWeightRangeLabel = (unit: WeightUnit): string => {
  switch (unit) {
    case 'Kí':
    case 'Kilogram':
      return '10 - 10,000 kg';
    case 'Tạ':
      return '0.1 - 100 Tạ';
    case 'Yến':
      return '1 - 1,000 Yến';
    case 'Tấn':
    default:
      return '0.01 - 10 tấn';
  }
};

/**
 * Calculate total weight from order details with unit conversion
 * @param orderDetails - Array of order detail objects
 * @returns Total weight in tons
 */
export const calculateTotalWeight = (orderDetails: any[]): number => {
  return orderDetails.reduce((sum: number, detail: any) => {
    const weight = detail?.weight || 0;
    const quantity = detail?.quantity || 1;
    const unit = detail?.unit || 'Tấn';
    
    const weightInTons = convertWeightToTons(weight, unit);
    return sum + (weightInTons * quantity);
  }, 0);
};
