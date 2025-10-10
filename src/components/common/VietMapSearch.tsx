import React, { useState, useEffect, useRef } from 'react';
import { Input, AutoComplete, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import debounce from 'lodash/debounce';
import type { VietMapAutocompleteResult } from '@/models/VietMap';

interface VietMapSearchProps {
    onSearch: (text: string) => void;
    onSelect: (result: VietMapAutocompleteResult) => void;
    results: VietMapAutocompleteResult[];
    loading: boolean;
    initialValue?: string;
    street?: string;
    ward?: string;
    province?: string;
}

const VietMapSearch: React.FC<VietMapSearchProps> = ({
    onSearch,
    onSelect,
    results,
    loading,
    initialValue = '',
    street,
    ward,
    province
}) => {
    const [searchText, setSearchText] = useState(initialValue);
    const debouncedSearch = useRef(
        debounce((text: string) => {
            onSearch(text);
        }, 500)
    ).current;

    // Update search text when street, ward, or province changes
    useEffect(() => {
        if (street || ward || province) {
            const parts = [street, ward, province].filter(Boolean);
            if (parts.length > 0) {
                const newSearchText = parts.join(', ');
                setSearchText(newSearchText);
                debouncedSearch(newSearchText);
            }
        }
    }, [street, ward, province]);

    // Handle input change
    const handleInputChange = (text: string) => {
        setSearchText(text);
        debouncedSearch(text);
    };

    // Handle selection
    const handleSelect = (value: string, option: any) => {
        const selectedResult = results.find(r => r.ref_id === option.key);
        if (selectedResult) {
            onSelect(selectedResult);
        }
    };

    // Generate options from results
    const options = results.map(result => ({
        key: result.ref_id,
        value: result.display || result.name,
        label: (
            <div className="flex flex-col py-1">
                <div className="font-medium">{result.name}</div>
                <div className="text-xs text-gray-500">{result.address}</div>
            </div>
        )
    }));

    return (
        <AutoComplete
            value={searchText}
            options={options}
            onSelect={handleSelect}
            onChange={handleInputChange}
            style={{ width: '100%' }}
            notFoundContent={loading ? <Spin size="small" /> : "Không tìm thấy kết quả"}
        >
            <Input
                placeholder="Nhập địa chỉ để tìm kiếm (ít nhất 3 ký tự)"
                prefix={<SearchOutlined />}
                className="rounded-md"
                suffix={loading ? <Spin size="small" /> : null}
            />
        </AutoComplete>
    );
};

export default VietMapSearch; 