import React from 'react';
import { Pie } from '@ant-design/plots';
import { Card, Empty, Skeleton } from 'antd';
import { PieChartOutlined } from '@ant-design/icons';

interface DonutDataItem {
    type: string;
    value: number;
    color?: string;
}

interface DonutChartProps {
    data: DonutDataItem[];
    title: string;
    loading?: boolean;
    height?: number;
    innerRadius?: number;
    showLegend?: boolean;
    /** Custom label formatter: (type, value, percent) => string */
    labelFormatter?: (type: string, value: number, percent: number) => string;
    /** Custom tooltip name formatter: (type) => string */
    tooltipNameFormatter?: (type: string) => string;
}

const DonutChart: React.FC<DonutChartProps> = ({
    data,
    title,
    loading = false,
    height = 300,
    innerRadius = 0.6,
    showLegend = true,
    labelFormatter,
    tooltipNameFormatter,
}) => {
    if (loading) {
        return (
            <Card className="shadow-sm">
                <div className="flex items-center mb-4">
                    <PieChartOutlined className="text-xl text-blue-500 mr-2" />
                    <h3 className="text-lg font-semibold m-0">{title}</h3>
                </div>
                <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card className="shadow-sm">
                <div className="flex items-center mb-4">
                    <PieChartOutlined className="text-xl text-blue-500 mr-2" />
                    <h3 className="text-lg font-semibold m-0">{title}</h3>
                </div>
                <Empty description="Không có dữ liệu" />
            </Card>
        );
    }

    const config = {
        data,
        angleField: 'value',
        colorField: 'type',
        radius: 1,
        innerRadius,
        height,
        color: data.map(item => item.color).filter(Boolean).length > 0
            ? data.map(item => item.color || '#1890ff')
            : undefined,
        // Label giống ví dụ chính thức: mặc định hiển thị value, ở ngoài lát cắt
        label: labelFormatter
            ? {
                  text: (dataItem: DonutDataItem) => {
                      const total = data.reduce((sum, item) => sum + item.value, 0);
                      const percent = total > 0 ? (dataItem.value / total) * 100 : 0;
                      return labelFormatter(dataItem.type, dataItem.value, percent);
                  },
                  style: {
                      fontSize: 12,
                      fontWeight: 'bold',
                  },
              }
            : {
                  text: 'value',
                  position: 'outside',
                  style: {
                      fontSize: 12,
                      fontWeight: 'bold',
                  },
              },
        legend: showLegend
            ? {
                  position: 'top' as const,
                  itemName: {
                      // Dùng formatter để hiển thị tiếng Việt nếu có tooltipNameFormatter
                      formatter: (text: string) =>
                          tooltipNameFormatter ? tooltipNameFormatter(text) : text,
                      style: {
                          fontSize: 12,
                      },
                  },
              }
            : false,
        statistic: {
            title: {
                offsetY: -8,
                style: {
                    fontSize: '14px',
                    color: '#666',
                },
                content: 'Tổng',
            },
            content: {
                offsetY: 4,
                style: {
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#1890ff',
                },
                formatter: () => {
                    const total = data.reduce((sum, item) => sum + item.value, 0);
                    const safeTotal = typeof total === 'number' && !Number.isNaN(total) ? total : 0;
                    return safeTotal.toLocaleString('vi-VN');
                },
            },
        },
        interactions: [
            {
                type: 'element-selected',
            },
            {
                type: 'element-active',
            },
        ],
        animation: {
            appear: {
                animation: 'fade-in',
                duration: 800,
            },
        },
    };

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center mb-4">
                <PieChartOutlined className="text-xl text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold m-0">{title}</h3>
            </div>
            <div style={{ width: '100%', overflow: 'hidden' }}>
                <Pie {...config} />
            </div>
        </Card>
    );
};
// Memo hóa để tránh re-render không cần thiết khi data không đổi
function areEqual(prev: DonutChartProps, next: DonutChartProps): boolean {
    if (prev.loading !== next.loading) return false;
    if (prev.data.length !== next.data.length) return false;
    for (let i = 0; i < prev.data.length; i += 1) {
        const a = prev.data[i];
        const b = next.data[i];
        if (a.type !== b.type || a.value !== b.value || a.color !== b.color) {
            return false;
        }
    }
    return true;
}

export default React.memo(DonutChart, areEqual);
