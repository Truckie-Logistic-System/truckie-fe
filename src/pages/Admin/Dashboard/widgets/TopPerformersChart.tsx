import React from 'react';
import { Card, Avatar, Table, Tag, Empty, Skeleton, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { TopStaff, TopDriver } from '../../../../models/AdminDashboard';
import { BarChart } from '../../../Dashboard/components/charts';

const { Text } = Typography;

interface TopPerformersChartProps {
  data: (TopStaff | TopDriver)[] | null;
  loading: boolean;
  title: string;
  color?: string;
  metricKey: 'resolvedIssues' | 'acceptedTrips';
  metricLabel: string;
}

const TopPerformersChart: React.FC<TopPerformersChartProps> = ({
  data,
  loading,
  title,
  color = '#1890ff',
  metricKey,
  metricLabel,
}) => {
  const hasData = data && data.length > 0;

  return (
    <Card 
      title={
        <span className="text-blue-800">
          {title}
        </span>
      } 
      bordered={false} 
      className="shadow-sm"
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : !hasData ? (
        <Empty description="Không có dữ liệu" />
      ) : (
        <div className="space-y-4">
          {/* Table - limit to top 5 */}
          <Table
            dataSource={(data || []).slice(0, 5)}
            rowKey={(item) => (item as any).staffId || (item as any).driverId}
            pagination={false}
            size="small"
            columns={[
              {
                title: '#',
                width: 40,
                render: (_: any, __: any, index: number) => (
                  <span className={index < 3 ? 'text-yellow-600 font-bold' : ''}>
                    {index + 1}
                  </span>
                ),
              },
              {
                title: 'Nhân sự',
                dataIndex: 'name',
                ellipsis: true,
                render: (name: string, record: TopStaff | TopDriver) => (
                  <div className="flex items-center">
                    <Avatar
                      src={record.avatarUrl}
                      icon={!record.avatarUrl && <UserOutlined />}
                      size="small"
                      className="mr-2"
                    />
                    <div>
                      <Text strong>{name}</Text>
                      <div><Text type="secondary" className="text-xs">{record.email}</Text></div>
                    </div>
                  </div>
                ),
              },
              {
                title: metricLabel,
                dataIndex: metricKey,
                align: 'right' as const,
                width: 120,
                render: (value: number) => {
                  const safeValue = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
                  return <Tag color={color}>{safeValue.toLocaleString('vi-VN')}</Tag>;
                },
              },
            ]}
          />
          
          {/* Chart - use shared horizontal BarChart, same behavior as Staff dashboard */}
          <div className="pt-4 border-t">
            <BarChart
              data={(data || []).slice(0, 5).map((item: TopStaff | TopDriver, index: number) => ({
                category: `${item.name} #${index + 1}`,
                value: (item as any)[metricKey] || 0,
              }))}
              height={250}
              color={color}
              formatter={(value: number) => {
                const safeValue = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
                return safeValue.toLocaleString('vi-VN');
              }}
            />
          </div>
        </div>
      )}
    </Card>
  );
};

export default TopPerformersChart;
