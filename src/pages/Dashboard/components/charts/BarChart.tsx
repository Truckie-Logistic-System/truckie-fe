import React from 'react';
import { Card, Skeleton, Empty } from 'antd';
import { Bar } from '@ant-design/plots';

export interface BarChartData {
  category: string;
  value: number;
  type?: string;
  label?: string;
}

interface BarChartProps {
  data: BarChartData[];
  title?: string;
  loading?: boolean;
  height?: number;
  yAxisLabel?: string;
  color?: string | string[];
  showLabel?: boolean;
  formatter?: (value: number) => string;
  isGrouped?: boolean;
  legend?: {
    series1: string;
    series2: string;
  };
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  loading = false,
  height = 300,
  yAxisLabel,
  color = '#3b82f6',
  showLabel = true,
  formatter,
  isGrouped = false,
  legend,
}) => {
  if (loading) {
    return (
      <Card title={title} className="shadow-sm">
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card title={title} className="shadow-sm">
        <Empty description="Không có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  // Ensure height is sufficient for all bars (minimum 40px per bar)
  const minHeight = Math.max(height, data.length * 40);
  
  // Calculate max value for label positioning
  const maxValue = Math.max(...data.map(item => item.value));
  
  // Following exact Ant Design Charts Bar example from documentation:
  // For Bar chart (horizontal bars):
  // xField = category field (displayed on Y-axis - left side labels)
  // yField = value field (displayed on X-axis - bar length)
  const config: any = {
    data,
    xField: 'category',
    yField: 'value',
    height: minHeight,
    sort: {
      reverse: true,
    },
    // Ensure all data points are rendered
    scale: {
      x: { padding: 0.5 },
    },
    label: {
      text: 'value',
      formatter: (datum: any) => {
        if (formatter) {
          return formatter(datum.value);
        }
        const value = typeof datum.value === 'number' && !Number.isNaN(datum.value) ? datum.value : 0;
        return value.toLocaleString('vi-VN');
      },
      style: {
        textAlign: (d: any) => (+d.value > maxValue * 0.1 ? 'right' : 'start'),
        fill: (d: any) => (+d.value > maxValue * 0.1 ? '#fff' : '#000'),
        dx: (d: any) => (+d.value > maxValue * 0.1 ? -5 : 5),
      },
    },
    axis: {
      y: {
        labelFormatter: formatter ? (value: number) => formatter(value) : (value: number) => {
          const safeValue = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
          return safeValue.toLocaleString('vi-VN');
        },
        labelAutoHide: true,
        labelAutoEllipsis: true,
      },
      x: {
        labelAutoHide: true,
        labelAutoEllipsis: true,
      },
    },
    style: {
      fill: typeof color === 'string' ? color : '#3b82f6',
    },
  };

  if (isGrouped) {
    config.colorField = 'type';
    config.group = true;
    config.legend = legend ? {
      custom: true,
      items: [
        { name: legend.series1, value: legend.series1, marker: { style: { fill: '#10b981' } } },
        { name: legend.series2, value: legend.series2, marker: { style: { fill: '#3b82f6' } } },
      ],
    } : true;
    config.color = ['#10b981', '#3b82f6'];
  }

  return (
    <Card title={title} className="shadow-sm">
      <div style={{ width: '100%', overflow: 'hidden' }}>
        <Bar {...config} />
      </div>
    </Card>
  );
};

export default BarChart;
