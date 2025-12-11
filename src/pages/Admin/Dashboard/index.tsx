import React, { useState, useCallback } from 'react';
import { Card, Row, Col, Typography, Tabs } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { UserOutlined, CarOutlined, DashboardOutlined } from '@ant-design/icons';
import { dashboardService } from '../../../services/dashboard';
import type { DashboardFilter, TimeRange, AdminDashboardResponse, TopPerformer, TrendDataPoint } from '../../../services/dashboard';
import type { PeriodType, RegistrationTimeSeries, TopStaff, TopDriver } from '../../../models/AdminDashboard';
import { StatsCards, RegistrationChart, TopPerformersChart, DeviceStatsCards, FleetTab, PenaltiesSummaryCards, PenaltiesTimeSeriesChart, FuelConsumptionChart, DeviceStatsCard, PenaltiesStatsCard, VehicleInspectionAlerts } from './widgets';
import { TimeRangeFilter, KpiCard, AiSummaryCard } from '../../Dashboard/components/widgets';

const { Title, Text } = Typography;

const AdminDashboard: React.FC = () => {
  const [filter, setFilter] = useState<DashboardFilter>({
    range: 'MONTH',
  });
  const [activeTab, setActiveTab] = useState<string>('overview');

  const handleTimeRangeChange = (range: TimeRange, from?: string, to?: string) => {
    setFilter({
      range,
      fromDate: from,
      toDate: to,
    });
  };

  // Type adapters to convert unified response to widget-specific types
  const adaptRegistrationData = useCallback((trendData: TrendDataPoint[] | undefined, role: string): RegistrationTimeSeries | null => {
    if (!trendData || trendData.length === 0) return null;
    
    // Filter out invalid data points and ensure proper structure
    const validPoints = trendData
      .filter(p => {
        // Check if label exists and is not empty
        const isValidLabel = p.label && p.label.trim() !== '';
        // Check if count is valid
        const isValidCount = p.count !== null && p.count !== undefined && p.count >= 0;
        return isValidLabel && isValidCount;
      })
      .map(p => ({
        date: p.label, // Use backend label directly (WEEK: "dd/MM", MONTH: "Tuần X", YEAR: "MM/yyyy")
        count: p.count
      }));
    
    if (validPoints.length === 0) return null;
    
    return {
      role,
      period: filter.range.toLowerCase() as PeriodType,
      points: validPoints
    };
  }, [filter.range]);

  const adaptTopStaff = (topPerformers: TopPerformer[] | undefined): TopStaff[] => {
    if (!topPerformers) return [];
    
    return topPerformers.map((staff, index) => ({
      staffId: staff.id,
      name: staff.name,
      email: '', // Email not available in TopPerformer, use empty string
      resolvedIssues: staff.orderCount || 0, // Provide default value for undefined
      avatarUrl: undefined
    }));
  };

  const adaptTopDrivers = (topPerformers: TopPerformer[] | undefined): TopDriver[] => {
    if (!topPerformers) return [];
    
    return topPerformers.map((driver, index) => ({
      driverId: driver.id,
      name: driver.name,
      email: '', // Email not available in TopPerformer, use empty string
      acceptedTrips: driver.orderCount || 0, // Provide default value for undefined
      avatarUrl: undefined
    }));
  };

  const adaptFleetHealth = (fleetHealth: any) => {
    if (!fleetHealth) return null;
    
    // Convert FleetHealthSummary to AdminDashboardSummary format for FleetTab
    return {
      period: filter.range.toLowerCase() as PeriodType,
      currentRange: { from: '', to: '' }, // Not used in FleetTab
      previousRange: { from: '', to: '' }, // Not used in FleetTab
      totals: {
        customers: { count: 0, deltaPercent: 0 }, // Not used in FleetTab
        staff: { count: 0, deltaPercent: 0 },
        drivers: { count: 0, deltaPercent: 0 }
      },
      fleetStatus: {
        totalVehicles: fleetHealth.totalVehicles,
        availableVehicles: fleetHealth.activeVehicles,
        inUseVehicles: fleetHealth.inUseVehicles || 0, // Use IN_TRANSIT vehicles
        inMaintenanceVehicles: fleetHealth.inMaintenanceVehicles,
        maintenanceAlerts: fleetHealth.upcomingMaintenances?.map((alert: any) => ({
          vehicleId: alert.vehicleId,
          licensePlate: alert.licensePlate,
          maintenanceType: alert.maintenanceType,
          scheduledDate: alert.dueDate,
          isOverdue: alert.isOverdue
        })) || []
      }
    };
  };

  // Single API call for all admin dashboard data
  const { data: dashboard, isLoading, refetch } = useQuery({
    queryKey: ['adminDashboard', filter],
    queryFn: () => dashboardService.getAdminDashboard(filter),
  });

  // Calculate total users from KPI summary
  const totalUsers = dashboard?.kpiSummary.newCustomers || 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <Title level={2} className="m-0 text-blue-800">
              Tổng quan hệ thống
            </Title>
            <Text type="secondary">Theo dõi thống kê và hiệu suất tổng thể</Text>
          </div>
          <TimeRangeFilter
            value={filter.range}
            onChange={handleTimeRangeChange}
            customFromDate={filter.fromDate}
            customToDate={filter.toDate}
          />
        </div>
      </div>

      {/* Stats Cards - User Statistics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title="Tổng người dùng"
            value={
              (dashboard?.registrationData?.customerRegistrations?.reduce((sum, point) => sum + point.count, 0) || 0) +
              (dashboard?.registrationData?.staffRegistrations?.reduce((sum, point) => sum + point.count, 0) || 0) +
              (dashboard?.registrationData?.driverRegistrations?.reduce((sum, point) => sum + point.count, 0) || 0)
            }
            prefix={<UserOutlined className="text-purple-500" />}
            loading={isLoading}
            borderColor="border-t-purple-500"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title="Tổng khách hàng"
            value={dashboard?.registrationData?.customerRegistrations?.reduce((sum, point) => sum + point.count, 0) || 0}
            prefix={<UserOutlined className="text-blue-500" />}
            loading={isLoading}
            borderColor="border-t-blue-500"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title="Tổng nhân viên"
            value={dashboard?.registrationData?.staffRegistrations?.reduce((sum, point) => sum + point.count, 0) || 0}
            prefix={<DashboardOutlined className="text-green-500" />}
            loading={isLoading}
            borderColor="border-t-green-500"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title="Tổng tài xế"
            value={dashboard?.registrationData?.driverRegistrations?.reduce((sum, point) => sum + point.count, 0) || 0}
            prefix={<CarOutlined className="text-orange-500" />}
            loading={isLoading}
            borderColor="border-t-orange-500"
          />
        </Col>
      </Row>

      {/* AI Summary - Full Row */}
      <div className="mb-6">
        <AiSummaryCard
          summary={dashboard?.aiSummary || ''}
          loading={isLoading}
        />
      </div>

      {/* Tabs Navigation */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        className="admin-dashboard-tabs"
        items={[
          {
            key: 'overview',
            label: (
              <span>
                <DashboardOutlined />
                Tổng quan
              </span>
            ),
            children: (
              <>
                {/* Customer Registrations Chart - Full Row */}
                <div className="mt-6 overflow-x-auto">
                  <RegistrationChart
                    data={adaptRegistrationData(dashboard?.registrationData?.customerRegistrations, 'customer')}
                    loading={isLoading}
                    title="Số khách hàng đăng ký theo thời gian"
                    color="#1890ff"
                    period={filter.range.toLowerCase() as PeriodType}
                  />
                </div>

                {/* Staff & Driver Registrations Charts - Same Row */}
                <Row gutter={[16, 16]} className="mt-6">
                  <Col xs={24} lg={12}>
                    <div className="overflow-x-auto">
                      <RegistrationChart
                        data={adaptRegistrationData(dashboard?.registrationData?.staffRegistrations, 'staff')}
                        loading={isLoading}
                        title="Số nhân viên đăng ký theo thời gian"
                        color="#52c41a"
                        period={filter.range.toLowerCase() as PeriodType}
                      />
                    </div>
                  </Col>
                  <Col xs={24} lg={12}>
                    <div className="overflow-x-auto">
                      <RegistrationChart
                        data={adaptRegistrationData(dashboard?.registrationData?.driverRegistrations, 'driver')}
                        loading={isLoading}
                        title="Số tài xế đăng ký theo thời gian"
                        color="#faad14"
                        period={filter.range.toLowerCase() as PeriodType}
                      />
                    </div>
                  </Col>
                </Row>

                {/* Top Performers - Full Row */}
                <Row gutter={[16, 16]} className="mt-6">
                  <Col xs={24} lg={12}>
                    <TopPerformersChart
                      data={adaptTopStaff(dashboard?.topStaff)}
                      loading={isLoading}
                      title="Top nhân viên xuất sắc"
                      color="#52c41a"
                      metricKey="resolvedIssues"
                      metricLabel="Sự cố giải quyết"
                    />
                  </Col>
                  <Col xs={24} lg={12}>
                    <TopPerformersChart
                      data={adaptTopDrivers(dashboard?.topDrivers)}
                      loading={isLoading}
                      title="Top tài xế xuất sắc"
                      color="#faad14"
                      metricKey="acceptedTrips"
                      metricLabel="Chuyến xe hoàn thành"
                    />
                  </Col>
                </Row>
              </>
            ),
          },
          {
            key: 'fleet',
            label: (
              <span>
                <CarOutlined />
                Đội xe
              </span>
            ),
            children: (
              <FleetTab 
                data={adaptFleetHealth(dashboard?.fleetHealth)} 
                isLoading={isLoading}
                handleNavigateToVehicle={(vehicleId) => {
                  // Navigate to vehicle detail page
                  console.log('Navigate to vehicle:', vehicleId);
                }}
              />
            ),
          },
          {
            key: 'operations',
            label: (
              <span>
                <DashboardOutlined />
                Vận hành
              </span>
            ),
            children: (
              <>
                {/* Device Statistics */}
                <div className="mt-6">
                  <DeviceStatsCard
                    data={dashboard?.deviceStatistics}
                    loading={isLoading}
                  />
                </div>

                {/* Fuel Consumption & Penalties Charts */}
                <Row gutter={[16, 16]} className="mt-6">
                  <Col xs={24} lg={12}>
                    <FuelConsumptionChart
                      data={dashboard?.fuelConsumptionStatistics}
                      loading={isLoading}
                    />
                  </Col>
                  <Col xs={24} lg={12}>
                    <PenaltiesStatsCard
                      data={dashboard?.penaltiesStatistics}
                      loading={isLoading}
                    />
                  </Col>
                </Row>

                {/* Vehicle Inspection Alerts */}
                <div className="mt-6">
                  <VehicleInspectionAlerts
                    data={dashboard?.vehicleInspectionAlerts}
                    loading={isLoading}
                    onScheduleSuccess={() => {
                      refetch();
                    }}
                  />
                </div>
              </>
            ),
          },
        ]}
      />
    </div>
  );
};

export default AdminDashboard;
