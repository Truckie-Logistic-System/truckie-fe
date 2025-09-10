import React from 'react';
import { Card } from 'antd';
import { UserOutlined, FileTextOutlined } from '@ant-design/icons';
import type { Sender, Order } from '../../../models';

interface SenderInfoCardProps {
    sender?: Sender;
    order?: Order;
}

const SenderInfoCard: React.FC<SenderInfoCardProps> = ({ sender, order }) => {
    // Nếu có order, lấy sender từ order
    const senderData = order?.sender || sender;

    // Nếu không có dữ liệu, hiển thị thông báo
    if (!senderData) {
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
                <div className="p-4 text-center text-gray-500">
                    Không có thông tin người gửi
                </div>
            </Card>
        );
    }

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
                        {senderData.companyName && (
                            <p className="mb-2"><span className="font-medium">Tên công ty:</span> {senderData.companyName}</p>
                        )}
                        {senderData.representativeName && (
                            <p className="mb-2"><span className="font-medium">Người đại diện:</span> {senderData.representativeName}</p>
                        )}
                        {senderData.representativePhone && (
                            <p className="mb-2"><span className="font-medium">SĐT người đại diện:</span> {senderData.representativePhone}</p>
                        )}
                        {senderData.businessLicenseNumber && (
                            <p className="mb-2"><span className="font-medium">Số giấy phép kinh doanh:</span> {senderData.businessLicenseNumber}</p>
                        )}
                        {senderData.businessAddress && (
                            <p className="mb-0"><span className="font-medium">Địa chỉ kinh doanh:</span> {senderData.businessAddress}</p>
                        )}
                        {!senderData.companyName && !senderData.representativeName && !senderData.businessLicenseNumber && (
                            <p className="text-gray-500">Không có thông tin doanh nghiệp</p>
                        )}
                    </div>
                </div>

                {/* User Information */}
                {senderData.userResponse && (
                    <div>
                        <h3 className="text-lg font-medium mb-3 text-gray-700 flex items-center">
                            <UserOutlined className="mr-2 text-green-500" /> Thông tin người dùng
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="mb-2"><span className="font-medium">Tên đầy đủ:</span> {senderData.userResponse.fullName}</p>
                            <p className="mb-2"><span className="font-medium">Email:</span> {senderData.userResponse.email}</p>
                            <p className="mb-2"><span className="font-medium">Số điện thoại:</span> {senderData.userResponse.phoneNumber}</p>
                            <p className="mb-0"><span className="font-medium">Vai trò:</span> {senderData.userResponse.role.roleName}</p>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default SenderInfoCard; 