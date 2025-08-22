import React from 'react';
import { Button, Select } from 'antd';
import { ArrowUpOutlined, PauseCircleOutlined, PlayCircleOutlined, StopOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import type { DirectionResponse } from '../../../services/openmap.service';

interface NavigationPanelProps {
    isNavigationPanelCollapsed: boolean;
    isSimulating: boolean;
    routeResult: DirectionResponse | null;
    currentInstructionIndex: number;
    nextTurnDistance: number;
    remainingDistance: number;
    remainingTime: number;
    simulationSpeed: number;
    formatDistance: (distance: string) => string;
    formatTime: (duration: string) => string;
    toggleNavigationPanel: () => void;
    stopNavigation: () => void;
    pauseNavigation: () => void;
    resumeNavigation: () => void;
    changeSimulationSpeed: (speed: number) => void;
}

const NavigationPanel: React.FC<NavigationPanelProps> = ({
    isNavigationPanelCollapsed,
    isSimulating,
    routeResult,
    currentInstructionIndex,
    nextTurnDistance,
    remainingDistance,
    remainingTime,
    simulationSpeed,
    formatDistance,
    formatTime,
    toggleNavigationPanel,
    stopNavigation,
    pauseNavigation,
    resumeNavigation,
    changeSimulationSpeed
}) => {
    return (
        <div
            className={`bg-white rounded-t-xl shadow-lg mx-auto max-w-2xl transition-all duration-300 ${isNavigationPanelCollapsed ? 'max-h-16' : 'max-h-96'}`}
            style={{
                boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
                width: '95%'
            }}
        >
            {/* Collapse/Expand handle */}
            <div
                className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-6 bg-white rounded-t-full flex items-center justify-center cursor-pointer shadow-md"
                onClick={toggleNavigationPanel}
            >
                {isNavigationPanelCollapsed ? <UpOutlined /> : <DownOutlined />}
            </div>

            {/* Header with title */}
            <div className="flex justify-between items-center px-4 py-3 border-b">
                <div className="font-medium">
                    {isSimulating ? "Mô phỏng dẫn đường" : "Dẫn đường"}
                </div>
                <Button
                    type="text"
                    size="small"
                    icon={<StopOutlined />}
                    onClick={stopNavigation}
                    danger
                />
            </div>

            {/* Content - only shown when expanded */}
            {!isNavigationPanelCollapsed && routeResult && routeResult.routes && routeResult.routes.length > 0 && (
                <div className="p-4">
                    {/* Current instruction */}
                    <div className="mb-4">
                        <div className="flex items-center mb-2">
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                                <ArrowUpOutlined style={{ fontSize: '20px' }} />
                            </div>
                            <div className="flex-1">
                                <div className="text-lg font-medium" dangerouslySetInnerHTML={{
                                    __html: routeResult.routes[0].legs[0].steps[currentInstructionIndex]?.html_instructions || 'Đang dẫn đường...'
                                }} />
                                <div className="text-sm text-gray-500">
                                    {nextTurnDistance > 0 && `${nextTurnDistance} m`}
                                </div>
                            </div>
                        </div>

                        {/* Next instruction preview */}
                        {currentInstructionIndex < routeResult.routes[0].legs[0].steps.length - 1 && (
                            <div className="flex items-center ml-13 pl-10">
                                <div className="text-sm text-gray-500">
                                    Tiếp theo: <span dangerouslySetInnerHTML={{
                                        __html: routeResult.routes[0].legs[0].steps[currentInstructionIndex + 1]?.html_instructions
                                    }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation info */}
                    <div className="flex justify-between mb-4">
                        <div className="text-center">
                            <div className="text-sm text-gray-500">Còn lại</div>
                            <div className="text-lg font-medium">{remainingDistance > 0 ? `${remainingDistance} m` : '0 m'}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm text-gray-500">Thời gian</div>
                            <div className="text-lg font-medium">{formatTime(remainingTime.toString())}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm text-gray-500">Đến nơi</div>
                            <div className="text-lg font-medium">
                                {new Date(Date.now() + remainingTime * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>

                    {/* Navigation controls */}
                    <div className="flex justify-between">
                        <Button
                            type="default"
                            icon={<StopOutlined />}
                            onClick={stopNavigation}
                            danger
                        >
                            Kết thúc
                        </Button>

                        {isSimulating && (
                            <div className="flex items-center">
                                <span className="text-xs mr-2">Tốc độ:</span>
                                <Select
                                    value={simulationSpeed}
                                    onChange={changeSimulationSpeed}
                                    options={[
                                        { value: 1, label: '1x' },
                                        { value: 2, label: '2x' },
                                        { value: 5, label: '5x' },
                                        { value: 10, label: '10x' }
                                    ]}
                                    style={{ width: 70 }}
                                    size="small"
                                />
                            </div>
                        )}

                        {!isSimulating ? (
                            <Button
                                type="primary"
                                icon={<PauseCircleOutlined />}
                                onClick={pauseNavigation}
                            >
                                Tạm dừng
                            </Button>
                        ) : (
                            <Button
                                type="primary"
                                icon={<PlayCircleOutlined />}
                                onClick={resumeNavigation}
                            >
                                Tiếp tục
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Minimal view when collapsed */}
            {isNavigationPanelCollapsed && routeResult && routeResult.routes && routeResult.routes.length > 0 && (
                <div className="flex justify-between items-center px-4">
                    <div className="font-medium" dangerouslySetInnerHTML={{
                        __html: routeResult.routes[0].legs[0].steps[currentInstructionIndex]?.html_instructions || 'Đang dẫn đường...'
                    }} />
                    <div className="text-blue-500 font-medium">
                        {remainingDistance > 0 ? `${remainingDistance} m` : '0 m'}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NavigationPanel; 