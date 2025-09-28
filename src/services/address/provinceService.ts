import httpClient from "../api/httpClient";
import { handleApiError } from "../api/errorHandler";
import type { Province } from "@/models/Province";

/**
 * Service for handling province-related API calls
 */
const provinceService = {
    /**
     * Get all provinces with districts and wards
     * @returns Promise with array of provinces
     */
    getProvinces: async (): Promise<Province[]> => {
        console.log('provinceService.getProvinces: Starting API call');
        try {
            console.log('Sending request to /provinces endpoint');
            const response = await httpClient.get("/provinces");
            console.log('Received response from /provinces:', response);

            // Kiểm tra xem response có đúng định dạng không
            if (response.data) {
                // Nếu response.data là mảng, sử dụng trực tiếp
                if (Array.isArray(response.data)) {
                    console.log(`Received ${response.data.length} provinces directly in data`);
                    return response.data;
                }

                // Nếu response.data.data là mảng, sử dụng data.data
                if (response.data.data && Array.isArray(response.data.data)) {
                    console.log(`Received ${response.data.data.length} provinces in data.data`);
                    return response.data.data;
                }

                // Nếu response.data là object và có thuộc tính data, thử parse nó
                if (typeof response.data === 'object' && response.data !== null) {
                    console.log('Response data is an object, trying to extract provinces');
                    // Nếu có một mảng ở bất kỳ thuộc tính nào, sử dụng nó
                    for (const key in response.data) {
                        if (Array.isArray(response.data[key])) {
                            console.log(`Found array in response.data.${key} with ${response.data[key].length} items`);
                            return response.data[key];
                        }
                    }

                    // Nếu response.data là một province object (không phải mảng), đặt nó trong mảng
                    if (response.data.name && (response.data.wards || response.data.districts)) {
                        console.log('Found a single province object in response');

                        // Nếu có districts nhưng không có wards, chuyển đổi cấu trúc
                        if (!response.data.wards && response.data.districts) {
                            const allWards = [];
                            for (const district of response.data.districts) {
                                if (district.wards && Array.isArray(district.wards)) {
                                    allWards.push(...district.wards);
                                }
                            }
                            response.data.wards = allWards;
                        }

                        return [response.data];
                    }
                }
            }

            console.warn('Invalid response format from /provinces API, using empty array');
            return [];
        } catch (error: any) {
            console.error("Error fetching provinces:", error);
            console.error("Error details:", {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });

            throw handleApiError(error, "Không thể tải danh sách tỉnh/thành phố");
        }
    },

    /**
     * Find Ho Chi Minh City province from the list
     * @param provinces List of provinces to search in
     * @returns The Ho Chi Minh City province object or undefined if not found
     */
    findHoChiMinhCity: (provinces: Province[]): Province | undefined => {
        // Tìm theo codename
        let hcmc = provinces.find(province =>
            province.codename === 'thanh_pho_ho_chi_minh' ||
            province.codename === 'ho_chi_minh' ||
            province.codename === 'hcm'
        );

        // Nếu không tìm thấy, thử tìm theo tên
        if (!hcmc) {
            hcmc = provinces.find(province => {
                const name = province.name.toLowerCase();
                return name.includes('hồ chí minh') ||
                    name.includes('ho chi minh') ||
                    name.includes('hcm') ||
                    name.includes('tp hcm');
            });
        }

        // Nếu vẫn không tìm thấy và có ít nhất một tỉnh, lấy tỉnh đầu tiên
        if (!hcmc && provinces.length > 0) {
            console.log('Could not find HCMC, using first province:', provinces[0].name);
            return provinces[0];
        }

        console.log('findHoChiMinhCity result:', hcmc ? `Found: ${hcmc.name}` : 'Not found');
        return hcmc;
    }
};

export default provinceService; 