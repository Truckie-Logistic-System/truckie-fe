import React from 'react';
import { Card, Row, Col, Statistic, Spin, Empty } from 'antd';
import { Line } from '@ant-design/plots';
import { 
  ExclamationCircleOutlined, 
  ArrowUpOutlined, 
  ArrowDownOutlined 
} from '@ant-design/icons';
import type { PenaltiesStatistics } from '@/services/dashboard/dashboardService';

interface PenaltiesStatsCardProps {
  data?: PenaltiesStatistics;
  loading?: boolean;
}

const PenaltiesStatsCard: React.FC<PenaltiesStatsCardProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <Card
        title={
          <span className="text-blue-800">
            <ExclamationCircleOutlined className="mr-2" />
            Thống kê vi phạm giao thông
          </span>
        }
        className="shadow-sm"
      >
        <div className="flex justify-center items-center h-48">
          <Spin />
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card
        title={
          <span className="text-blue-800">
            <ExclamationCircleOutlined className="mr-2" />
            Thống kê vi phạm giao thông
          </span>
        }
        className="shadow-sm"
      >
        <Empty description="Không có dữ liệu" />
      </Card>
    );
  }

  const deltaPercent = data.deltaPercent || 0;
  const isPositive = deltaPercent >= 0;

  const chartData = data.penaltiesTrend?.map(item => ({
    date: item.label,
    value: item.count,
  })) || [];

  const config = {
    data: chartData,
    xField: 'date',
    yField: 'value',
    smooth: true,
    color: '#ff4d4f',
    point: {
      size: 4,
      shape: 'circle',
      style: {
        fill: '#ff4d4f',
        stroke: '#fff',
        lineWidth: 2,
      },
    },
    xAxis: {
      label: {
        autoRotate: true,
        style: {
          fontSize: 11,
        },
        formatter: (value: string) => {
          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            const [, month, day] = value.split('-');
            return `${day}/${month}`;
          }
          return value;
        },
        autoHide: true,
        autoEllipsis: true,
      },
      tickCount: Math.min(chartData.length, 8),
    },
    yAxis: {
      label: {
        formatter: (v: string) => `${Number(v)}`,
      },
    },
    tooltip: {
      formatter: (datum: { value: number }) => ({
        name: 'Vi phạm',
        value: `${datum.value} vụ`,
      }),
    },
  };

  return (
    <Card
      title={
        <span className="text-blue-800">
          <ExclamationCircleOutlined className="mr-2" />
          Thống kê vi phạm giao thông
        </span>
      }
      className="shadow-sm"
    >
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12}>
          <Statistic
            title="Tổng vi phạm"
            value={data.totalPenalties}
            valueStyle={{ color: '#ff4d4f', fontSize: '24px', fontWeight: 'bold' }}
            suffix={
              deltaPercent !== 0 && (
                <span style={{ fontSize: '14px', marginLeft: 8 }}>
                  {isPositive ? (
                    <ArrowUpOutlined style={{ color: '#ff4d4f', marginRight: 4 }} />
                  ) : (
                    <ArrowDownOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                  )}
                  <span style={{ color: isPositive ? '#ff4d4f' : '#52c41a' }}>
                    {Math.abs(deltaPercent).toFixed(1)}%
                  </span>
                </span>
              )
            }
          />
        </Col>
        <Col xs={24} sm={12}>
          <Statistic
            title="Chưa xử lý"
            value={data.unresolvedPenalties}
            valueStyle={{ color: '#faad14', fontSize: '24px', fontWeight: 'bold' }}
          />
        </Col>
      </Row>

      {chartData.length > 0 ? (
        <div style={{ height: 200, width: '100%', overflow: 'hidden' }}>
          <Line {...config} />
        </div>
      ) : (
        <Empty description="Không có dữ liệu biểu đồ" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Card>
  );
};

export default PenaltiesStatsCard;
