import React, { useState } from 'react';
import { Modal, Table, Typography, Radio, Card, Empty, Skeleton, Collapse, Tabs } from 'antd';
import type { VehicleRule, BasingPrice } from '../../../../models';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { TabPane } = Tabs;

interface PricePreviewModalProps {
    visible: boolean;
    onClose: () => void;
    vehicleRules: VehicleRule[];
    loading: boolean;
}

type SortType = 'weight' | 'dimensions';
type ViewMode = 'customer' | 'admin';

interface TableDataItem {
    vehicleTypeName: string;
    minWeight: number;
    maxWeight: number;
    volumeAvg: number;
    weightAvg: number;
    category: string;
    categoryId: string;
    dimensions: string;
    rule: VehicleRule;
    [key: string]: any; // For dynamic distance columns
}

interface PriceTableResult {
    data: TableDataItem[];
    distanceRanges: Array<{
        from: number;
        to: number;
    }>;
}

interface CategoryInfo {
    id: string;
    name: string;
    description: string;
    nameVi: string; // Tên tiếng Việt
}

const PricePreviewModal: React.FC<PricePreviewModalProps> = ({
    visible,
    onClose,
    vehicleRules,
    loading,
}) => {
    const [sortType, setSortType] = useState<SortType>('weight');
    const [viewMode, setViewMode] = useState<ViewMode>('customer');
    const [activeCategory, setActiveCategory] = useState<string>('');

    // Filter to only active rules
    const filteredRules = vehicleRules.filter(rule => rule.status === 'ACTIVE');

    // Format hiển thị quãng đường
    const formatDistanceRange = (fromKm: number, toKm: number): string => {
        if (fromKm === 0) return `<${toKm + 1}km`;
        if (toKm > 9999) return `>${fromKm - 1}km`;
        return `${fromKm}-${toKm}km`;
    };

    // Dịch tên loại hàng sang tiếng Việt
    const getCategoryNameVi = (name: string): string => {
        switch (name) {
            case 'NORMAL': return 'Hàng thông thường';
            case 'BULKY CARGO': return 'Hàng cồng kềnh';
            case 'DANGEROUS': return 'Hàng nguy hiểm';
            default: return name;
        }
    };

    // Extract unique categories
    const getCategories = (): CategoryInfo[] => {
        const categoriesMap = new Map<string, CategoryInfo>();

        filteredRules.forEach(rule => {
            if (!categoriesMap.has(rule.category.id)) {
                categoriesMap.set(rule.category.id, {
                    id: rule.category.id,
                    name: rule.category.categoryName,
                    nameVi: getCategoryNameVi(rule.category.categoryName),
                    description: rule.category.description
                });
            }
        });

        return Array.from(categoriesMap.values());
    };

    const categories = getCategories();

    // Set initial active category if not set
    React.useEffect(() => {
        if (categories.length > 0 && !activeCategory) {
            setActiveCategory(categories[0].id);
        }
    }, [categories, activeCategory]);

    // Get rules filtered by active category
    const getRulesByCategory = () => {
        if (!activeCategory) return [];
        return filteredRules.filter(rule => rule.category.id === activeCategory);
    };

    const categoryRules = getRulesByCategory();

    // Get unique vehicle types to prevent duplicates
    const getUniqueVehicleTypes = () => {
        const uniqueVehicleTypes = new Map<string, VehicleRule>();

        categoryRules.forEach(rule => {
            const key = rule.vehicleTypeEntity.id;
            // If this vehicle type isn't in our map yet, or if this rule has pricing data and the existing one doesn't
            if (!uniqueVehicleTypes.has(key) ||
                (rule.basingPrices.length > 0 && uniqueVehicleTypes.get(key)?.basingPrices.length === 0)) {
                uniqueVehicleTypes.set(key, rule);
            }
        });

        return Array.from(uniqueVehicleTypes.values());
    };

    const uniqueRules = getUniqueVehicleTypes();

    const handleSortChange = (e: any) => {
        setSortType(e.target.value);
    };

    const handleViewModeChange = (e: any) => {
        setViewMode(e.target.value);
    };

    const handleCategoryChange = (categoryId: string) => {
        setActiveCategory(categoryId);
    };

    // Create specifications table data
    const createSpecificationsTableData = () => {
        return uniqueRules.map(rule => {
            const volumeAvg = (
                ((rule.minLength + rule.maxLength) / 2) *
                ((rule.minWidth + rule.maxWidth) / 2) *
                ((rule.minHeight + rule.maxHeight) / 2)
            );

            const weightAvg = (rule.minWeight + rule.maxWeight) / 2;

            return {
                vehicleTypeName: rule.vehicleTypeEntity.vehicleTypeName,
                minWeight: rule.minWeight,
                maxWeight: rule.maxWeight,
                dimensions: `${rule.minLength}×${rule.minWidth}×${rule.minHeight} - ${rule.maxLength}×${rule.maxWidth}×${rule.maxHeight}`,
                volumeAvg,
                weightAvg,
                category: rule.category.categoryName,
                categoryId: rule.category.id,
                rule: rule,
            };
        }).sort((a, b) => {
            if (sortType === 'weight') {
                return a.weightAvg - b.weightAvg;
            } else {
                return a.volumeAvg - b.volumeAvg;
            }
        });
    };

    // Create price table data
    const createPriceTableData = (): PriceTableResult => {
        // Get all unique distance ranges
        const allDistanceRanges: Array<{ from: number, to: number }> = [];

        uniqueRules.forEach(rule => {
            if (rule.basingPrices && rule.basingPrices.length > 0) {
                rule.basingPrices.forEach(price => {
                    const { fromKm, toKm } = price.distanceRuleResponse;
                    const existingRange = allDistanceRanges.find(
                        range => range.from === fromKm && range.to === toKm
                    );

                    if (!existingRange) {
                        allDistanceRanges.push({ from: fromKm, to: toKm });
                    }
                });
            }
        });

        // Sort distance ranges
        allDistanceRanges.sort((a, b) => a.from - b.from);

        // Create table data with dynamic columns for each distance range
        const tableData = uniqueRules.map(rule => {
            const volumeAvg = (
                ((rule.minLength + rule.maxLength) / 2) *
                ((rule.minWidth + rule.maxWidth) / 2) *
                ((rule.minHeight + rule.maxHeight) / 2)
            );

            const weightAvg = (rule.minWeight + rule.maxWeight) / 2;

            const baseData: TableDataItem = {
                vehicleTypeName: rule.vehicleTypeEntity.vehicleTypeName,
                minWeight: rule.minWeight,
                maxWeight: rule.maxWeight,
                volumeAvg,
                weightAvg,
                category: rule.category.categoryName,
                categoryId: rule.category.id,
                dimensions: `${rule.minLength}×${rule.minWidth}×${rule.minHeight} - ${rule.maxLength}×${rule.maxWidth}×${rule.maxHeight}`,
                rule: rule, // Keep reference to original rule for detailed view
            };

            // Add dynamic columns for each distance range
            allDistanceRanges.forEach(range => {
                const priceForRange = rule.basingPrices?.find(
                    price =>
                        price.distanceRuleResponse.fromKm === range.from &&
                        price.distanceRuleResponse.toKm === range.to
                );

                const columnKey = `${range.from}-${range.to}`;
                baseData[columnKey] = priceForRange ? parseInt(priceForRange.basePrice) : null;
            });

            return baseData;
        }).sort((a, b) => {
            if (sortType === 'weight') {
                return a.weightAvg - b.weightAvg;
            } else {
                return a.volumeAvg - b.volumeAvg;
            }
        });

        return {
            data: tableData,
            distanceRanges: allDistanceRanges
        };
    };

    // Create specifications columns
    const createSpecificationsColumns = (): ColumnsType<TableDataItem> => {
        return [
            {
                title: 'Loại xe',
                dataIndex: 'vehicleTypeName',
                key: 'vehicleTypeName',
                width: '25%',
            },
            {
                title: 'Trọng lượng (tấn)',
                key: 'weight',
                width: '25%',
                render: (_: unknown, record: TableDataItem) => (
                    <span>{record.minWeight} - {record.maxWeight}</span>
                ),
            },
            {
                title: 'Kích thước (m)',
                dataIndex: 'dimensions',
                key: 'dimensions',
                width: '50%',
            },
        ];
    };

    // Create price columns
    const createPriceColumns = (): ColumnsType<TableDataItem> => {
        const priceTableResult = createPriceTableData();
        const columns: ColumnsType<TableDataItem> = [
            {
                title: 'Loại xe',
                dataIndex: 'vehicleTypeName',
                key: 'vehicleTypeName',
                fixed: 'left' as const,
                width: 150,
            },
        ];

        priceTableResult.distanceRanges.forEach(range => {
            columns.push({
                title: formatDistanceRange(range.from, range.to),
                dataIndex: `${range.from}-${range.to}`,
                key: `${range.from}-${range.to}`,
                width: 120,
                align: 'right' as const,
                render: (price: number | null) => {
                    return price ? price.toLocaleString('vi-VN') : '-';
                },
            });
        });

        return columns;
    };

    // Create admin columns with detailed information
    const createAdminColumns = (): ColumnsType<TableDataItem> => {
        return [
            {
                title: 'Loại xe',
                dataIndex: 'vehicleTypeName',
                key: 'vehicleTypeName',
                width: '15%',
            },
            {
                title: 'Trọng lượng (tấn)',
                key: 'weight',
                width: '15%',
                render: (_: unknown, record: TableDataItem) => (
                    <span>{record.minWeight} - {record.maxWeight}</span>
                ),
            },
            {
                title: 'Kích thước (m)',
                dataIndex: 'dimensions',
                key: 'dimensions',
                width: '20%',
            },
            {
                title: 'Loại hàng',
                dataIndex: 'category',
                key: 'category',
                width: '15%',
                render: (text: string) => getCategoryNameVi(text),
            },
            {
                title: 'Chi tiết giá',
                key: 'priceDetails',
                width: '35%',
                render: (_: unknown, record: TableDataItem) => {
                    const rule = record.rule;
                    if (!rule.basingPrices || rule.basingPrices.length === 0) {
                        return <Text type="secondary">Chưa có thông tin giá</Text>;
                    }

                    return (
                        <Collapse ghost>
                            <Panel header={`${rule.basingPrices.length} mức giá`} key="1">
                                <Table
                                    dataSource={rule.basingPrices}
                                    columns={[
                                        {
                                            title: 'Khoảng cách',
                                            key: 'distance',
                                            render: (record: BasingPrice) => (
                                                <span>
                                                    {formatDistanceRange(record.distanceRuleResponse.fromKm, record.distanceRuleResponse.toKm)}
                                                </span>
                                            ),
                                        },
                                        {
                                            title: 'Giá cơ bản (VND)',
                                            dataIndex: 'basePrice',
                                            key: 'basePrice',
                                            render: (price: string) => (
                                                <span>{parseInt(price).toLocaleString('vi-VN')}</span>
                                            ),
                                        },
                                    ]}
                                    pagination={false}
                                    size="small"
                                    bordered
                                />
                            </Panel>
                        </Collapse>
                    );
                },
            },
        ];
    };

    const specificationsTableData = createSpecificationsTableData();
    const priceTableResult = createPriceTableData();

    // Get category color for tabs
    const getCategoryColor = (categoryName: string) => {
        switch (categoryName.toUpperCase()) {
            case 'NORMAL': return 'green';
            case 'BULKY CARGO': return 'orange';
            case 'DANGEROUS': return 'red';
            default: return 'blue';
        }
    };

    // Get current category description
    const getCurrentCategoryDescription = () => {
        const category = categories.find(cat => cat.id === activeCategory);
        return category?.description || '';
    };

    if (loading) {
        return (
            <Modal
                title="Xem trước bảng giá"
                open={visible}
                onCancel={onClose}
                footer={null}
                width={1200}
                style={{ top: 20 }}
            >
                <Skeleton active />
                <Skeleton active />
            </Modal>
        );
    }

    if (filteredRules.length === 0) {
        return (
            <Modal
                title="Xem trước bảng giá"
                open={visible}
                onCancel={onClose}
                footer={null}
                width={1200}
                style={{ top: 20 }}
            >
                <Empty description="Không có dữ liệu bảng giá" />
            </Modal>
        );
    }

    return (
        <Modal
            title="Xem trước bảng giá"
            open={visible}
            onCancel={onClose}
            footer={null}
            width={1200}
            style={{ top: 20 }}
            bodyStyle={{ padding: '24px' }}
        >
            <Tabs
                activeKey={activeCategory}
                onChange={handleCategoryChange}
                className="mb-4"
                type="card"
            >
                {categories.map(category => (
                    <TabPane
                        tab={
                            <span>
                                <span style={{
                                    display: 'inline-block',
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    backgroundColor: getCategoryColor(category.name),
                                    marginRight: 8
                                }}></span>
                                {category.nameVi}
                            </span>
                        }
                        key={category.id}
                    />
                ))}
            </Tabs>

            <div className="mb-4">
                <div className="mt-3 mb-2">
                    <Text>
                        <strong>Mô tả:</strong> {getCurrentCategoryDescription()}
                    </Text>
                </div>
                <div className="flex justify-between mt-4">
                    <Radio.Group
                        value={viewMode}
                        onChange={handleViewModeChange}
                        optionType="button"
                        buttonStyle="solid"
                    >
                        <Radio.Button value="customer">Hiển thị cho khách hàng</Radio.Button>
                        <Radio.Button value="admin">Hiển thị chi tiết</Radio.Button>
                    </Radio.Group>

                    <Radio.Group
                        value={sortType}
                        onChange={handleSortChange}
                        optionType="button"
                        buttonStyle="solid"
                    >
                        <Radio.Button value="weight">Sắp xếp theo trọng lượng</Radio.Button>
                        <Radio.Button value="dimensions">Sắp xếp theo kích thước</Radio.Button>
                    </Radio.Group>
                </div>
            </div>

            {viewMode === 'customer' ? (
                <>
                    <Card className="mb-4">
                        <Title level={5} className="text-center bg-orange-500 text-white py-2 mb-4">
                            BẢNG QUY CHUẨN HÀNG HÓA VẬN CHUYỂN XE TẢI
                        </Title>
                        <Table
                            dataSource={specificationsTableData}
                            columns={createSpecificationsColumns()}
                            pagination={false}
                            rowKey="vehicleTypeName"
                            bordered
                            size="middle"
                            className="mb-6"
                            locale={{ emptyText: 'Không có dữ liệu cho loại hàng này' }}
                        />
                    </Card>

                    <Card className="mb-4">
                        <Title level={5} className="text-center bg-orange-500 text-white py-2 mb-4">
                            BẢNG GIÁ CƯỚC VẬN CHUYỂN XE TẢI (ĐƠN VỊ TÍNH: VNĐ)
                        </Title>
                        <Table
                            dataSource={priceTableResult.data}
                            columns={createPriceColumns()}
                            pagination={false}
                            rowKey="vehicleTypeName"
                            scroll={{ x: 'max-content' }}
                            bordered
                            size="middle"
                            locale={{ emptyText: 'Không có dữ liệu giá cho loại hàng này' }}
                        />
                    </Card>
                </>
            ) : (
                <Card className="mb-4">
                    <Table
                        dataSource={specificationsTableData}
                        columns={createAdminColumns()}
                        pagination={false}
                        rowKey="vehicleTypeName"
                        bordered
                        size="middle"
                        locale={{ emptyText: 'Không có dữ liệu cho loại hàng này' }}
                    />
                </Card>
            )}
        </Modal>
    );
};

export default PricePreviewModal; 