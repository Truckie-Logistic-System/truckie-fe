import React, { useState, useEffect } from 'react';
import { AutoComplete, Spin } from 'antd';
import { useAddressSearch } from '../../hooks/useAddressSearch';
import type { PlaceDetailResult } from '../../models/TrackAsia';

interface AddressSearchProps {
    onPlaceSelect: (place: PlaceDetailResult) => void;
    initialValue?: string;
    street?: string;
    ward?: string;
    province?: string;
}

const AddressSearch: React.FC<AddressSearchProps> = ({ onPlaceSelect, initialValue, street, ward, province }) => {
    // Tạo giá trị hiển thị từ street, ward, province nếu có
    const getDisplayValue = () => {
        if (street && ward && province) {
            return `${street}, ${ward}, ${province}`;
        }
        return initialValue || '';
    };

    const [searchValue, setSearchValue] = useState(getDisplayValue());
    const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
    const { isSearching, searchOptions, debouncedSearch, getPlaceDetail } = useAddressSearch();

    // Cập nhật searchValue khi các props thay đổi
    useEffect(() => {
        const newDisplayValue = getDisplayValue();
        if (newDisplayValue !== searchValue) {
            setSearchValue(newDisplayValue);
        }
    }, [initialValue, street, ward, province]);

    // Xử lý khi người dùng nhập vào ô tìm kiếm
    const handleSearchChange = (value: string) => {
        setSearchValue(value);
        // Nếu giá trị thay đổi, đặt lại selectedPlaceId
        if (selectedPlaceId) {
            setSelectedPlaceId(null);
        }
        debouncedSearch(value);
    };

    // Xử lý khi người dùng chọn một địa điểm
    const handlePlaceSelect = async (placeId: string) => {
        if (!placeId || placeId === 'no-results' || placeId === 'error') {
            return;
        }
        setSelectedPlaceId(placeId);

        const result = await getPlaceDetail(placeId);
        if (result.success && result.place) {
            const placeDetail = result.place;
            // Cập nhật giá trị hiển thị thành name + formatted_address
            let displayValue = '';

            // Nếu có name và formatted_address, kết hợp chúng
            if (placeDetail.name && placeDetail.formatted_address) {
                // Kiểm tra xem name đã có trong formatted_address chưa
                if (placeDetail.formatted_address.includes(placeDetail.name)) {
                    displayValue = placeDetail.formatted_address;
                } else {
                    displayValue = `${placeDetail.name}, ${placeDetail.formatted_address}`;
                }
            }
            // Nếu chỉ có name
            else if (placeDetail.name) {
                displayValue = placeDetail.name;
            }
            // Nếu chỉ có formatted_address
            else if (placeDetail.formatted_address) {
                displayValue = placeDetail.formatted_address;
            }
            // Nếu không có cả hai, giữ nguyên giá trị hiện tại
            else {
                displayValue = searchValue;
            }
            setSearchValue(displayValue);
            // Gọi onPlaceSelect với timeout để đảm bảo UI được cập nhật trước
            setTimeout(() => {
                onPlaceSelect(placeDetail);
            }, 0);
        } else {
            console.error('Error getting place details:', result.error);
            // Hiển thị thông báo lỗi
            setSearchValue(searchOptions.find(opt => opt.value === placeId)?.label || searchValue);
        }
    };

    return (
        <AutoComplete
            value={searchValue}
            options={searchOptions}
            onSelect={handlePlaceSelect}
            onChange={handleSearchChange}
            placeholder="Nhập địa chỉ để tìm kiếm..."
            style={{ width: '100%' }}
            notFoundContent={isSearching ? <Spin size="small" /> : null}
            allowClear
        />
    );
};

export default AddressSearch; 