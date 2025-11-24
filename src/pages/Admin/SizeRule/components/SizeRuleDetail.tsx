import React, { useState, useEffect } from 'react';
import { Modal, Tag, Table, Typography, Row, Col, Card, Tooltip, Button, Form, InputNumber, App, Select } from 'antd';
import type { SizeRule, BasingPrice, DistanceRule } from '../../../../models';
import { formatDate } from '../../../../utils/dateUtils';
import { InfoCircleOutlined, DollarOutlined, CarOutlined, CalendarOutlined, TagOutlined, EditOutlined, SaveOutlined, PlusOutlined } from '@ant-design/icons';
import { CommonStatusTag } from '../../../../components/common/tags';
import { CommonStatusEnum } from '../../../../constants/enums';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import sizeRuleService from '../../../../services/size-rule/sizeRuleService';

const { Title, Text } = Typography;

interface SizeRuleDetailProps {
    visible: boolean;
    sizeRule: SizeRule;
    onClose: () => void;
}

interface EditablePriceItem extends BasingPrice {
    isEditing?: boolean;
    isNew?: boolean;
}

const SizeRuleDetail: React.FC<SizeRuleDetailProps> = ({
    visible,
    sizeRule,
    onClose,
}) => {
    const [form] = Form.useForm();
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const [editingPrices, setEditingPrices] = useState<EditablePriceItem[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [isAddingPrices, setIsAddingPrices] = useState(false);

    // Fetch distance rules
    const { data: distanceRules = [] } = useQuery({
        queryKey: ['distanceRules'],
        queryFn: () => sizeRuleService.getDistanceRules(),
    });

    // Mutations for basing prices
    const createBasingPriceMutation = useMutation({
        mutationFn: sizeRuleService.createBasingPrice,
        onSuccess: () => {
            // Bỏ thông báo ở đây để tránh hiển thị nhiều lần
            queryClient.invalidateQueries({ queryKey: ['sizeRules'] });
        },
        onError: (error) => {
            message.error('Không thể thêm giá cơ bản: ' + (error as Error).message);
        }
    });

    const updateBasingPriceMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: { basePrice: number, sizeRuleId: string, distanceRuleId: string } }) =>
            sizeRuleService.updateBasingPrice(id, data),
        onSuccess: () => {
            // Bỏ thông báo ở đây để tránh hiển thị nhiều lần
            queryClient.invalidateQueries({ queryKey: ['sizeRules'] });
        },
        onError: (error) => {
            message.error('Không thể cập nhật giá cơ bản: ' + (error as Error).message);
        }
    });

    // Initialize editing prices when sizeRule changes
    useEffect(() => {
        if (sizeRule?.basingPrices) {
            // Đảm bảo cập nhật editingPrices với dữ liệu mới nhất từ sizeRule
            setEditingPrices(sizeRule.basingPrices.map(price => ({
                ...price,
                isEditing: false,
                isNew: false
            })));
            setEditMode(false);
            setIsAddingPrices(false);
        }
    }, [sizeRule]);

    const getCategoryColor = (category: string) => {
        if (category === 'NORMAL') return 'green';
        if (category === 'BULKY CARGO') return 'orange';
        if (category === 'DANGEROUS') return 'red';
        return 'blue';
    };

    // Chuyển đổi trạng thái thành CommonStatusEnum
    const getStatusEnum = (status: string): CommonStatusEnum => {
        return status === 'ACTIVE' ? CommonStatusEnum.ACTIVE : CommonStatusEnum.INACTIVE;
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

    // Format hiển thị quãng đường
    const formatDistanceRange = (fromKm: number, toKm: number): string => {
        if (fromKm === 0) return `<${toKm + 1}km`;
        if (toKm > 9999) return `>${fromKm - 1}km`;
        return `${fromKm}-${toKm}km`;
    };

    // Tìm khoảng cách theo ID
    const findDistanceRule = (id: string): DistanceRule | undefined => {
        return distanceRules.find(rule => rule.id === id);
    };

    // Kiểm tra xem đã có đủ giá cho tất cả khoảng cách chưa
    const hasAllDistanceRules = (): boolean => {
        if (!distanceRules.length) return true;

        // Kiểm tra xem mỗi distance rule đã có trong bảng giá chưa
        return distanceRules.every(distanceRule =>
            editingPrices.some(price =>
                price.distanceRuleResponse.id === distanceRule.id
            )
        );
    };

    // Thêm mới giá cơ bản cho tất cả khoảng cách còn thiếu
    const addNewPrice = () => {
        // Tìm các khoảng cách chưa được sử dụng
        const unusedDistanceRules = distanceRules.filter(distanceRule =>
            !editingPrices.some(price =>
                price.distanceRuleResponse.id === distanceRule.id
            )
        );

        if (unusedDistanceRules.length === 0) {
            message.info('Đã thiết lập giá cho tất cả khoảng cách');
            return;
        }

        // Tạo các mục giá mới cho tất cả khoảng cách chưa sử dụng
        const newPrices = unusedDistanceRules.map(distanceRule => ({
            id: `new-${Date.now()}-${distanceRule.id}`,
            basePrice: '0',
            distanceRuleResponse: distanceRule,
            isEditing: true,
            isNew: true
        }));

        setEditingPrices([...editingPrices, ...newPrices]);
        setEditMode(true);
        setIsAddingPrices(true);
    };

    // Bắt đầu chỉnh sửa tất cả các giá
    const startEditingAll = () => {
        setEditingPrices(prevPrices =>
            prevPrices.map(price => ({
                ...price,
                isEditing: true
            }))
        );
        setEditMode(true);

        // Set form values cho tất cả các mục
        editingPrices.forEach(price => {
            form.setFieldsValue({
                [`basePrice_${price.id}`]: parseInt(price.basePrice),
                [`distanceRule_${price.id}`]: price.distanceRuleResponse.id
            });
        });
    };

    // Hủy chỉnh sửa
    const cancelEditing = () => {
        // Lấy dữ liệu mới nhất từ API để đảm bảo hiển thị đúng sau khi hủy
        queryClient.invalidateQueries({ queryKey: ['sizeRules'] });

        // Nếu đang thêm mới, xóa các mục mới chưa lưu
        if (isAddingPrices) {
            setEditingPrices(prevPrices => prevPrices.filter(price => !price.isNew));
        } else {
            // Nếu chỉ đang chỉnh sửa, chuyển tất cả về trạng thái không chỉnh sửa
            setEditingPrices(prevPrices =>
                prevPrices.map(price => ({
                    ...price,
                    isEditing: false,
                    isNew: false
                }))
            );
        }

        setEditMode(false);
        setIsAddingPrices(false);
    };

    // Lưu tất cả các thay đổi
    const saveAllChanges = async () => {
        try {
            // Lấy tất cả các giá đang chỉnh sửa
            const editingItems = editingPrices.filter(price => price.isEditing);

            if (editingItems.length === 0) {
                message.info('Không có thay đổi để lưu');
                return;
            }

            // Validate tất cả các trường
            for (const item of editingItems) {
                const basePrice = form.getFieldValue(`basePrice_${item.id}`);
                const distanceRuleId = form.getFieldValue(`distanceRule_${item.id}`);

                if (!basePrice || !distanceRuleId) {
                    message.error('Vui lòng nhập đầy đủ thông tin cho tất cả các mục');
                    return;
                }
            }

            // Lưu tất cả các thay đổi
            const newItems = [];
            const updatedItems = [];

            for (const item of editingItems) {
                const basePrice = form.getFieldValue(`basePrice_${item.id}`);
                const distanceRuleId = form.getFieldValue(`distanceRule_${item.id}`);

                const data = {
                    basePrice,
                    sizeRuleId: sizeRule.id,
                    distanceRuleId
                };

                if (item.isNew) {
                    await createBasingPriceMutation.mutateAsync(data);
                    newItems.push(distanceRuleId);
                } else {
                    await updateBasingPriceMutation.mutateAsync({ id: item.id, data });
                    updatedItems.push(distanceRuleId);
                }
            }

            // Cập nhật UI
            setEditingPrices(prevPrices =>
                prevPrices.map(price => {
                    if (price.isEditing) {
                        const basePrice = form.getFieldValue(`basePrice_${price.id}`);
                        const distanceRuleId = form.getFieldValue(`distanceRule_${price.id}`);
                        return {
                            ...price,
                            isEditing: false,
                            isNew: false,
                            basePrice: basePrice.toString(),
                            distanceRuleResponse: findDistanceRule(distanceRuleId) || price.distanceRuleResponse
                        };
                    }
                    return price;
                })
            );

            setEditMode(false);
            setIsAddingPrices(false);

            // Hiển thị thông báo thành công duy nhất
            if (newItems.length > 0 && updatedItems.length > 0) {
                message.success(`Đã thêm ${newItems.length} và cập nhật ${updatedItems.length} mục giá thành công`);
            } else if (newItems.length > 0) {
                message.success(`Đã thêm ${newItems.length} mục giá thành công`);
            } else if (updatedItems.length > 0) {
                message.success(`Đã cập nhật ${updatedItems.length} mục giá thành công`);
            }
        } catch (error) {
            console.error('Error saving all changes:', error);
            message.error('Có lỗi xảy ra khi lưu thay đổi');
        }
    };

    // Columns for the pricing table
    const basingPriceColumns = [
        {
            title: 'Khoảng cách',
            key: 'distance',
            render: (record: EditablePriceItem) => {
                if (record.isEditing) {
                    return (
                        <Form.Item
                            name={`distanceRule_${record.id}`}
                            initialValue={record.distanceRuleResponse.id}
                            rules={[{ required: true, message: 'Vui lòng chọn khoảng cách' }]}
                            style={{ margin: 0 }}
                        >
                            <Select style={{ width: '100%' }} disabled={true}>
                                {distanceRules.map(rule => (
                                    <Select.Option
                                        key={rule.id}
                                        value={rule.id}
                                    >
                                        {formatDistanceRange(rule.fromKm, rule.toKm)}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    );
                }
                return (
                    <Tag color="blue">
                        {formatDistanceRange(record.distanceRuleResponse.fromKm, record.distanceRuleResponse.toKm)}
                    </Tag>
                );
            },
        },
        {
            title: 'Giá cơ bản (VND)',
            key: 'basePrice',
            render: (record: EditablePriceItem) => {
                if (record.isEditing) {
                    return (
                        <Form.Item
                            name={`basePrice_${record.id}`}
                            initialValue={parseInt(record.basePrice)}
                            rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
                            style={{ margin: 0 }}
                        >
                            <InputNumber
                                min={0}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value: string | undefined): number => {
                                    const parsed = value?.replace(/\$\s?|(,*)/g, '') || '0';
                                    return parseInt(parsed);
                                }}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    );
                }
                return (
                    <span className="font-medium text-blue-600">{parseInt(record.basePrice).toLocaleString('vi-VN')}</span>
                );
            },
        }
    ];

    // Format kích thước theo cùng định dạng với bảng
    const dimensionsFormatted = `${sizeRule.minLength}×${sizeRule.minWidth}×${sizeRule.minHeight} - ${sizeRule.maxLength}×${sizeRule.maxWidth}×${sizeRule.maxHeight}`;

    return (
        <Modal
            title={
                <div className="flex items-center">
                    <span className="text-base font-medium">{sizeRule.sizeRuleName}</span>
                    <div className="ml-2">
                        <CommonStatusTag status={getStatusEnum(sizeRule.status)} />
                    </div>
                    <Tag
                        color={getCategoryColor(sizeRule.category.categoryName)}
                        className="ml-1"
                    >
                        {getCategoryName(sizeRule.category.categoryName)}
                    </Tag>
                </div>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={1200}
            style={{ top: 20 }}
            bodyStyle={{ padding: '16px' }}
            className="vehicle-rule-detail-modal"
        >
            <Form form={form} component={false}>
                <Row gutter={[16, 16]}>
                    {/* Hàng 1: Thông tin cơ bản và kích thước/trọng lượng */}
                    <Col span={12}>
                        <Card
                            size="small"
                            className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
                            title={
                                <div className="flex items-center">
                                    <InfoCircleOutlined className="mr-2 text-blue-500" />
                                    <span>Thông tin cơ bản</span>
                                </div>
                            }
                        >
                            <div className="flex justify-end mb-2">
                                <Text className="text-gray-500 text-xs">ID: {sizeRule.id.substring(0, 8)}...</Text>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <div className="bg-gray-50 p-3 rounded-lg border-l-2 border-l-blue-400">
                                    <div className="flex items-center">
                                        <CarOutlined className="mr-2 text-blue-500" />
                                        <Text type="secondary">Loại xe:</Text>
                                    </div>
                                    <div className="ml-6">
                                        <Text className="font-medium">{sizeRule.vehicleTypeEntity.vehicleTypeName}</Text>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-lg border-l-2 border-l-green-400">
                                    <div className="flex items-center">
                                        <CalendarOutlined className="mr-2 text-green-500" />
                                        <Text type="secondary">Hiệu lực:</Text>
                                    </div>
                                    <div className="ml-6">
                                        <Text>{formatDate(sizeRule.effectiveFrom)} - {sizeRule.effectiveTo ? formatDate(sizeRule.effectiveTo) : 'Không giới hạn'}</Text>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-lg border-l-2 border-l-orange-400">
                                    <div className="flex items-center">
                                        <TagOutlined className="mr-2 text-orange-500" />
                                        <Text type="secondary">Mô tả loại hàng:</Text>
                                    </div>
                                    <div className="ml-6 mt-1">
                                        <Text>{sizeRule.category.description || 'Không có mô tả'}</Text>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </Col>

                    <Col span={12}>
                        <Card
                            size="small"
                            className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500"
                            title={
                                <div className="flex items-center">
                                    <CarOutlined className="mr-2 text-green-500" />
                                    <span>Thông số kỹ thuật</span>
                                </div>
                            }
                        >
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 hover:shadow-sm transition-shadow">
                                    <Title level={5} className="text-center m-0 mb-2 text-blue-700 flex items-center justify-center">
                                        <span className="mr-1">Trọng lượng</span>
                                        <Tooltip title="Trọng lượng tối thiểu và tối đa của hàng hóa (tấn)">
                                            <InfoCircleOutlined className="text-blue-400" />
                                        </Tooltip>
                                    </Title>
                                    <div className="flex justify-between">
                                        <div className="text-center">
                                            <Text type="secondary">Tối thiểu</Text>
                                            <div><Text strong className="text-blue-600 text-lg">{sizeRule.minWeight}</Text></div>
                                        </div>
                                        <div className="text-center">
                                            <Text type="secondary">Tối đa</Text>
                                            <div><Text strong className="text-blue-600 text-lg">{sizeRule.maxWeight}</Text></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-green-50 p-3 rounded-lg border border-green-200 hover:shadow-sm transition-shadow">
                                    <Title level={5} className="text-center m-0 mb-2 text-green-700 flex items-center justify-center">
                                        <span className="mr-1">Kích thước</span>
                                        <Tooltip title="Kích thước tổng thể của hàng hóa (m)">
                                            <InfoCircleOutlined className="text-green-400" />
                                        </Tooltip>
                                    </Title>
                                    <div className="text-center">
                                        <Text strong className="block text-green-600">{dimensionsFormatted}</Text>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-gray-50 p-2 rounded-lg text-center border border-gray-200 hover:bg-gray-100 transition-colors">
                                    <Text type="secondary">Dài (m)</Text>
                                    <div><Text className="text-gray-700">{sizeRule.minLength} - {sizeRule.maxLength}</Text></div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded-lg text-center border border-gray-200 hover:bg-gray-100 transition-colors">
                                    <Text type="secondary">Rộng (m)</Text>
                                    <div><Text className="text-gray-700">{sizeRule.minWidth} - {sizeRule.maxWidth}</Text></div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded-lg text-center border border-gray-200 hover:bg-gray-100 transition-colors">
                                    <Text type="secondary">Cao (m)</Text>
                                    <div><Text className="text-gray-700">{sizeRule.minHeight} - {sizeRule.maxHeight}</Text></div>
                                </div>
                            </div>
                        </Card>
                    </Col>

                    {/* Hàng 2: Bảng giá */}
                    <Col span={24}>
                        <Card
                            size="small"
                            className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-orange-500"
                            title={
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <DollarOutlined className="mr-2 text-orange-500" />
                                        <span>Bảng giá theo khoảng cách</span>
                                    </div>
                                </div>
                            }
                        >
                            {editingPrices && editingPrices.length > 0 ? (
                                <div>
                                    <div className="bg-orange-50 p-3 rounded-lg mb-3 border-l-2 border-l-orange-400">
                                        <Text className="text-orange-700">
                                            Giá cước vận chuyển được tính dựa trên khoảng cách vận chuyển. Giá hiển thị là giá cơ bản, có thể thay đổi tùy thuộc vào các yếu tố khác.
                                        </Text>
                                    </div>
                                    <Table
                                        dataSource={editingPrices}
                                        columns={basingPriceColumns}
                                        pagination={false}
                                        rowKey="id"
                                        size="small"
                                        bordered
                                        className="shadow-sm"
                                        rowClassName={() => "hover:bg-gray-50"}
                                    />

                                    <div className="flex justify-end mt-4">
                                        {!hasAllDistanceRules() && !editMode && (
                                            <Button
                                                type="primary"
                                                icon={<PlusOutlined />}
                                                onClick={addNewPrice}
                                                className="bg-green-600 hover:bg-green-700 mr-2"
                                            >
                                                Thêm giá
                                            </Button>
                                        )}

                                        {!editMode && editingPrices.length > 0 && (
                                            <Button
                                                type="primary"
                                                icon={<EditOutlined />}
                                                onClick={startEditingAll}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                Chỉnh sửa giá
                                            </Button>
                                        )}

                                        {editMode && (
                                            <>
                                                <Button
                                                    onClick={cancelEditing}
                                                    danger
                                                    className="mr-2"
                                                >
                                                    Hủy
                                                </Button>
                                                <Button
                                                    type="primary"
                                                    icon={<SaveOutlined />}
                                                    onClick={saveAllChanges}
                                                    className="bg-blue-600 hover:bg-blue-700"
                                                >
                                                    Lưu tất cả
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    <DollarOutlined style={{ fontSize: '24px' }} className="text-gray-400 mb-2" />
                                    <div><Text className="text-gray-500">Chưa có thông tin giá</Text></div>
                                    {!hasAllDistanceRules() && (
                                        <Button
                                            type="primary"
                                            icon={<PlusOutlined />}
                                            onClick={addNewPrice}
                                            className="mt-4 bg-green-600 hover:bg-green-700"
                                        >
                                            Thêm giá
                                        </Button>
                                    )}
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

export default SizeRuleDetail; 