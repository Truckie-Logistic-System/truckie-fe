import React, { useState, useCallback, useEffect } from 'react';
import { AutoComplete, Spin } from 'antd';
import { debounce } from 'lodash';
import trackasiaService from '../../services/map/trackasiaService';
import type { PlaceDetailResult, AutocompleteResult } from '../../models/TrackAsia';

// Ho Chi Minh City bounding box
const HCMC_BOUNDS = '106.5444,10.3369,107.0111,11.1602'; // southwest_lng,southwest_lat,northeast_lng,northeast_lat

interface AddressSearchProps {
    onPlaceSelect: (place: PlaceDetailResult) => void;
    initialValue?: string;
}

const AddressSearch: React.FC<AddressSearchProps> = ({ onPlaceSelect, initialValue }) => {
    const [searchValue, setSearchValue] = useState(initialValue || '');
    const [searchOptions, setSearchOptions] = useState<{ value: string; label: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

    // Cập nhật searchValue khi initialValue thay đổi
    useEffect(() => {
        if (initialValue && initialValue !== searchValue) {
            setSearchValue(initialValue);
        }
    }, [initialValue]);

    // Tìm kiếm địa điểm với TrackAsia
    const searchPlaces = async (query: string) => {
        if (!query || query.trim().length < 3) {
            setSearchOptions([]);
            return;
        }

        console.log('Searching places with query:', query);
        setIsSearching(true);
        try {
            console.log('Calling autocomplete API with query:', query, 'bounds:', HCMC_BOUNDS);
            const results = await trackasiaService.autocomplete(query, 5, HCMC_BOUNDS);
            console.log('Autocomplete API results:', results);

            if (results.length === 0) {
                console.log('No results found for query:', query);
                setSearchOptions([{
                    value: 'no-results',
                    label: 'Không tìm thấy kết quả'
                }]);
            } else {
                console.log('Found', results.length, 'results for query:', query);
                setSearchOptions(results.map(result => {
                    console.log('Result item:', result);
                    return {
                        value: result.place_id,
                        label: result.description || result.name
                    };
                }));
            }
        } catch (error) {
            console.error('Error searching places:', error);
            setSearchOptions([{
                value: 'error',
                label: 'Lỗi tìm kiếm, vui lòng thử lại'
            }]);
        } finally {
            setIsSearching(false);
        }
    };

    // Debounce search để tránh gọi API quá nhiều
    const debouncedSearch = useCallback(
        debounce((query: string) => {
            searchPlaces(query);
        }, 300),
        []
    );

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

        console.log('Selected place ID:', placeId);
        setSelectedPlaceId(placeId);
        setIsSearching(true);

        try {
            console.log('Calling getPlaceDetail API with place_id:', placeId);
            const placeDetail = await trackasiaService.getPlaceDetail(placeId);
            console.log('Place detail API response:', placeDetail);

            if (placeDetail && placeDetail.geometry && placeDetail.geometry.location) {
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

                console.log('Setting search value to:', displayValue);
                setSearchValue(displayValue);

                console.log('Calling onPlaceSelect with:', placeDetail);

                // Gọi onPlaceSelect với timeout để đảm bảo UI được cập nhật trước
                setTimeout(() => {
                    onPlaceSelect(placeDetail);
                }, 0);
            } else {
                console.error('Invalid place detail response:', placeDetail);
                // Hiển thị thông báo lỗi
                setSearchValue(searchOptions.find(opt => opt.value === placeId)?.label || searchValue);
            }
        } catch (error) {
            console.error('Error getting place details:', error);
            // Nếu có lỗi, vẫn hiển thị địa chỉ đã chọn
            setSearchValue(searchOptions.find(opt => opt.value === placeId)?.label || searchValue);
        } finally {
            setIsSearching(false);
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