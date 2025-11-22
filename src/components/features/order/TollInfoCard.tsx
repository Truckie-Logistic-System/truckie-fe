import React from 'react';
import { Card, Typography, Table, Empty, Descriptions } from 'antd';
import { DollarCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { TollDetail } from '@/models/JourneyHistory';
import { parseTollDetails, translatePointName } from '@/models/JourneyHistory';

const { Title } = Typography;

interface TollInfoCardProps {
    journeySegments: Array<{
        id: string;
        segmentOrder: number;
        startPointName: string;
        endPointName: string;
        tollDetailsJson: string | null;
        distanceKilometers: number;
        status: string;
        createdAt: string;
        modifiedAt: string;
    }>;
}

const TollInfoCard: React.FC<TollInfoCardProps> = ({ journeySegments }) => {
    // Process all toll data from journey segments
    const tollData = journeySegments
        .map(segment => {
            const tolls = parseTollDetails(segment.tollDetailsJson);

            return {
                segmentId: segment.id,
                segmentOrder: segment.segmentOrder,
                startPointName: segment.startPointName,
                endPointName: segment.endPointName,
                distanceKm: segment.distanceKilometers,
                status: segment.status,
                createdAt: segment.createdAt,
                modifiedAt: segment.modifiedAt,
                tolls: tolls
            };
        })
        .filter(segment => segment.tolls && segment.tolls.length > 0);

    // If no toll data, show empty state
    if (tollData.length === 0) {
        return (
            <Card className="mb-6 shadow-md rounded-lg">
                <Title level={5} className="flex items-center mb-4">
                    <DollarCircleOutlined className="mr-2 text-blue-500" /> Thông tin trạm thu phí
                </Title>
                <Empty description="Không có thông tin trạm thu phí" />
            </Card>
        );
    }

    // Columns for the toll table
    const columns = [
        {
            title: 'Đoạn đường',
            dataIndex: 'segment',
            key: 'segment',
            render: (_: any, record: any) => (
                <span className="flex items-center">
                    <EnvironmentOutlined className="mr-2 text-blue-500" />
                    <span className="font-medium">{translatePointName(record.startPointName)}</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium">{translatePointName(record.endPointName)}</span>
                </span>
            ),
        },
        {
            title: 'Tên trạm',
            dataIndex: 'name',
            key: 'name',
            render: (name: string) => (
                <span className="font-medium">{name}</span>
            ),
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'address',
            key: 'address',
            render: (address: string) => (
                <span className="text-gray-700">{address}</span>
            ),
        },
        {
            title: 'Phí (VND)',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number) => (
                <span className="font-semibold text-blue-600">
                    {amount.toLocaleString('vi-VN')}
                </span>
            ),
        },
    ];

    // Flatten toll data for the table
    const tableData = tollData.flatMap((segment, index) =>
        segment?.tolls.map((toll, tollIndex) => ({
            key: `${segment?.segmentId}-${tollIndex}`,
            startPointName: segment?.startPointName,
            endPointName: segment?.endPointName,
            segmentOrder: segment?.segmentOrder,
            distanceKm: segment?.distanceKm,
            status: segment?.status,
            ...toll
        })) || []
    );

    // Calculate total toll fee
    const totalTollFee = tableData.reduce((sum, item) => sum + item.amount, 0);

    return (
        <Card className="mb-6 shadow-md rounded-lg border-t-4 border-t-blue-500">
            <Title level={5} className="flex items-center mb-4">
                <DollarCircleOutlined className="mr-2 text-blue-500" /> Thông tin trạm thu phí
            </Title>

            <Descriptions size="small" bordered className="mb-4" column={{ xs: 1, sm: 2 }}>
                <Descriptions.Item
                    label={<span className="font-medium">Tổng số trạm thu phí</span>}
                    className="bg-blue-50"
                >
                    <span className="text-lg font-semibold">{tableData.length}</span>
                </Descriptions.Item>
                <Descriptions.Item
                    label={<span className="font-medium">Tổng phí đường</span>}
                    className="bg-blue-50"
                >
                    <span className="text-lg font-semibold text-blue-600">
                        {totalTollFee.toLocaleString('vi-VN')} VND
                    </span>
                </Descriptions.Item>
            </Descriptions>

            <Table
                columns={columns}
                dataSource={tableData}
                pagination={false}
                size="middle"
                className="mb-4"
                rowClassName="hover:bg-blue-50 transition-colors"
            />
        </Card>
    );
};

export default TollInfoCard; 