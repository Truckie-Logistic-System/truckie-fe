import type { PlaceDetailResult } from '../models/TrackAsia';

// Hàm so sánh tiếng Việt không dấu để cải thiện tìm kiếm
export const removeVietnameseAccents = (str: string): string => {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
};

// Tạo hàm lọc tùy chỉnh cho Select
export const createCustomFilterOption = () => {
    return (input: string, option: any): boolean => {
        const optionLabel = option?.label?.toString() || '';
        const inputValue = input.toLowerCase();
        const optionLabelLower = optionLabel.toLowerCase();

        // Kiểm tra nếu label chứa input trực tiếp
        if (optionLabelLower.includes(inputValue)) {
            return true;
        }

        // Kiểm tra không dấu
        const optionLabelNormalized = removeVietnameseAccents(optionLabel);
        const inputValueNormalized = removeVietnameseAccents(input);

        // Tách từ khóa tìm kiếm và kiểm tra từng phần
        const inputParts = inputValueNormalized.split(/\s+/).filter(Boolean);

        // Nếu tất cả các phần của input đều có trong option (không phân biệt thứ tự)
        return inputParts.every(part => optionLabelNormalized.includes(part));
    };
};

// Điền thông tin địa chỉ từ address_components
export const fillAddressFromComponents = (components: any[] | undefined, placeDetail?: any) => {
    if (!components || !Array.isArray(components)) {
        console.log('No address components found or not an array');
        return null;
    }

    try {
        console.log('Processing address components:', components);
        console.log('Place detail:', placeDetail);

        // Tìm street_number và route để tạo street
        const streetNumber = components.find(c => c.types && c.types.includes('street_number'));
        const route = components.find(c => c.types && c.types.includes('route'));

        // Tìm các thành phần khác của địa chỉ
        const ward = components.find(c => c.types && c.types.includes('administrative_area_level_2'));
        const district = components.find(c => c.types && c.types.includes('administrative_area_level_3'));
        const province = components.find(c => c.types && c.types.includes('administrative_area_level_1'));
        const sublocality = components.find(c => c.types && c.types.includes('sublocality_level_1'));
        const premise = components.find(c => c.types && c.types.includes('premise'));

        console.log('Found components:', {
            streetNumber, route, ward, district, province, sublocality, premise
        });

        // Tạo street từ các thành phần
        let street = '';

        // Ưu tiên kết hợp street_number và route
        if (streetNumber && route) {
            street = `${streetNumber.long_name} ${route.long_name}`;
        }
        // Nếu chỉ có route
        else if (route) {
            street = route.long_name;
        }
        // Nếu có premise (tòa nhà, địa điểm cụ thể)
        else if (premise) {
            street = premise.long_name;
        }

        // Nếu không có thông tin đường, thử dùng thông tin sublocality
        if (!street && sublocality) {
            street = sublocality.long_name;
        }

        // Nếu vẫn không có street, sử dụng name của địa điểm + formatted_address
        if (!street && placeDetail) {
            if (placeDetail.name) {
                // Nếu name không nằm trong formatted_address, sử dụng name
                if (placeDetail.formatted_address && !placeDetail.formatted_address.includes(placeDetail.name)) {
                    street = placeDetail.name;
                }
                // Nếu không có formatted_address, sử dụng name
                else if (!placeDetail.formatted_address) {
                    street = placeDetail.name;
                }
            }
        }

        // Nếu vẫn không có street, thử lấy từ vicinity hoặc formatted_address
        if (!street && placeDetail) {
            if (placeDetail.vicinity) {
                const vicinityParts = placeDetail.vicinity.split(',');
                if (vicinityParts.length > 0) {
                    street = vicinityParts[0].trim();
                }
            } else if (placeDetail.formatted_address) {
                const addressParts = placeDetail.formatted_address.split(',');
                if (addressParts.length > 0) {
                    street = addressParts[0].trim();
                }
            }
        }

        // Xác định ward (phường/xã)
        let wardName = '';
        if (ward) {
            wardName = ward.long_name;
        } else if (district) {
            // Nếu không có ward, thử dùng district
            wardName = district.long_name;
        } else if (sublocality && !street.includes(sublocality.long_name)) {
            // Nếu không có ward và district, dùng sublocality nếu chưa dùng cho street
            wardName = sublocality.long_name;
        }

        // Nếu vẫn không có ward, thử lấy từ vicinity hoặc formatted_address
        if (!wardName && placeDetail) {
            if (placeDetail.vicinity) {
                const vicinityParts = placeDetail.vicinity.split(',');
                if (vicinityParts.length > 1) {
                    wardName = vicinityParts[1].trim();
                }
            } else if (placeDetail.formatted_address) {
                const addressParts = placeDetail.formatted_address.split(',');
                if (addressParts.length > 1) {
                    wardName = addressParts[1].trim();
                }
            }
        }

        // Xác định province (tỉnh/thành phố)
        let provinceName = '';
        if (province) {
            provinceName = province.long_name;
            // Đảm bảo có "Thành phố" ở đầu nếu là Hồ Chí Minh
            if (provinceName.includes('Hồ Chí Minh') && !provinceName.includes('Thành phố')) {
                provinceName = `Thành phố ${provinceName}`;
            }
        } else if (placeDetail && placeDetail.formatted_address) {
            // Nếu không có province, thử lấy từ formatted_address
            const addressParts = placeDetail.formatted_address.split(',');
            if (addressParts.length > 2) {
                provinceName = addressParts[2].trim();
                if (provinceName.includes('Hồ Chí Minh') && !provinceName.includes('Thành phố')) {
                    provinceName = `Thành phố ${provinceName}`;
                }
            }
        }

        // Nếu vẫn không có province, mặc định là "Thành phố Hồ Chí Minh"
        if (!provinceName) {
            provinceName = 'Thành phố Hồ Chí Minh';
        }

        console.log('Extracted address parts:', { street, wardName, provinceName });

        // Tạo object chứa thông tin địa chỉ
        const formValues: any = {};
        if (street) formValues.street = street;
        if (wardName) formValues.ward = wardName;
        if (provinceName) formValues.province = provinceName;

        return formValues;
    } catch (error) {
        console.error('Error filling address from components:', error);
        return null;
    }
};

