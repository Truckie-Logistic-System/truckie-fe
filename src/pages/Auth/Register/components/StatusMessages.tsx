import React from 'react';
import { Alert } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';

interface StatusMessagesProps {
    error: string | null;
    success: string | null;
    onErrorClose: () => void;
}

const StatusMessages: React.FC<StatusMessagesProps> = ({
    error,
    success,
    onErrorClose
}) => {
    return (
        <>
            {error && (
                <Alert
                    message="Đăng ký thất bại"
                    description={error}
                    type="error"
                    showIcon
                    closable
                    className="mb-4"
                    onClose={onErrorClose}
                />
            )}

            {success && (
                <Alert
                    message="Đăng ký thành công"
                    description={success}
                    type="success"
                    showIcon
                    icon={<CheckCircleOutlined />}
                    className="mb-4"
                />
            )}
        </>
    );
};

export default StatusMessages; 