import React from 'react';
import { Calendar, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { VehicleServiceStatusEnum, getVehicleServiceStatusConfig } from '@/constants/enums/VehicleServiceStatusEnum';

interface VehicleServiceStatusBadgeProps {
  status: VehicleServiceStatusEnum;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const iconMap = {
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
};

export const VehicleServiceStatusBadge: React.FC<VehicleServiceStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const config = getVehicleServiceStatusConfig(status);
  const Icon = iconMap[config.icon as keyof typeof iconMap];

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${sizeClasses[size]}
        ${className}
      `}
      style={{
        color: config.color,
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
      }}
    >
      {showIcon && Icon && <Icon size={iconSizes[size]} />}
      <span>{config.label}</span>
    </div>
  );
};

export default VehicleServiceStatusBadge;
