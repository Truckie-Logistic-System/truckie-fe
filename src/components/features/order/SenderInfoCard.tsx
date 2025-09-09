import React from 'react';
import { Card } from 'antd';
import { UserOutlined, FileTextOutlined } from '@ant-design/icons';
import type { Sender } from '../../../models';

interface SenderInfoCardProps {
    sender: Sender;
}

const SenderInfoCard: React.FC<SenderInfoCardProps> = ({ sender }) => {
    return (
        <Card
            title={
                <div className="flex items-center">
                    <UserOutlined className="mr-2 text-green-500" />
                    <span>Thông tin người gửi</span>
                </div>
            }
            className="shadow-md mb-6 rounded-xl"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Information */}
                <div>
                    <h3 className="text-lg font-medium mb-3 text-gray-700 flex items-center">
                        <FileTextOutlined className="mr-2 text-green-500" /> Thông tin doanh nghiệp
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        {sender.companyName && (
                            <p className="mb-2"><span className="font-medium">Tên công ty:</span> {sender.companyName}</p>
                        )}
                        {sender.representativeName && (
                            <p className="mb-2"><span className="font-medium">Người đại diện:</span> {sender.representativeName}</p>
                        )}
                        {sender.representativePhone && (
                            <p className="mb-2"><span className="font-medium">SĐT người đại diện:</span> {sender.representativePhone}</p>
                        )}
                        {sender.businessLicenseNumber && (
                            <p className="mb-2"><span className="font-medium">Số giấy phép kinh doanh:</span> {sender.businessLicenseNumber}</p>
                        )}
                        {sender.businessAddress && (
                            <p className="mb-0"><span className="font-medium">Địa chỉ kinh doanh:</span> {sender.businessAddress}</p>
                        )}
                        {!sender.companyName && !sender.representativeName && !sender.businessLicenseNumber && (
                            <p className="text-gray-500">Không có thông tin doanh nghiệp</p>
                        )}
                    </div>
                </div>

                {/* User Information */}
                {sender.userResponse && (
                    <div>
                        <h3 className="text-lg font-medium mb-3 text-gray-700 flex items-center">
                            <UserOutlined className="mr-2 text-green-500" /> Thông tin người dùng
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="mb-2"><span className="font-medium">Tên đầy đủ:</span> {sender.userResponse.fullName}</p>
                            <p className="mb-2"><span className="font-medium">Email:</span> {sender.userResponse.email}</p>
                            <p className="mb-2"><span className="font-medium">Số điện thoại:</span> {sender.userResponse.phoneNumber}</p>
                            <p className="mb-0"><span className="font-medium">Vai trò:</span> {sender.userResponse.role.roleName}</p>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default SenderInfoCard; 