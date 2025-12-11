import React from 'react';
import { Card, Statistic, Row, Col, Spin, Empty } from 'antd';
import { Line } from '@ant-design/plots';
import { FireOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import type { FuelConsumptionStatistics } from '@/services/dashboard/dashboardService';

interface FuelConsumptionChartProps {
  data?: FuelConsumptionStatistics;
  loading?: boolean;
}

const FuelConsumptionChart: React.FC<FuelConsumptionChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <Card
        title={
          <span className="text-blue-800">
            <FireOutlined className="mr-2" />
            Thống kê nhiên liệu tiêu thụ
          </span>
        }
        className="shadow-sm"
      >
        <div className="flex justify-center items-center h-64">
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
            <FireOutlined className="mr-2" />
            Thống kê nhiên liệu tiêu thụ
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

  const chartData = data.fuelConsumptionTrend?.map(item => ({
    date: item.label,
    value: item.amount,
  })) || [];

  const config = {
    data: chartData,
    xField: 'date',
    yField: 'value',
    smooth: true,
    color: '#1890ff',
    point: {
      size: 4,
      shape: 'circle',
      style: {
        fill: '#1890ff',
        stroke: '#fff',
        lineWidth: 2,
      },
    },
    area: {
      style: {
        fill: 'l(270) 0:#ffffff 0.5:#7ec2f3 1:#1890ff',
        fillOpacity: 0.3,
      },
    },
    xAxis: {
      label: {
        autoRotate: true,
        style: {
          fontSize: 11,
        },
        autoHide: true,
        autoEllipsis: true,
      },
      tickCount: Math.min(chartData.length, 8),
    },
    yAxis: {
      label: {
        formatter: (v: string) => `${Number(v).toLocaleString('vi-VN')} L`,
      },
    },
    tooltip: {
      formatter: (datum: { value: number }) => ({
        name: 'Nhiên liệu',
        value: `${datum.value.toLocaleString('vi-VN')} lít`,
      }),
    },
  };

  return (
    <Card
      title={
        <span className="text-blue-800">
          <FireOutlined className="mr-2" />
          Thống kê nhiên liệu tiêu thụ
        </span>
      }
      className="shadow-sm"
    >
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12}>
          <Statistic
            title="Tổng nhiên liệu tiêu thụ"
            value={data.totalFuelConsumed}
            precision={0}
            suffix="lít"
            valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: 'bold' }}
          />
        </Col>
        <Col xs={24} sm={12}>
          <Statistic
            title="Trung bình mỗi chuyến"
            value={data.averageFuelConsumption}
            precision={1}
            suffix="lít"
            valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold' }}
          />
          {deltaPercent !== 0 && (
            <div className="flex items-center mt-1">
              {isPositive ? (
                <ArrowUpOutlined style={{ color: '#ff4d4f', marginRight: 4 }} />
              ) : (
                <ArrowDownOutlined style={{ color: '#52c41a', marginRight: 4 }} />
              )}
              <span style={{ color: isPositive ? '#ff4d4f' : '#52c41a', fontSize: 12 }}>
                {Math.abs(deltaPercent).toFixed(1)}% so với kỳ trước
              </span>
            </div>
          )}
        </Col>
      </Row>

      {chartData.length > 0 ? (
        <div style={{ height: 250, width: '100%', overflow: 'hidden' }}>
          <Line {...config} />
        </div>
      ) : (
        <Empty description="Không có dữ liệu biểu đồ" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Card>
  );
};

export default FuelConsumptionChart;
