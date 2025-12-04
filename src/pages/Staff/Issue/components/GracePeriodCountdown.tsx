import React, { useState, useEffect } from 'react';
import {
    Card,
    Typography,
    Space,
    Tag,
    Progress,
    Alert
} from 'antd';
import {
    ClockCircleOutlined,
    WarningOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import type { OffRouteEvent } from '@/models/OffRouteEvent';

const { Text, Title } = Typography;

interface GracePeriodCountdownProps {
    offRouteEvent: OffRouteEvent | null;
    onExpired?: () => void;
}

const GracePeriodCountdown: React.FC<GracePeriodCountdownProps> = ({
    offRouteEvent,
    onExpired
}) => {
    const [timeRemaining, setTimeRemaining] = useState<string>('--');
    const [progressPercent, setProgressPercent] = useState<number>(0);
    const [isExpired, setIsExpired] = useState<boolean>(false);

    useEffect(() => {
        if (!offRouteEvent?.gracePeriodExpiresAt) {
            setTimeRemaining('Không có thông tin');
            setProgressPercent(0);
            return;
        }

        const calculateTimeRemaining = () => {
            const now = new Date();
            const contactedAt = offRouteEvent.contactedAt ? new Date(offRouteEvent.contactedAt) : new Date(offRouteEvent.gracePeriodExpiresAt!);
            const expiry = offRouteEvent.gracePeriodExpiresAt ? new Date(offRouteEvent.gracePeriodExpiresAt) : new Date();
            
            const totalGraceMs = expiry.getTime() - contactedAt.getTime();
            const elapsedMs = now.getTime() - contactedAt.getTime();
            const remainingMs = expiry.getTime() - now.getTime();

            if (remainingMs <= 0) {
                setTimeRemaining('Đã hết hạn');
                setProgressPercent(100);
                setIsExpired(true);
                if (onExpired) onExpired();
                return;
            }

            setIsExpired(false);
            
            const totalMinutes = Math.floor(totalGraceMs / (1000 * 60));
            const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
            const remainingMinutes = Math.floor(remainingMs / (1000 * 60));
            const remainingSeconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

            let timeString = '';
            if (remainingMinutes >= 60) {
                const hours = Math.floor(remainingMinutes / 60);
                const minutes = remainingMinutes % 60;
                timeString = `${hours} giờ ${minutes} phút`;
            } else {
                timeString = `${remainingMinutes} phút ${remainingSeconds} giây`;
            }

            setTimeRemaining(timeString);
            
            const progress = Math.min(100, Math.max(0, (elapsedMinutes / totalMinutes) * 100));
            setProgressPercent(progress);
        };

        calculateTimeRemaining();
        const interval = setInterval(calculateTimeRemaining, 1000);

        return () => clearInterval(interval);
    }, [offRouteEvent, onExpired]);

    const getProgressColor = () => {
        if (isExpired) return '#ff4d4f';
        if (progressPercent > 80) return '#fa8c16';
        if (progressPercent > 60) return '#fadb14';
        return '#52c41a';
    };

    const getStatusColor = () => {
        if (isExpired) return 'red';
        if (progressPercent > 80) return 'orange';
        if (progressPercent > 60) return 'gold';
        return 'green';
    };

    const getStatusText = () => {
        if (isExpired) return 'Hết hạn';
        if (progressPercent > 80) return 'Sắp hết hạn';
        if (progressPercent > 60) return 'Cần chú ý';
        return 'Đang chờ';
    };

    if (!offRouteEvent) {
        return null;
    }

    if (offRouteEvent.warningStatus !== 'CONTACTED_WAITING_RETURN') {
        return null;
    }

    return (
        <Card
            size="small"
            style={{
                background: isExpired ? '#fff2f0' : '#f6ffed',
                border: `1px solid ${isExpired ? '#ffccc7' : '#b7eb8f'}`
            }}
        >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                        <ClockCircleOutlined style={{ color: getProgressColor() }} />
                        <Title level={5} style={{ margin: 0 }}>
                            Thời gian chờ tài xế về tuyến
                        </Title>
                    </Space>
                    <Tag color={getStatusColor()}>
                        {getStatusText()}
                    </Tag>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: '16px', color: getProgressColor() }}>
                        {timeRemaining}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        Đã gia hạn: {offRouteEvent.gracePeriodExtensionCount} lần
                    </Text>
                </div>

                <Progress
                    percent={Math.round(progressPercent)}
                    strokeColor={getProgressColor()}
                    showInfo={false}
                    size="small"
                />

                {isExpired && (
                    <Alert
                        message="Thời gian chờ đã hết hạn"
                        description="Tài xế không về tuyến trong thời gian quy định. Vui lòng tạo sự cố hoặc liên hệ lại."
                        type="error"
                        showIcon
                    />
                )}

                {progressPercent > 80 && !isExpired && (
                    <Alert
                        message="Sắp hết hạn chờ"
                        description="Thời gian chờ sắp hết, hãy chuẩn bị các phương án xử lý tiếp theo."
                        type="warning"
                        showIcon
                    />
                )}
            </Space>
        </Card>
    );
};

export default GracePeriodCountdown;
