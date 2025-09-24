import type { SelectProps } from 'antd';

/**
 * Converts an enum to Ant Design Select options
 * 
 * @param enumObj - The enum object
 * @param labelMap - Optional map of enum values to display labels
 * @returns Array of Select options
 */
export const enumToSelectOptions = <T extends Record<string, string>>(
    enumObj: T,
    labelMap?: Record<string, string>
): SelectProps['options'] => {
    return Object.values(enumObj).map(value => ({
        value,
        label: labelMap?.[value] || value,
    }));
};

/**
 * Creates filter options for a Table component from an enum
 * 
 * @param enumObj - The enum object
 * @param labelMap - Optional map of enum values to display labels
 * @returns Filter options for Ant Design Table
 */
export const createEnumFilter = <T extends Record<string, string>>(
    enumObj: T,
    labelMap?: Record<string, string>
) => {
    return Object.values(enumObj).map(value => ({
        text: labelMap?.[value] || value,
        value,
    }));
};

/**
 * Gets a color class for a status value
 * 
 * @param status - The status value
 * @param colorMap - Map of status values to color classes
 * @param defaultColor - Default color class if status is not found in colorMap
 * @returns Tailwind CSS color class
 */
export const getStatusColor = (
    status: string,
    colorMap: Record<string, string>,
    defaultColor = 'bg-gray-400 text-white'
): string => {
    return colorMap[status] || defaultColor;
}; 