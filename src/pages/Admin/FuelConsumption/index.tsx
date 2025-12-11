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
  Statistic,
  Image,
  Tabs,
  Descriptions
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined,
  CarOutlined,
  UserOutlined,
  DashboardOutlined,
  PhoneOutlined,
  CameraOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import fuelConsumptionService from '@/services/vehicle/fuelConsumptionService';
import type { FuelConsumptionListItem } from '@/services/vehicle/fuelConsumptionService';
import dayjs from 'dayjs';
import debounce from 'lodash/debounce';

const { Title, Text } = Typography;

const FuelConsumptionPage: React.FC = () => {
  const [consumptions, setConsumptions] = useState<FuelConsumptionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FuelConsumptionListItem | null>(null);

  const fetchConsumptions = async () => {
    setLoading(true);
    try {
      const data = await fuelConsumptionService.getAllFuelConsumptions();
      setConsumptions(data);
    } catch (error: any) {
      message.error(error.message || 'Không thể tải danh sách tiêu thụ nhiên liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsumptions();
  }, []);

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearchText(value), 300),
    []
  );

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  }, [debouncedSearch]);

  const filteredData = useMemo(() => {
    if (!searchText) return consumptions;
    const lowerSearch = searchText.toLowerCase();
    return consumptions.filter(item => 
      item.vehicleAssignment?.trackingCode?.toLowerCase().includes(lowerSearch) ||
      item.vehicle?.licensePlateNumber?.toLowerCase().includes(lowerSearch) ||
      item.driver?.fullName?.toLowerCase().includes(lowerSearch) ||
      item.vehicle?.brand?.toLowerCase().includes(lowerSearch)
    );
  }, [consumptions, searchText]);

  // Statistics
  const stats = useMemo(() => {
    const total = consumptions.length;
    const totalFuel = consumptions.reduce((sum, c) => sum + (c.fuelVolumeLiters || 0), 0);
    const totalDistance = consumptions.reduce((sum, c) => sum + (c.distanceTraveledKm || 0), 0);
    const avgConsumption = totalDistance > 0 ? (totalFuel / totalDistance) * 100 : 0;
    return { total, totalFuel, totalDistance, avgConsumption };
  }, [consumptions]);

  const handleRowClick = (record: FuelConsumptionListItem) => {
    setSelectedItem(record);
    setDetailModalVisible(true);
  };

  const columns: ColumnsType<FuelConsumptionListItem> = [
    {
      title: 'Mã chuyến xe',
      key: 'trackingCode',
      render: (_, record) => (
        <Text strong>{record.vehicleAssignment?.trackingCode || '-'}</Text>
      ),
    },
    {
      title: 'Phương tiện',
      key: 'vehicle',
      render: (_, record) => (
        <div>
          <div>
            <CarOutlined className="mr-1" />
            {record.vehicle?.licensePlateNumber || '-'}
          </div>
          {record.vehicle?.brand && (
            <div className="text-xs text-gray-500">
              {record.vehicle.brand} {record.vehicle.model || ''}
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
          <UserOutlined className="mr-1" />
          {record.driver?.fullName || '-'}
        </div>
      ),
    },
    {
      title: 'Số km bắt đầu',
      dataIndex: 'odometerStartKm',
      key: 'odometerStart',
      render: (value) => value ? `${value.toLocaleString()} km` : '-',
      sorter: (a, b) => (a.odometerStartKm || 0) - (b.odometerStartKm || 0),
    },
    {
      title: 'Số km kết thúc',
      dataIndex: 'odometerEndKm',
      key: 'odometerEnd',
      render: (value) => value ? `${value.toLocaleString()} km` : '-',
      sorter: (a, b) => (a.odometerEndKm || 0) - (b.odometerEndKm || 0),
    },
    {
      title: 'Quãng đường',
      dataIndex: 'distanceTraveledKm',
      key: 'distance',
      render: (value) => (
        <Tag color="blue">
          {value ? `${value.toLocaleString()} km` : '-'}
        </Tag>
      ),
      sorter: (a, b) => (a.distanceTraveledKm || 0) - (b.distanceTraveledKm || 0),
    },
    {
      title: 'Nhiên liệu (L)',
      dataIndex: 'fuelVolumeLiters',
      key: 'fuel',
      render: (value) => (
        <Tag color="orange">
          {value ? `${value.toLocaleString()} L` : '-'}
        </Tag>
      ),
      sorter: (a, b) => (a.fuelVolumeLiters || 0) - (b.fuelVolumeLiters || 0),
    },
    {
      title: 'Ngày ghi nhận',
      dataIndex: 'dateRecorded',
      key: 'dateRecorded',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-',
      sorter: (a, b) => dayjs(a.dateRecorded).unix() - dayjs(b.dateRecorded).unix(),
      defaultSortOrder: 'descend',
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-2">
        <Title level={2} className="!m-0 flex items-center text-blue-800">
          <DashboardOutlined className="mr-2 text-blue-600" />
          Quản lý tiêu thụ nhiên liệu
        </Title>
        <Text type="secondary">
          Theo dõi nhật ký tiêu thụ nhiên liệu theo chuyến xe, phương tiện và tài xế.
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm" style={{ borderLeft: '4px solid #1890ff' }}>
            <Statistic
              title="Tổng bản ghi"
              value={stats.total}
              prefix={<DashboardOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm" style={{ borderLeft: '4px solid #faad14' }}>
            <Statistic
              title="Tổng nhiên liệu"
              value={stats.totalFuel}
              precision={1}
              suffix="L"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm" style={{ borderLeft: '4px solid #52c41a' }}>
            <Statistic
              title="Tổng quãng đường"
              value={stats.totalDistance}
              precision={1}
              suffix="km"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm" style={{ borderLeft: '4px solid #722ed1' }}>
            <Statistic
              title="TB tiêu thụ"
              value={stats.avgConsumption}
              precision={2}
              suffix="L/100km"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title level={4} className="!mb-0" style={{ color: '#1890ff' }}>
            <DashboardOutlined className="mr-2" />
            Quản lý tiêu thụ nhiên liệu
          </Title>
          <Space>
            <Input
              placeholder="Tìm kiếm theo mã chuyến, biển số, tên tài xế, hãng xe..."
              prefix={<SearchOutlined />}
              onChange={handleSearch}
              style={{ width: 300 }}
              allowClear
            />
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchConsumptions}
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
              showTotal: (total) => `Tổng ${total} bản ghi`,
            }}
            scroll={{ x: 1100 }}
          />
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={1000}
        styles={{ body: { padding: '16px' } }}
        title={
          <Space>
            <DashboardOutlined className="text-blue-600" />
            <span className="text-lg font-semibold">Chi tiết tiêu thụ nhiên liệu</span>
          </Space>
        }
      >
        {selectedItem && (
          <Tabs defaultActiveKey="1" size="large">
            <Tabs.TabPane 
              tab={
                <Space>
                  <CarOutlined className="text-blue-500" />
                  <span>Thông tin chung</span>
                </Space>
              } 
              key="1"
            >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card 
                  title={
                    <Space>
                      <CarOutlined className="text-blue-500" />
                      <Text strong>Phương tiện</Text>
                    </Space>
                  }
                  className="shadow-sm h-full"
                >
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Biển số xe">
                      <Text strong className="text-lg">{selectedItem.vehicle?.licensePlateNumber || '-'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Hãng xe">
                      <Text>{selectedItem.vehicle?.brand || '-'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Mã chuyến xe">
                      <Tag color="blue">{selectedItem.vehicleAssignment?.trackingCode || '-'}</Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              
              <Col span={12}>
                <Card 
                  title={
                    <Space>
                      <UserOutlined className="text-green-500" />
                      <Text strong>Tài xế</Text>
                    </Space>
                  }
                  className="shadow-sm h-full"
                >
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Họ tên">
                      <Text strong>{selectedItem.driver?.fullName || '-'}</Text>
                    </Descriptions.Item>
                    {selectedItem.driver?.phoneNumber && (
                      <Descriptions.Item label="SĐT">
                        <Space>
                          <PhoneOutlined className="text-blue-500" />
                          <Text>{selectedItem.driver.phoneNumber}</Text>
                        </Space>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>
              </Col>
            </Row>
            
            <Row gutter={[16, 16]} className="mt-4">
              <Col span={12}>
                <Card 
                  title={
                    <Space>
                      <DashboardOutlined className="text-orange-500" />
                      <Text strong>Thông tin tiêu thụ</Text>
                    </Space>
                  }
                  className="shadow-sm h-full"
                >
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Nhiên liệu">
                      <Tag color="orange" className="text-lg">
                        {selectedItem.fuelVolumeLiters ? `${selectedItem.fuelVolumeLiters.toLocaleString()} L` : '-'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Quãng đường">
                      <Tag color="blue" className="text-lg">
                        {selectedItem.distanceTraveledKm ? `${selectedItem.distanceTraveledKm.toLocaleString()} km` : '-'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày ghi nhận">
                      <Text>{selectedItem.dateRecorded ? dayjs(selectedItem.dateRecorded).format('DD/MM/YYYY HH:mm') : '-'}</Text>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              
              <Col span={12}>
                <Card 
                  title={
                    <Space>
                      <DashboardOutlined className="text-purple-500" />
                      <Text strong>Thông tin đồng hồ</Text>
                    </Space>
                  }
                  className="shadow-sm h-full"
                >
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Số km bắt đầu">
                      <Text strong className="text-lg">
                        {selectedItem.odometerStartKm ? `${selectedItem.odometerStartKm.toLocaleString()} km` : '-'}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Số km kết thúc">
                      <Text strong className="text-lg">
                        {selectedItem.odometerEndKm ? `${selectedItem.odometerEndKm.toLocaleString()} km` : '-'}
                      </Text>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>
            
            {selectedItem.notes && (
              <Row gutter={[16, 16]} className="mt-4">
                <Col span={24}>
                  <Card 
                    title={
                      <Space>
                        <Text strong>Ghi chú</Text>
                      </Space>
                    }
                    className="shadow-sm"
                  >
                    <Text>{selectedItem.notes}</Text>
                  </Card>
                </Col>
              </Row>
            )}
          </Tabs.TabPane>
          
          <Tabs.TabPane 
            tab={
              <Space>
                <CameraOutlined className="text-green-600" />
                <span>Hình ảnh chứng từ</span>
              </Space>
            } 
            key="2"
          >
            <Row gutter={[16, 16]}>
              {selectedItem.odometerAtStartUrl && (
                <Col span={8}>
                  <Card 
                    title={
                      <Space>
                        <CameraOutlined className="text-blue-500" />
                        <Text strong>Ảnh đồng hồ ODO bắt đầu</Text>
                      </Space>
                    }
                    className="shadow-sm h-full"
                  >
                    <Image
                      src={selectedItem.odometerAtStartUrl}
                      alt="Ảnh đồng hồ ODO bắt đầu"
                      width="100%"
                      style={{ 
                        maxHeight: '400px', 
                        objectFit: 'contain',
                        border: '1px solid #d9d9d9',
                        borderRadius: '8px'
                      }}
                      placeholder={
                        <div className="flex items-center justify-center h-48 bg-gray-100 rounded">
                          <Space direction="vertical" align="center">
                            <CameraOutlined className="text-3xl text-gray-400" />
                            <Text type="secondary">Đang tải hình ảnh...</Text>
                          </Space>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              )}
              
              {selectedItem.odometerAtEndUrl && (
                <Col span={8}>
                  <Card 
                    title={
                      <Space>
                        <CameraOutlined className="text-purple-500" />
                        <Text strong>Ảnh đồng hồ ODO kết thúc</Text>
                      </Space>
                    }
                    className="shadow-sm h-full"
                  >
                    <Image
                      src={selectedItem.odometerAtEndUrl}
                      alt="Ảnh đồng hồ ODO kết thúc"
                      width="100%"
                      style={{ 
                        maxHeight: '400px', 
                        objectFit: 'contain',
                        border: '1px solid #d9d9d9',
                        borderRadius: '8px'
                      }}
                      placeholder={
                        <div className="flex items-center justify-center h-48 bg-gray-100 rounded">
                          <Space direction="vertical" align="center">
                            <CameraOutlined className="text-3xl text-gray-400" />
                            <Text type="secondary">Đang tải hình ảnh...</Text>
                          </Space>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              )}

              {selectedItem.companyInvoiceImageUrl && (
                <Col span={8}>
                  <Card 
                    title={
                      <Space>
                        <CameraOutlined className="text-green-600" />
                        <Text strong>Hóa đơn nhiên liệu</Text>
                      </Space>
                    }
                    className="shadow-sm h-full"
                  >
                    <Image
                      src={selectedItem.companyInvoiceImageUrl}
                      alt="Hóa đơn nhiên liệu"
                      width="100%"
                      style={{ 
                        maxHeight: '400px', 
                        objectFit: 'contain',
                        border: '1px solid #d9d9d9',
                        borderRadius: '8px'
                      }}
                      placeholder={
                        <div className="flex items-center justify-center h-48 bg-gray-100 rounded">
                          <Space direction="vertical" align="center">
                            <CameraOutlined className="text-3xl text-gray-400" />
                            <Text type="secondary">Đang tải hình ảnh...</Text>
                          </Space>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              )}
            </Row>

            {!selectedItem.odometerAtStartUrl && !selectedItem.odometerAtEndUrl && !selectedItem.companyInvoiceImageUrl && (
              <div className="text-center py-12">
                <CameraOutlined className="text-5xl text-gray-300 mb-4" />
                <Text type="secondary">Không có hình ảnh chứng từ</Text>
              </div>
            )}
          </Tabs.TabPane>
        </Tabs>
        )}
      </Modal>
    </div>
  );
};

export default FuelConsumptionPage;
