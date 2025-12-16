import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Row, 
  Col, 
  Card, 
  Typography, 
  Table, 
  Tag, 
  Progress, 
  Skeleton,
  Alert,
  Empty,
  List,
  Badge,
  Space,
  Button,
  Statistic,
  Tooltip,
  Pagination,
  Tabs
} from 'antd';
import {
  DollarOutlined,
  CarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  FileTextOutlined,
  ToolOutlined,
  AlertOutlined,
  ShoppingOutlined,
  TruckOutlined,
  RightOutlined,
  PhoneOutlined,
  BankOutlined,
  DashboardOutlined,
  TeamOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { AiSummaryCard, TimeRangeFilter, KpiCard, FloatingFilterBar } from './widgets';
import { TrendLineChart, DonutChart, ColumnChart, BarChart } from './charts';
import { dashboardService, type TimeRange, type StaffDashboardResponse, type IssueTypeTrend, type RefundTrend, type TopCustomerItem, type TopDriverItem } from '@/services/dashboard';
import { IssueTypeLabels, IssueType } from '@/constants/enums/IssueTypeEnum';
import { IssueStatusLabels, IssueEnum } from '@/constants/enums/IssueEnum';
import OrderStatusTag from '@/components/common/tags/OrderStatusTag';
import { OrderStatusEnum } from '@/constants/enums';

const { Title, Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'orange',
  ACTIVE: 'blue',
  IN_PROGRESS: 'processing',
  COMPLETED: 'green',
  CANCELLED: 'red',
  DELAYED: 'volcano',
};

const ISSUE_STATUS_COLORS: Record<string, string> = {
  OPEN: 'error',
  REPORTED: 'warning',
  IN_PROGRESS: 'processing',
  RESOLVED: 'success',
  CLOSED: 'default',
};

const formatCurrency = (rawValue?: number | null): string => {
  const value = typeof rawValue === 'number' && !Number.isNaN(rawValue) ? rawValue : 0;

  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)} tỷ`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)} tr`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  return value.toLocaleString('vi-VN');
};

