import React from 'react';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import { 
  MobileOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  LinkOutlined 
} from '@ant-design/icons';
import type { DeviceStatistics } from '@/services/dashboard/dashboardService';

interface DeviceStatsCardProps {
  data?: DeviceStatistics;
  loading?: boolean;
}

const DeviceStatsCard: React.FC<DeviceStatsCardProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <Card
        title={
          <span className="text-blue-800">
            <MobileOutlined className="mr-2" />
            Thống kê thiết bị
          </span>
        }
        className="shadow-sm"
      >
        <div className="flex justify-center items-center h-32">
          <Spin />
        </div>
      </Card>
    );
  }

  const stats = data || {
    totalDevices: 0,
    activeDevices: 0,
    inactiveDevices: 0,
    assignedDevices: 0,
  };

  return (
    <Card
      title={
        <span className="text-blue-800">
          <MobileOutlined className="mr-2" />
          Thống kê thiết bị
        </span>
      }
      className="shadow-sm"
    >
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Statistic
            title="Tổng thiết bị"
            value={stats.totalDevices}
            prefix={<MobileOutlined style={{ color: '#1890ff' }} />}
            valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="Đang hoạt động"
            value={stats.activeDevices}
            prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="Không hoạt động"
            value={stats.inactiveDevices}
            prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
            valueStyle={{ color: '#ff4d4f', fontWeight: 'bold' }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="Đã gắn xe"
            value={stats.assignedDevices}
            prefix={<LinkOutlined style={{ color: '#722ed1' }} />}
            valueStyle={{ color: '#722ed1', fontWeight: 'bold' }}
          />
        </Col>
      </Row>
    </Card>
  );
};

export default DeviceStatsCard;
