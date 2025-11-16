import React from 'react';
import { Card, Progress, Tag, Tooltip, Alert } from 'antd';
import { InfoCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { 
    calculateOrderStatusBreakdown, 
    hasMixedStatuses, 
    getStatusWarning 
} from '@/utils/orderStatusBreakdown';
import { getOrderStatusLabel } from '@/utils/statusHelpers';

interface OrderStatusBreakdownProps {
    orderDetails: Array<{ status: string }>;
    currentOrderStatus: string;
    showExplanation?: boolean;
    showWarning?: boolean;
    compact?: boolean; // Compact mode for smaller display
}

/**
 * Component hiển thị breakdown chi tiết của order status
 * Giải thích tại sao order có status hiện tại dựa trên trạng thái các kiện hàng
 */
const OrderStatusBreakdown: React.FC<OrderStatusBreakdownProps> = ({
    orderDetails,
    currentOrderStatus,
    showExplanation = true,
    showWarning = true,
    compact = false
}) => {
    const breakdown = calculateOrderStatusBreakdown(orderDetails, currentOrderStatus);
    const warning = showWarning ? getStatusWarning(orderDetails) : null;
    const isMixed = hasMixedStatuses(orderDetails);

    if (breakdown.items.length === 0) {
        return null;
    }

    // Compact mode: chỉ hiển thị tags và tooltip
    if (compact) {
        return (
            <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-gray-600">Kiện hàng:</span>
                {breakdown.items.map((item) => (
                    <Tooltip 
                        key={item.status} 
                        title={`${item.count} kiện (${item.percentage}%)`}
                    >
                        <Tag className={item.color}>
                            {item.label}: {item.count}
                        </Tag>
                    </Tooltip>
                ))}
                {isMixed && (
                    <Tooltip title={breakdown.explanation}>
                        <InfoCircleOutlined className="text-blue-500 cursor-help" />
                    </Tooltip>
                )}
            </div>
        );
    }

    // Full mode: Card với breakdown đầy đủ
    return (
        <Card 
            title={
                <div className="flex items-center gap-2">
                    <InfoCircleOutlined className="text-blue-500" />
                    <span>Chi tiết trạng thái kiện hàng</span>
                    <Tag color="blue">{breakdown.total} kiện</Tag>
                </div>
            }
            size="small"
            className="shadow-sm"
        >
            {/* Warning nếu có */}
            {warning && (
                <Alert
                    message={warning}
                    type={warning.includes('⚠️') ? 'warning' : 'info'}
                    showIcon
                    icon={<ExclamationCircleOutlined />}
                    className="mb-4"
                />
            )}

            {/* Breakdown items */}
            <div className="space-y-3">
                {breakdown.items.map((item) => (
                    <div key={item.status} className="space-y-1">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Tag className={item.color}>
                                    {item.label}
                                </Tag>
                                <span className="text-sm text-gray-600">
                                    {item.count} kiện
                                </span>
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                                {item.percentage}%
                            </span>
                        </div>
                        <Progress 
                            percent={item.percentage} 
                            showInfo={false}
                            strokeColor={
                                item.status === 'SUCCESSFUL' || item.status === 'DELIVERED' ? '#52c41a' :
                                item.status === 'IN_TROUBLES' ? '#faad14' :
                                item.status === 'COMPENSATION' ? '#722ed1' :
                                item.status === 'RETURNED' || item.status === 'RETURNING' ? '#fa8c16' :
                                item.status === 'CANCELLED' ? '#ff4d4f' :
                                '#1890ff'
                            }
                            size="small"
                        />
                    </div>
                ))}
            </div>

            {/* Explanation */}
            {showExplanation && breakdown.explanation && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-start gap-2">
                        <CheckCircleOutlined className="text-blue-500 mt-1" />
                        <div className="flex-1">
                            <div className="text-sm font-medium text-gray-700 mb-1">
                                Trạng thái đơn hàng: {getOrderStatusLabel(currentOrderStatus)}
                            </div>
                            <div className="text-sm text-gray-600">
                                {breakdown.explanation}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Priority Logic Explanation (for mixed statuses) */}
            {isMixed && showExplanation && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-2">
                        <InfoCircleOutlined className="text-blue-500 mt-0.5" />
                        <div className="text-xs text-gray-600">
                            <span className="font-medium">Lưu ý:</span> Trạng thái đơn hàng được xác định theo thứ tự ưu tiên: 
                            Giao thành công &gt; Có vấn đề &gt; Đã đền bù &gt; Hoàn trả
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default OrderStatusBreakdown;
