import React from 'react';
import { getOrderDetailStatusLabel, getOrderDetailStatusCardColor } from '@/utils/statusHelpers';

interface OrderDetailStatusCardProps {
  status: string;
  className?: string;
}

/**
 * Component hiển thị Order Detail Status dưới dạng card với màu sắc
 * Tương tự như Order Status Card nhưng cho Order Detail Status
 */
export const OrderDetailStatusCard: React.FC<OrderDetailStatusCardProps> = ({
  status,
  className = '',
}) => {
  const cardColor = getOrderDetailStatusCardColor(status);
  const label = getOrderDetailStatusLabel(status);

  return (
    <div
      className={`px-3 py-1.5 rounded-md text-sm font-medium inline-block ${className}`}
      style={{
        backgroundColor: cardColor.backgroundColor,
        borderColor: cardColor.borderColor,
        border: `1px solid ${cardColor.borderColor}`,
        color: getTextColorForBackground(cardColor.backgroundColor),
      }}
    >
      {label}
    </div>
  );
};

/**
 * Helper function để lấy màu text phù hợp với background
 */
function getTextColorForBackground(bgColor: string): string {
  const colorMap: Record<string, string> = {
    '#f3f4f6': '#374151', // gray
    '#f3e8ff': '#7c3aed', // purple
    '#dbeafe': '#0369a1', // blue
    '#dcfce7': '#166534', // green
    '#fee2e2': '#991b1b', // red
    '#ffedd5': '#92400e', // orange
  };
  return colorMap[bgColor] || '#374151';
}

export default OrderDetailStatusCard;