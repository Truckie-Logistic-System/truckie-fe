export interface Category {
    id: string;
    categoryName: string;
    description: string;
}

export interface CategoryCreateDto {
    categoryName: string;
    description: string;
}

export interface CategoryUpdateDto {
    categoryName?: string;
    description?: string;
} 