const NewStaffDashboard: React.FC = () => {
  const navigate = useNavigate();
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('WEEK');
  const [customDates, setCustomDates] = useState<{ from?: string; to?: string }>({});
  
  // AbortController for AI summary requests
  const aiSummaryControllerRef = useRef<AbortController | null>(null);
  
  // Function to cancel current AI summary request
  const cancelCurrentAiSummaryRequest = () => {
    if (aiSummaryControllerRef.current) {
      aiSummaryControllerRef.current.abort();
      aiSummaryControllerRef.current = null;
    }
  };
  
  // Pagination states
  const [tripAlertsPage, setTripAlertsPage] = useState(1);
  const [pendingIssuesPage, setPendingIssuesPage] = useState(1);
  const [maintenanceAlertsPage, setMaintenanceAlertsPage] = useState(1);
  const [recentOrdersPage, setRecentOrdersPage] = useState(1);
  const [pendingOrdersPage, setPendingOrdersPage] = useState(1);
  const PAGE_SIZE = 3;
  
  // Tab state
  const [activeTab, setActiveTab] = useState('overview');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['staffDashboard', timeRange, customDates],
    queryFn: () => dashboardService.getStaffDashboard({
      range: timeRange,
      fromDate: customDates.from,
      toDate: customDates.to,
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes - refresh more frequently for operations
  });

  // Separate query for AI summary to avoid blocking main dashboard
  const { data: aiSummary, isLoading: isAiLoading, refetch: refetchAiSummary } = useQuery({
    queryKey: ['staffAiSummary', timeRange, customDates],
    queryFn: async () => {
      // Cancel previous request
      cancelCurrentAiSummaryRequest();
      
      // Create new AbortController for this request
      const controller = new AbortController();
      aiSummaryControllerRef.current = controller;
      
      try {
        const result = await dashboardService.getStaffAiSummary({
          range: timeRange,
          fromDate: customDates.from,
          toDate: customDates.to,
        }, controller.signal); // Pass abort signal to service
        
        // Only return result if request wasn't aborted
        if (!controller.signal.aborted) {
          return result;
        }
        return null;
      } catch (error) {
        // Don't treat abort as error
        if (error instanceof Error && error.name === 'AbortError') {
          return null;
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // AI summary can be cached longer
    retry: (failureCount, error) => {
      // Don't retry if request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        return false;
      }
      return failureCount < 2;
    },
    enabled: true,
  });

  const handleTimeRangeChange = (range: TimeRange, from?: string, to?: string) => {
    // Cancel pending AI summary request before changing filter
    cancelCurrentAiSummaryRequest();
    
    setTimeRange(range);
    if (range === 'CUSTOM') {
      setCustomDates({ from, to });
    } else {
      setCustomDates({});
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelCurrentAiSummaryRequest();
    };
  }, []);

  // Trip status data for donut chart
  const tripStatusData = data?.tripStatusDistribution
    ? Object.entries(data.tripStatusDistribution).map(([status, count]) => ({
        type: getTripStatusLabel(status),
        value: count as number,
        color: STATUS_COLORS[status] || '#6b7280',
      }))
    : [];

  // Issue category data for donut chart
  const issueCategoryData = data?.issueSummary?.issuesByCategory
    ? Object.entries(data.issueSummary.issuesByCategory).map(([category, count]) => ({
        type: getIssueCategoryLabel(category),
        value: count as number,
      }))
    : [];

  // Fleet utilization data for column chart
  const fleetUtilizationData = [
    { category: 'Đang dùng', value: data?.fleetStatus?.inUseVehicles || 0, type: 'Đang dùng' },
    { category: 'Sẵn sàng', value: data?.fleetStatus?.availableVehicles || 0, type: 'Sẵn sàng' },
    { category: 'Bảo dưỡng', value: data?.fleetStatus?.inMaintenanceVehicles || 0, type: 'Bảo dưỡng' },
  ];

  const totalTrips = tripStatusData.reduce((sum, item) => sum + item.value, 0);

  // === NEW DATA TRANSFORMATIONS FOR ENHANCED DASHBOARD ===

  // Trip completion trend data for line chart
  const tripCompletionTrendData = data?.tripCompletionTrend?.map(item => ({
    label: item.date,
    date: item.date,
    value: item.completedTrips,
    category: 'Hoàn thành',
  })) || [];

  // Issue type trend data for multi-line chart
  const issueTypeTrendData = data?.issueTypeTrend?.map(item => ({
    label: item.date,
    date: item.date,
    value: item.count,
    category: getIssueCategoryLabel(item.issueType),
  })) || [];

  // Contract trend data for line chart (multi-line: paid vs cancelled)
  const contractTrendData = data?.contractTrend?.flatMap(item => [
    { label: item.date, date: item.date, value: item.paidCount, category: 'Đã thanh toán' },
    { label: item.date, date: item.date, value: item.cancelledCount, category: 'Đã hủy' },
  ]) || [];

  // Transaction trend data for line chart
  const transactionTrendData = data?.transactionTrend?.map(item => ({
    label: item.date,
    date: item.date,
    value: Number(item.paidAmount),
  })) || [];

  // Revenue vs Compensation trend data for multi-line chart
  const revenueCompensationTrendData = data?.revenueCompensationTrend?.flatMap(item => [
    { label: item.date, date: item.date, value: Number(item.revenue), category: 'Doanh thu' },
    { label: item.date, date: item.date, value: Number(item.compensation), category: 'Đền bù' },
  ]) || [];

  // Refund trend data for multi-line chart (count + amount)
  const refundTrendData = data?.refundTrend?.flatMap(item => [
    { label: item.date, date: item.date, value: item.refundCount, category: 'Số giao dịch' },
    { label: item.date, date: item.date, value: Number(item.refundAmount), category: 'Giá trị (₫)' },
  ]) || [];

  // Package status trend data for multi-line chart (like customer)
  const packageTrendLineData = data?.packageStatusTrend?.flatMap(item => [
    { date: item.date, label: item.date, value: item.inTransit, category: 'Đang vận chuyển' },
    { date: item.date, label: item.date, value: item.delivered, category: 'Đã giao' },
    { date: item.date, label: item.date, value: item.cancelled, category: 'Đã hủy' },
    { date: item.date, label: item.date, value: item.problem, category: 'Có vấn đề' },
  ]) || [];

  // Navigation handlers
  const handleNavigateToIssue = (issueId: string) => {
    navigate(`/staff/issues/${issueId}`);
  };

  const handleNavigateToVehicle = (vehicleId: string) => {
    navigate(`/staff/vehicle/${vehicleId}`);
  };

  const handleNavigateToOrder = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  // Show floating filter bar when header filter is out of viewport
  const [showFloatingFilter, setShowFloatingFilter] = useState(false);

  useEffect(() => {
    const target = headerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const headerVisible = entry.isIntersecting;
        const hasUserScrolled = window.scrollY > 0;
        setShowFloatingFilter(!headerVisible && hasUserScrolled);
      },
      {
        root: null,
        threshold: 0.1,
      }
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, []);

  if (isError) {
    return (
      <div className="p-6">
        <Alert
          message="Lỗi tải dữ liệu"
          description="Không thể tải dữ liệu dashboard. Vui lòng thử lại sau."
          type="error"
          showIcon
          action={
            <Button onClick={() => refetch()} icon={<ReloadOutlined />} type="link">
              Thử lại
            </Button>
          }
        />
      </div>
    );
  }

  // Count pending orders
  const pendingOrdersCount = data?.pendingOrders?.length || 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div ref={headerRef} className="mb-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <Title level={2} className="m-0 text-blue-800">
              <CarOutlined className="mr-2" />
              Vận hành & Hỗ trợ
            </Title>
            <Text type="secondary">Theo dõi hoạt động vận chuyển và hỗ trợ khách hàng</Text>
          </div>
          <TimeRangeFilter
            value={timeRange}
            onChange={handleTimeRangeChange}
            customFromDate={customDates.from}
            customToDate={customDates.to}
          />
        </div>
      </div>

      {/* Floating vertical filter bar (right side) */}
      {showFloatingFilter && (
        <FloatingFilterBar
          value={timeRange}
          onChange={(range) => handleTimeRangeChange(range)}
        />
      )}

      {/* AI Summary */}
      <AiSummaryCard summary={aiSummary || ''} loading={isAiLoading} />

      {/* Tabs Navigation */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        className="staff-dashboard-tabs"
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
                {/* Operational KPI Cards */}
                <div className="mb-6" style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <KpiCard
                      title="Tổng chuyến"
                      value={data?.operationalSummary?.totalTrips || 0}
                      prefix={<CarOutlined className="text-blue-500" />}
                      loading={isLoading}
                      borderColor="border-t-blue-500"
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <KpiCard
                      title="Đang hoạt động"
                      value={data?.operationalSummary?.activeTrips || 0}
                      prefix={<ClockCircleOutlined className="text-green-500" />}
                      loading={isLoading}
                      borderColor="border-t-green-500"
                      valueStyle={{ color: '#22c55e' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <KpiCard
                      title="Hoàn thành"
                      value={data?.operationalSummary?.completedTrips || 0}
                      prefix={<CheckCircleOutlined className="text-emerald-500" />}
                      loading={isLoading}
                      borderColor="border-t-emerald-500"
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <KpiCard
                      title="Sự cố đang mở"
                      value={data?.issueSummary?.openIssues || 0}
                      prefix={<ExclamationCircleOutlined className="text-orange-500" />}
                      loading={isLoading}
                      borderColor="border-t-orange-500"
                      valueStyle={{ color: data?.issueSummary?.openIssues ? '#f59e0b' : undefined }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <KpiCard
                      title="Sự cố đang xử lý"
                      value={data?.issueSummary?.inProgressIssues || 0}
                      prefix={<ToolOutlined className="text-blue-500" />}
                      loading={isLoading}
                      borderColor="border-t-blue-500"
                      valueStyle={{ color: data?.issueSummary?.inProgressIssues ? '#3b82f6' : undefined }}
                    />
                  </div>
                </div>

                {/* Package Summary */}
                <Row gutter={[16, 16]} className="mb-6">
                  <Col span={24}>
                    <Card
                      title={
                        <span className="text-blue-800">
                          <ShoppingOutlined className="mr-2" />
                          Thống kê kiện hàng
                        </span>
                      }
                      className="shadow-sm"
                    >
                      {isLoading ? (
                        <Skeleton active paragraph={{ rows: 2 }} />
                      ) : (
                        <Row gutter={[16, 16]}>
                          <Col xs={12} sm={8} lg={4}>
                            <Statistic
                              title="Tổng đơn hàng"
                              value={data?.packageSummary?.totalOrders || 0}
                              prefix={<FileTextOutlined className="text-blue-500" />}
                            />
                          </Col>
                          <Col xs={12} sm={8} lg={4}>
                            <Statistic
                              title="Tổng kiện hàng"
                              value={data?.packageSummary?.totalOrderDetails || 0}
                              prefix={<ShoppingOutlined className="text-purple-500" />}
                            />
                          </Col>
                          <Col xs={12} sm={8} lg={4}>
                            <Statistic
                              title="Đang vận chuyển"
                              value={data?.packageSummary?.inTransitPackages || 0}
                              valueStyle={{ color: '#3b82f6' }}
                              prefix={<TruckOutlined />}
                            />
                          </Col>
                          <Col xs={12} sm={8} lg={4}>
                            <Statistic
                              title="Đã giao"
                              value={data?.packageSummary?.deliveredPackages || 0}
                              valueStyle={{ color: '#22c55e' }}
                              prefix={<CheckCircleOutlined />}
                            />
                          </Col>
                          <Col xs={12} sm={8} lg={4}>
                            <Statistic
                              title="Gặp sự cố"
                              value={data?.packageSummary?.problemPackages || 0}
                              valueStyle={{ color: '#ef4444' }}
                              prefix={<WarningOutlined />}
                            />
                          </Col>
                          <Col xs={12} sm={8} lg={4}>
                            <Statistic
                              title="Tỉ lệ thành công"
                              value={data?.packageSummary?.successRate || 0}
                              suffix="%"
                              valueStyle={{ color: (data?.packageSummary?.successRate || 0) >= 80 ? '#22c55e' : '#f59e0b' }}
                            />
                          </Col>
                        </Row>
                      )}
                    </Card>
                  </Col>
                </Row>
                {/* Recent Orders - Full width section above */}
                <Row gutter={[16, 16]} className="mb-6">
                  <Col span={24}>
                    <Card 
                      title={
                        <span className="text-blue-800">
                          <FileTextOutlined className="mr-2" />
                          Đơn hàng gần đây
                        </span>
                      }
                      className="shadow-sm"
                      bodyStyle={{ padding: 0 }}
                    >
                      {isLoading ? (
                        <div className="p-4"><Skeleton active paragraph={{ rows: 5 }} /></div>
                      ) : data?.recentOrders && data.recentOrders.length > 0 ? (
                        <>
                          <List
                            dataSource={data.recentOrders.slice((recentOrdersPage - 1) * PAGE_SIZE, recentOrdersPage * PAGE_SIZE)}
                            renderItem={(order) => (
                              <List.Item 
                                className="!py-3 !px-4 hover:bg-gray-50 cursor-pointer transition-colors border-b"
                                onClick={() => handleNavigateToOrder(order.orderId)}
                                actions={[
                                  <Button type="link" icon={<RightOutlined />} size="small" />
                                ]}
                              >
                                <List.Item.Meta
                                  avatar={
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${order.hasIssue ? 'bg-red-100' : 'bg-blue-100'}`}>
                                      {order.hasIssue ? <WarningOutlined className="text-red-500" /> : <FileTextOutlined className="text-blue-500" />}
                                    </div>
                                  }
                                  title={
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Text strong>{order.orderCode}</Text>
                                      <OrderStatusTag status={order.status as OrderStatusEnum} />
                                      {order.hasIssue && <Tag color="error">Có sự cố</Tag>}
                                    </div>
                                  }
                                  description={
                                    <div>
                                      <Text type="secondary" className="text-sm">{order.senderName || order.senderCompany}</Text>
                                      <Text type="secondary" className="text-sm ml-2">
                                        • {order.deliveredPackages}/{order.totalPackages} kiện đã giao
                                      </Text>
                                    </div>
                                  }
                                />
                              </List.Item>
                            )}
                          />
                          {data.recentOrders.length > PAGE_SIZE && (
                            <div className="p-3 flex justify-center border-t">
                              <Pagination
                                current={recentOrdersPage}
                                pageSize={PAGE_SIZE}
                                total={data.recentOrders.length}
                                onChange={setRecentOrdersPage}
                                size="small"
                                showSizeChanger={false}
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <Empty description="Không có đơn hàng" className="py-8" />
                      )}
                    </Card>
                  </Col>

                </Row>

                {/* Pending Orders (PROCESSING, ON_PLANNING) */}
                {pendingOrdersCount > 0 && (
                  <Row gutter={[16, 16]} className="mb-6">
                    <Col span={24}>
                      <Card 
                        title={
                          <span className="text-blue-800">
                            <FileTextOutlined className="mr-2" />
                            Đơn hàng cần xử lý
                          </span>
                        }
                        extra={<Badge count={pendingOrdersCount} />}
                        className="shadow-sm"
                        bodyStyle={{ padding: 0 }}
                      >
                        <List
                          dataSource={data?.pendingOrders?.slice((pendingOrdersPage - 1) * PAGE_SIZE, pendingOrdersPage * PAGE_SIZE)}
                          renderItem={(order) => (
                            <List.Item 
                              className="!py-3 !px-4 hover:bg-gray-50 cursor-pointer transition-colors border-b"
                              onClick={() => handleNavigateToOrder(order.orderId)}
                              actions={[
                                <Button type="link" icon={<RightOutlined />} size="small" />
                              ]}
                            >
                              <List.Item.Meta
                                avatar={
                                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100">
                                    <ClockCircleOutlined className="text-orange-500" />
                                  </div>
                                }
                                title={
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Text strong>{order.orderCode}</Text>
                                    <OrderStatusTag status={order.status as OrderStatusEnum} />
                                    <Text type="secondary" className="text-xs">{order.totalPackages} kiện</Text>
                                  </div>
                                }
                                description={
                                  <div>
                                    <div className="flex items-center gap-1">
                                      <UserOutlined className="text-gray-400" />
                                      <Text type="secondary" className="text-sm">{order.senderName || order.senderCompany}</Text>
                                      {order.senderPhone && (
                                        <>
                                          <PhoneOutlined className="text-gray-400 ml-2" />
                                          <Text type="secondary" className="text-sm">{order.senderPhone}</Text>
                                        </>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 mt-1">
                                      <EnvironmentOutlined className="text-gray-400" />
                                      <Text type="secondary" className="text-xs line-clamp-1">{order.pickupAddress}</Text>
                                    </div>
                                  </div>
                                }
                              />
                            </List.Item>
                          )}
                        />
                        {pendingOrdersCount > PAGE_SIZE && (
                          <div className="p-3 flex justify-center border-t">
                            <Pagination
                              current={pendingOrdersPage}
                              pageSize={PAGE_SIZE}
                              total={pendingOrdersCount}
                              onChange={setPendingOrdersPage}
                              size="small"
                              showSizeChanger={false}
                            />
                          </div>
                        )}
                      </Card>
                    </Col>
                  </Row>
                )}

                {/* Trip Alerts & Pending Issues */}
                <Row gutter={[16, 16]} className="mb-6">
                  {/* Trip Alerts */}
                  <Col xs={24} lg={12}>
                    <Card 
                      title={
                        <span className="text-blue-800">
                          <AlertOutlined className="mr-2" />
                          Cảnh báo chuyến xe
                        </span>
                      }
                      extra={
                        data?.tripAlerts && data.tripAlerts.length > 0 && (
                          <Badge count={data.tripAlerts.length} />
                        )
                      }
                      className="shadow-sm h-full"
                      bodyStyle={{ padding: 0 }}
                    >
                      {isLoading ? (
                        <div className="p-4"><Skeleton active paragraph={{ rows: 5 }} /></div>
                      ) : data?.tripAlerts && data.tripAlerts.length > 0 ? (
                        <>
                          <List
                            dataSource={data.tripAlerts.slice((tripAlertsPage - 1) * PAGE_SIZE, tripAlertsPage * PAGE_SIZE)}
                            renderItem={(alert) => (
                              <List.Item 
                                className="!py-3 !px-4 hover:bg-gray-50 cursor-pointer transition-colors border-b"
                                onClick={() => alert.issueId && handleNavigateToIssue(alert.issueId)}
                                actions={[
                                  <Button type="link" icon={<RightOutlined />} size="small" />
                                ]}
                              >
                                <List.Item.Meta
                                  avatar={<div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100"><AlertOutlined className="text-red-500" /></div>}
                                  title={
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Text strong>{alert.trackingCode}</Text>
                                      <Text type="secondary" className="text-xs">{alert.vehiclePlate}</Text>
                                      <Tag color={alert.alertType === 'ISSUE_REPORTED' ? 'error' : 'warning'}>
                                        {alert.alertType === 'ISSUE_REPORTED' ? 'Sự cố' : 'Cảnh báo'}
                                      </Tag>
                                    </div>
                                  }
                                  description={
                                    <Text type="secondary" className="text-sm">
                                      {alert.message || `Tài xế: ${alert.driverName}`}
                                    </Text>
                                  }
                                />
                              </List.Item>
                            )}
                          />
                          {data.tripAlerts.length > PAGE_SIZE && (
                            <div className="p-3 flex justify-center border-t">
                              <Pagination
                                current={tripAlertsPage}
                                pageSize={PAGE_SIZE}
                                total={data.tripAlerts.length}
                                onChange={setTripAlertsPage}
                                size="small"
                                showSizeChanger={false}
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <Empty description="Không có cảnh báo" image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-8" />
                      )}
                    </Card>
                  </Col>

                  {/* Pending Issues */}
                  <Col xs={24} lg={12}>
                    <Card 
                      title={
                        <span className="text-blue-800">
                          <ExclamationCircleOutlined className="mr-2" />
                          Sự cố cần xử lý
                        </span>
                      }
                      extra={
                        <Space>
                          <Badge status="error" text={`${data?.issueSummary?.openIssues || 0} mở`} />
                          <Badge status="processing" text={`${data?.issueSummary?.inProgressIssues || 0} đang xử lý`} />
                        </Space>
                      }
                      className="shadow-sm h-full"
                      bodyStyle={{ padding: 0 }}
                    >
                      {isLoading ? (
                        <div className="p-4"><Skeleton active paragraph={{ rows: 5 }} /></div>
                      ) : data?.pendingIssues && data.pendingIssues.length > 0 ? (
                        <>
                          <List
                            dataSource={data.pendingIssues.slice((pendingIssuesPage - 1) * 5, pendingIssuesPage * 5)}
                            renderItem={(issue) => (
                              <List.Item 
                                className="!py-3 !px-4 hover:bg-gray-50 cursor-pointer transition-colors border-b"
                                onClick={() => handleNavigateToIssue(issue.issueId)}
                                actions={[
                                  <Button type="link" icon={<RightOutlined />} size="small" />
                                ]}
                              >
                                <List.Item.Meta
                                  avatar={
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${issue.isUrgent ? 'bg-red-100' : 'bg-orange-100'}`}>
                                      {issue.isUrgent ? <WarningOutlined className="text-red-500" /> : <ExclamationCircleOutlined className="text-orange-500" />}
                                    </div>
                                  }
                                  title={
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Text strong>{issue.tripTrackingCode || issue.orderCode || '-'}</Text>
                                      <Tag>{getIssueCategoryLabel(issue.category)}</Tag>
                                      <Tag color={ISSUE_STATUS_COLORS[issue.status] || 'default'}>
                                        {getIssueStatusLabel(issue.status)}
                                      </Tag>
                                    </div>
                                  }
                                  description={
                                    <Text type="secondary" className="text-sm line-clamp-1">
                                      {issue.description || 'Không có mô tả'}
                                    </Text>
                                  }
                                />
                              </List.Item>
                            )}
                          />
                          {data.pendingIssues.length > 5 && (
                            <div className="p-3 flex justify-center border-t">
                              <Pagination
                                current={pendingIssuesPage}
                                pageSize={5}
                                total={data.pendingIssues.length}
                                onChange={setPendingIssuesPage}
                                size="small"
                                showSizeChanger={false}
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <Empty description="Không có sự cố cần xử lý" className="py-8" />
                      )}
                    </Card>
                  </Col>
                </Row>


                {/* Top Customers & Top Drivers */}
                <Row gutter={[16, 16]} className="mb-6">
                  {/* Top Customers */}
                  <Col xs={24} lg={12}>
                    <Card 
                      title={
                        <span className="text-blue-800">
                          <TeamOutlined className="mr-2" />
                          Top khách hàng
                        </span>
                      }
                      className="shadow-sm"
                    >
                      {isLoading ? (
                        <Skeleton active paragraph={{ rows: 8 }} />
                      ) : data?.topCustomers && data.topCustomers.length > 0 ? (
                        <div className="space-y-4">
                          <Table
                            dataSource={data.topCustomers}
                            rowKey="customerId"
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
                                title: 'Khách hàng',
                                dataIndex: 'customerName',
                                ellipsis: true,
                                render: (name: string, record: TopCustomerItem) => (
                                  <div>
                                    <Text strong>{name || record.companyName}</Text>
                                    {record.companyName && name && (
                                      <div><Text type="secondary" className="text-xs">{record.companyName}</Text></div>
                                    )}
                                  </div>
                                ),
                              },
                              // {
                              //   title: 'Kiện thành công',
                              //   dataIndex: 'totalPackages',
                              //   align: 'center' as const,
                              //   width: 120,
                              //   render: (value: number) => {
                              //     const safeValue = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
                              //     return <Tag color="blue">{safeValue.toLocaleString('vi-VN')}</Tag>;
                              //   },
                              // },
                              {
                                title: 'Doanh thu',
                                dataIndex: 'totalRevenue',
                                align: 'right' as const,
                                width: 100,
                                render: (value: number) => (
                                  <Text className="text-green-600 font-semibold">
                                    {formatCurrency(value || 0)}₫
                                  </Text>
                                ),
                              },
                            ]}
                          />
                          <div className="pt-4 border-t">
                            <BarChart
                              data={data.topCustomers.map((c: TopCustomerItem, index: number) => ({
                                category: `${c.customerName || c.companyName} #${index + 1}`,
                                value: c.totalRevenue,
                              }))}
                              height={250}
                              yAxisLabel="Doanh thu (₫)"
                              color="#10b981"
                              formatter={(v) => formatCurrency(v) + '₫'}
                            />
                          </div>
                        </div>
                      ) : (
                        <Empty description="Không có dữ liệu" />
                      )}
                    </Card>
                  </Col>

                  {/* Top Drivers */}
                  <Col xs={24} lg={12}>
                    <Card 
                      title={
                        <span className="text-blue-800">
                          <UserOutlined className="mr-2" />
                          Top tài xế
                        </span>
                      }
                      className="shadow-sm"
                    >
                      {isLoading ? (
                        <Skeleton active paragraph={{ rows: 8 }} />
                      ) : data?.topDrivers && data.topDrivers.length > 0 ? (
                        <div className="space-y-4">
                          <Table
                            dataSource={data.topDrivers}
                            rowKey="driverId"
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
                                title: 'Tài xế',
                                dataIndex: 'driverName',
                                ellipsis: true,
                                render: (name: string, record: TopDriverItem) => (
                                  <div>
                                    <Text strong>{name}</Text>
                                    {record.phone && (
                                      <div>
                                        <Text type="secondary" className="text-xs">
                                          <PhoneOutlined className="mr-1" />
                                          {record.phone}
                                        </Text>
                                      </div>
                                    )}
                                  </div>
                                ),
                              },
                              {
                                title: 'Chuyến hoàn thành',
                                dataIndex: 'completedTrips',
                                align: 'center' as const,
                                width: 140,
                                render: (value: number) => (
                                  <Tag color="green">{value}</Tag>
                                ),
                              },
                            ]}
                          />
                          <div className="pt-4 border-t">
                            <BarChart
                              data={data.topDrivers.map((d: TopDriverItem, index: number) => ({
                                category: `${d.driverName} #${index + 1}`,
                                value: d.completedTrips,
                              }))}
                              height={250}
                              yAxisLabel="Số chuyến"
                              color="#3b82f6"
                            />
                          </div>
                        </div>
                      ) : (
                        <Empty description="Không có dữ liệu" />
                      )}
                    </Card>
                  </Col>
                </Row>
              </>
            ),
          },
          {
            key: 'operations',
            label: (
              <span>
                <TruckOutlined />
                Vận hành
              </span>
            ),
            children: (
              <>
                {/* Trip Completion Trend */}
                <Row gutter={[16, 16]} className="mb-6">
                  <Col span={24}>
                    <TrendLineChart
                      data={tripCompletionTrendData}
                      title="Số chuyến hoàn thành theo thời gian"
                      loading={isLoading}
                      yAxisLabel="Số chuyến"
                      isCurrency={false}
                      showArea={true}
                      color="#22c55e"
                    />
                  </Col>
                </Row>

                {/* Issue Type Trend */}
                <Row gutter={[16, 16]} className="mb-6">
                  <Col span={24}>
                    <TrendLineChart
                      data={issueTypeTrendData}
                      title="Phân loại sự cố theo thời gian"
                      loading={isLoading}
                      yAxisLabel="Số sự cố"
                      isCurrency={false}
                    />
                  </Col>
                </Row>

                {/* Package Status Trend */}
                <Row gutter={[16, 16]} className="mb-6">
                  <Col span={24}>
                    <TrendLineChart
                      data={packageTrendLineData}
                      title="Xu hướng trạng thái kiện hàng"
                      loading={isLoading}
                      yAxisLabel="Số kiện"
                      isCurrency={false}
                    />
                  </Col>
                </Row>

                {/* Driver Performance section removed */}
              </>
            ),
          },
          {
            key: 'finance',
            label: (
              <span>
                <DollarOutlined />
                Tài chính
              </span>
            ),
            children: (
              <>
                {/* Revenue vs Compensation Trend */}
                <Row gutter={[16, 16]} className="mb-6">
                  <Col span={24}>
                    <TrendLineChart
                      data={revenueCompensationTrendData}
                      title="Doanh thu & Đền bù theo thời gian"
                      loading={isLoading}
                      yAxisLabel="Giá trị (₫)"
                      isCurrency={true}
                      showArea={false}
                    />
                  </Col>
                </Row>

                {/* Contract & Transaction Trends */}
                <Row gutter={[16, 16]} className="mb-6">
                  <Col xs={24} lg={12}>
                    <TrendLineChart
                      data={contractTrendData}
                      title="Xu hướng hợp đồng"
                      loading={isLoading}
                      yAxisLabel="Số hợp đồng"
                      isCurrency={false}
                    />
                  </Col>
                  <Col xs={24} lg={12}>
                    <TrendLineChart
                      data={transactionTrendData}
                      title="Xu hướng giao dịch"
                      loading={isLoading}
                      yAxisLabel="Giá trị (₫)"
                      isCurrency={true}
                      showArea={true}
                      color="#3b82f6"
                    />
                  </Col>
                </Row>

                {/* Refund Trend & Financial Summary */}
                <Row gutter={[16, 16]} className="mb-6">
                  <Col xs={24} lg={12}>
                    <TrendLineChart
                      data={refundTrendData}
                      title="Thống kê hoàn tiền"
                      loading={isLoading}
                      yAxisLabel="Số lượng / Giá trị"
                      isCurrency={false}
                    />
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card 
                      title={
                        <span className="text-blue-800">
                          <DollarOutlined className="mr-2" />
                          Tổng quan tài chính
                        </span>
                      }
                      className="shadow-sm"
                    >
                      {isLoading ? (
                        <Skeleton active paragraph={{ rows: 5 }} />
                      ) : (
                        <div className="space-y-4">
                          {/* Revenue & Compensation Summary */}
                          <Row gutter={16}>
                            <Col span={12}>
                              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="text-2xl font-bold text-green-600">
                                  {formatCurrency(data?.financialSummary?.transactionAmount || 0)}đ
                                </div>
                                <Text type="secondary" className="text-sm">💰 Tổng tiền thu</Text>
                              </div>
                            </Col>
                            <Col span={12}>
                              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                                <div className="text-2xl font-bold text-red-600">
                                  {formatCurrency(data?.financialSummary?.totalRefunded || 0)}đ
                                </div>
                                <Text type="secondary" className="text-sm">🔄 Tổng đền bù</Text>
                              </div>
                            </Col>
                          </Row>

                          {/* Contract Stats */}
                          <Row gutter={16}>
                            <Col span={8}>
                              <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <div className="text-xl font-bold text-blue-600">
                                  {data?.financialSummary?.totalContracts || 0}
                                </div>
                                <Text type="secondary" className="text-xs">Hợp đồng</Text>
                              </div>
                            </Col>
                            <Col span={8}>
                              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                <div className="text-xl font-bold text-yellow-600">
                                  {data?.financialSummary?.pendingContracts || 0}
                                </div>
                                <Text type="secondary" className="text-xs">Chờ ký</Text>
                              </div>
                            </Col>
                            <Col span={8}>
                              <div className="text-center p-3 bg-green-50 rounded-lg">
                                <div className="text-xl font-bold text-green-600">
                                  {data?.financialSummary?.paidContracts || 0}
                                </div>
                                <Text type="secondary" className="text-xs">Hoàn thành</Text>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      )}
                    </Card>
                  </Col>
                </Row>
              </>
            ),
          },
        ]}
      />
    </div>
  );
};

