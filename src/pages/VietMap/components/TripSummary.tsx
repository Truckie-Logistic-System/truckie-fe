import React from 'react';
import { Alert, Button, Row, Col, Statistic } from 'antd';
import { CheckCircleOutlined, ReloadOutlined, PlayCircleOutlined } from '@ant-design/icons';

interface TripSummaryProps {
    totalDistance: number;
    totalTime: number;
    averageSpeed: number;
    formatDistance: (distance: number) => string;
    formatTime: (milliseconds: number) => string;
    resetTrip: () => void;
    startSameRouteAgain: () => void;
}

const TripSummary: React.FC<TripSummaryProps> = ({
    totalDistance,
    totalTime,
    averageSpeed,
    formatDistance,
    formatTime,
    resetTrip,
    startSameRouteAgain
}) => {
    return (
        <Alert
            message="Hành trình đã hoàn thành"
            description={
                <div>
                    <Row gutter={[16, 16]} className="mt-3">
                        <Col span={8}>
                            <Statistic
                                title="Quãng đường"
                                value={totalDistance}
                                precision={2}
                                suffix="km"
                                valueStyle={{ fontSize: '16px' }}
                            />
                        </Col>
                        <Col span={8}>
                            <Statistic
                                title="Thời gian"
                                value={formatTime(totalTime)}
                                valueStyle={{ fontSize: '16px' }}
                            />
                        </Col>
                        <Col span={8}>
                            <Statistic
                                title="Tốc độ TB"
                                value={averageSpeed}
                                precision={1}
                                suffix="km/h"
                                valueStyle={{ fontSize: '16px' }}
                            />
                        </Col>
                    </Row>
                    <div className="flex justify-between mt-3">
                        <Button
                            type="default"
                            icon={<ReloadOutlined />}
                            onClick={resetTrip}
                        >
                            Tìm đường mới
                        </Button>
                        <Button
                            type="primary"
                            icon={<PlayCircleOutlined />}
                            onClick={startSameRouteAgain}
                        >
                            Đi lại lộ trình này
                        </Button>
                    </div>
                </div>
            }
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
        />
    );
};

export default TripSummary; 