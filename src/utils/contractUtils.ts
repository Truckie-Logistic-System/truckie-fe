/**
 * Utility functions for contract data handling
 */

/**
 * Clean "N/A" values from contract data and replace with meaningful defaults
 * @param value - The value to clean
 * @param fallback - The fallback value to use if value is "N/A", null, or undefined
 * @returns Cleaned value or fallback
 */
export const cleanContractValue = (value: string | null | undefined, fallback: string): string => {
  if (!value || value === "N/A" || value.trim() === "") {
    return fallback;
  }
  return value;
};

/**
 * Clean contract name and description with meaningful defaults
 * @param contractName - Original contract name
 * @param description - Original description
 * @param orderCode - Order code for generating meaningful defaults
 * @returns Object with cleaned contract name and description
 */
export const cleanContractData = (
  contractName: string | null | undefined,
  description: string | null | undefined,
  orderCode?: string
) => {
  const orderCodeText = orderCode || 'đơn hàng';
  
  const cleanContractName = cleanContractValue(
    contractName,
    `Hợp đồng vận chuyển - ${orderCodeText}`
  );
  
  // Ensure contract name doesn't exceed typical database limits (e.g., 255 characters)
  const finalContractName = cleanContractName.length > 255 
    ? cleanContractName.substring(0, 252) + "..." 
    : cleanContractName;
  
  const cleanDescription = cleanContractValue(
    description,
    `Hợp đồng vận chuyển cho ${orderCodeText}. Điều khoản theo thỏa thuận.`
  );
  
  return {
    contractName: finalContractName,
    description: cleanDescription,
  };
};
