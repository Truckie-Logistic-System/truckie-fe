export interface Ward {
    name: string;
    code: number;
    codename: string;
    division_type: string;
    short_codename: string;
}

export interface Province {
    name: string;
    code: number;
    codename: string;
    division_type: string;
    phone_code: number;
    wards: Ward[];
}

export interface ProvincesResponse {
    success: boolean;
    message: string;
    data: Province[];
} 