import React, { useState } from 'react';
import { Card, List, Tag, Button, Empty, Spin, Pagination, Typography } from 'antd';
import { 
  WarningOutlined, 
  CarOutlined, 
  ToolOutlined,
  CalendarOutlined,
  RightOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { VehicleInspectionAlert } from '@/services/dashboard/dashboardService';
import ScheduleMaintenanceModal from '@/pages/Admin/Vehicle/components/ScheduleMaintenanceModal';

const { Text } = Typography;

interface VehicleInspectionAlertsProps {
  data?: VehicleInspectionAlert[];
  loading?: boolean;
  onScheduleSuccess?: () => void;
}

const PAGE_SIZE = 5;

const VehicleInspectionAlerts: React.FC<VehicleInspectionAlertsProps> = ({ 
  data, 
  loading,
  onScheduleSuccess 
}) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleInspectionAlert | null>(null);

  const handleAlertClick = (alert: VehicleInspectionAlert) => {
    navigate(`/admin/vehicles/${alert.vehicleId}`);
  };

  const handleScheduleClick = (e: React.MouseEvent, alert: VehicleInspectionAlert) => {
    e.stopPropagation();
    setSelectedVehicle(alert);
    setScheduleModalVisible(true);
  };

  const handleScheduleSuccess = () => {
    setScheduleModalVisible(false);
    setSelectedVehicle(null);
    onScheduleSuccess?.();
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'INSPECTION':
        return <CarOutlined className="text-orange-500" />;
      case 'MAINTENANCE':
        return <ToolOutlined className="text-yellow-500" />;
      default:
        return <WarningOutlined className="text-red-500" />;
    }
  };

  const getAlertTypeLabel = (alertType: string) => {
    switch (alertType) {
      case 'INSPECTION':
        return 'Đăng kiểm';
      case 'MAINTENANCE':
        return 'Bảo dưỡng';
      default:
        return alertType;
    }
  };

  const getDaysLabel = (daysUntilDue: number) => {
    if (daysUntilDue < 0) {
      return `Quá hạn ${Math.abs(daysUntilDue)} ngày`;
    } else if (daysUntilDue === 0) {
      return 'Hôm nay';
    } else if (daysUntilDue === 1) {
      return 'Ngày mai';
    } else {
      return `Còn ${daysUntilDue} ngày`;
    }
  };

  if (loading) {
    return (
      <Card
        title={
          <span className="text-blue-800">
            <WarningOutlined className="mr-2" />
            Xe cần đăng kiểm/bảo dưỡng
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

  const alerts = data || [];
  const paginatedAlerts = alerts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      <Card
        title={
          <div className="flex justify-between items-center">
            <span className="text-blue-800">
              <WarningOutlined className="mr-2" />
              Xe cần đăng kiểm/bảo dưỡng ({alerts.length})
            </span>
          </div>
        }
        className="shadow-sm"
      >
        {alerts.length === 0 ? (
          <Empty 
            description="Không có xe nào cần đăng kiểm/bảo dưỡng trong 3 tháng tới" 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
          />
        ) : (
          <>
            <List
              dataSource={paginatedAlerts}
              renderItem={(alert) => (
                <List.Item
                  className="!py-3 !px-4 hover:bg-gray-50 cursor-pointer transition-colors border rounded-lg mb-2"
                  onClick={() => handleAlertClick(alert)}
                  actions={[
                    <Button 
                      key="schedule"
                      type="primary" 
                      size="small"
                      icon={<CalendarOutlined />}
                      onClick={(e) => handleScheduleClick(e, alert)}
                    >
                      Đặt lịch
                    </Button>,
                    <Button key="view" type="link" icon={<RightOutlined />} size="small" />
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        alert.isOverdue ? 'bg-red-100' : 'bg-yellow-100'
                      }`}>
                        {getAlertIcon(alert.alertType)}
                      </div>
                    }
                    title={
                      <div className="flex items-center gap-2 flex-wrap">
                        <Text strong>{alert.licensePlate}</Text>
                        <Tag color={alert.isOverdue ? 'error' : 'warning'}>
                          {alert.isOverdue ? 'Quá hạn' : 'Sắp đến hạn'}
                        </Tag>
                        <Tag color="blue">{getAlertTypeLabel(alert.alertType)}</Tag>
                      </div>
                    }
                    description={
                      <div className="flex items-center gap-2">
                        <Text type="secondary">{alert.description}</Text>
                        <Text type="secondary">•</Text>
                        <Text type={alert.isOverdue ? 'danger' : 'warning'}>
                          {getDaysLabel(alert.daysUntilDue)}
                        </Text>
                        <Text type="secondary">•</Text>
                        <Text type="secondary">{alert.dueDate}</Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
            {alerts.length > PAGE_SIZE && (
              <div className="flex justify-center mt-3">
                <Pagination
                  current={currentPage}
                  pageSize={PAGE_SIZE}
                  total={alerts.length}
                  onChange={setCurrentPage}
                  size="small"
                  showSizeChanger={false}
                />
              </div>
            )}
          </>
        )}
      </Card>

      {selectedVehicle && (
        <ScheduleMaintenanceModal
          visible={scheduleModalVisible}
          vehicleId={selectedVehicle.vehicleId}
          onCancel={() => {
            setScheduleModalVisible(false);
            setSelectedVehicle(null);
          }}
          onSuccess={handleScheduleSuccess}
        />
      )}
    </>
  );
};

export default VehicleInspectionAlerts;
