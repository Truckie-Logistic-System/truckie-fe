import React from 'react';
import { Card, Typography } from 'antd';
import ChangePasswordForm from './ChangePasswordForm';
import type { UserResponse } from '@/models/User';

const { Text } = Typography;

interface PasswordChangeTabProps {
    user: UserResponse | undefined;
    isOwnProfile: boolean;
}

const PasswordChangeTab: React.FC<PasswordChangeTabProps> = ({ user, isOwnProfile }) => {
    if (!user) return null;

    return (
        <Card className="mb-4">
            <div className="mb-4">
                <Text className="text-gray-500">
                    Đổi mật khẩu định kỳ sẽ giúp tài khoản của bạn an toàn hơn.
                </Text>
            </div>
            {user && isOwnProfile && (
                <ChangePasswordForm username={user.username} />
            )}
        </Card>
    );
};

export default PasswordChangeTab; 