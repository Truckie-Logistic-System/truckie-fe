import React from 'react';
import { Button, Select } from 'antd';
import { CloseCircleOutlined, CompassOutlined, PlayCircleOutlined, PauseCircleOutlined, CarOutlined } from '@ant-design/icons';

// Hàm định dạng khoảng cách
const formatDistanceDisplay = (distanceStr: string): string => {
    // Nếu đã là chuỗi có đơn vị, trả về nguyên bản
    if (distanceStr.includes('km') || distanceStr.includes('m')) {
        return distanceStr;
    }

    // Nếu là số (mét), định dạng lại
    const distance = parseFloat(distanceStr);
    if (isNaN(distance)) return distanceStr;

    if (distance >= 1000) {
        return `${(distance / 1000).toFixed(1)} km`;
    }
    return `${Math.round(distance)} m`;
};

interface NavigationPanelProps {
    isNavigating: boolean;
    isSimulating: boolean;
    remainingDistance: string;
    remainingTime: string;
    currentInstructionIndex: number;
    routeInfo: any;
    onClose: () => void;
    progress: number;
    simulationSpeed: number;
    onChangeSpeed: (speed: number) => void;
    isPaused: boolean;
    onTogglePause: () => void;
    currentSpeed?: number; // Tốc độ hiện tại (km/h)
}

// Hàm tính thời gian đến nơi
const getArrivalTime = (remainingTimeStr: string): string => {
    // Phân tích thời gian còn lại
    const now = new Date();
    let seconds = 0;

    if (remainingTimeStr.includes('phút')) {
        const match = remainingTimeStr.match(/(\d+)\s*phút/);
        if (match) {
            seconds += parseInt(match[1]) * 60;
        }
    }

    if (remainingTimeStr.includes('giờ')) {
        const match = remainingTimeStr.match(/(\d+)\s*giờ/);
        if (match) {
            seconds += parseInt(match[1]) * 3600;
        }
    }

    if (remainingTimeStr.includes('giây')) {
        const match = remainingTimeStr.match(/(\d+)\s*giây/);
        if (match) {
            seconds += parseInt(match[1]);
        }
    }

    // Tính thời gian đến
    // Làm tròn số giây lên phút gần nhất để tránh thay đổi liên tục
    const roundedSeconds = Math.round(seconds / 60) * 60;
    const arrivalTime = new Date(now.getTime() + roundedSeconds * 1000);

    // Format thời gian đến
    const hours = arrivalTime.getHours();
    const mins = arrivalTime.getMinutes();

    return `${hours < 10 ? '0' + hours : hours}:${mins < 10 ? '0' + mins : mins}`;
};

const NavigationPanel: React.FC<NavigationPanelProps> = ({
    isNavigating,
    isSimulating,
    remainingDistance,
    remainingTime,
    currentInstructionIndex,
    routeInfo,
    onClose,
    progress,
    simulationSpeed,
    onChangeSpeed,
    isPaused,
    onTogglePause,
    currentSpeed = 0 // Giá trị mặc định là 0
}) => {
    if (!routeInfo) return null;

    // Đảm bảo routeInfo.steps tồn tại và có phần tử
    const steps = routeInfo.steps || [];
    if (steps.length === 0) return null;

    // Đảm bảo currentInstructionIndex hợp lệ
    const safeIndex = Math.min(Math.max(0, currentInstructionIndex), steps.length - 1);
    const currentInstruction = steps[safeIndex];
    const mode = isSimulating ? "Mô phỏng dẫn đường" : "Đang dẫn đường";

    return (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white shadow-lg">
            {/* Phần tiêu đề */}
            <div className="flex justify-between items-center px-4 py-2 border-b">
                <div className="text-lg font-bold">{mode}</div>
                <div className="flex items-center gap-2">
                    {isSimulating && (
                        <Select
                            value={`${simulationSpeed}`}
                            style={{ width: 80 }}
                            onChange={(value) => onChangeSpeed(parseInt(value))}
                            options={[
                                { value: '1', label: '1x' },
                                { value: '2', label: '2x' },
                                { value: '4', label: '4x' }
                            ]}
                        />
                    )}
                    <Button
                        type="text"
                        danger
                        icon={<CloseCircleOutlined />}
                        onClick={onClose}
                    >
                        Kết thúc
                    </Button>
                </div>
            </div>

            {/* Phần thông tin hướng dẫn hiện tại */}
            <div className="p-4">
                {/* Thông tin hướng dẫn chính */}
                <div className="flex items-center mb-4">
                    <div className="bg-blue-500 text-white rounded-full p-3 mr-4 flex items-center justify-center">
                        <CompassOutlined style={{ fontSize: '24px' }} />
                    </div>
                    <div className="flex-1">
                        <div className="text-lg font-medium">{currentInstruction?.instruction || 'Đi thẳng'}</div>
                        <div className="text-sm text-gray-500">{formatDistanceDisplay(currentInstruction?.distance || '0m')}</div>
                    </div>
                </div>

                {/* Thông tin thời gian và khoảng cách */}
                <div className="flex justify-between mb-4 bg-gray-50 p-3 rounded-lg">
                    <div className="text-center">
                        <div className="text-gray-500 text-sm">Còn lại</div>
                        <div className="text-xl font-bold">{formatDistanceDisplay(remainingDistance)}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-gray-500 text-sm">Thời gian</div>
                        <div className="text-xl font-bold">{remainingTime}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-gray-500 text-sm">Đến nơi</div>
                        <div className="text-xl font-bold">{getArrivalTime(remainingTime)}</div>
                    </div>
                </div>

                {/* Thông tin tốc độ */}
                <div className="flex justify-center mb-4 bg-blue-50 p-2 rounded-lg">
                    <div className="text-center">
                        <div className="text-gray-500 text-sm">Tốc độ hiện tại</div>
                        <div className="text-xl font-bold text-blue-600">
                            {currentSpeed !== undefined ? `${currentSpeed.toFixed(1)} km/h` : '-'}
                        </div>
                    </div>
                </div>

                {/* Thanh tiến trình mô phỏng */}
                {isSimulating && (
                    <div className="mb-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                            <div
                                className="bg-blue-600 h-2.5 rounded-full"
                                style={{ width: `${progress * 100}%` }}
                            ></div>
                        </div>
                        <div className="text-xs text-gray-500 text-right">
                            {Math.round(progress * 100)}%
                        </div>
                    </div>
                )}

                {/* Nút điều khiển */}
                <div className="flex gap-2">
                    <Button
                        type="primary"
                        block
                        icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                        onClick={onTogglePause}
                    >
                        {isPaused ? "Tiếp tục" : "Tạm dừng"}
                    </Button>

                    {isSimulating && !isPaused && (
                        <Button
                            type="default"
                            block
                            icon={<CarOutlined />}
                            onClick={() => onChangeSpeed(simulationSpeed === 1 ? 2 : (simulationSpeed === 2 ? 4 : 1))}
                        >
                            Tăng tốc ({simulationSpeed}x)
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NavigationPanel; 