export interface OrderSize {
    id: string;
    name: string; // Thêm thuộc tính name
    price: number; // Thêm thuộc tính price
    minWeight: number;
    maxWeight: number;
    minLength: number;
    maxLength: number;
    minHeight: number;
    maxHeight: number;
    minWidth: number;
    maxWidth: number;
    status: string;
    description: string;
}

export interface OrderSizeCreateDto {
    minWeight: number;
    maxWeight: number;
    minLength: number;
    maxLength: number;
    minHeight: number;
    maxHeight: number;
    minWidth: number;
    maxWidth: number;
    description: string;
}

export interface OrderSizeUpdateDto {
    minWeight?: number;
    maxWeight?: number;
    minLength?: number;
    maxLength?: number;
    minHeight?: number;
    maxHeight?: number;
    minWidth?: number;
    maxWidth?: number;
    description?: string;
    status?: string;
} 