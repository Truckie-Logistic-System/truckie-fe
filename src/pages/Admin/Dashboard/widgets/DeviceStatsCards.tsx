import React from 'react';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import {
  CarOutlined,
  HddOutlined,
  ToolOutlined,
  ExclamationCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import type { FleetStats } from '../../../../models/AdminDashboard';

interface DeviceStatsCardsProps {
  data: FleetStats | null;
  loading: boolean;
}

const DeviceStatsCards: React.FC<DeviceStatsCardsProps> = ({ data, loading }) => {
  const getIcon = (type: 'vehicles' | 'devices' | 'maintenances' | 'penalties') => {
    switch (type) {
      case 'vehicles':
        return <CarOutlined style={{ fontSize: 24, color: '#1890ff' }} />;
      case 'devices':
        return <HddOutlined style={{ fontSize: 24, color: '#52c41a' }} />;
      case 'maintenances':
        return <ToolOutlined style={{ fontSize: 24, color: '#faad14' }} />;
      case 'penalties':
        return <ExclamationCircleOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />;
    }
  };

  const getTitle = (type: 'vehicles' | 'devices' | 'maintenances' | 'penalties') => {
    switch (type) {
      case 'vehicles':
        return 'Tổng số phương tiện';
      case 'devices':
        return 'Tổng số thiết bị';
      case 'maintenances':
        return 'Bảo trì đang thực hiện';
      case 'penalties':
        return 'Vi phạm chưa xử lý';
    }
  };

  const renderCard = (type: 'vehicles' | 'devices' | 'maintenances' | 'penalties') => {
    const statsData = data?.[type];
    const deltaPercent = statsData?.deltaPercent || 0;
    const isPositive = deltaPercent >= 0;

    return (
      <Col xs={24} sm={12} lg={6} key={type}>
        <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Spin />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>{getIcon(type)}</div>
                <div className="text-right">
                  <div className="text-gray-500 text-sm">{getTitle(type)}</div>
                  <div className="text-2xl font-bold">{statsData?.count || 0}</div>
                </div>
              </div>
              <div className="flex items-center">
                {isPositive ? (
                  <ArrowUpOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                ) : (
                  <ArrowDownOutlined style={{ color: '#ff4d4f', marginRight: 4 }} />
                )}
                <span
                  style={{
                    color: isPositive ? '#52c41a' : '#ff4d4f',
                    fontSize: 14,
                  }}
                >
                  {Math.abs(deltaPercent).toFixed(1)}%
                </span>
                <span className="text-gray-500 text-sm ml-2">so với kỳ trước</span>
              </div>
            </div>
          )}
        </Card>
      </Col>
    );
  };

  return (
    <Row gutter={[16, 16]}>
      {renderCard('vehicles')}
      {renderCard('devices')}
      {renderCard('maintenances')}
      {renderCard('penalties')}
    </Row>
  );
};

export default DeviceStatsCards;
