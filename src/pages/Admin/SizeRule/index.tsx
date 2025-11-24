import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, App, Modal, Card, Input, Typography, Tabs } from 'antd';
import { PlusOutlined, DollarOutlined, ReloadOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import type { SizeRule, SizeRuleCategory, SizeRuleType } from '../../../models';
import sizeRuleService from '../../../services/size-rule/sizeRuleService';
import SizeRuleTable from './components/SizeRuleTable';
import SizeRuleForm from './components/SizeRuleForm';
import SizeRulePricePreviewModal from './components/SizeRulePricePreviewModal';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Mở rộng sizeRuleService với các phương thức cần thiết
const extendedSizeRuleService = {
    ...sizeRuleService,
    getCategories: async (): Promise<SizeRuleCategory[]> => {
        // Giả lập API call, thay thế bằng API thực tế khi có
        return [];
    },
    getVehicleTypes: async (): Promise<SizeRuleType[]> => {
        // Giả lập API call, thay thế bằng API thực tế khi có
        return [];
    }
};

const SizeRulePage: React.FC = () => {
    const { message, modal } = App.useApp();
    const queryClient = useQueryClient();
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);
    const [editingRule, setEditingRule] = useState<SizeRule | null>(null);
    const [searchText, setSearchText] = useState('');
    const [activeTab, setActiveTab] = useState<string>('all');

    const {
        data: sizeRules = [],
        isLoading,
        isError,
        refetch,
        isFetching
    } = useQuery({
        queryKey: ['sizeRules'],
        queryFn: () => sizeRuleService.getSizeRulesFull(),
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['sizeRuleCategories'],
        queryFn: () => extendedSizeRuleService.getCategories(),
    });

    const { data: vehicleTypes = [] } = useQuery({
        queryKey: ['sizeRuleTypes'],
        queryFn: () => extendedSizeRuleService.getVehicleTypes(),
    });

    const createMutation = useMutation({
        mutationFn: sizeRuleService.createSizeRule,
        onSuccess: () => {
            message.success('Tạo quy tắc mới thành công');
            queryClient.invalidateQueries({ queryKey: ['sizeRules'] });
            setIsFormVisible(false);
        },
        onError: (error) => {
            message.error('Không thể tạo quy tắc: ' + (error as Error).message);
        }
    });

    const updateMutation = useMutation({
        mutationFn: sizeRuleService.updateSizeRule,
        onSuccess: () => {
            message.success('Cập nhật quy tắc thành công');
            queryClient.invalidateQueries({ queryKey: ['sizeRules'] });
            setIsFormVisible(false);
            setEditingRule(null);
        },
        onError: (error) => {
            message.error('Không thể cập nhật quy tắc: ' + (error as Error).message);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: sizeRuleService.deleteSizeRule,
        onSuccess: () => {
            message.success('Xóa quy tắc thành công');
            queryClient.invalidateQueries({ queryKey: ['sizeRules'] });
        },
        onError: (error) => {
            message.error('Không thể xóa quy tắc: ' + (error as Error).message);
        }
    });

    const handleAddClick = () => {
        setEditingRule(null);
        setIsFormVisible(true);
    };

    const handleEditClick = (sizeRule: SizeRule) => {
        setEditingRule(sizeRule);
        setIsFormVisible(true);
    };

    const handleDeleteClick = (id: string) => {
        deleteMutation.mutate(id);
    };

    const handleFormSubmit = (values: any) => {
        if (editingRule) {
            updateMutation.mutate(values);
        } else {
            createMutation.mutate(values);
        }
    };

    const handleFormCancel = () => {
        setIsFormVisible(false);
        setEditingRule(null);
    };

    const handlePreviewClick = () => {
        setIsPreviewVisible(true);
    };

    // Lấy danh sách các loại hàng duy nhất từ dữ liệu
    const getUniqueCategories = () => {
        const uniqueCategories = new Map();
        sizeRules.forEach(rule => {
            if (!uniqueCategories.has(rule.category.id)) {
                uniqueCategories.set(rule.category.id, {
                    id: rule.category.id,
                    name: rule.category.categoryName,
                    nameVi: getCategoryNameVi(rule.category.categoryName)
                });
            }
        });
        return Array.from(uniqueCategories.values());
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

    const uniqueCategories = getUniqueCategories();

    // Lọc dữ liệu theo tab và tìm kiếm
    const filteredSizeRules = sizeRules.filter(rule => {
        // Lọc theo tab loại hàng
        if (activeTab !== 'all' && rule.category.id !== activeTab) {
            return false;
        }

        // Lọc theo tìm kiếm
        if (!searchText) return true;

        const searchLower = searchText.toLowerCase();
        return (
            rule.sizeRuleName.toLowerCase().includes(searchLower) ||
            rule.vehicleTypeEntity.vehicleTypeName.toLowerCase().includes(searchLower) ||
            rule.category.categoryName.toLowerCase().includes(searchLower)
        );
    });

    if (isError) {
        return <div className="p-6">Đã xảy ra lỗi khi tải dữ liệu</div>;
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="flex items-center m-0 text-blue-800">
                            <span className="mr-3 text-blue-600"><DollarOutlined /></span> Quản lý bảng giá
                        </Title>
                        <Text type="secondary">Quản lý các quy tắc tính giá vận chuyển dựa trên loại xe, trọng lượng, kích thước và khoảng cách.</Text>
                    </div>
                    <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        onClick={handlePreviewClick}
                        className="bg-green-600 hover:bg-green-700"
                        size="large"
                    >
                        Xem trước
                    </Button>
                </div>

                <Card className="shadow-sm mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                        <Title level={4} className="m-0 mb-4 md:mb-0">Danh sách quy tắc giá</Title>
                        <div className="flex w-full md:w-auto gap-2">
                            <Input
                                placeholder="Tìm kiếm theo tên, loại xe, loại hàng..."
                                prefix={<SearchOutlined />}
                                className="w-full md:w-64"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                disabled={isLoading}
                            />
                            <Button
                                icon={<ReloadOutlined spin={isFetching} />}
                                onClick={() => refetch()}
                                title="Làm mới dữ liệu"
                                loading={isFetching}
                            />
                        </div>
                    </div>

                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        className="mb-4"
                    >
                        <TabPane tab="Tất cả" key="all" />
                        {uniqueCategories.map(category => (
                            <TabPane
                                tab={
                                    <span>
                                        <span style={{
                                            display: 'inline-block',
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            backgroundColor: getCategoryColor(category.name),
                                            marginRight: 6
                                        }}></span>
                                        {category.nameVi}
                                    </span>
                                }
                                key={category.id}
                            />
                        ))}
                    </Tabs>

                    <SizeRuleTable
                        sizeRules={filteredSizeRules}
                        loading={isLoading}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                        onRefresh={() => refetch()}
                    />
                </Card>
            </div>

            <Modal
                title={editingRule ? 'Chỉnh sửa quy tắc' : 'Thêm quy tắc mới'}
                open={isFormVisible}
                onCancel={handleFormCancel}
                footer={null}
                width={1200}
                style={{ top: 20 }}
                destroyOnClose
            >
                <SizeRuleForm
                    initialValues={editingRule || undefined}
                    categories={categories as SizeRuleCategory[]}
                    vehicleTypes={vehicleTypes as SizeRuleType[]}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                    loading={createMutation.isPending || updateMutation.isPending}
                />
            </Modal>

            <SizeRulePricePreviewModal
                visible={isPreviewVisible}
                onClose={() => setIsPreviewVisible(false)}
                sizeRules={sizeRules}
                loading={isLoading}
            />
        </div>
    );
};

// Lấy màu cho loại hàng
const getCategoryColor = (category: string): string => {
    switch (category) {
        case 'NORMAL': return '#52c41a';
        case 'BULKY CARGO': return '#fa8c16';
        case 'DANGEROUS': return '#f5222d';
        default: return '#1890ff';
    }
};

export default SizeRulePage;
