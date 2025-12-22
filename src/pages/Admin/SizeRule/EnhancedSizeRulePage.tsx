import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Button, 
    App, 
    Card, 
    Typography, 
    Tabs, 
    Table, 
    InputNumber, 
    Skeleton, 
    Empty, 
    Tag,
    Row,
    Col,
    Divider,
    Space,
    Collapse
} from 'antd';
import { 
    DollarOutlined, 
    ReloadOutlined, 
    SaveOutlined,
    SettingOutlined
} from '@ant-design/icons';
import type { SizeRule, BasingPrice, DistanceRule } from '../../../models';
import sizeRuleService from '../../../services/size-rule/sizeRuleService';
import distanceRuleService from '../../../services/distance-rule/distanceRuleService';
import DistanceRangeManager from '../../../components/Admin/DistanceRangeManager';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

interface TableDataItem {
    vehicleTypeName: string;
    vehicleTypeDescription: string;
    minWeight: number;
    maxWeight: number;
    dimensions: string;
    rule: SizeRule;
    [key: string]: any;
}

interface EditingPrice {
    sizeRuleId: string;
    distanceRangeKey: string;
    basingPriceId?: string;
    distanceRuleId: string;
    value: number;
}

const EnhancedSizeRulePage: React.FC = () => {
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const [activeCategory, setActiveCategory] = useState<string>('');
    const [editingPrices, setEditingPrices] = useState<Map<string, EditingPrice>>(new Map());

    // Fetch size rules
    const {
        data: sizeRules = [],
        isLoading: isLoadingSizeRules,
        refetch: refetchSizeRules,
        isFetching: isFetchingSizeRules
    } = useQuery({
        queryKey: ['sizeRules'],
        queryFn: () => sizeRuleService.getSizeRulesFull(),
    });

    // Fetch distance rules
    const {
        data: distanceRules = [],
        isLoading: isLoadingDistanceRules,
        refetch: refetchDistanceRules
    } = useQuery({
        queryKey: ['distanceRules'],
        queryFn: () => distanceRuleService.getAllDistanceRules(),
    });

    // Update price mutation
    const updatePriceMutation = useMutation({
        mutationFn: async (data: { id?: string; basePrice: number; sizeRuleId: string; distanceRuleId: string }) => {
            if (data.id) {
                return sizeRuleService.updateBasingPrice(data.id, {
                    basePrice: data.basePrice,
                    sizeRuleId: data.sizeRuleId,
                    distanceRuleId: data.distanceRuleId
                });
            } else {
                return sizeRuleService.createBasingPrice({
                    basePrice: data.basePrice,
                    sizeRuleId: data.sizeRuleId,
                    distanceRuleId: data.distanceRuleId
                });
            }
        },
        onSuccess: () => {
            message.success('Cập nhật giá thành công');
            queryClient.invalidateQueries({ queryKey: ['sizeRules'] });
            setEditingPrices(new Map());
        },
        onError: (error) => {
            message.error('Không thể cập nhật giá: ' + (error as Error).message);
        }
    });

    // Distance rule mutations
    const createDistanceRuleMutation = useMutation({
        mutationFn: (data: { fromKm: number; toKm: number }) => 
            distanceRuleService.createDistanceRule(data),
        onSuccess: () => {
            message.success('Thêm khoảng cách thành công');
            refetchDistanceRules();
            refetchSizeRules();
        },
        onError: (error: any) => {
            message.error(error?.response?.data?.message || 'Không thể thêm khoảng cách');
        }
    });

    const updateDistanceRuleMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { fromKm: number; toKm: number } }) =>
            distanceRuleService.updateDistanceRule(id, data),
        onSuccess: () => {
            message.success('Cập nhật khoảng cách thành công');
            refetchDistanceRules();
            refetchSizeRules();
        },
        onError: (error: any) => {
            message.error(error?.response?.data?.message || 'Không thể cập nhật khoảng cách');
        }
    });

    const deleteDistanceRuleMutation = useMutation({
        mutationFn: (id: string) => distanceRuleService.deleteDistanceRule(id),
        onSuccess: () => {
            message.success('Xóa khoảng cách thành công');
            refetchDistanceRules();
            refetchSizeRules();
        },
        onError: (error: any) => {
            message.error(error?.response?.data?.message || 'Không thể xóa khoảng cách');
        }
    });

    const filteredRules = sizeRules.filter((rule: SizeRule) => rule.status === 'ACTIVE');

    const getCategories = () => {
        const categoriesMap = new Map<string, { id: string; name: string; description: string }>();
        filteredRules.forEach((rule: SizeRule) => {
            if (!categoriesMap.has(rule.category.id)) {
                categoriesMap.set(rule.category.id, {
                    id: rule.category.id,
                    name: rule.category.categoryName,
                    description: rule.category.description || rule.category.categoryName
                });
            }
        });
        return Array.from(categoriesMap.values());
    };

    const categories = getCategories();

    React.useEffect(() => {
        if (categories.length > 0 && !activeCategory) {
            setActiveCategory(categories[0].id);
        }
    }, [categories, activeCategory]);

    const getCategoryRules = () => {
        if (!activeCategory) return [];
        return filteredRules.filter((rule: SizeRule) => rule.category.id === activeCategory);
    };

    const getUniqueVehicleTypes = () => {
        const uniqueVehicleTypes = new Map<string, SizeRule>();
        getCategoryRules().forEach((rule: SizeRule) => {
            const key = rule.vehicleTypeEntity.id;
            if (!uniqueVehicleTypes.has(key) ||
                (rule.basingPrices.length > 0 && uniqueVehicleTypes.get(key)?.basingPrices.length === 0)) {
                uniqueVehicleTypes.set(key, rule);
            }
        });
        return Array.from(uniqueVehicleTypes.values());
    };

    const uniqueRules = getUniqueVehicleTypes();

    // Use active distance rules sorted by displayOrder
    const activeDistanceRules = distanceRules
        .filter(rule => rule.status === 'ACTIVE')
        .sort((a, b) => a.displayOrder - b.displayOrder);

    // Create price table data with dynamic columns
    const createPriceTableData = () => {
        const tableData = uniqueRules.map(rule => {
            const baseData: TableDataItem = {
                vehicleTypeName: rule.vehicleTypeEntity.vehicleTypeName,
                vehicleTypeDescription: rule.vehicleTypeEntity.description || rule.vehicleTypeEntity.vehicleTypeName,
                minWeight: rule.minWeight,
                maxWeight: rule.maxWeight,
                dimensions: `${rule.minLength}×${rule.minWidth}×${rule.minHeight} - ${rule.maxLength}×${rule.maxWidth}×${rule.maxHeight}`,
                rule: rule,
            };

            activeDistanceRules.forEach(distanceRule => {
                const priceForRange = rule.basingPrices?.find(
                    price => price.distanceRuleResponse.id === distanceRule.id
                );
                const columnKey = distanceRule.id;
                baseData[columnKey] = priceForRange ? {
                    id: priceForRange.id,
                    value: parseInt(priceForRange.basePrice),
                    distanceRuleId: distanceRule.id
                } : { id: null, value: null, distanceRuleId: distanceRule.id };
            });

            return baseData;
        }).sort((a, b) => a.minWeight - b.minWeight);

        return {
            data: tableData,
            distanceRules: activeDistanceRules
        };
    };

    const priceTableResult = createPriceTableData();

    const handlePriceChange = (
        sizeRuleId: string, 
        distanceRuleId: string,
        basingPriceId: string | null, 
        value: number | null
    ) => {
        const key = `${sizeRuleId}-${distanceRuleId}`;
        if (value !== null) {
            setEditingPrices(prev => {
                const newMap = new Map(prev);
                newMap.set(key, {
                    sizeRuleId,
                    distanceRangeKey: distanceRuleId,
                    basingPriceId: basingPriceId || undefined,
                    distanceRuleId,
                    value
                });
                return newMap;
            });
        } else {
            setEditingPrices(prev => {
                const newMap = new Map(prev);
                newMap.delete(key);
                return newMap;
            });
        }
    };

    const handleSaveAll = async () => {
        const updates = Array.from(editingPrices.values());
        
        try {
            for (const update of updates) {
                await updatePriceMutation.mutateAsync({
                    id: update.basingPriceId,
                    basePrice: update.value,
                    sizeRuleId: update.sizeRuleId,
                    distanceRuleId: update.distanceRuleId
                });
            }
        } catch (error) {
            console.error('Error saving prices:', error);
        }
    };

    const getCategoryColor = (categoryName: string) => {
        switch (categoryName.toUpperCase()) {
            case 'NORMAL': return '#52c41a';
            case 'FRAGILE': return '#fa8c16';
            default: return '#1890ff';
        }
    };

    // Create dynamic columns
    const createColumns = () => {
        const baseColumns: any[] = [
            {
                title: 'Loại xe',
                dataIndex: 'vehicleTypeDescription',
                key: 'vehicleType',
                fixed: 'left',
                width: 150,
                render: (text: string) => <Text strong>{text}</Text>
            },
            {
                title: 'Trọng lượng (Tấn)',
                key: 'weight',
                width: 150,
                render: (_: any, record: TableDataItem) => 
                    `${record.minWeight} - ${record.maxWeight}`
            },
            {
                title: 'Kích thước (m)',
                dataIndex: 'dimensions',
                key: 'dimensions',
                width: 200,
                render: (text: string) => <Text type="secondary" style={{ fontSize: '12px' }}>{text}</Text>
            }
        ];

        // Add dynamic distance columns
        const distanceColumns = priceTableResult.distanceRules.map((distanceRule) => ({
            title: (
                <Space direction="vertical" size={0} style={{ textAlign: 'center' }}>
                    <Text strong style={{ color: '#fff' }}>{distanceRule.displayName}</Text>
                    {distanceRule.isBasePrice && (
                        <Tag color="gold" style={{ margin: 0, fontSize: '10px' }}>Giá gốc</Tag>
                    )}
                </Space>
            ),
            dataIndex: distanceRule.id,
            key: distanceRule.id,
            width: 180,
            align: 'center' as const,
            render: (priceData: any, record: TableDataItem) => {
                const key = `${record.rule.id}-${distanceRule.id}`;
                const editingPrice = editingPrices.get(key);
                const displayValue = editingPrice?.value ?? priceData?.value;

                return (
                    <InputNumber
                        value={displayValue}
                        onChange={(value) => handlePriceChange(
                            record.rule.id,
                            distanceRule.id,
                            priceData?.id,
                            value
                        )}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                        style={{ 
                            width: '100%',
                            backgroundColor: editingPrice ? '#fff7e6' : undefined,
                            borderColor: editingPrice ? '#ffa940' : undefined
                        }}
                        min={0}
                        step={1000}
                        placeholder="Nhập giá"
                    />
                );
            }
        }));

        return [...baseColumns, ...distanceColumns];
    };

    const columns = createColumns();

    const isLoading = isLoadingSizeRules || isLoadingDistanceRules;

    if (isLoading) {
        return (
            <div style={{ padding: '24px' }}>
                <Skeleton active paragraph={{ rows: 8 }} />
            </div>
        );
    }

    if (!sizeRules || sizeRules.length === 0) {
        return (
            <Empty 
                description="Chưa có quy tắc nào được tạo"
                style={{ marginTop: '60px' }}
            />
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Card>
                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Title level={3} style={{ margin: 0 }}>
                                    <DollarOutlined /> Quản lý bảng giá
                                </Title>
                                <Space>
                                    {editingPrices.size > 0 && (
                                        <Button
                                            type="primary"
                                            icon={<SaveOutlined />}
                                            onClick={handleSaveAll}
                                            loading={updatePriceMutation.isPending}
                                        >
                                            Lưu tất cả ({editingPrices.size} thay đổi)
                                        </Button>
                                    )}
                                    <Button
                                        icon={<ReloadOutlined />}
                                        onClick={() => {
                                            refetchSizeRules();
                                            refetchDistanceRules();
                                        }}
                                        loading={isFetchingSizeRules}
                                    >
                                        Làm mới
                                    </Button>
                                </Space>
                            </div>

                            <Divider style={{ margin: '8px 0' }} />

                            {/* Distance Range Manager */}
                            <Collapse 
                                ghost
                                items={[{
                                    key: '1',
                                    label: (
                                        <Space>
                                            <SettingOutlined style={{ color: '#1890ff' }} />
                                            <Text strong>Cấu hình khoảng cách</Text>
                                            <Tag color="blue">{activeDistanceRules.length} khoảng cách</Tag>
                                        </Space>
                                    ),
                                    children: (
                                        <DistanceRangeManager
                                            distanceRules={distanceRules}
                                            onAdd={async (fromKm, toKm) => {
                                                await createDistanceRuleMutation.mutateAsync({ fromKm, toKm });
                                            }}
                                            onUpdate={async (id, fromKm, toKm) => {
                                                await updateDistanceRuleMutation.mutateAsync({ id, data: { fromKm, toKm } });
                                            }}
                                            onDelete={async (id) => {
                                                await deleteDistanceRuleMutation.mutateAsync(id);
                                            }}
                                            loading={
                                                createDistanceRuleMutation.isPending || 
                                                updateDistanceRuleMutation.isPending || 
                                                deleteDistanceRuleMutation.isPending
                                            }
                                        />
                                    )
                                }]}
                            />

                            <Divider style={{ margin: '8px 0' }} />

                            {/* Price Table by Category */}
                            <Tabs 
                                activeKey={activeCategory}
                                onChange={setActiveCategory}
                                items={categories.map(cat => ({
                                    key: cat.id,
                                    label: (
                                        <span>
                                            <Tag color={getCategoryColor(cat.name)} style={{ marginRight: 8 }}>
                                                {cat.description}
                                            </Tag>
                                        </span>
                                    ),
                                    children: (
                                        <Table
                                            columns={columns}
                                            dataSource={priceTableResult.data}
                                            rowKey={(record) => record.rule.id}
                                            pagination={false}
                                            scroll={{ x: 1200 }}
                                            size="middle"
                                            bordered
                                        />
                                    )
                                }))}
                            />
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default EnhancedSizeRulePage;