// Xử lý kết quả từ TrackAsia Place Detail
export const processPlaceDetail = (placeDetail: PlaceDetailResult) => {
    if (!placeDetail || !placeDetail.geometry || !placeDetail.geometry.location) {
        console.log('Invalid place detail object:', placeDetail);
        return null;
    }

    console.log('Processing place detail:', placeDetail);

    const location = placeDetail.geometry.location;

    // Tìm street_number và route để tạo street
    const streetNumber = placeDetail.address_components?.find(c => c.types && c.types.includes('street_number'));
    const route = placeDetail.address_components?.find(c => c.types && c.types.includes('route'));

    // Tìm ward từ administrative_area_level_2
    const ward = placeDetail.address_components?.find(c => c.types && c.types.includes('administrative_area_level_2'));

    // Tìm province từ administrative_area_level_1
    const province = placeDetail.address_components?.find(c => c.types && c.types.includes('administrative_area_level_1'));

    // Xử lý street
    let street = '';
    if (streetNumber && route) {
        // Nếu có cả street_number và route, kết hợp chúng
        street = `${streetNumber.long_name} ${route.long_name}`;
    } else {
        // Nếu không có cả street_number và route, sử dụng name
        street = placeDetail.name || '';
    }

    // Xử lý ward
    let wardName = '';
    if (ward) {
        wardName = ward.long_name;
    } else {
        // Nếu không có ward, thử lấy từ formatted_address
        const addressParts = placeDetail.formatted_address?.split(',') || [];
        if (addressParts.length > 1) {
            wardName = addressParts[1].trim();
        }
    }

    // Xử lý province
    let provinceName = '';
    if (province) {
        provinceName = province.long_name;
        // Đảm bảo có "Thành phố" ở đầu nếu là Hồ Chí Minh
        if (provinceName.includes('Hồ Chí Minh') && !provinceName.includes('Thành phố')) {
            provinceName = `Thành phố ${provinceName}`;
        }
    } else {
        // Nếu không có province, thử lấy từ formatted_address
        const addressParts = placeDetail.formatted_address?.split(',') || [];
        if (addressParts.length > 2) {
            provinceName = addressParts[addressParts.length - 1].trim();
            if (provinceName.includes('Hồ Chí Minh') && !provinceName.includes('Thành phố')) {
                provinceName = `Thành phố ${provinceName}`;
            }
        } else {
            provinceName = 'Thành phố Hồ Chí Minh';
        }
    }

    // Tạo địa chỉ kết hợp từ name và formatted_address
    let combinedAddress = placeDetail.formatted_address || '';

    // Nếu name không nằm trong formatted_address, thêm vào trước
    if (placeDetail.name && !combinedAddress.toLowerCase().includes(placeDetail.name.toLowerCase())) {
        combinedAddress = `${placeDetail.name}, ${combinedAddress}`;
    }

    const result = {
        location: {
            lat: location.lat,
            lng: location.lng
        },
        address: combinedAddress,
        street: street,
        ward: wardName,
        province: provinceName,
        latitude: location.lat,
        longitude: location.lng
    };

    console.log('Processed place detail result:', result);
    return result;
};
