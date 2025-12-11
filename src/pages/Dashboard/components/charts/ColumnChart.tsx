import React from 'react';
import { Column } from '@ant-design/plots';
import { Card, Empty, Skeleton } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';

interface ColumnDataItem {
    category: string;
    value: number;
    type?: string;
}

interface ColumnChartProps {
    data: ColumnDataItem[];
    title: string;
    loading?: boolean;
    height?: number;
    xAxisLabel?: string;
    yAxisLabel?: string;
    color?: string | string[];
    isGroup?: boolean;
}

const ColumnChart: React.FC<ColumnChartProps> = ({
    data,
    title,
    loading = false,
    height = 300,
    xAxisLabel = '',
    yAxisLabel = 'Giá trị',
    color = '#1890ff',
    isGroup = false,
}) => {
    if (loading) {
        return (
            <Card className="shadow-sm">
                <div className="flex items-center mb-4">
                    <BarChartOutlined className="text-xl text-blue-500 mr-2" />
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
                    <BarChartOutlined className="text-xl text-blue-500 mr-2" />
                    <h3 className="text-lg font-semibold m-0">{title}</h3>
                </div>
                <Empty description="Không có dữ liệu" />
            </Card>
        );
    }

    const config = {
        data,
        xField: 'category',
        yField: 'value',
        seriesField: isGroup ? 'type' : undefined,
        height,
        color,
        columnStyle: {
            radius: [8, 8, 0, 0],
        },
        label: {
            position: 'top' as const,
            style: {
                fill: '#666',
                fontSize: 12,
            },
            formatter: (datum: ColumnDataItem) => {
                if (datum.value >= 1000000) return `${(datum.value / 1000000).toFixed(1)}M`;
                if (datum.value >= 1000) return `${(datum.value / 1000).toFixed(1)}K`;
                return datum.value.toString();
            },
        },
        xAxis: {
            label: {
                autoRotate: false,
                style: {
                    fill: '#666',
                    fontSize: 12,
                },
                autoHide: true,
                autoEllipsis: true,
            },
            title: xAxisLabel
                ? {
                      text: xAxisLabel,
                      style: {
                          fontSize: 12,
                          fill: '#666',
                      },
                  }
                : undefined,
            tickCount: Math.min(data.length, 8),
        },
        yAxis: {
            label: {
                formatter: (v: string) => {
                    const num = parseFloat(v);
                    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
                    return v;
                },
                style: {
                    fill: '#666',
                    fontSize: 12,
                },
            },
            title: {
                text: yAxisLabel,
                style: {
                    fontSize: 12,
                    fill: '#666',
                },
            },
        },
        tooltip: {
            showTitle: true,
            title: (datum: any) => datum.category,
            customContent: (title: string, items: any[]) => {
                if (!items || items.length === 0) return null;
                const item = items[0];
                const value = item?.data?.value || 0;
                const name = item?.data?.type || title;
                
                return (
                    <div style={{ padding: '8px 12px', border: '1px solid #f0f0f0', borderRadius: '4px', backgroundColor: '#fff' }}>
                        <div style={{ marginBottom: 4, fontWeight: 500 }}>{name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ 
                                width: 8, 
                                height: 8, 
                                borderRadius: '50%', 
                                backgroundColor: Array.isArray(color) ? color[items[0]?.dataIndex || 0] : color,
                                display: 'inline-block'
                            }}></span>
                            <span>Số lượng: <strong>{(typeof value === 'number' && !Number.isNaN(value) ? value : 0).toLocaleString('vi-VN')}</strong></span>
                        </div>
                    </div>
                );
            },
        },
        animation: {
            appear: {
                animation: 'scale-in-y',
                duration: 800,
            },
        },
    };

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center mb-4">
                <BarChartOutlined className="text-xl text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold m-0">{title}</h3>
            </div>
            <div style={{ width: '100%', overflow: 'hidden' }}>
                <Column {...config} />
            </div>
        </Card>
    );
};

export default ColumnChart;
