import React from 'react';
import { Card, Avatar, Typography } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, IdcardOutlined } from '@ant-design/icons';
import type { UserResponse } from '@/services/customer';

const { Title, Text } = Typography;

interface ProfileSummaryCardProps {
    user: UserResponse | undefined;
}

const ProfileSummaryCard: React.FC<ProfileSummaryCardProps> = ({ user }) => {
    if (!user) return null;

    return (
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex flex-col items-center text-center">
                <Avatar
                    size={120}
                    src={user.imageUrl}
                    icon={<UserOutlined />}
                    className="mb-4 border-4 border-blue-100"
                />
                <Title level={3} className="mb-1">{user.fullName}</Title>
                <Text className="text-blue-600 font-medium mb-4">{user.role?.roleName}</Text>

                <div className="w-full flex flex-col gap-3 text-left mt-4">
                    <div className="flex items-center gap-2">
                        <MailOutlined className="text-blue-600" />
                        <Text>{user.email || 'Chưa cập nhật'}</Text>
                    </div>
                    <div className="flex items-center gap-2">
                        <PhoneOutlined className="text-blue-600" />
                        <Text>{user.phoneNumber || 'Chưa cập nhật'}</Text>
                    </div>
                    <div className="flex items-center gap-2">
                        <IdcardOutlined className="text-blue-600" />
                        <Text>ID: {user.id}</Text>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ProfileSummaryCard; 