import React, { useState } from 'react';
import { Table, Button, Space, Tooltip, Modal, App } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import type { SizeRule, BasingPrice } from '../../../../models';
import { formatDate } from '../../../../utils/dateUtils';
import SizeRuleDetail from './SizeRuleDetail';
import { CommonStatusTag } from '../../../../components/common/tags';
import { CommonStatusEnum } from '../../../../constants/enums';
import StatusTag from '../../../../components/common/tags/StatusTag';

interface SizeRuleTableProps {
    sizeRules: SizeRule[];
    loading: boolean;
    onEdit: (sizeRule: SizeRule) => void;
    onDelete: (id: string) => void;
    onRefresh: () => void;
}

const SizeRuleTable: React.FC<SizeRuleTableProps> = ({
    sizeRules,
    loading,
    onEdit,
    onDelete,
    onRefresh,
}) => {
    const { modal } = App.useApp();
    const [detailVisible, setDetailVisible] = useState(false);
    const [selectedRule, setSelectedRule] = useState<SizeRule | null>(null);

    const showDetail = (record: SizeRule) => {
        setSelectedRule(record);
        setDetailVisible(true);
    };

    // Dịch tên loại hàng sang tiếng Việt
    const getCategoryName = (category: string): string => {
        switch (category) {
            case 'NORMAL': return 'Hàng thông thường';
            case 'BULKY CARGO': return 'Hàng cồng kềnh';
            case 'DANGEROUS': return 'Hàng nguy hiểm';
            default: return category;
        }
    };

    // Lấy màu cho loại hàng
    const getCategoryColor = (category: string): string => {
        switch (category) {
            case 'NORMAL': return 'bg-green-500 text-white';
            case 'BULKY CARGO': return 'bg-orange-500 text-white';
            case 'DANGEROUS': return 'bg-red-500 text-white';
            default: return 'bg-blue-500 text-white';
        }
    };

    // Chuyển đổi trạng thái thành CommonStatusEnum
    const getStatusEnum = (status: string): CommonStatusEnum => {
        return status === 'ACTIVE' ? CommonStatusEnum.ACTIVE : CommonStatusEnum.INACTIVE;
    };

    // Format hiển thị quãng đường
    const formatDistanceRange = (fromKm: number, toKm: number): string => {
        if (fromKm === 0) return `<${toKm + 1}km`;
        if (toKm > 9999) return `>${fromKm - 1}km`;
        return `${fromKm}-${toKm}km`;
    };

    const columns = [
        {
            title: 'Loại xe',
            dataIndex: ['vehicleTypeEntity', 'vehicleTypeName'],
            key: 'vehicleTypeName',
            sorter: (a: SizeRule, b: SizeRule) =>
                a.vehicleTypeEntity.vehicleTypeName.localeCompare(b.vehicleTypeEntity.vehicleTypeName),
            render: (text: string) => <span className="font-medium">{text}</span>,
        },
        {
            title: 'Loại hàng',
            dataIndex: ['category', 'categoryName'],
            key: 'categoryName',
            sorter: (a: SizeRule, b: SizeRule) =>
                a.category.categoryName.localeCompare(b.category.categoryName),
            render: (text: string) => (
                <StatusTag
                    status={text}
                    colorClass={getCategoryColor(text)}
                    label={getCategoryName(text)}
                    size="small"
                />
            ),
            filters: [
                { text: 'Hàng thông thường', value: 'NORMAL' },
                { text: 'Hàng cồng kềnh', value: 'BULKY CARGO' },
                { text: 'Hàng nguy hiểm', value: 'DANGEROUS' },
            ],
            onFilter: (value: any, record: SizeRule) => record.category.categoryName === value,
        },
        {
            title: 'Trọng lượng (tấn)',
            key: 'weight',
            render: (_: unknown, record: SizeRule) => (
                <span>{record.minWeight} - {record.maxWeight}</span>
            ),
            sorter: (a: SizeRule, b: SizeRule) => a.maxWeight - b.maxWeight,
        },
        {
            title: 'Kích thước (m)',
            key: 'dimensions',
            render: (_: unknown, record: SizeRule) => (
                <Tooltip title={`Dài: ${record.minLength}-${record.maxLength}, Rộng: ${record.minWidth}-${record.maxWidth}, Cao: ${record.minHeight}-${record.maxHeight}`}>
                    <span>
                        {record.minLength}×{record.minWidth}×{record.minHeight} - {record.maxLength}×{record.maxWidth}×{record.maxHeight}
                    </span>
                </Tooltip>
            ),
        },
        {
            title: 'Trạng thái',
            key: 'status',
            render: (_: unknown, record: SizeRule) => (
                <CommonStatusTag status={getStatusEnum(record.status)} size="small" />
            ),
            filters: [
                { text: 'Hoạt động', value: 'ACTIVE' },
                { text: 'Không hoạt động', value: 'INACTIVE' },
            ],
            onFilter: (value: any, record: SizeRule) => record.status === value,
        },
        {
            title: 'Hiệu lực từ',
            dataIndex: 'effectiveFrom',
            key: 'effectiveFrom',
            render: (date: string) => formatDate(date),
            sorter: (a: SizeRule, b: SizeRule) =>
                new Date(a.effectiveFrom).getTime() - new Date(b.effectiveFrom).getTime(),
        },
        {
            title: 'Thao tác',
            key: 'action',
            align: 'center' as const,
            width: 100,
            render: (_: unknown, record: SizeRule) => (
                <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    className="bg-blue-500 hover:bg-blue-600"
                    onClick={() => showDetail(record)}
                >
                    Chi tiết
                </Button>
            ),
        },
    ];

    return (
        <>
            <Table
                dataSource={sizeRules}
                columns={columns}
                rowKey="id"
                loading={loading}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng số ${total} quy tắc`,
                }}
            />

            {selectedRule && (
                <SizeRuleDetail
                    visible={detailVisible}
                    sizeRule={selectedRule}
                    onClose={() => setDetailVisible(false)}
                />
            )}
        </>
    );
};

export default SizeRuleTable; 