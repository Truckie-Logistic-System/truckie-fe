import React, { useState } from 'react';
import { Card, Row, Col, Typography, List, Button, Tag, Empty, Skeleton, Pagination } from 'antd';
import { CarOutlined, ToolOutlined, WarningOutlined, RightOutlined } from '@ant-design/icons';
import { ColumnChart } from '../../../Dashboard/components/charts';
import type { AdminDashboardSummary } from '../../../../models/AdminDashboard';

const { Text } = Typography;

interface FleetTabProps {
  data: AdminDashboardSummary | null;
  isLoading: boolean;
  handleNavigateToVehicle: (vehicleId: string) => void;
}

const FleetTab: React.FC<FleetTabProps> = ({ data, isLoading, handleNavigateToVehicle }) => {
  const [maintenanceAlertsPage, setMaintenanceAlertsPage] = useState(1);
  const PAGE_SIZE = 5;

  // Fleet utilization data for column chart
  const fleetUtilizationData = [
    { category: 'Đang dùng', value: data?.fleetStatus?.inUseVehicles || 0, type: 'Đang hoạt động' },
    { category: 'Sẵn sàng', value: data?.fleetStatus?.availableVehicles || 0, type: 'Sẵn sàng' },
    { category: 'Bảo dưỡng', value: data?.fleetStatus?.inMaintenanceVehicles || 0, type: 'Bảo dưỡng' },
  ];

  const handleAlertClick = (alert: any) => {
    if (alert?.vehicleId) {
      handleNavigateToVehicle(alert.vehicleId);
    }
  };

  return (
    <>
      {/* Fleet Status */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={24}>
          <Card 
            title={
              <span className="text-blue-800">
                <ToolOutlined className="mr-2" />
                Thống kê đội xe
              </span>
            }
            className="shadow-sm"
          >
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : (
              <div className="space-y-4">
                {/* Fleet summary stats */}
                <Row gutter={16}>
                  <Col xs={12} sm={6}>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">
                        {data?.fleetStatus?.totalVehicles || 0}
                      </div>
                      <Text type="secondary">Tổng phương tiện</Text>
                    </div>
                  </Col>
                  <Col xs={12} sm={6}>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">
                        {data?.fleetStatus?.availableVehicles || 0}
                      </div>
                      <Text type="secondary">Sẵn sàng</Text>
                    </div>
                  </Col>
                  <Col xs={12} sm={6}>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-3xl font-bold text-purple-600">
                        {data?.fleetStatus?.inUseVehicles || 0}
                      </div>
                      <Text type="secondary">Đang hoạt động</Text>
                    </div>
                  </Col>
                  <Col xs={12} sm={6}>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-3xl font-bold text-orange-600">
                        {data?.fleetStatus?.inMaintenanceVehicles || 0}
                      </div>
                      <Text type="secondary">Đang bảo dưỡng</Text>
                    </div>
                  </Col>
                </Row>

                {/* Maintenance Alerts */}
                {/* {data?.fleetStatus?.maintenanceAlerts && data.fleetStatus.maintenanceAlerts.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <Text strong className="text-orange-600">
                        <WarningOutlined className="mr-1" />
                        Xe cần bảo dưỡng/đăng kiểm ({data.fleetStatus.maintenanceAlerts.length})
                      </Text>
                    </div>
                    <List
                      dataSource={data.fleetStatus.maintenanceAlerts.slice((maintenanceAlertsPage - 1) * PAGE_SIZE, maintenanceAlertsPage * PAGE_SIZE)}
                      renderItem={(alert: any) => (
                        <List.Item 
                          className="!py-3 !px-4 hover:bg-gray-50 cursor-pointer transition-colors border rounded-lg mb-2"
                          onClick={() => handleAlertClick(alert)}
                          actions={[
                            <Button type="link" icon={<RightOutlined />} size="small" />
                          ]}
                        >
                          <List.Item.Meta
                            avatar={
                              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${alert.isOverdue ? 'bg-red-100' : 'bg-yellow-100'}`}>
                                <CarOutlined className={alert.isOverdue ? 'text-red-500' : 'text-yellow-500'} />
                              </div>
                            }
                            title={
                              <div className="flex items-center gap-2 flex-wrap">
                                <Text strong>{alert.licensePlate || ''}</Text>
                                <Tag color={alert.isOverdue ? 'error' : 'warning'}>
                                  {alert.isOverdue ? 'Quá hạn' : 'Sắp đến hạn'}
                                </Tag>
                              </div>
                            }
                            description={
                              <div className="flex items-center gap-2">
                                <Text type="secondary">{alert.maintenanceType || ''}</Text>
                                <Text type="secondary">•</Text>
                                <Text type="secondary">{alert.scheduledDate || ''}</Text>
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                    {data.fleetStatus.maintenanceAlerts.length > PAGE_SIZE && (
                      <div className="flex justify-center mt-3">
                        <Pagination
                          current={maintenanceAlertsPage}
                          pageSize={PAGE_SIZE}
                          total={data.fleetStatus.maintenanceAlerts.length}
                          onChange={setMaintenanceAlertsPage}
                          size="small"
                          showSizeChanger={false}
                        />
                      </div>
                    )}
                  </div>
                )} */}
                
                {(!data?.fleetStatus?.maintenanceAlerts || data.fleetStatus.maintenanceAlerts.length === 0) && (
                  <div className="border-t pt-4">
                    <Empty description="Không có xe nào cần bảo dưỡng" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  </div>
                )}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Fleet Utilization Chart */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <div className="overflow-x-auto">
            <ColumnChart
              data={fleetUtilizationData}
              title="Phân bổ trạng thái đội xe"
              loading={isLoading}
              yAxisLabel="Số lượng"
              color={['#3b82f6', '#22c55e', '#f59e0b']}
              height={300}
            />
          </div>
        </Col>
      </Row>
    </>
  );
};

export default FleetTab;
