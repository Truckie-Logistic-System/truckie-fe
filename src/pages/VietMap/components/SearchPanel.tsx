import React from 'react';
import { Space, Button, AutoComplete, Spin, Skeleton } from 'antd';
import { SearchOutlined, AimOutlined } from '@ant-design/icons';

interface SearchPanelProps {
    currentAddress: string;
    addressDetails: any;
    searchQuery: string;
    options: { value: string; label: React.ReactNode }[];
    isSearching: boolean;
    formatDistance: (distance: number) => string;
    handleSearchChange: (value: string) => void;
    handleSearchComplete: (value: string) => void;
    handleSelectPlace: (value: string, option: any) => void;
    getCurrentLocation: () => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({
    currentAddress,
    addressDetails,
    searchQuery,
    options,
    isSearching,
    formatDistance,
    handleSearchChange,
    handleSearchComplete,
    handleSelectPlace,
    getCurrentLocation
}) => {
    // Tạo nội dung loading với Skeleton
    const loadingContent = (
        <div className="py-2 px-1">
            <div className="flex items-center mb-2">
                <Skeleton.Avatar active size="small" className="mr-2" />
                <Skeleton.Input active size="small" style={{ width: '60%' }} />
            </div>
            <div className="ml-8">
                <Skeleton.Input active size="small" style={{ width: '80%' }} />
            </div>
            <div className="flex items-center mt-2">
                <Skeleton.Avatar active size="small" className="mr-2" />
                <Skeleton.Input active size="small" style={{ width: '60%' }} />
            </div>
            <div className="ml-8">
                <Skeleton.Input active size="small" style={{ width: '80%' }} />
            </div>
        </div>
    );

    return (
        <Space direction="vertical" className="w-full">
            <div>
                <div className="text-sm text-gray-600 mb-1">Địa chỉ hiện tại:</div>
                <div className="text-sm break-words font-medium">{currentAddress}</div>

                {addressDetails && (
                    <div className="mt-2">
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                            {addressDetails.name && (
                                <>
                                    <div className="text-gray-600">Số nhà/Tên:</div>
                                    <div>{addressDetails.name}</div>
                                </>
                            )}

                            {addressDetails.boundaries && addressDetails.boundaries.map((boundary: any, index: number) => (
                                <React.Fragment key={index}>
                                    <div className="text-gray-600">{boundary.prefix}:</div>
                                    <div>{boundary.name}</div>
                                </React.Fragment>
                            ))}

                            {addressDetails.distance && (
                                <>
                                    <div className="text-gray-600">Khoảng cách:</div>
                                    <div>{formatDistance(addressDetails.distance)}</div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="relative w-full">
                <AutoComplete
                    className="w-full"
                    options={options}
                    onSelect={handleSelectPlace}
                    onSearch={handleSearchChange}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleSearchComplete(searchQuery);
                        }
                    }}
                    value={searchQuery}
                    placeholder="Tìm kiếm địa điểm"
                    notFoundContent={isSearching ? loadingContent : (searchQuery.length >= 2 ? "Không tìm thấy kết quả" : null)}
                    dropdownMatchSelectWidth={true}
                />
                {searchQuery.length >= 2 && !isSearching && (
                    <Button
                        type="text"
                        size="small"
                        icon={<SearchOutlined />}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10"
                        onClick={() => handleSearchComplete(searchQuery)}
                    />
                )}
                {isSearching && (
                    <Spin
                        size="small"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10"
                    />
                )}
            </div>

            <Button
                type="default"
                icon={<AimOutlined />}
                onClick={getCurrentLocation}
                className="w-full"
            >
                Vị trí hiện tại
            </Button>
        </Space>
    );
};

export default SearchPanel; 