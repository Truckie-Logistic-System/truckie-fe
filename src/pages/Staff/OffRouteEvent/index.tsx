import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Table, 
  Card, 
  Input, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  message, 
  Skeleton,
  Typography,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  CarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  AlertOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import offRouteEventService from '@/services/issue/offRouteEventService';
import type { OffRouteEventListItem } from '@/services/issue/offRouteEventService';
import dayjs from 'dayjs';
import debounce from 'lodash/debounce';

const { Title, Text } = Typography;

// Warning Status translations and colors
const WARNING_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  NONE: { label: 'Chưa cảnh báo', color: 'default', icon: <ClockCircleOutlined /> },
  YELLOW_SENT: { label: 'Cảnh báo vàng', color: 'warning', icon: <AlertOutlined /> },
  RED_SENT: { label: 'Cảnh báo đỏ', color: 'error', icon: <ExclamationCircleOutlined /> },
  CONTACTED_WAITING_RETURN: { label: 'Chờ quay lại', color: 'processing', icon: <ClockCircleOutlined /> },
  CONTACT_FAILED: { label: 'Không liên hệ được', color: 'error', icon: <WarningOutlined /> },
  RESOLVED_SAFE: { label: 'Đã giải quyết', color: 'success', icon: <CheckCircleOutlined /> },
  ISSUE_CREATED: { label: 'Đã tạo sự cố', color: 'purple', icon: <ExclamationCircleOutlined /> },
  BACK_ON_ROUTE: { label: 'Đã quay lại tuyến', color: 'success', icon: <CheckCircleOutlined /> },
};

const getWarningStatusColor = (status?: string) => WARNING_STATUS_CONFIG[status || '']?.color || 'default';
const getWarningStatusLabel = (status?: string) => WARNING_STATUS_CONFIG[status || '']?.label || status || '-';

