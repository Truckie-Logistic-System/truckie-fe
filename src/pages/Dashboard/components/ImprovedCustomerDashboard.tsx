import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Row, 
  Col, 
  Card, 
  Typography, 
  Table, 
  Tag, 
  Skeleton,
  Alert,
  Empty,
  List,
  Button,
  Tooltip,
  Statistic,
  Space,
  Progress,
  Tabs,
  Pagination
} from 'antd';
import {
  DollarOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  FileTextOutlined,
  TruckOutlined,
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  RightOutlined,
  EditOutlined,
  CreditCardOutlined,
  RollbackOutlined,
  DashboardOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import { AiSummaryCard, TimeRangeFilter, KpiCard, FloatingFilterBar } from './widgets';
import { TrendLineChart, DonutChart, ColumnChart } from './charts';
import { dashboardService, type TimeRange, type CustomerDashboardResponse, type TopRecipient, type ActionItem } from '@/services/dashboard';
import OrderStatusTag from '@/components/common/tags/OrderStatusTag';
import { OrderStatusEnum, OrderStatusLabels } from '@/constants/enums';

const { Title, Text } = Typography;

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

// Helper function to get action icon
const getActionIcon = (type: string) => {
  switch (type) {
    case 'CONTRACT_SIGN':
      return <EditOutlined className="text-orange-500" />;
    case 'DEPOSIT_PAYMENT':
      return <CreditCardOutlined className="text-blue-500" />;
    case 'FULL_PAYMENT':
      return <DollarOutlined className="text-purple-500" />;
    case 'RETURN_FEE_PAYMENT':
      return <RollbackOutlined className="text-red-500" />;
    default:
      return <FileTextOutlined className="text-gray-500" />;
  }
};

// Helper function to get action color
const getActionColor = (type: string) => {
  switch (type) {
    case 'CONTRACT_SIGN':
      return 'orange';
    case 'DEPOSIT_PAYMENT':
      return 'blue';
    case 'FULL_PAYMENT':
      return 'purple';
    case 'RETURN_FEE_PAYMENT':
      return 'red';
    default:
      return 'default';
  }
};

// Format deadline with full date and time (input like '2025-12-05 22:17:01.479')
const formatDeadline = (deadline: string | undefined): string => {
  if (!deadline) return '';
  try {
    let normalized = deadline.trim();

    // Nếu là dạng 'yyyy-MM-dd HH:mm:ss.SSS' thì chuyển sang ISO để new Date hiểu đúng
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(normalized)) {
      normalized = normalized.replace(' ', 'T'); // 2025-12-05T22:17:01.479
    }

    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) {
      return deadline;
    }

    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Ho_Chi_Minh',
    });
  } catch {
    return deadline;
  }
};

// Get action title based on type
const getActionTitle = (type: string): string => {
  switch (type) {
    case 'CONTRACT_SIGN':
      return 'Ký hợp đồng & đặt cọc';
    case 'DEPOSIT_PAYMENT':
      return 'Thanh toán đặt cọc';
    case 'FULL_PAYMENT':
      return 'Thanh toán toàn bộ';
    case 'RETURN_FEE_PAYMENT':
      return 'Thanh toán cước trả hàng';
    default:
      return 'Thực hiện';
  }
};

// Get Vietnamese label for current time range
const getTimeRangeLabel = (range: TimeRange, custom?: { from?: string; to?: string }): string => {
  switch (range) {
    case 'WEEK':
      return '7 ngày gần đây';
    case 'MONTH':
      return 'Tháng này';
    case 'YEAR':
      return 'Năm nay';
    case 'CUSTOM': {
      const from = custom?.from ? new Date(custom.from).toLocaleDateString('vi-VN') : '';
      const to = custom?.to ? new Date(custom.to).toLocaleDateString('vi-VN') : '';
      if (from && to) return `Tùy chỉnh: ${from} - ${to}`;
      if (from) return `Từ ${from}`;
      if (to) return `Đến ${to}`;
      return 'Khoảng thời gian tùy chỉnh';
    }
    default:
      return 'Khoảng thời gian';
  }
};

