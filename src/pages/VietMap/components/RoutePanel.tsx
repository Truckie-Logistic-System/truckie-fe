import React from 'react';
import { Space, Button, AutoComplete, Spin, Select, List, Tooltip, Skeleton } from 'antd';
import { AimOutlined, SwapOutlined, CarOutlined, PlayCircleOutlined, CloseCircleOutlined, RocketOutlined } from '@ant-design/icons';

// Định nghĩa kiểu dữ liệu cho RouteResponse để tương thích với code cũ
interface RouteResponse {
    paths: Array<{
        distance: number;
        time: number;
        points: string;
        bbox: number[];
        instructions: RouteInstruction[];
    }>;
}

// Định nghĩa kiểu dữ liệu cho RouteInstruction
interface RouteInstruction {
    distance: number;
    heading: number;
    sign: number;
    interval: number[];
    text: string;
    time: number;
    street_name: string;
    last_heading: number | null;
}

interface RoutePanelProps {
    selectedVehicle: 'car' | 'bike' | 'foot' | 'motorcycle';
    startPoint: { lat: number; lng: number; address: string } | null;
    endPoint: { lat: number; lng: number; address: string } | null;
    startSearchQuery: string;
    endSearchQuery: string;
    startOptions: { value: string; label: React.ReactNode }[];
    endOptions: { value: string; label: React.ReactNode }[];
    isStartSearching: boolean;
    isEndSearching: boolean;
    isRouteFinding: boolean;
    routeResult: RouteResponse | null;
    simulationSpeed: number;
    isNavigating: boolean;
    formatDistance: (distance: number) => string;
    formatTime: (milliseconds: number) => string;
    getVehicleIcon: () => React.ReactNode;
    handleStartSearchChange: (value: string) => void;
    handleEndSearchChange: (value: string) => void;
    handleSelectStartPlace: (value: string, option: any) => void;
    handleSelectEndPlace: (value: string, option: any) => void;
    useCurrentLocationAsStart: () => void;
    swapStartAndEndPoints: () => void;
    findRouteBetweenPoints: () => void;
    startNavigation: () => void;
    startSimulation: () => void;
    changeSimulationSpeed: (speed: number) => void;
    clearRoute: () => void;
    onVehicleChange: (vehicle: 'car' | 'bike' | 'foot' | 'motorcycle') => void;
}