const OffRouteEventPage: React.FC = () => {
  const [events, setEvents] = useState<OffRouteEventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OffRouteEventListItem | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await offRouteEventService.getAllOffRouteEvents();
      setEvents(data);
    } catch (error: any) {
      message.error(error.message || 'Không thể tải danh sách cảnh báo lệch tuyến');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearchText(value), 300),
    []
  );

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  }, [debouncedSearch]);

  const filteredData = useMemo(() => {
    if (!searchText) return events;
    const lowerSearch = searchText.toLowerCase();
    return events.filter(item => 
      item.vehicleAssignment?.trackingCode?.toLowerCase().includes(lowerSearch) ||
      item.vehicleAssignment?.vehiclePlateNumber?.toLowerCase().includes(lowerSearch) ||
      item.vehicleAssignment?.driverName?.toLowerCase().includes(lowerSearch) ||
      item.order?.orderCode?.toLowerCase().includes(lowerSearch)
    );
  }, [events, searchText]);

  // Statistics
  const stats = useMemo(() => {
    const total = events.length;
    const yellowCount = events.filter(e => e.warningStatus === 'YELLOW_SENT').length;
    const redCount = events.filter(e => e.warningStatus === 'RED_SENT' || e.warningStatus === 'CONTACT_FAILED').length;
    const resolvedCount = events.filter(e => e.resolvedAt || e.warningStatus === 'RESOLVED_SAFE' || e.warningStatus === 'BACK_ON_ROUTE').length;
    return { total, yellowCount, redCount, resolvedCount };
  }, [events]);

  const handleRowClick = (record: OffRouteEventListItem) => {
    setSelectedItem(record);
    setDetailModalVisible(true);
  };

  const columns: ColumnsType<OffRouteEventListItem> = [
    {
      title: 'Mã chuyến xe',
      key: 'trackingCode',
      render: (_, record) => (
        <div>
          <Text strong>{record.vehicleAssignment?.trackingCode || '-'}</Text>
          {record.vehicleAssignment?.vehiclePlateNumber && (
            <div className="text-xs text-gray-500">
              <CarOutlined className="mr-1" />
              {record.vehicleAssignment.vehiclePlateNumber}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Tài xế',
      key: 'driver',
      render: (_, record) => (
        <div>
          <div>{record.vehicleAssignment?.driverName || '-'}</div>
          {record.vehicleAssignment?.driverPhone && (
            <div className="text-xs text-gray-500">
              <PhoneOutlined className="mr-1" />
              {record.vehicleAssignment.driverPhone}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Khoảng cách lệch',
      dataIndex: 'distanceFromRouteMeters',
      key: 'distance',
      width: 130,
      render: (distance) => (
        <Tag color={distance > 1000 ? 'red' : distance > 500 ? 'orange' : 'blue'}>
          {distance ? `${distance.toFixed(0)} m` : '-'}
        </Tag>
      ),
      sorter: (a, b) => (a.distanceFromRouteMeters || 0) - (b.distanceFromRouteMeters || 0),
    },
    {
      title: 'Trạng thái cảnh báo',
      dataIndex: 'warningStatus',
      key: 'warningStatus',
      width: 160,
      render: (status) => (
        <Tag color={getWarningStatusColor(status)}>
          {getWarningStatusLabel(status)}
        </Tag>
      ),
      filters: [
        { text: 'Chưa cảnh báo', value: 'NONE' },
        { text: 'Cảnh báo vàng', value: 'YELLOW_SENT' },
        { text: 'Cảnh báo đỏ', value: 'RED_SENT' },
        { text: 'Chờ quay lại', value: 'CONTACTED_WAITING_RETURN' },
        { text: 'Không liên hệ được', value: 'CONTACT_FAILED' },
        { text: 'Đã giải quyết', value: 'RESOLVED_SAFE' },
        { text: 'Đã tạo sự cố', value: 'ISSUE_CREATED' },
        { text: 'Đã quay lại tuyến', value: 'BACK_ON_ROUTE' },
      ],
      onFilter: (value, record) => record.warningStatus === value,
    },
    {
      title: 'Liên hệ được',
      dataIndex: 'canContactDriver',
      key: 'canContact',
      width: 110,
      render: (canContact) => (
        canContact ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>Có</Tag>
        ) : (
          <Tag color="red" icon={<WarningOutlined />}>Không</Tag>
        )
      ),
    },
    {
      title: 'Thời gian bắt đầu',
      dataIndex: 'offRouteStartTime',
      key: 'startTime',
      width: 140,
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-',
      sorter: (a, b) => dayjs(a.offRouteStartTime).unix() - dayjs(b.offRouteStartTime).unix(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Đã giải quyết',
      dataIndex: 'resolvedAt',
      key: 'resolved',
      width: 130,
      render: (date) => (
        date ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            {dayjs(date).format('DD/MM HH:mm')}
          </Tag>
        ) : (
          <Tag color="orange" icon={<ClockCircleOutlined />}>Chưa</Tag>
        )
      ),
    },
  ];

  return (
    <div className="p-6">
      {/* Statistics Cards */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm" style={{ borderLeft: '4px solid #1890ff' }}>
            <Statistic
              title="Tổng cảnh báo"
              value={stats.total}
              prefix={<EnvironmentOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm" style={{ borderLeft: '4px solid #faad14' }}>
            <Statistic
              title="Cảnh báo vàng"
              value={stats.yellowCount}
              prefix={<AlertOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: stats.yellowCount > 0 ? '#faad14' : undefined }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm" style={{ borderLeft: '4px solid #f5222d' }}>
            <Statistic
              title="Cảnh báo đỏ"
              value={stats.redCount}
              prefix={<ExclamationCircleOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: stats.redCount > 0 ? '#f5222d' : undefined }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm" style={{ borderLeft: '4px solid #52c41a' }}>
            <Statistic
              title="Đã giải quyết"
              value={stats.resolvedCount}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title level={4} className="!mb-0" style={{ color: '#1890ff' }}>
            <EnvironmentOutlined className="mr-2" />
            Danh sách cảnh báo lệch tuyến
          </Title>
          <Space>
            <Input
              placeholder="Tìm kiếm theo mã chuyến, biển số, tài xế..."
              prefix={<SearchOutlined />}
              onChange={handleSearch}
              style={{ width: 300 }}
              allowClear
            />
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchEvents}
              loading={loading}
            >
              Làm mới
            </Button>
          </Space>
        </div>

        {loading ? (
          <Skeleton active paragraph={{ rows: 10 }} />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
              style: { cursor: 'pointer' }
            })}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} cảnh báo`,
            }}
            scroll={{ x: 1000 }}
          />
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
        styles={{ body: { padding: 0 } }}
      >
        {selectedItem && (
          <div>
            {/* Banner Header */}
            <div 
              className="p-6 text-white"
              style={{ 
                background: selectedItem.warningStatus === 'RED_SENT' || selectedItem.warningStatus === 'CONTACT_FAILED'
                  ? 'linear-gradient(135deg, #f5222d 0%, #ff4d4f 100%)' 
                  : selectedItem.warningStatus === 'YELLOW_SENT'
                    ? 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)'
                    : selectedItem.resolvedAt
                      ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
                      : 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)'
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <EnvironmentOutlined style={{ fontSize: 32 }} />
                <div>
                  <div className="text-lg font-semibold">Cảnh báo lệch tuyến</div>
                  <div className="text-white/80 text-sm">
                    {selectedItem.vehicleAssignment?.trackingCode || '-'}
                  </div>
                </div>
              </div>
              <Row gutter={24}>
                <Col span={12}>
                  <div className="text-white/70 text-xs mb-1">Khoảng cách lệch</div>
                  <div className="text-2xl font-bold">
                    {selectedItem.distanceFromRouteMeters ? `${selectedItem.distanceFromRouteMeters.toFixed(0)} m` : '-'}
                  </div>
                </Col>
                <Col span={12}>
                  <div className="text-white/70 text-xs mb-1">Trạng thái</div>
                  <div className="text-lg font-semibold">
                    {getWarningStatusLabel(selectedItem.warningStatus)}
                  </div>
                </Col>
              </Row>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Quick Info Banners */}
              <Row gutter={16} className="mb-6">
                <Col span={12}>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <CarOutlined className="text-blue-500" />
                      <span className="text-gray-500 text-xs">Biển số xe</span>
                    </div>
                    <div className="font-semibold text-lg">
                      {selectedItem.vehicleAssignment?.vehiclePlateNumber || '-'}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <div className="flex items-center gap-2 mb-2">
                      <PhoneOutlined className="text-green-500" />
                      <span className="text-gray-500 text-xs">Tài xế</span>
                    </div>
                    <div className="font-semibold">
                      {selectedItem.vehicleAssignment?.driverName || '-'}
                    </div>
                    {selectedItem.vehicleAssignment?.driverPhone && (
                      <a 
                        href={`tel:${selectedItem.vehicleAssignment.driverPhone}`}
                        className="text-blue-500 text-sm"
                      >
                        {selectedItem.vehicleAssignment.driverPhone}
                      </a>
                    )}
                  </div>
                </Col>
              </Row>

              {/* Timeline Info */}
              <div className="mb-6">
                <div className="text-gray-700 font-medium mb-3">Thông tin thời gian</div>
                <div className="space-y-3">
                  {selectedItem.offRouteStartTime && (
                    <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                      <span className="text-gray-600">Bắt đầu lệch tuyến</span>
                      <span className="font-medium">
                        {dayjs(selectedItem.offRouteStartTime).format('DD/MM/YYYY HH:mm:ss')}
                      </span>
                    </div>
                  )}
                  {selectedItem.yellowWarningSentAt && (
                    <div className="flex justify-between items-center bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                      <span className="text-yellow-700">Gửi cảnh báo vàng</span>
                      <span className="font-medium text-yellow-700">
                        {dayjs(selectedItem.yellowWarningSentAt).format('DD/MM/YYYY HH:mm:ss')}
                      </span>
                    </div>
                  )}
                  {selectedItem.redWarningSentAt && (
                    <div className="flex justify-between items-center bg-red-50 rounded-lg p-3 border border-red-100">
                      <span className="text-red-700">Gửi cảnh báo đỏ</span>
                      <span className="font-medium text-red-700">
                        {dayjs(selectedItem.redWarningSentAt).format('DD/MM/YYYY HH:mm:ss')}
                      </span>
                    </div>
                  )}
                  {selectedItem.contactedAt && (
                    <div className="flex justify-between items-center bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <span className="text-blue-700">Thời gian liên hệ</span>
                      <span className="font-medium text-blue-700">
                        {dayjs(selectedItem.contactedAt).format('DD/MM/YYYY HH:mm:ss')}
                      </span>
                    </div>
                  )}
                  {selectedItem.resolvedAt && (
                    <div className="flex justify-between items-center bg-green-50 rounded-lg p-3 border border-green-100">
                      <span className="text-green-700">Đã giải quyết</span>
                      <span className="font-medium text-green-700">
                        {dayjs(selectedItem.resolvedAt).format('DD/MM/YYYY HH:mm:ss')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border rounded-lg p-3">
                  <div className="text-gray-500 text-xs">Liên hệ được</div>
                  <div className="font-medium">
                    {selectedItem.canContactDriver ? (
                      <Tag color="green" icon={<CheckCircleOutlined />}>Có</Tag>
                    ) : (
                      <Tag color="red" icon={<WarningOutlined />}>Không</Tag>
                    )}
                  </div>
                </div>
                {selectedItem.gracePeriodExtensionCount !== undefined && selectedItem.gracePeriodExtensionCount > 0 && (
                  <div className="bg-white border rounded-lg p-3">
                    <div className="text-gray-500 text-xs">Số lần gia hạn</div>
                    <div className="font-medium">{selectedItem.gracePeriodExtensionCount} lần</div>
                  </div>
                )}
                {selectedItem.lastKnownLat && selectedItem.lastKnownLng && (
                  <div className="bg-white border rounded-lg p-3 col-span-2">
                    <div className="text-gray-500 text-xs">Vị trí cuối</div>
                    <a 
                      href={`https://www.google.com/maps?q=${selectedItem.lastKnownLat},${selectedItem.lastKnownLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 font-medium"
                    >
                      {selectedItem.lastKnownLat.toFixed(6)}, {selectedItem.lastKnownLng.toFixed(6)}
                    </a>
                  </div>
                )}
                {selectedItem.resolvedReason && (
                  <div className="bg-white border rounded-lg p-3 col-span-2">
                    <div className="text-gray-500 text-xs">Lý do giải quyết</div>
                    <div className="font-medium">{selectedItem.resolvedReason}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OffRouteEventPage;
