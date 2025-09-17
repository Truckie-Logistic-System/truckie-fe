export interface Category {
    id: string;
    categoryName: string;
    description: string;
}

export interface CategoryPricing {
    id: string;
    priceMultiplier: number;
    extraFee: number;
    categoryResponse: Category;
}

export interface CreateCategoryRequest {
    categoryName: string;
    description: string; // Bắt buộc
}

export interface UpdateCategoryRequest {
    categoryName: string;
    description: string; // Bắt buộc
}

export interface CreateCategoryPricingRequest {
    priceMultiplier: number;
    extraFee: number;
    categoryId: string;
}

export interface UpdateCategoryPricingRequest {
    priceMultiplier: number;
    extraFee: number;
    categoryId: string;
} 