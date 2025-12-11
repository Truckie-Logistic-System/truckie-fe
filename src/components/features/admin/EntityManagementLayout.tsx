import React from 'react';
import type { ReactNode } from 'react';
import { Button, App, Card, Input, Typography, Badge, Skeleton } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface StatCardProps {
    icon: ReactNode;
    title: string;
    count: number;
    isLoading: boolean;
    bgColorClass: string;
    iconColorClass: string;
    badgeColor?: string;
    badgeCount?: number;
}

interface EntityManagementLayoutProps {
    title: string;
    icon: ReactNode;
    description: string;
    addButtonText?: string;
    addButtonIcon?: ReactNode;
    onAddClick?: () => void;
    searchText: string;
    onSearchChange: (value: string) => void;
    onRefresh: () => void;
    isLoading: boolean;
    isFetching: boolean;
    totalCount: number;
    activeCount: number;
    bannedCount: number;
    tableTitle: string;
    tableComponent: ReactNode;
    modalComponent: ReactNode;
    searchPlaceholder?: string;
    activeCardTitle?: string;
    bannedCardTitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({
    icon,
    title,
    count,
    isLoading,
    bgColorClass,
    iconColorClass,
    badgeColor,
    badgeCount
}) => (
    <Card className={`bg-gradient-to-r ${bgColorClass} shadow-sm hover:shadow-md transition-shadow`}>
        <div className="flex justify-between items-center">
            <div>
                <Text className="text-gray-600 block">{title}</Text>
                {isLoading ? (
                    <Skeleton.Input style={{ width: 60 }} active size="small" />
                ) : (
                    <Title level={3} className={`m-0 ${iconColorClass}`}>{count}</Title>
                )}
            </div>
            {badgeColor ? (
                <Badge count={isLoading ? 0 : badgeCount} color={badgeColor} showZero>
                    <div className={`${bgColorClass} p-2 rounded-full`}>
                        <span className={`text-3xl ${iconColorClass}`}>{icon}</span>
                    </div>
                </Badge>
            ) : (
                <span className={`text-4xl ${iconColorClass} opacity-80`}>{icon}</span>
            )}
        </div>
    </Card>
);

const EntityManagementLayout: React.FC<EntityManagementLayoutProps> = ({
    title,
    icon,
    description,
    addButtonText,
    addButtonIcon,
    onAddClick,
    searchText,
    onSearchChange,
    onRefresh,
    isLoading,
    isFetching,
    totalCount,
    activeCount,
    bannedCount,
    tableTitle,
    tableComponent,
    modalComponent,
    searchPlaceholder,
    activeCardTitle,
    bannedCardTitle
}) => {
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="flex items-center m-0 text-blue-800">
                            <span className="mr-3 text-blue-600">{icon}</span> {title}
                        </Title>
                        <Text type="secondary">{description}</Text>
                    </div>
                    {addButtonText && onAddClick && (
                        <Button
                            type="primary"
                            icon={addButtonIcon}
                            onClick={onAddClick}
                            className="bg-blue-600 hover:bg-blue-700"
                            size="large"
                        >
                            {addButtonText}
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <StatCard
                        icon={icon}
                        title={`Tổng số ${title.toLowerCase().replace('quản lý', '').trim().replace(/^(.)/, match => match.toUpperCase())}`}
                        count={totalCount}
                        isLoading={isLoading}
                        bgColorClass="from-blue-50 to-blue-100 border-blue-200"
                        iconColorClass="text-blue-800"
                    />
                    <StatCard
                        icon={icon}
                        title={activeCardTitle || `${title.replace('Quản lý', '').trim().replace(/^(.)/, match => match.toUpperCase())} Hoạt động`}
                        count={activeCount}
                        isLoading={isLoading}
                        bgColorClass="from-green-50 to-green-100 border-green-200"
                        iconColorClass="text-green-600"
                        badgeColor="green"
                        badgeCount={activeCount}
                    />
                    <StatCard
                        icon={icon}
                        title={bannedCardTitle || `${title.replace('Quản lý', '').trim().replace(/^(.)/, match => match.toUpperCase())} Bị cấm`}
                        count={bannedCount}
                        isLoading={isLoading}
                        bgColorClass="from-red-50 to-red-100 border-red-200"
                        iconColorClass="text-red-600"
                        badgeColor="red"
                        badgeCount={bannedCount}
                    />
                </div>

                <Card className="shadow-sm mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                        <Title level={4} className="m-0 mb-4 md:mb-0">{tableTitle}</Title>
                        <div className="flex w-full md:w-auto gap-2">
                            <Input
                                placeholder={searchPlaceholder || `Tìm kiếm theo tên, email, số điện thoại...`}
                                prefix={<SearchOutlined />}
                                className="w-full md:w-64"
                                value={searchText}
                                onChange={(e) => onSearchChange(e.target.value)}
                                disabled={isLoading}
                            />
                            <Button
                                icon={<ReloadOutlined spin={isFetching} />}
                                onClick={onRefresh}
                                title="Làm mới dữ liệu"
                                loading={isFetching}
                            />
                        </div>
                    </div>

                    {tableComponent}
                </Card>
            </div>

            {modalComponent}
        </div>
    );
};

export default EntityManagementLayout; 