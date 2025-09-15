import React from 'react';
import { Modal, Radio, Avatar, ConfigProvider } from 'antd';
import { CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import { CommonStatusEnum } from '@/constants/enums';
import { CommonStatusTag } from '@/components/common/tags';

export interface StatusOption {
    value: string | boolean;
    label: string;
    description: string;
    color: string; // 'green', 'red', etc.
    icon: ReactNode;
}

export interface StatusChangeModalProps {
    visible: boolean;
    loading: boolean;
    title: string;
    icon: ReactNode;
    entityName: string;
    entityDescription?: string;
    avatarIcon: ReactNode;
    currentStatus: string | boolean;
    getStatusColor: (status: string | boolean) => string;
    getStatusText: (status: string | boolean) => string;
    statusOptions: StatusOption[];
    selectedStatus: string | boolean;
    onStatusChange: (value: any) => void;
    onOk: () => void;
    onCancel: () => void;
}

const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
    visible,
    loading,
    title,
    icon,
    entityName,
    entityDescription,
    avatarIcon,
    currentStatus,
    getStatusColor,
    getStatusText,
    statusOptions,
    selectedStatus,
    onStatusChange,
    onOk,
    onCancel
}) => {
    // Chuyển đổi currentStatus thành CommonStatusEnum
    const mapToCommonStatus = (status: string | boolean): CommonStatusEnum => {
        if (typeof status === 'boolean') {
            return status ? CommonStatusEnum.ACTIVE : CommonStatusEnum.INACTIVE;
        }

        switch (String(status).toLowerCase()) {
            case 'active':
                return CommonStatusEnum.ACTIVE;
            case 'inactive':
                return CommonStatusEnum.INACTIVE;
            case 'deleted':
                return CommonStatusEnum.DELETED;
            case 'pending':
                return CommonStatusEnum.PENDING;
            case 'processing':
                return CommonStatusEnum.PROCESSING;
            case 'completed':
                return CommonStatusEnum.COMPLETED;
            default:
                return CommonStatusEnum.INACTIVE;
        }
    };

    return (
        <Modal
            title={
                <div className="flex items-center">
                    {icon && <span className="text-blue-500 mr-2 text-xl">{icon}</span>}
                    <span>{title}</span>
                </div>
            }
            open={visible}
            onOk={onOk}
            onCancel={onCancel}
            confirmLoading={loading}
            okText={loading ? "Đang cập nhật..." : "Cập nhật"}
            cancelText="Hủy"
            okButtonProps={{
                className: `${String(selectedStatus).toLowerCase() === 'active' || selectedStatus === true ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`,
                disabled: loading
            }}
            cancelButtonProps={{
                disabled: loading
            }}
            maskClosable={!loading}
            closable={!loading}
            keyboard={!loading}
            className="status-change-modal"
            width={400}
        >
            <div className="flex items-center mb-6">
                <Avatar
                    icon={avatarIcon}
                    size={50}
                    className="mr-4"
                />
                <div>
                    <div className="text-lg font-medium">{entityName}</div>
                    {entityDescription && <div className="text-gray-500">{entityDescription}</div>}
                    <div className="mt-1">
                        <CommonStatusTag status={mapToCommonStatus(currentStatus)} size="small" />
                    </div>
                </div>
            </div>

            <div className="mb-2">
                <div className="font-medium text-gray-700 mb-3">Chọn trạng thái mới:</div>
                <ConfigProvider
                    theme={{
                        components: {
                            Radio: {
                                buttonBg: 'transparent',
                                buttonCheckedBg: 'transparent',
                                buttonSolidCheckedColor: 'white',
                            }
                        }
                    }}
                >
                    <Radio.Group
                        value={selectedStatus}
                        onChange={(e) => onStatusChange(e.target.value)}
                        style={{ width: '100%' }}
                        disabled={loading}
                        optionType="button"
                        buttonStyle="solid"
                    >
                        <div className="flex flex-col gap-4 w-full">
                            {statusOptions.map((option) => {
                                const isActive = option.color === 'green';
                                const isSelected = selectedStatus === option.value;
                                const bgColor = isActive ? '#10b981' : '#ef4444';
                                const textColor = isActive ? '#dcfce7' : '#fee2e2';

                                return (
                                    <Radio.Button
                                        key={String(option.value)}
                                        value={option.value}
                                        style={{
                                            height: 'auto',
                                            padding: '12px',
                                            width: '100%',
                                            borderRadius: '8px',
                                            border: isSelected ? `2px solid ${bgColor}` : '1px solid #e5e7eb',
                                            background: isSelected ? bgColor : 'white'
                                        }}
                                    >
                                        <div className="flex items-start gap-3 text-left">
                                            <div className="mt-1">
                                                {option.icon && (
                                                    <span style={{
                                                        fontSize: '24px',
                                                        color: isSelected ? 'white' : bgColor
                                                    }}>
                                                        {option.icon}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <div style={{
                                                    fontWeight: 'bold',
                                                    fontSize: '18px',
                                                    color: isSelected ? 'white' : bgColor
                                                }}>
                                                    {option.label}
                                                </div>
                                                <div style={{
                                                    fontSize: '14px',
                                                    color: isSelected ? textColor : bgColor
                                                }}>
                                                    {option.description}
                                                </div>
                                            </div>
                                        </div>
                                    </Radio.Button>
                                );
                            })}
                        </div>
                    </Radio.Group>
                </ConfigProvider>
            </div>
        </Modal>
    );
};

export default StatusChangeModal; 