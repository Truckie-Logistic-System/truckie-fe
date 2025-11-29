import React from 'react';
import { Table, Tag, Descriptions, Space } from 'antd';
import { 
  InboxOutlined, 
  BarChartOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

interface PackageListProps {
  packageIds: string[];
  metadata?: Record<string, any>;
  title?: string;
}

const PackageList: React.FC<PackageListProps> = ({ 
  packageIds, 
  metadata = {},
  title = 'Thông tin kiện hàng'
}) => {
  if (!packageIds || packageIds.length === 0) {
    return null;
  }

  const getPackageStatus = (index: number) => {
    // Try to get status from metadata if available
    const statusKey = `packageStatus_${index}`;
    const status = metadata[statusKey];
    
    if (status === 'DELIVERED') {
      return { color: 'success', icon: <CheckCircleOutlined />, text: 'Đã giao' };
    } else if (status === 'RETURNED') {
      return { color: 'default', icon: <CheckCircleOutlined />, text: 'Đã trả' };
    } else if (status === 'DAMAGED') {
      return { color: 'error', icon: <ExclamationCircleOutlined />, text: 'Hư hỏng' };
    } else if (status === 'IN_TRANSIT') {
      return { color: 'processing', icon: <ClockCircleOutlined />, text: 'Đang vận chuyển' };
    }
    
    // Default status
    return { color: 'default', icon: <InboxOutlined />, text: 'Chờ xử lý' };
  };

  const getPackageWeight = (index: number) => {
    // Use the actual metadata structure: totalWeight (e.g., "4 kg")
    // For individual packages, we might need packageWeight_0, packageWeightUnit_0, etc.
    if (packageIds.length === 1) {
      // Single package - use totalWeight from metadata
      return metadata.totalWeight || 'N/A';
    } else {
      // Multiple packages - try to get individual package weight
      const weightKey = `packageWeight_${index}`;
      const weightUnitKey = `packageWeightUnit_${index}`;
      const weight = metadata[weightKey];
      const unit = metadata[weightUnitKey] || 'kg';
      
      if (weight) {
        return `${weight} ${unit}`;
      }
      return 'N/A';
    }
  };

  const getPackageTrackingCode = (index: number) => {
    // Use orderCode from metadata or fallback to package ID
    if (packageIds.length === 1) {
      return metadata.orderCode || packageIds[index] || 'N/A';
    } else {
      // For multiple packages, try individual tracking codes
      const trackingKey = `packageTrackingCode_${index}`;
      return metadata[trackingKey] || packageIds[index] || 'N/A';
    }
  };

  const getPackageDescription = (index: number) => {
    // Try to get description from metadata
    // For single package, use packageDescription directly
    // For multiple packages, try indexed keys first
    if (packageIds.length === 1) {
      return metadata.packageDescription || 'Không có mô tả';
    } else {
      const descKey = `packageDescription_${index}`;
      return metadata[descKey] || metadata.packageDescription || 'Không có mô tả';
    }
  };

  // Prepare table data
  const tableData = packageIds.map((packageId, index) => {
    const status = getPackageStatus(index);
    const weight = getPackageWeight(index);
    const trackingCode = getPackageTrackingCode(index);
    const description = getPackageDescription(index);
    
    return {
      key: packageId,
      stt: index + 1,
      trackingCode: (
        <Tag color="cyan" className="m-0 text-xs">
          {trackingCode}
        </Tag>
      ),
      description: description !== 'Không có mô tả' ? description : '-',
      weight: (
        <div className="flex items-center gap-1">
          <BarChartOutlined className="text-gray-400 text-xs" />
          <span className="text-sm text-gray-600">
            {weight}
          </span>
        </div>
      ),
      quantity: packageIds.length === 1 ? metadata.packageCount || 1 : 1,
      status: (
        <Tag 
          color={status.color} 
          icon={status.icon}
          className="m-0"
        >
          {status.text}
        </Tag>
      ),
    };
  });

  const columns = [
    {
      title: 'STT',
      dataIndex: 'stt',
      key: 'stt',
      width: 60,
      align: 'center' as const,
    },
    {
      title: 'Mã theo dõi',
      dataIndex: 'trackingCode',
      key: 'trackingCode',
      width: 180,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Khối lượng',
      dataIndex: 'weight',
      key: 'weight',
      width: 120,
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
    },
  ];

  return (
    <div className="package-list mt-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <InboxOutlined className="text-blue-600" />
          {title} ({packageIds.length} kiện)
          {metadata.categoryDescription && (
            <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
              ({metadata.categoryDescription})
            </span>
          )}
        </h4>
        
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={false}
          size="small"
          className="package-table"
          scroll={{ x: 800 }}
        />
        
        {/* Summary information */}
        <div className="mt-3 pt-3 border-t border-blue-200">
          <Descriptions size="small" column={2} className="mb-0">
            <Descriptions.Item label="Tổng trọng lượng">
              <span className="font-medium">{metadata.totalWeight || 'N/A'}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Số kiện hàng">
              <span className="font-medium">{packageIds.length}</span>
            </Descriptions.Item>
            {metadata.orderCode && (
              <Descriptions.Item label="Mã đơn hàng">
                <span className="font-medium">{metadata.orderCode}</span>
              </Descriptions.Item>
            )}
          </Descriptions>
        </div>
      </div>
    </div>
  );
};

export default PackageList;
