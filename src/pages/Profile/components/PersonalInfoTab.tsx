import React from 'react';
import { Row, Col, Typography, Divider, Skeleton } from 'antd';
import type { UserModel } from '@/models/User';
import EditPersonalInfoModal from './EditPersonalInfoModal';

const { Text } = Typography;

interface PersonalInfoTabProps {
    user: UserModel | undefined;
    isOwnProfile?: boolean;
    onRefresh?: () => void;
}

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({ user, isOwnProfile = true, onRefresh }) => {
    if (!user) {
        return <Skeleton active paragraph={{ rows: 6 }} />;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Thông tin cá nhân</h3>
                {isOwnProfile && <EditPersonalInfoModal userData={user} onRefresh={onRefresh} />}
            </div>

            <Divider className="my-4" />

            <Row gutter={[16, 24]}>
                <Col xs={24} md={12}>
                    <div className="mb-4">
                        <Text className="text-gray-500 block mb-1">Họ và tên</Text>
                        <Text className="text-lg font-medium">{user.fullName || 'Chưa cập nhật'}</Text>
                    </div>
                </Col>
                <Col xs={24} md={12}>
                    <div className="mb-4">
                        <Text className="text-gray-500 block mb-1">Email</Text>
                        <Text className="text-lg font-medium">{user.email || 'Chưa cập nhật'}</Text>
                    </div>
                </Col>
                <Col xs={24} md={12}>
                    <div className="mb-4">
                        <Text className="text-gray-500 block mb-1">Số điện thoại</Text>
                        <Text className="text-lg font-medium">{user.phoneNumber || 'Chưa cập nhật'}</Text>
                    </div>
                </Col>
                <Col xs={24} md={12}>
                    <div className="mb-4">
                        <Text className="text-gray-500 block mb-1">Giới tính</Text>
                        <Text className="text-lg font-medium">{user.gender ? 'Nam' : 'Nữ'}</Text>
                    </div>
                </Col>
                <Col xs={24} md={12}>
                    <div className="mb-4">
                        <Text className="text-gray-500 block mb-1">Ngày sinh</Text>
                        <Text className="text-lg font-medium">{user.dateOfBirth || 'Chưa cập nhật'}</Text>
                    </div>
                </Col>
                <Col xs={24} md={12}>
                    <div className="mb-4">
                        <Text className="text-gray-500 block mb-1">Trạng thái</Text>
                        <div className="mt-1">
                            <Text className={`px-3 py-1 rounded-full text-sm ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                                }`}>
                                {user.status || 'Chưa cập nhật'}
                            </Text>
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default PersonalInfoTab; 