export interface OrderSize {
    id: string;
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
    minLength: number;
    maxLength: number;
    minHeight: number;
    maxHeight: number;
    minWidth: number;
    maxWidth: number;
    description: string;
}

export interface OrderSizeUpdateDto {
    id: string;
    minLength?: number;
    maxLength?: number;
    minHeight?: number;
    maxHeight?: number;
    minWidth?: number;
    maxWidth?: number;
    description?: string;
}