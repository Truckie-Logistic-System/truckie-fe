import React, { useState, useEffect } from 'react';
import { Card, Select, DatePicker, Button, Space, Row, Col, Divider } from 'antd';
import { FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { OrderStatusEnum, OrderStatusLabels } from '@/constants/enums';
import dayjs from 'dayjs';
import addressService from '@/services/address/addressService';
import customerService from '@/services/customer/customerService';
import { useAuth } from '@/context';
import type { Address } from '@/models/Address';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface OrdersFilterProps {
    onFilterChange: (filters: {
        year?: number;
        quarter?: number;
        status?: string;
        addressId?: string;
    }) => void;
}

const OrdersFilter: React.FC<OrdersFilterProps> = ({ onFilterChange }) => {
    const [year, setYear] = useState<number | undefined>(undefined);
    const [quarter, setQuarter] = useState<number | undefined>(undefined);
    const [status, setStatus] = useState<string | undefined>(undefined);
    const [addressId, setAddressId] = useState<string | undefined>(undefined);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const { user } = useAuth();

    // Generate year options (current year and 5 years back)
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

    // Quarter options
    const quarterOptions = [
        { value: 1, label: 'Quý 1 (Tháng 1-3)' },
        { value: 2, label: 'Quý 2 (Tháng 4-6)' },
        { value: 3, label: 'Quý 3 (Tháng 7-9)' },
        { value: 4, label: 'Quý 4 (Tháng 10-12)' },
    ];

    // Status options from enum
    const statusOptions = Object.entries(OrderStatusEnum).map(([key, value]) => ({
        value,
        label: OrderStatusLabels[value] || key,
    }));

    // Group status options by category
    const groupedStatusOptions = [
        {
            label: 'Khởi tạo',
            options: statusOptions.filter(status =>
                [OrderStatusEnum.PENDING, OrderStatusEnum.PROCESSING].includes(status.value as OrderStatusEnum)
            )
        },
        {
            label: 'Hợp đồng',
            options: statusOptions.filter(status =>
                [OrderStatusEnum.CONTRACT_DRAFT, OrderStatusEnum.CONTRACT_SIGNED].includes(status.value as OrderStatusEnum)
            )
        },
        {
            label: 'Lập kế hoạch & Thanh toán',
            options: statusOptions.filter(status =>
                [OrderStatusEnum.ON_PLANNING, OrderStatusEnum.ASSIGNED_TO_DRIVER, OrderStatusEnum.FULLY_PAID].includes(status.value as OrderStatusEnum)
            )
        },
        {
            label: 'Đang vận chuyển',
            options: statusOptions.filter(status =>
                [OrderStatusEnum.PICKING_UP, OrderStatusEnum.ON_DELIVERED, OrderStatusEnum.ONGOING_DELIVERED].includes(status.value as OrderStatusEnum)
            )
        },
        {
            label: 'Sự cố',
            options: statusOptions.filter(status =>
                [OrderStatusEnum.IN_TROUBLES, OrderStatusEnum.RESOLVED, OrderStatusEnum.COMPENSATION].includes(status.value as OrderStatusEnum)
            )
        },
        {
            label: 'Hoàn thành',
            options: statusOptions.filter(status =>
                [OrderStatusEnum.DELIVERED, OrderStatusEnum.SUCCESSFUL].includes(status.value as OrderStatusEnum)
            )
        },
        {
            label: 'Từ chối/Trả lại',
            options: statusOptions.filter(status =>
                [OrderStatusEnum.REJECT_ORDER, OrderStatusEnum.RETURNING, OrderStatusEnum.RETURNED].includes(status.value as OrderStatusEnum)
            )
        }
    ];

    // Fetch addresses for the current user
    useEffect(() => {
        const fetchAddresses = async () => {
            if (!user?.id) return;

            try {
                setLoading(true);
                // First, get the customer ID from the user ID
                const customerData = await customerService.getCustomerProfile(user.id);

                if (customerData && customerData.id) {
                    // Then, get addresses for this customer
                    const addressList = await addressService.getAddressesByCustomerId(customerData.id);
                    setAddresses(addressList);
                }
            } catch (error) {
                console.error('Error fetching addresses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAddresses();
    }, [user]);

    // Handle filter application
    const applyFilters = () => {
        onFilterChange({
            year,
            quarter,
            status,
            addressId,
        });
    };

    // Handle filter reset
    const resetFilters = () => {
        setYear(undefined);
        setQuarter(undefined);
        setStatus(undefined);
        setAddressId(undefined);
        onFilterChange({});
    };

    return (
        <Card className="mb-6 shadow-md rounded-xl">
            <div className="flex items-center mb-4">
                <FilterOutlined className="text-blue-500 mr-2" />
                <h3 className="text-lg font-medium">Lọc đơn hàng</h3>
            </div>

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                    <div className="mb-2 font-medium">Năm</div>
                    <Select
                        placeholder="Chọn năm"
                        style={{ width: '100%' }}
                        value={year}
                        onChange={setYear}
                        allowClear
                    >
                        {yearOptions.map(year => (
                            <Option key={year} value={year}>{year}</Option>
                        ))}
                    </Select>
                </Col>

                <Col xs={24} sm={12} md={6}>
                    <div className="mb-2 font-medium">Quý</div>
                    <Select
                        placeholder="Chọn quý"
                        style={{ width: '100%' }}
                        value={quarter}
                        onChange={setQuarter}
                        allowClear
                    >
                        {quarterOptions.map(quarter => (
                            <Option key={quarter.value} value={quarter.value}>{quarter.label}</Option>
                        ))}
                    </Select>
                </Col>

                <Col xs={24} sm={12} md={6}>
                    <div className="mb-2 font-medium">Trạng thái</div>
                    <Select
                        placeholder="Chọn trạng thái"
                        style={{ width: '100%' }}
                        value={status}
                        onChange={setStatus}
                        allowClear
                        showSearch
                        optionFilterProp="children"
                    >
                        {groupedStatusOptions.map(group => (
                            <Select.OptGroup key={group.label} label={group.label}>
                                {group.options.map(option => (
                                    <Option key={option.value} value={option.value}>
                                        {option.label}
                                    </Option>
                                ))}
                            </Select.OptGroup>
                        ))}
                    </Select>
                </Col>

                <Col xs={24} sm={12} md={6}>
                    <div className="mb-2 font-medium">Địa chỉ</div>
                    <Select
                        placeholder="Chọn địa chỉ"
                        style={{ width: '100%' }}
                        value={addressId}
                        onChange={setAddressId}
                        allowClear
                        showSearch
                        optionFilterProp="children"
                        loading={loading}
                    >
                        {addresses.map(address => (
                            <Option key={address.id} value={address.id}>
                                {address.street}, {address.ward}, {address.province}
                            </Option>
                        ))}
                    </Select>
                </Col>
            </Row>

            <Divider style={{ margin: '16px 0' }} />

            <div className="flex justify-end">
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={resetFilters}>
                        Đặt lại
                    </Button>
                    <Button type="primary" onClick={applyFilters} className="bg-blue-600 hover:bg-blue-700">
                        Áp dụng bộ lọc
                    </Button>
                </Space>
            </div>
        </Card>
    );
};

export default OrdersFilter; 