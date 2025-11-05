import React from 'react';
import { Modal, Button, Tag, Typography, Space, Divider } from 'antd';
import { AlertOutlined, CarOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useIssuesContext } from '@/context/IssuesContext';
import { getIssueStatusColor, getIssueStatusLabel } from '@/models/Issue';
import MapPreview from '@/pages/Staff/Issue/components/MapPreview';

const { Title, Text, Paragraph } = Typography;

/**
 * Modal hiển thị urgent notification khi có issue mới được tạo
 * Hiển thị brief info và cho phép navigate đến trang chi tiết
 */
const IssueModal: React.FC = () => {
  const navigate = useNavigate();
  const { newIssueForModal, hideNewIssueModal } = useIssuesContext();

  const handleViewDetail = () => {
    if (newIssueForModal) {
      navigate(`/staff/issues/${newIssueForModal.id}`);
      hideNewIssueModal();
    }
  };

  const handleClose = () => {
    hideNewIssueModal();
  };

  if (!newIssueForModal) return null;

  console.log(newIssueForModal);

  return (
    <Modal
      open={!!newIssueForModal}
      onCancel={handleClose}
      footer={null}
      width={900}
      centered
      closable={false}
      className="issue-urgent-modal"
    >
      <div>
        {/* Header */}
        <div className="text-center mb-4">
          <div className="flex justify-center items-center gap-3 mb-2">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center animate-pulse">
              <AlertOutlined style={{ fontSize: '32px', color: '#ef4444' }} />
            </div>
            <Title level={3} className="text-red-600 mb-0">
              SỰ CỐ MỚI!
            </Title>
          </div>
          <Paragraph type="secondary" className="mb-0">
            Vừa có sự cố mới được báo cáo từ tài xế
          </Paragraph>
        </div>

        <Divider className="my-3" />

        {/* Main Content - 2 columns layout */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left Column - Issue Info */}
          <div className="text-left bg-gray-50 p-4 rounded">
          {/* Status & Type */}
          <div className="mb-3">
            <Tag color={getIssueStatusColor(newIssueForModal.status)} className="text-sm">
              {getIssueStatusLabel(newIssueForModal.status)}
            </Tag>
            <Tag color="red" className="text-sm animate-pulse">
              KHẨN CẤP
            </Tag>
          </div>

          {/* Issue Type - Highlighted */}
          {newIssueForModal.issueTypeEntity && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
              <Text strong className="text-blue-700">
                Loại sự cố: {newIssueForModal.issueTypeEntity.issueTypeName}
              </Text>
            </div>
          )}

          {/* Description */}
          <div className="mb-3">
            <Paragraph strong className="mb-1">
              Mô tả:
            </Paragraph>
            <Paragraph ellipsis={{ rows: 3 }} className="text-gray-700">
              {newIssueForModal.description}
            </Paragraph>
          </div>

          {/* Vehicle Info */}
          {newIssueForModal.vehicleAssignment?.vehicle && (
            <Space className="mb-2">
              <CarOutlined className="text-blue-500" />
              <Text>
                Xe: <strong>{newIssueForModal.vehicleAssignment.vehicle.licensePlateNumber}</strong>
              </Text>
            </Space>
          )}

          {/* Driver Info */}
          {newIssueForModal.vehicleAssignment?.driver1 && (
            <div className="mb-0">
              <Space>
                <UserOutlined className="text-green-500" />
                <Text>
                  Tài xế:{' '}
                  <strong>
                    {newIssueForModal.vehicleAssignment.driver1.fullName || 'N/A'}
                  </strong>
                </Text>
              </Space>
            </div>
          )}
          </div>

          {/* Right Column - Location Map Preview */}
          <div className="flex flex-col">
            {newIssueForModal.locationLatitude && newIssueForModal.locationLongitude ? (
              <div className="flex-1 rounded overflow-hidden border border-gray-200">
                <MapPreview 
                  latitude={newIssueForModal.locationLatitude}
                  longitude={newIssueForModal.locationLongitude}
                  size={350}
                />
              </div>
            ) : (
              <div className="flex-1 bg-gray-100 rounded flex items-center justify-center">
                <Text type="secondary">Không có thông tin vị trí</Text>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <Divider className="my-3" />
        <div className="flex justify-center gap-3">
          <Button size="large" onClick={handleClose}>
            Đóng
          </Button>
          <Button type="primary" size="large" onClick={handleViewDetail} danger>
            Xem chi tiết & Xử lý ngay
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default IssueModal;
