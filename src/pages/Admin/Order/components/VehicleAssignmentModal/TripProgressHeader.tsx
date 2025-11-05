import React from "react";
import { Progress } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";

interface TripProgressHeaderProps {
    currentTripIndex: number;
    totalTrips: number;
    completedTrips: number;
    itemCount: number;
}

export const TripProgressHeader: React.FC<TripProgressHeaderProps> = ({
    currentTripIndex,
    totalTrips,
    completedTrips,
    itemCount
}) => {
    const progressPercent = Math.round((completedTrips / totalTrips) * 100);

    return (
        <div className="mb-6 bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-lg text-white shadow-md">
            <div className="space-y-4">
                {/* Header Info */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold mb-1">
                            Chuyến #{currentTripIndex + 1} / {totalTrips}
                        </h3>
                        <p className="text-blue-100 text-sm">
                            {itemCount} kiện hàng cần vận chuyển
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold">
                            {completedTrips}/{totalTrips}
                        </div>
                        <div className="text-blue-100 text-sm">Hoàn thành</div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Tiến độ</span>
                        <span className="text-sm font-semibold">{progressPercent}%</span>
                    </div>
                    <Progress
                        percent={progressPercent}
                        strokeColor={{
                            '0%': '#60a5fa',
                            '100%': '#3b82f6',
                        }}
                        status={progressPercent === 100 ? 'success' : 'active'}
                        showInfo={false}
                        className="[&_.ant-progress-bg]:bg-blue-300"
                    />
                </div>

                {/* Completed Trips */}
                {completedTrips > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                        <CheckCircleOutlined className="text-green-300" />
                        <span>
                            {completedTrips} chuyến đã hoàn thành
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
