import React, { useState, useEffect } from 'react';
import { Table, Button, Tabs, Tag, Tooltip, Space, Modal, App, Skeleton, Card, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined } from '@ant-design/icons';
import addressService from '../../../services/address/addressService';
import type { Address } from '../../../models/Address';
import AddressForm from './AddressForm';

const { TabPane } = Tabs;

interface AddressTabProps {
    customerId: string;
}

const AddressTab: React.FC<AddressTabProps> = ({ customerId }) => {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [currentAddress, setCurrentAddress] = useState<Address | null>(null);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const { message } = App.useApp();

    const fetchAddresses = async () => {
        try {
            setLoading(true);
            const data = await addressService.getMyAddresses();
            setAddresses(data);
        } catch (error) {
            message.error('Không thể tải danh sách địa chỉ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    const handleAddAddress = () => {
        setCurrentAddress(null);
        setModalMode('create');
        setIsModalVisible(true);
    };

    const handleEditAddress = (address: Address) => {
        setCurrentAddress(address);
        setModalMode('edit');
        setIsModalVisible(true);
    };

    const handleDeleteAddress = (id: string) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc chắn muốn xóa địa chỉ này?',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await addressService.deleteAddress(id);
                    message.success('Xóa địa chỉ thành công');
                    fetchAddresses();
                } catch (error) {
                    message.error('Không thể xóa địa chỉ');
                }
            }
        });
    };

    const handleSaveAddress = async () => {
        await fetchAddresses();
        setIsModalVisible(false);
    };

    const columns = [
        {
            title: 'Địa chỉ',
            dataIndex: 'street',
            key: 'street',
            render: (text: string, record: Address) => (
                <div>
                    <div className="font-medium">{record.street}</div>
                    <div className="text-gray-500 text-sm">{record.ward}, {record.province}</div>
                </div>
            ),
        },
        {
            title: 'Loại địa chỉ',
            dataIndex: 'addressType',
            key: 'addressType',
            render: (addressType: boolean) => (
                addressType ?
                    <Tag color="blue">Địa chỉ gửi hàng</Tag> :
                    <Tag color="green">Địa chỉ nhận hàng</Tag>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: Address) => (
                <Space size="middle">
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            icon={<EditOutlined />}
                            size="small"
                            onClick={() => handleEditAddress(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <Button
                            icon={<DeleteOutlined />}
                            size="small"
                            danger
                            onClick={() => handleDeleteAddress(record.id)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const pickupAddresses = addresses.filter(address => address.addressType === true);
    const deliveryAddresses = addresses.filter(address => address.addressType === false);

    if (loading) {
        return (
            <div className="address-tab">
                <div className="flex justify-between items-center mb-4">
                    <Skeleton.Input active size="small" style={{ width: 150 }} />
                    <Skeleton.Button active size="default" shape="default" />
                </div>

                <Card className="mb-4">
                    <Skeleton active paragraph={{ rows: 1 }} />
                </Card>

                <Skeleton active paragraph={{ rows: 6 }} />
            </div>
        );
    }

    return (
        <div className="address-tab">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Quản lý địa chỉ</h3>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddAddress}
                >
                    Thêm địa chỉ mới
                </Button>
            </div>

            <Tabs defaultActiveKey="all">
                <TabPane tab="Tất cả địa chỉ" key="all">
                    {addresses.length > 0 ? (
                        <Table
                            dataSource={addresses}
                            columns={columns}
                            rowKey="id"
                            pagination={{ pageSize: 5 }}
                        />
                    ) : (
                        <Empty
                            description="Chưa có địa chỉ nào"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    )}
                </TabPane>
                <TabPane tab={`Địa chỉ gửi hàng (${pickupAddresses.length})`} key="pickup">
                    {pickupAddresses.length > 0 ? (
                        <Table
                            dataSource={pickupAddresses}
                            columns={columns}
                            rowKey="id"
                            pagination={{ pageSize: 5 }}
                        />
                    ) : (
                        <Empty
                            description="Chưa có địa chỉ gửi hàng nào"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    )}
                </TabPane>
                <TabPane tab={`Địa chỉ nhận hàng (${deliveryAddresses.length})`} key="delivery">
                    {deliveryAddresses.length > 0 ? (
                        <Table
                            dataSource={deliveryAddresses}
                            columns={columns}
                            rowKey="id"
                            pagination={{ pageSize: 5 }}
                        />
                    ) : (
                        <Empty
                            description="Chưa có địa chỉ nhận hàng nào"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    )}
                </TabPane>
            </Tabs>

            <AddressForm
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onSuccess={handleSaveAddress}
                initialValues={currentAddress}
                mode={modalMode}
            />
        </div>
    );
};

export default AddressTab; 