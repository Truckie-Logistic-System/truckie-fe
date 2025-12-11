import React, { useRef, useEffect, useMemo } from 'react';
import { Line } from '@antv/g2plot';
import { Plugin } from '@antv/g-plugin-rough-canvas-renderer';
import { Card, Empty, Skeleton } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';

interface TrendDataPoint {
    label: string;
    value: number;
    category?: string;
}

interface TrendLineChartProps {
    data: TrendDataPoint[];
    title: string;
    loading?: boolean;
    height?: number;
    yAxisLabel?: string;
    smooth?: boolean;
    color?: string;
    showArea?: boolean;
    // Nếu true thì format giá trị dạng tiền tệ VND, nếu false thì hiển thị số thường
    isCurrency?: boolean;
}

const TrendLineChart: React.FC<TrendLineChartProps> = ({
    data,
    title,
    loading = false,
    height = 300,
    yAxisLabel = 'Giá trị',
    smooth = false,
    color = '#1890ff',
    showArea = true,
    isCurrency = true,
}) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<Line | null>(null);

    // Memoize transformed data to prevent unnecessary updates
    const transformedData = useMemo(() => {
        if (!data || data.length === 0) return [];
        
        // Chuẩn hóa dữ liệu thời gian để trục X theo filter dashboard (WEEK/MONTH/YEAR/CUSTOM)
        const transformed = data.map((item) => {
            const raw = (item as any).date ?? item.label;
            
            // For yyyy-MM-dd format (WEEK filter), keep as string - G2Plot handles it better
            // For other formats, try to parse as Date
            let timeValue: any;
            if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
                // yyyy-MM-dd format - keep as string for better G2Plot compatibility
                timeValue = raw;
            } else {
                // Other formats - try Date parsing
                const parsed = new Date(raw);
                timeValue = Number.isNaN(parsed.getTime()) ? raw : parsed;
            }
            
            return {
                ...item,
                time: timeValue,
            };
        });

        return transformed;
    }, [data, title]);

    const hasCategory = data?.some((d) => !!d.category) || false;

    // Memoize chart config to prevent unnecessary recreations
    const chartConfig = useMemo(() => {
        if (!transformedData.length) return null;

        return {
            data: transformedData,
            xField: 'time',
            yField: 'value',
            smooth,
            height,
            // màu base, với multi-line thì colorField sẽ override
            color: hasCategory ? undefined : color,
            // Bo góc nhọn giống demo (không mượt)
            lineStyle: {
                lineCap: 'butt' as const,
                lineJoin: 'miter' as const,
            },
            seriesField: hasCategory ? 'category' : undefined,
            // Scale config to ensure proper date ordering for string dates (yyyy-MM-dd)
            scale: {
                time: {
                    type: 'cat' as const, // Categorical scale for string dates
                },
            },
            point: {
                size: 5,
                shape: 'circle',
                style: {
                    fill: 'white',
                    stroke: color,
                    lineWidth: 2,
                },
            },
            tooltip: {
                showMarkers: true,
                showTitle: true,
                title: (title: string) => title,
                formatter: (datum: any) => {
                    // Giá trị hiển thị: tiền tệ VND hoặc số lượng thường
                    const safeValue = typeof datum.value === 'number' && !Number.isNaN(datum.value) ? datum.value : 0;
                    const formattedValue = isCurrency
                        ? (safeValue >= 1000000
                            ? `${(safeValue / 1000000).toFixed(2)} triệu ₫`
                            : safeValue >= 1000
                                ? `${(safeValue / 1000).toFixed(1)}k ₫`
                                : `${safeValue.toLocaleString('vi-VN')} ₫`)
                        : safeValue.toLocaleString('vi-VN');

                    // Nếu có category (multi-series) thì giữ nguyên tên category, ngược lại dùng nhãn trục Y
                    const name = hasCategory && datum.category ? datum.category : yAxisLabel;

                    return {
                        name,
                        value: formattedValue,
                    };
                },
            },
            // Trục theo style sketchy - G2Plot dùng xAxis/yAxis riêng biệt
            xAxis: {
                tickStroke: '#cdcdcd',
                gridStroke: '#efefef',
                label: {
                    formatter: (value: any) => {
                        // If value is a Date object, format it nicely
                        if (value instanceof Date) {
                            return value.toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                            });
                        }
                        // If value is yyyy-MM-dd string, format to dd/MM
                        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                            const [year, month, day] = value.split('-');
                            return `${day}/${month}`;
                        }
                        return value;
                    },
                    style: {
                        fill: '#666',
                        fontSize: 12,
                    },
                    autoHide: true,
                    autoEllipsis: true,
                },
                tickCount: Math.min(transformedData.length, 8),
            },
            yAxis: {
                tickStroke: '#cdcdcd',
                gridStroke: '#efefef',
                label: {
                    formatter: (v: string) => {
                        if (!isCurrency) return v;
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
            areaStyle:
                showArea
                    ? () => {
                          return {
                              fill: `l(270) 0:${color}00 0.5:${color}33 1:${color}66`,
                          };
                      }
                    : undefined,
            // Rough/canvas renderer không hỗ trợ path-in trên mọi phần tử → gây lỗi element.getTotalLength
            // Dùng hiệu ứng đơn giản hơn để tránh crash
            animation: {
                appear: {
                    animation: 'fade-in',
                    duration: 600,
                },
            },
            // Legend chỉ hiển thị khi có nhiều line; undefined khi không dùng để khớp kiểu Legend | undefined
            legend: hasCategory
                ? {
                      position: 'top' as const,
                  }
                : undefined,
        };
    }, [transformedData, hasCategory, smooth, height, color, showArea, isCurrency, yAxisLabel]);

    // Initialize and update chart
    useEffect(() => {
        if (!chartRef.current || !chartConfig) return;

        // Always destroy and recreate chart to avoid rough plugin issues with update()
        if (chartInstance.current) {
            chartInstance.current.destroy();
            chartInstance.current = null;
        }

        // Create new chart instance
        chartInstance.current = new Line(chartRef.current, chartConfig);

        // Register rough plugin trực tiếp; cast any để tránh lỗi type getContext
        const internalChart: any = (chartInstance.current as any).chart;
        const canvasRenderer = internalChart?.getContext?.().canvasRenderer;
        if (canvasRenderer) {
            canvasRenderer.registerPlugin(new Plugin());
        }

        chartInstance.current.render();
    }, [chartConfig]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }
        };
    }, []);

    if (loading) {
        return (
            <Card className="shadow-sm">
                <div className="flex items-center mb-4">
                    <LineChartOutlined className="text-xl text-blue-500 mr-2" />
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
                    <LineChartOutlined className="text-xl text-blue-500 mr-2" />
                    <h3 className="text-lg font-semibold m-0">{title}</h3>
                </div>
                <Empty description="Không có dữ liệu" />
            </Card>
        );
    }

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center mb-4">
                <LineChartOutlined className="text-xl text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold m-0">{title}</h3>
            </div>
            <div ref={chartRef} style={{ width: '100%', overflow: 'hidden' }} />
        </Card>
    );
};

export default TrendLineChart;
