import React from 'react';
import { Modal, Radio, Avatar, ConfigProvider } from 'antd';
import { CheckCircleOutlined, StopOutlined, ShopOutlined } from '@ant-design/icons';
import type { UserModel } from '../../../../services/user/types';

interface StatusChangeModalProps {
    visible: boolean;
    loading: boolean;
    customer: UserModel | null;
    status: string;
    onStatusChange: (value: string) => void;
    onOk: () => void;
    onCancel: () => void;
}

const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
    visible,
    loading,
    customer,
    status,
    onStatusChange,
    onOk,
    onCancel
}) => {
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active': return 'green';
            case 'banned': return 'red';
            default: return 'default';
        }
    };

    const getStatusText = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active': return 'Hoạt động';
            case 'banned': return 'Bị cấm';
            default: return status;
        }
    };

    return (
        <Modal
            title={
                <div className="flex items-center">
                    <ShopOutlined className="text-blue-500 mr-2 text-xl" />
                    <span>Cập nhật trạng thái khách hàng</span>
                </div>
            }
            open={visible}
            onOk={onOk}
            onCancel={onCancel}
            confirmLoading={loading}
            okText={loading ? "Đang cập nhật..." : "Cập nhật"}
            cancelText="Hủy"
            okButtonProps={{
                className: status.toLowerCase() === 'active' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600',
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
                    src={customer?.imageUrl}
                    size={50}
                    icon={<ShopOutlined />}
                    className="mr-4"
                />
                <div>
                    <div className="text-lg font-medium">{customer?.fullName}</div>
                    <div className="text-gray-500">{customer?.email}</div>
                    <div className="mt-1">
                        <span
                            className={`px-2 py-1 text-xs rounded-full ${getStatusColor(customer?.status || '') === 'green'
                                ? 'bg-green-100 text-green-700'
                                : getStatusColor(customer?.status || '') === 'red'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            {getStatusText(customer?.status || '')}
                        </span>
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
                        value={status}
                        onChange={(e) => onStatusChange(e.target.value)}
                        style={{ width: '100%' }}
                        disabled={loading}
                        optionType="button"
                        buttonStyle="solid"
                    >
                        <div className="flex flex-col gap-4 w-full">
                            <Radio.Button
                                value="ACTIVE"
                                style={{
                                    height: 'auto',
                                    padding: '12px',
                                    width: '100%',
                                    borderRadius: '8px',
                                    border: status === 'ACTIVE' ? '2px solid #10b981' : '1px solid #e5e7eb',
                                    background: status === 'ACTIVE' ? '#10b981' : 'white'
                                }}
                            >
                                <div className="flex items-start gap-3 text-left">
                                    <div className="mt-1">
                                        <CheckCircleOutlined
                                            style={{
                                                fontSize: '24px',
                                                color: status === 'ACTIVE' ? 'white' : '#10b981'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <div style={{
                                            fontWeight: 'bold',
                                            fontSize: '18px',
                                            color: status === 'ACTIVE' ? 'white' : '#10b981'
                                        }}>
                                            Hoạt động
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            color: status === 'ACTIVE' ? '#dcfce7' : '#34d399'
                                        }}>
                                            Khách hàng có thể đặt và theo dõi đơn hàng
                                        </div>
                                    </div>
                                </div>
                            </Radio.Button>

                            <Radio.Button
                                value="BANNED"
                                style={{
                                    height: 'auto',
                                    padding: '12px',
                                    width: '100%',
                                    borderRadius: '8px',
                                    border: status === 'BANNED' ? '2px solid #ef4444' : '1px solid #e5e7eb',
                                    background: status === 'BANNED' ? '#ef4444' : 'white'
                                }}
                            >
                                <div className="flex items-start gap-3 text-left">
                                    <div className="mt-1">
                                        <StopOutlined
                                            style={{
                                                fontSize: '24px',
                                                color: status === 'BANNED' ? 'white' : '#ef4444'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <div style={{
                                            fontWeight: 'bold',
                                            fontSize: '18px',
                                            color: status === 'BANNED' ? 'white' : '#dc2626'
                                        }}>
                                            Cấm hoạt động
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            color: status === 'BANNED' ? '#fee2e2' : '#ef4444'
                                        }}>
                                            Khách hàng không thể đăng nhập và sử dụng hệ thống
                                        </div>
                                    </div>
                                </div>
                            </Radio.Button>
                        </div>
                    </Radio.Group>
                </ConfigProvider>
            </div>
        </Modal>
    );
};

export default StatusChangeModal; 