const ImprovedCustomerDashboard: React.FC = () => {
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
  const [actionsPage, setActionsPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);
  const [recentIssuesPage, setRecentIssuesPage] = useState(1);
  const [topRecipientsPage, setTopRecipientsPage] = useState(1);
  const PAGE_SIZE = 3;
  
  // Tab state
  const [activeTab, setActiveTab] = useState('overview');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['customerDashboard', timeRange, customDates],
    queryFn: () => dashboardService.getCustomerDashboard({
      range: timeRange,
      fromDate: customDates.from,
      toDate: customDates.to,
    }),
    staleTime: 3 * 60 * 1000,
  });

  // Separate query for AI summary to avoid blocking main dashboard
  const { data: aiSummary, isLoading: isAiLoading, refetch: refetchAiSummary } = useQuery({
    queryKey: ['customerAiSummary', timeRange, customDates],
    queryFn: async () => {
      // Cancel previous request
      cancelCurrentAiSummaryRequest();
      
      // Create new AbortController for this request
      const controller = new AbortController();
      aiSummaryControllerRef.current = controller;
      
      try {
        const result = await dashboardService.getCustomerAiSummary({
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

  // Navigate to order detail
  const handleNavigateToOrder = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  // Package status data for donut chart
  const rawStatusDistribution = (() => {
    if (data?.orderDetailStatusDistribution && Object.keys(data.orderDetailStatusDistribution).length > 0) {
      return data.orderDetailStatusDistribution;
    }
    if (data?.orderStatusDistribution && Object.keys(data.orderStatusDistribution).length > 0) {
      return data.orderStatusDistribution;
    }
    return undefined;
  })();

  const packageStatusData = rawStatusDistribution
    ? Object.entries(rawStatusDistribution).map(([status, count]) => {
        const statusEnum = status as OrderStatusEnum;
        return {
          // Hiển thị tiếng Việt trong legend & tooltip
          type: OrderStatusLabels[statusEnum] || status,
          value: count as number,
          // Màu trùng với logic OrderStatusTag (chỉ cần một màu chủ đạo cho mỗi trạng thái)
          color:
            statusEnum === OrderStatusEnum.ASSIGNED_TO_DRIVER ? '#3b82f6' : // Xanh dương
            statusEnum === OrderStatusEnum.CANCELLED ? '#ef4444' :           // Đỏ
            statusEnum === OrderStatusEnum.DELIVERED ? '#22c55e' :           // Xanh lá
            statusEnum === OrderStatusEnum.ON_PLANNING ? '#a855f7' :         // Tím
            statusEnum === OrderStatusEnum.PENDING ? '#6366f1' :             // Indigo
            statusEnum === OrderStatusEnum.IN_TROUBLES ? '#f59e0b' :        // Cam
            statusEnum === OrderStatusEnum.PICKING_UP ? '#0ea5e9' :         // Xanh lợt
            undefined,
        };
      })
    : [];

  // Debug log for package status distribution
  useEffect(() => {
    if (!isLoading) {
      // eslint-disable-next-line no-console
      console.log('[CustomerDashboard] Package status distribution', {
        orderDetailStatusDistribution: data?.orderDetailStatusDistribution,
        orderStatusDistribution: data?.orderStatusDistribution,
        packageStatusData,
      });
    }
  }, [isLoading, data?.orderDetailStatusDistribution, data?.orderStatusDistribution, packageStatusData]);

  // Contract value trend data
  const contractValueData = data?.financialSummary?.contractValueTrend?.map(item => ({
    label: item.date,
    date: item.date,
    value: Number(item.totalValue),
  })) || [];

  // Transaction trend data
  const transactionData = data?.financialSummary?.transactionTrend?.map(item => ({
    label: item.date,
    date: item.date,
    value: Number(item.amount),
  })) || [];
  
  // Package status trend data for stacked area chart
  const packageTrendData = data?.packageStatusTrend?.flatMap(item => [
    { date: item.date, type: 'Đang vận chuyển', value: item.inTransit },
    { date: item.date, type: 'Đã giao', value: item.delivered },
    { date: item.date, type: 'Đã hủy', value: item.cancelled },
    { date: item.date, type: 'Có vấn đề', value: item.problem },
  ]) || [];

  // Convert package trend data to TrendLineChart format (multi-line by status)
  const packageTrendLineData = packageTrendData.map(item => ({
    label: item.date,
    date: item.date,
    value: item.value,
    category: item.type,
  }));

  // Only show floating filter bar after user scrolls past the static header filter
  const [showFloatingFilter, setShowFloatingFilter] = useState(false);

  useEffect(() => {
    const target = headerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const headerVisible = entry.isIntersecting;
        const hasUserScrolled = window.scrollY > 0;
        // Chỉ hiển thị khi user đã thực sự scroll và header ra khỏi viewport
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

  return (
    <div className="dashboard-customer">
      {/* Header - Full width gradient */}
      <div
        ref={headerRef}
        className="mb-6 bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-lg shadow-lg -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8"
      >
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <Title level={2} className="m-0 text-white flex items-center">
              <TruckOutlined className="mr-3" />
              Tổng quan vận chuyển
            </Title>
            <Text className="text-blue-100">Theo dõi kiện hàng và hoạt động vận chuyển của bạn</Text>
          </div>
          <TimeRangeFilter
            value={timeRange}
            onChange={handleTimeRangeChange}
            customFromDate={customDates.from}
            customToDate={customDates.to}
          />
        </div>
      </div>

      {/* Floating vertical filter bar on the right side (only when header filter is scrolled out) */}
      {showFloatingFilter && (
        <FloatingFilterBar
          value={timeRange}
          onChange={(range) => handleTimeRangeChange(range)}
        />
      )}

      {/* AI Summary */}
      <AiSummaryCard summary={aiSummary || ''} loading={isAiLoading} />

      {/* Tab Navigation */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
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
                {/* Package Statistics KPI Cards */}
                <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title="Tổng số kiện hàng"
            value={data?.orderSummary?.totalOrderDetails || 0}
            prefix={<ShoppingOutlined className="text-blue-500" />}
            loading={isLoading}
            borderColor="border-t-blue-500"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title="Đang vận chuyển"
            value={data?.orderSummary?.inTransitPackages || 0}
            prefix={<TruckOutlined className="text-purple-500" />}
            loading={isLoading}
            borderColor="border-t-purple-500"
            valueStyle={{ color: '#8b5cf6' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title="Đã giao thành công"
            value={data?.orderSummary?.deliveredPackages || 0}
            prefix={<CheckCircleOutlined className="text-green-500" />}
            loading={isLoading}
            borderColor="border-t-green-500"
            valueStyle={{ color: '#22c55e' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            title="Tỷ lệ thành công"
            value={`${data?.orderSummary?.successRate?.toFixed(1) || 0}%`}
            prefix={<CheckCircleOutlined className="text-emerald-500" />}
            loading={isLoading}
            borderColor="border-t-emerald-500"
          />
        </Col>
      </Row>

      {/* Additional Package Stats */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={8}>
          <Card className="text-center">
            <Statistic
              title="Kiện hàng bị hủy"
              value={data?.orderSummary?.cancelledPackages || 0}
              prefix={<ExclamationCircleOutlined className="text-red-500" />}
              valueStyle={{ color: '#ef4444' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="text-center">
            <Statistic
              title="Kiện hàng gặp vấn đề"
              value={data?.orderSummary?.problemPackages || 0}
              prefix={<WarningOutlined className="text-orange-500" />}
              valueStyle={{ color: '#f97316' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="text-center">
            <Statistic
              title="Tổng số đơn hàng"
              value={data?.orderSummary?.totalOrders || 0}
              prefix={<FileTextOutlined className="text-blue-500" />}
            />
          </Card>
        </Col>
      </Row>

      {/* Package Status Trend - Multi-line line chart by status */}
      {packageTrendLineData.length > 0 && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col span={24}>
            <TrendLineChart
              data={packageTrendLineData}
              title="Xu hướng trạng thái kiện hàng theo thời gian"
              loading={isLoading}
              yAxisLabel="Số kiện"
              showArea={false}
              isCurrency={false}
            />
          </Col>
        </Row>
      )}

      {/* Actions Needed - List format with navigation and pagination */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={24}>
          <Card 
            title={<span><ExclamationCircleOutlined className="mr-2 text-orange-500" />Cần thực hiện</span>} 
            className="h-full"
            bodyStyle={{ padding: 0 }}
          >
            {isLoading ? (
              <div className="p-4"><Skeleton active /></div>
            ) : data?.actionsSummary?.actionItems && data.actionsSummary.actionItems.length > 0 ? (
              <List
                dataSource={data.actionsSummary.actionItems}
                pagination={{
                  current: actionsPage,
                  pageSize: PAGE_SIZE,
                  total: data.actionsSummary.actionItems.length,
                  onChange: (page) => setActionsPage(page),
                  size: 'small',
                  showSizeChanger: false,
                  className: 'px-4 pb-2'
                }}
                renderItem={(action: ActionItem) => (
                  <List.Item 
                    key={action.id}
                    className="!py-3 !px-4 hover:bg-gray-50 cursor-pointer transition-colors border-b"
                    onClick={() => handleNavigateToOrder(action.orderId)}
                    actions={[
                      <Button type="link" icon={<RightOutlined />} size="small" />
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">{getActionIcon(action.type)}</div>}
                      title={
                        <div className="flex items-center gap-2 flex-wrap">
                          <Text strong>{action.orderCode}</Text>
                          <Tag color={getActionColor(action.type)}>{getActionTitle(action.type)}</Tag>
                        </div>
                      }
                      description={
                        <div className="mt-1">
                          <Text type="secondary" className="text-sm block">{action.description}</Text>
                          {action.amount && action.amount > 0 && (
                            <Text className="text-blue-600 font-medium block mt-1">
                              {formatCurrency(action.amount)}₫
                            </Text>
                          )}
                          {action.deadline && (
                            <Text type="secondary" className="text-xs block mt-1">
                              <ClockCircleOutlined className="mr-1" />
                              Hạn: {formatDeadline(action.deadline)}
                            </Text>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="Không có hành động cần thực hiện" className="py-8" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Package Status Distribution */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <DonutChart
            data={packageStatusData}
            title="Phân bố trạng thái kiện hàng"
            loading={isLoading}
            showLegend
            // Không truyền labelFormatter để label trong chart chỉ hiển thị số value, tránh dính chữ
          />
        </Col>

        {/* Financial Summary - Visual with progress bars */}
        <Col xs={24} lg={12}>
          <Card title={<span><DollarOutlined className="mr-2" />Tổng quan tài chính</span>}>
            {isLoading ? (
              <Skeleton active />
            ) : (
              <div className="space-y-4">
                {/* Payment Progress */}
                <div>
                  <div className="flex justify-between mb-1">
                    <Text>Đã thanh toán</Text>
                    <Tooltip title={`${((val) => { const v = typeof val === 'number' && !Number.isNaN(val) ? val : 0; return v.toLocaleString('vi-VN'); })(data?.financialSummary?.totalPaid || 0)}₫`}>
                      <Text className="text-green-600 font-semibold cursor-help">
                        {formatCurrency(data?.financialSummary?.totalPaid || 0)}₫
                      </Text>
                    </Tooltip>
                  </div>
                  <Progress 
                    percent={
                      ((data?.financialSummary?.totalPaid || 0) / 
                      ((data?.financialSummary?.totalPaid || 0) + (data?.financialSummary?.pendingPayment || 1))) * 100
                    } 
                    strokeColor="#22c55e"
                    showInfo={false}
                  />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <Text>Chờ thanh toán</Text>
                    <Tooltip title={`${((val) => { const v = typeof val === 'number' && !Number.isNaN(val) ? val : 0; return v.toLocaleString('vi-VN'); })(data?.financialSummary?.pendingPayment || 0)}₫`}>
                      <Text className="text-orange-500 font-semibold cursor-help">
                        {formatCurrency(data?.financialSummary?.pendingPayment || 0)}₫
                      </Text>
                    </Tooltip>
                  </div>
                  <Progress 
                    percent={
                      ((data?.financialSummary?.pendingPayment || 0) / 
                      ((data?.financialSummary?.totalPaid || 1) + (data?.financialSummary?.pendingPayment || 0))) * 100
                    } 
                    strokeColor="#f97316"
                    showInfo={false}
                  />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <Text>Đã hoàn tiền</Text>
                    <Tooltip title={`${((val) => { const v = typeof val === 'number' && !Number.isNaN(val) ? val : 0; return v.toLocaleString('vi-VN'); })(data?.financialSummary?.totalRefunded || 0)}₫`}>
                      <Text className="text-blue-500 font-semibold cursor-help">
                        {formatCurrency(data?.financialSummary?.totalRefunded || 0)}₫
                      </Text>
                    </Tooltip>
                  </div>
                </div>
                
                {/* Contract Stats */}
                <div className="pt-4 border-t">
                  <Row gutter={16}>
                    <Col span={12}>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <Text className="text-2xl font-bold text-purple-600">
                          {data?.financialSummary?.contractsSigned || 0}
                        </Text>
                        <div className="text-xs text-gray-500">Hợp đồng đã ký</div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <Text className="text-2xl font-bold text-red-500">
                          {data?.financialSummary?.contractsCancelled || 0}
                        </Text>
                        <div className="text-xs text-gray-500">Hợp đồng đã hủy</div>
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

              </>
            ),
          },
          {
            key: 'orders_issues',
            label: (
              <span>
                <FileTextOutlined />
                Đơn hàng & Sự cố
              </span>
            ),
            children: (
              <>
                {/* Active Orders */}
                <Row gutter={[16, 16]} className="mb-6">
                  <Col span={24}>
                    <Card 
                      title={<span><ClockCircleOutlined className="mr-2" />Đơn hàng đang xử lý</span>}
                      bodyStyle={{ padding: 0 }}
                    >
                      {isLoading ? (
                        <div className="p-4"><Skeleton active /></div>
                      ) : data?.activeOrders && data.activeOrders.length > 0 ? (
                        <List
                          dataSource={data.activeOrders}
                          pagination={{
                            current: ordersPage,
                            pageSize: 5,
                            total: data.activeOrders.length,
                            onChange: (page) => setOrdersPage(page),
                            size: 'small',
                            showSizeChanger: false,
                            className: 'px-4 pb-2'
                          }}
                          renderItem={(order) => (
                            <List.Item 
                              key={order.orderId}
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
                                    <OrderStatusTag status={order.status as OrderStatusEnum} size="small" />
                                    {order.hasIssue && <Tag color="error">Có sự cố</Tag>}
                                  </div>
                                }
                                description={
                                  <div className="mt-1">
                                    <Text type="secondary" className="text-sm">{order.pickupAddress} → {order.deliveryAddress}</Text>
                                    {order.estimatedDelivery && (
                                      <Text type="secondary" className="block text-xs">
                                        Dự kiến giao: {new Date(order.estimatedDelivery).toLocaleString('vi-VN')}
                                      </Text>
                                    )}
                                  </div>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      ) : (
                        <Empty description="Không có đơn hàng đang xử lý" className="py-8" />
                      )}
                    </Card>
                  </Col>
                </Row>

                {/* Recent Issues */}
      {data?.recentIssues && data.recentIssues.length > 0 && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col span={24}>
            <Card title={<span><WarningOutlined className="mr-2 text-orange-500" />Sự cố gần đây</span>}>
              <List
                dataSource={data.recentIssues.slice((recentIssuesPage - 1) * PAGE_SIZE, recentIssuesPage * PAGE_SIZE)}
                renderItem={(issue) => (
                  <List.Item key={issue.issueId}>
                    <List.Item.Meta
                      avatar={<ExclamationCircleOutlined className="text-2xl text-orange-500" />}
                      title={
                        <Space>
                          <Text strong>{issue.issueType}</Text>
                          <Tag color="warning">{issue.status}</Tag>
                          {issue.orderCode && (
                            <Text type="secondary" className="text-xs">
                              Đơn hàng: {issue.orderCode}
                            </Text>
                          )}
                        </Space>
                      }
                      description={
                        <div>
                          <Text>{issue.description}</Text>
                          <br />
                          <Text type="secondary" className="text-xs">
                            {new Date(issue.reportedAt).toLocaleString('vi-VN')}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
              {data.recentIssues.length > PAGE_SIZE && (
                <div className="p-3 flex justify-center border-t">
                  <Pagination
                    current={recentIssuesPage}
                    pageSize={PAGE_SIZE}
                    total={data.recentIssues.length}
                    onChange={setRecentIssuesPage}
                    size="small"
                    showSizeChanger={false}
                  />
                </div>
              )}
            </Card>
          </Col>
        </Row>
      )}

      {/* Top Recipients */}
      {data?.topRecipients && data.topRecipients.length > 0 && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col span={24}>
            <Card title={<span><UserOutlined className="mr-2 text-blue-500" />Người nhận thân thiết</span>}>
              <Table<TopRecipient>
                dataSource={data.topRecipients.slice((topRecipientsPage - 1) * PAGE_SIZE, topRecipientsPage * PAGE_SIZE)}
                rowKey={(record) => `${record.recipientName}-${record.recipientPhone}`}
                pagination={false}
                columns={[
                  {
                    title: 'Người nhận',
                    key: 'recipient',
                    render: (_, record) => (
                      <div>
                        <div className="font-semibold">{record.recipientName}</div>
                        <div className="text-xs text-gray-500">
                          <PhoneOutlined className="mr-1" />
                          {record.recipientPhone}
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: 'Địa chỉ',
                    dataIndex: 'recipientAddress',
                    key: 'address',
                    ellipsis: true,
                    render: (address) => (
                      <Tooltip title={address}>
                        <EnvironmentOutlined className="mr-1" />
                        {address}
                      </Tooltip>
                    ),
                  },
                  {
                    title: 'Tổng kiện',
                    dataIndex: 'totalPackages',
                    key: 'total',
                    align: 'center',
                    sorter: (a, b) => a.totalPackages - b.totalPackages,
                  },
                  {
                    title: 'Thành công',
                    dataIndex: 'successfulPackages',
                    key: 'successful',
                    align: 'center',
                    render: (value) => (
                      <Text className="text-green-600 font-semibold">{value}</Text>
                    ),
                  },
                  {
                    title: 'Thất bại',
                    dataIndex: 'failedPackages',
                    key: 'failed',
                    align: 'center',
                    render: (value) => (
                      <Text className="text-red-600">{value}</Text>
                    ),
                  },
                  {
                    title: 'Tỷ lệ thành công',
                    dataIndex: 'successRate',
                    key: 'successRate',
                    align: 'center',
                    sorter: (a, b) => a.successRate - b.successRate,
                    render: (rate) => (
                      <Tag color={rate >= 90 ? 'success' : rate >= 70 ? 'warning' : 'error'}>
                        {rate.toFixed(1)}%
                      </Tag>
                    ),
                  },
                ]}
              />
              {data.topRecipients.length > PAGE_SIZE && (
                <div className="p-3 flex justify-center border-t">
                  <Pagination
                    current={topRecipientsPage}
                    pageSize={PAGE_SIZE}
                    total={data.topRecipients.length}
                    onChange={setTopRecipientsPage}
                    size="small"
                    showSizeChanger={false}
                  />
                </div>
              )}
            </Card>
          </Col>
        </Row>
      )}
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
                {/* Financial Summary */}
                <Row gutter={[16, 16]} className="mb-6">
                  <Col span={24}>
                    <Card 
                      title={<span><DollarOutlined className="mr-2 text-green-600" />Tổng quan tài chính</span>}
                      loading={isLoading}
                    >
                      <div className="space-y-4">
                        <Row gutter={16}>
                          <Col span={8}>
                            <Statistic
                              title="Tổng đã thanh toán"
                              value={data?.financialSummary?.totalPaid || 0}
                              prefix={<CreditCardOutlined className="text-green-500" />}
                              formatter={(value) => formatCurrency(Number(value))}
                            />
                          </Col>
                          <Col span={8}>
                            <Statistic
                              title="Tổng đền bù"
                              value={data?.financialSummary?.totalRefunded || 0}
                              prefix={<RollbackOutlined className="text-red-500" />}
                              formatter={(value) => formatCurrency(Number(value))}
                            />
                          </Col>
                          <Col span={8}>
                            <Statistic
                              title="Tổng giá trị hợp đồng"
                              value={data?.financialSummary?.totalContractValue || 0}
                              prefix={<FileTextOutlined className="text-blue-500" />}
                              formatter={(value) => formatCurrency(Number(value))}
                            />
                          </Col>
                        </Row>
                      </div>
                    </Card>
                  </Col>
                </Row>

                {/* Contract Value & Transaction Trends */}
                <Row gutter={[16, 16]} className="mb-6">
                  <Col xs={24} lg={12}>
                    <TrendLineChart
                      data={contractValueData}
                      title="Giá trị hợp đồng theo thời gian"
                      loading={isLoading}
                      yAxisLabel="Giá trị (₫)"
                    />
                  </Col>
                  <Col xs={24} lg={12}>
                    <TrendLineChart
                      data={transactionData}
                      title="Tiền đã thanh toán theo thời gian"
                      loading={isLoading}
                      yAxisLabel="Số tiền (₫)"
                    />
                  </Col>
                </Row>
              </>
            ),
          },
          {
            key: 'activity',
            label: (
              <span>
                <ClockCircleOutlined />
                Hoạt động
              </span>
            ),
            children: (
              <>
                {/* Recent Activity - with navigation and pagination */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card 
            title={<span><ClockCircleOutlined className="mr-2" />Hoạt động gần đây</span>}
            bodyStyle={{ padding: 0 }}
          >
            {isLoading ? (
              <div className="p-4"><Skeleton active /></div>
            ) : data?.recentActivity && data.recentActivity.length > 0 ? (
              <List
                dataSource={data.recentActivity}
                pagination={{
                  current: activityPage,
                  pageSize: PAGE_SIZE,
                  total: data.recentActivity.length,
                  onChange: (page) => setActivityPage(page),
                  size: 'small',
                  showSizeChanger: false,
                  className: 'px-4 pb-2'
                }}
                renderItem={(activity) => (
                  <List.Item 
                    key={activity.timestamp}
                    className="!py-3 !px-4 hover:bg-gray-50 cursor-pointer transition-colors border-b"
                    onClick={() => activity.orderId && handleNavigateToOrder(activity.orderId)}
                    actions={activity.orderId ? [
                      <Button type="link" icon={<RightOutlined />} size="small" />
                    ] : undefined}
                  >
                    <List.Item.Meta
                      avatar={<div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100"><FileTextOutlined className="text-green-500" /></div>}
                      title={
                        <div className="flex items-center gap-2 flex-wrap">
                          <Text strong>{activity.title}</Text>
                          {activity.orderStatus && (
                            <OrderStatusTag status={activity.orderStatus as OrderStatusEnum} size="small" />
                          )}
                        </div>
                      }
                      description={
                        <div className="mt-1">
                          <Text type="secondary" className="text-sm">{activity.description}</Text>
                          <Text type="secondary" className="text-xs ml-2">
                            • {new Date(activity.timestamp).toLocaleString('vi-VN')}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="Chưa có hoạt động nào" className="py-8" />
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

export default ImprovedCustomerDashboard;