const RoutePanel: React.FC<RoutePanelProps> = ({
    selectedVehicle,
    startPoint,
    endPoint,
    startSearchQuery,
    endSearchQuery,
    startOptions,
    endOptions,
    isStartSearching,
    isEndSearching,
    isRouteFinding,
    routeResult,
    simulationSpeed,
    isNavigating,
    formatDistance,
    formatTime,
    getVehicleIcon,
    handleStartSearchChange,
    handleEndSearchChange,
    handleSelectStartPlace,
    handleSelectEndPlace,
    useCurrentLocationAsStart,
    swapStartAndEndPoints,
    findRouteBetweenPoints,
    startNavigation,
    startSimulation,
    changeSimulationSpeed,
    clearRoute,
    onVehicleChange
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
            {/* Vehicle selection */}
            <div className="mb-2">
                <Select
                    value={selectedVehicle}
                    onChange={onVehicleChange}
                    className="w-full"
                    options={[
                        { value: 'car', label: 'Ô tô' },
                        { value: 'motorcycle', label: 'Xe máy' },
                        { value: 'bike', label: 'Xe đạp' },
                        { value: 'foot', label: 'Đi bộ' }
                    ]}
                />
            </div>

            {/* Start point */}
            <div className="relative w-full">
                <div className="flex items-center mb-1">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white mr-2">
                        A
                    </div>
                    <div className="text-sm font-medium">Điểm xuất phát</div>
                </div>
                <div className="flex">
                    <AutoComplete
                        className="flex-1"
                        options={startOptions}
                        onSelect={handleSelectStartPlace}
                        onSearch={handleStartSearchChange}
                        value={startSearchQuery}
                        placeholder="Chọn điểm xuất phát"
                        notFoundContent={isStartSearching ? loadingContent : (startSearchQuery.length >= 2 ? "Không tìm thấy kết quả" : null)}
                        dropdownMatchSelectWidth={true}
                    />
                    <Tooltip title="Dùng vị trí hiện tại">
                        <Button
                            type="text"
                            icon={<AimOutlined />}
                            onClick={useCurrentLocationAsStart}
                        />
                    </Tooltip>
                </div>
            </div>

            {/* Swap button */}
            <div className="flex justify-center my-1">
                <Button
                    type="text"
                    icon={<SwapOutlined />}
                    onClick={swapStartAndEndPoints}
                    disabled={!startPoint || !endPoint}
                />
            </div>

            {/* End point */}
            <div className="relative w-full">
                <div className="flex items-center mb-1">
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white mr-2">
                        B
                    </div>
                    <div className="text-sm font-medium">Điểm đến</div>
                </div>
                <AutoComplete
                    className="w-full"
                    options={endOptions}
                    onSelect={handleSelectEndPlace}
                    onSearch={handleEndSearchChange}
                    value={endSearchQuery}
                    placeholder="Chọn điểm đến"
                    notFoundContent={isEndSearching ? loadingContent : (endSearchQuery.length >= 2 ? "Không tìm thấy kết quả" : null)}
                    dropdownMatchSelectWidth={true}
                />
            </div>

            {/* Find route button */}
            <Button
                type="primary"
                icon={getVehicleIcon()}
                onClick={findRouteBetweenPoints}
                loading={isRouteFinding}
                disabled={!startPoint || !endPoint}
                className="w-full mt-2"
            >
                Tìm đường
            </Button>

            {/* Navigation buttons */}
            {routeResult && routeResult.paths && routeResult.paths.length > 0 && (
                <div className="w-full">
                    {/* Real navigation button */}
                    <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={startNavigation}
                        className="w-full mt-2 bg-green-600 hover:bg-green-700"
                        disabled={isNavigating}
                    >
                        Bắt đầu dẫn đường
                    </Button>

                    {/* Simulation section */}
                    <div className="mt-2 p-2 border border-dashed border-gray-300 rounded-md">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-sm font-medium">Chế độ mô phỏng</div>
                            <Tooltip title="Mô phỏng xe chạy theo đường đã tìm">
                                <Button type="text" size="small" icon={<RocketOutlined />} />
                            </Tooltip>
                        </div>

                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm">Tốc độ mô phỏng:</span>
                            <Select
                                value={simulationSpeed}
                                onChange={changeSimulationSpeed}
                                options={[
                                    { value: 1, label: '1x' },
                                    { value: 2, label: '2x' },
                                    { value: 5, label: '5x' },
                                    { value: 10, label: '10x' }
                                ]}
                                style={{ width: 80 }}
                                size="small"
                            />
                        </div>

                        <Button
                            type="primary"
                            icon={<CarOutlined />}
                            onClick={startSimulation}
                            className="w-full bg-blue-500 hover:bg-blue-600"
                            disabled={isNavigating}
                        >
                            Bắt đầu mô phỏng
                        </Button>
                    </div>
                </div>
            )}

            {/* Route results */}
            {routeResult && routeResult.paths && routeResult.paths.length > 0 && (
                <div className="mt-4 border-t pt-2">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-base font-medium">Kết quả tìm đường</div>
                        <Button
                            type="text"
                            icon={<CloseCircleOutlined />}
                            size="small"
                            onClick={clearRoute}
                        />
                    </div>

                    <div className="bg-blue-50 p-3 rounded-md mb-3">
                        <div className="flex justify-between mb-1">
                            <div className="text-gray-600">Tổng quãng đường:</div>
                            <div className="font-medium">{formatDistance(routeResult.paths[0].distance / 1000)}</div>
                        </div>
                        <div className="flex justify-between">
                            <div className="text-gray-600">Thời gian ước tính:</div>
                            <div className="font-medium">{formatTime(routeResult.paths[0].time)}</div>
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                        <List
                            size="small"
                            dataSource={routeResult.paths[0].instructions}
                            renderItem={(instruction: RouteInstruction, index) => (
                                <List.Item className="py-1 px-0">
                                    <div className="w-full">
                                        <div className="flex">
                                            <div className="mr-2 text-gray-500">{index + 1}.</div>
                                            <div className="flex-1">{instruction.text}</div>
                                        </div>
                                        {instruction.distance > 0 && (
                                            <div className="text-xs text-gray-500 ml-5">
                                                {formatDistance(instruction.distance / 1000)}
                                            </div>
                                        )}
                                    </div>
                                </List.Item>
                            )}
                        />
                    </div>
                </div>
            )}
        </Space>
    );
};

export default RoutePanel; 