// Helper functions
function getTripStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Chờ xử lý',
    ACTIVE: 'Đang hoạt động',
    IN_PROGRESS: 'Đang thực hiện',
    PICKING_UP: 'Đang lấy hàng',
    DELIVERING: 'Đang giao hàng',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
    DELAYED: 'Trễ hẹn',
  };
  return labels[status] || status;
}

function getIssueCategoryLabel(category: string): string {
  // Use IssueTypeLabels from enum if available
  const enumLabels: Record<string, string> = {
    SEAL_REPLACEMENT: 'Thay thế seal',
    DAMAGE: 'Hư hỏng hàng hóa',
    PENALTY: 'Vi phạm giao thông',
    ORDER_REJECTION: 'Từ chối đơn hàng',
    REROUTE: 'Điều hướng lại',
    OFF_ROUTE_RUNAWAY: 'Lệch tuyến bỏ trốn',
    // Legacy labels
    DAMAGED: 'Hàng hư hỏng',
    LOST: 'Mất hàng',
    DELAY: 'Giao trễ',
    WRONG_ADDRESS: 'Sai địa chỉ',
    CUSTOMER_COMPLAINT: 'Khiếu nại',
    VEHICLE_ISSUE: 'Sự cố xe',
    OTHER: 'Khác',
  };
  return enumLabels[category] || category;
}

function getIssueStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    OPEN: 'Mở',
    REPORTED: 'Đã báo cáo',
    IN_PROGRESS: 'Đang xử lý',
    RESOLVED: 'Đã giải quyết',
    CLOSED: 'Đã đóng',
  };
  return labels[status] || status;
}

export default NewStaffDashboard; 
