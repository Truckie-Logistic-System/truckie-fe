import React from 'react';
import { Modal, Radio, Tag, Avatar, Divider, ConfigProvider } from 'antd';
import { CheckCircleOutlined, StopOutlined, CarOutlined } from '@ant-design/icons';
import type { DriverModel } from '../../../../services/driver';

interface StatusChangeModalProps {
    visible: boolean;
    loading: boolean;
    driver: DriverModel | null;
    status: string;
    onStatusChange: (value: string) => void;
    onOk: () => void;
    onCancel: () => void;
}

const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
    visible,
    loading,
    driver,
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

    const handleOk = () => {
        onOk();
    };

    return (
        <Modal
            title={
                <div className="flex items-center">
                    <CarOutlined className="text-blue-500 mr-2 text-xl" />
                    <span>Cập nhật trạng thái tài xế</span>
                </div>
            }
            open={visible}
            onOk={handleOk}
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
                    src={driver?.userResponse?.imageUrl}
                    size={50}
                    icon={<CarOutlined />}
                    className="mr-4 bg-blue-100"
                />
                <div>
                    <div className="font-medium text-lg">{driver?.userResponse?.fullName}</div>
                    <div className="text-gray-500">{driver?.userResponse?.phoneNumber}</div>
                </div>
            </div>

            <Divider className="my-4" />

            <div className="mb-4">
                <div className="text-gray-500 mb-2">Trạng thái hiện tại:</div>
                <Tag
                    color={getStatusColor(driver?.status || '')}
                    className="px-3 py-1 text-sm"
                    icon={driver?.status?.toLowerCase() === 'active' ? <CheckCircleOutlined /> : <StopOutlined />}
                >
                    {getStatusText(driver?.status || '')}
                </Tag>
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                            <Radio.Button
                                value="ACTIVE"
                                style={{
                                    height: 'auto',
                                    padding: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    border: `2px solid ${status === 'ACTIVE' ? '#16a34a' : '#22c55e'}`,
                                    backgroundColor: status === 'ACTIVE' ? '#16a34a' : 'white',
                                    borderRadius: '8px',
                                }}
                                disabled={loading}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    width: '100%',
                                    opacity: loading ? 0.7 : 1
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: status === 'ACTIVE' ? '#22c55e' : '#dcfce7',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: '12px',
                                        flexShrink: 0
                                    }}>
                                        <CheckCircleOutlined style={{
                                            fontSize: '20px',
                                            color: status === 'ACTIVE' ? 'white' : '#16a34a'
                                        }} />
                                    </div>
                                    <div>
                                        <div style={{
                                            fontWeight: 'bold',
                                            fontSize: '18px',
                                            color: status === 'ACTIVE' ? 'white' : '#16a34a'
                                        }}>
                                            Hoạt động
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            color: status === 'ACTIVE' ? '#dcfce7' : '#22c55e'
                                        }}>
                                            Tài xế có thể nhận và thực hiện đơn hàng
                                        </div>
                                    </div>
                                </div>
                            </Radio.Button>

                            <Radio.Button
                                value="BANNED"
                                style={{
                                    height: 'auto',
                                    padding: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    border: `2px solid ${status === 'BANNED' ? '#dc2626' : '#ef4444'}`,
                                    backgroundColor: status === 'BANNED' ? '#dc2626' : 'white',
                                    borderRadius: '8px',
                                }}
                                disabled={loading}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    width: '100%',
                                    opacity: loading ? 0.7 : 1
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: status === 'BANNED' ? '#ef4444' : '#fee2e2',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: '12px',
                                        flexShrink: 0
                                    }}>
                                        <StopOutlined style={{
                                            fontSize: '20px',
                                            color: status === 'BANNED' ? 'white' : '#dc2626'
                                        }} />
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
                                            Tài xế không thể nhận và thực hiện đơn hàng
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