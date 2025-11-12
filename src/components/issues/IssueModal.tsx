import React from 'react';
import { Modal, Button, Tag, Typography, Divider, Image } from 'antd';
import { AlertOutlined, CarOutlined, UserOutlined, PictureOutlined } from '@ant-design/icons';
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

  // Debug log to check issue data
  console.log('🔍 [IssueModal] newIssueForModal:', {
    id: newIssueForModal.id,
    issueCategory: newIssueForModal.issueCategory,
    issueImages: newIssueForModal.issueImages,
    sealRemovalImage: newIssueForModal.sealRemovalImage,
    orderDetail: newIssueForModal.orderDetail
  });

  console.log(newIssueForModal);

  return (
    <Modal
      open={!!newIssueForModal}
      onCancel={handleClose}
      footer={null}
      width={1000}
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

        {/* Status & Type */}
        <div className="mb-2 flex gap-2">
          <Tag color={getIssueStatusColor(newIssueForModal.status)} className="text-sm">
            {getIssueStatusLabel(newIssueForModal.status)}
          </Tag>
          <Tag color="red" className="text-sm animate-pulse">
            KHẨN CẤP
          </Tag>
        </div>

        {/* Issue Type, Description & Order Detail - 3 columns if order detail exists, 2 columns otherwise */}
        <div className={`grid ${newIssueForModal.orderDetail ? 'grid-cols-3' : 'grid-cols-2'} gap-2 mb-2`}>
          {/* Issue Type */}
          {newIssueForModal.issueTypeEntity && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded">
              <div className="text-xs text-gray-600 mb-1">Loại sự cố</div>
              <Text strong className="text-blue-700 text-sm line-clamp-2">
                {newIssueForModal.issueTypeEntity.issueTypeName}
              </Text>
            </div>
          )}

          {/* Description */}
          <div className="p-2 bg-gray-50 border border-gray-200 rounded">
            <div className="text-xs text-gray-600 mb-1">Mô tả</div>
            <Paragraph ellipsis={{ rows: 2 }} className="text-gray-700 mb-0 text-sm">
              {newIssueForModal.description}
            </Paragraph>
          </div>

          {/* Order Detail Info (if available) */}
          {newIssueForModal.orderDetail && (
            <div className="p-2 bg-purple-50 border border-purple-200 rounded">
              <div className="text-xs text-gray-600 mb-1">Chi tiết hàng hóa</div>
              <div className="text-xs space-y-0.5">
                <div><strong>Mã:</strong> {newIssueForModal.orderDetail.trackingCode}</div>
                <div className="truncate"><strong>Mô tả:</strong> {newIssueForModal.orderDetail.description}</div>
                <div><strong>KL:</strong> {newIssueForModal.orderDetail.weightBaseUnit} {newIssueForModal.orderDetail.unit}</div>
              </div>
            </div>
          )}
        </div>

        {/* Vehicle & Drivers Info */}
        {(newIssueForModal.vehicleAssignmentEntity || newIssueForModal.vehicleAssignment) && (
          <div className="mb-2 space-y-1">
            {/* Vehicle Info */}
            {(() => {
              const va = newIssueForModal.vehicleAssignmentEntity || newIssueForModal.vehicleAssignment;
              return va?.vehicle ? (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                  <div className="text-xs text-gray-600 mb-1">Phương tiện</div>
                  <div className="flex items-center gap-2">
                    <CarOutlined className="text-blue-600 flex-shrink-0" />
                    <Text className="text-sm">
                      <strong>{va.vehicle.licensePlateNumber}</strong>
                      {' - '}
                      <span className="text-gray-600">{va.vehicle.manufacturer} {va.vehicle.model}</span>
                    </Text>
                  </div>
                </div>
              ) : null;
            })()}

            {/* Drivers Info - 2 columns */}
            {(() => {
              const va = newIssueForModal.vehicleAssignmentEntity || newIssueForModal.vehicleAssignment;
              const hasDriver1 = va?.driver1;
              const hasDriver2 = va?.driver2;
              
              if (!hasDriver1 && !hasDriver2) return null;
              
              return (
                <div className="grid grid-cols-2 gap-1">
                  {/* Driver 1 */}
                  {hasDriver1 && va?.driver1 ? (
                    <div className="p-2 bg-green-50 border border-green-200 rounded">
                      <div className="text-xs text-gray-600 mb-1">Tài xế 1</div>
                      <div className="flex items-center gap-1">
                        <UserOutlined className="text-green-600 flex-shrink-0 text-xs" />
                        <div className="min-w-0">
                          <div className="font-semibold text-sm truncate">{va.driver1.fullName}</div>
                          <div className="text-xs text-gray-600 truncate">{va.driver1.phoneNumber}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div />
                  )}

                  {/* Driver 2 */}
                  {hasDriver2 && va?.driver2 ? (
                    <div className="p-2 bg-green-50 border border-green-200 rounded">
                      <div className="text-xs text-gray-600 mb-1">Tài xế 2</div>
                      <div className="flex items-center gap-1">
                        <UserOutlined className="text-green-600 flex-shrink-0 text-xs" />
                        <div className="min-w-0">
                          <div className="font-semibold text-sm truncate">{va.driver2.fullName}</div>
                          <div className="text-xs text-gray-600 truncate">{va.driver2.phoneNumber}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div />
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Main Content - Location Map & Images */}
        <div className="grid grid-cols-2 gap-2">
          {/* Left Column - Location Map */}
          <div>
            {newIssueForModal.locationLatitude && newIssueForModal.locationLongitude ? (
              <div className="rounded overflow-hidden border border-gray-200">
                <MapPreview 
                  latitude={newIssueForModal.locationLatitude}
                  longitude={newIssueForModal.locationLongitude}
                  size={200}
                />
              </div>
            ) : (
              <div className="bg-gray-100 rounded flex items-center justify-center" style={{ height: '200px' }}>
                <Text type="secondary" className="text-xs">Không có vị trí</Text>
              </div>
            )}
          </div>

          {/* Right Column - Issue Images */}
          {((newIssueForModal.issueCategory === 'DAMAGE' && newIssueForModal.issueImages && newIssueForModal.issueImages.length > 0) ||
            (newIssueForModal.issueCategory === 'SEAL_REPLACEMENT' && newIssueForModal.sealRemovalImage) ||
            (newIssueForModal.issueCategory === 'PENALTY' && newIssueForModal.issueImages && newIssueForModal.issueImages.length > 0)) && (
            <div className={`p-2 rounded border ${
              newIssueForModal.issueCategory === 'DAMAGE' ? 'bg-red-50 border-red-200' : 
              newIssueForModal.issueCategory === 'PENALTY' ? 'bg-purple-50 border-purple-200' :
              'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center gap-1 mb-1">
                <PictureOutlined style={{ 
                  fontSize: '14px', 
                  color: newIssueForModal.issueCategory === 'DAMAGE' ? '#ef4444' : 
                         newIssueForModal.issueCategory === 'PENALTY' ? '#9333ea' : 
                         '#f59e0b' 
                }} />
                <Text strong style={{ 
                  fontSize: '11px', 
                  color: newIssueForModal.issueCategory === 'DAMAGE' ? '#dc2626' : 
                         newIssueForModal.issueCategory === 'PENALTY' ? '#7e22ce' : 
                         '#d97706' 
                }}>
                  {newIssueForModal.issueCategory === 'DAMAGE' ? 'Hình hư hại' : 
                   newIssueForModal.issueCategory === 'PENALTY' ? 'Biên bản vi phạm' : 
                   'Hình seal'}
                </Text>
              </div>
              <Image.PreviewGroup>
                <div className="grid grid-cols-2 gap-2">
                  {newIssueForModal.issueCategory === 'DAMAGE' && newIssueForModal.issueImages ? (
                    newIssueForModal.issueImages.map((imageUrl, index) => {
                      console.log('Rendering damage image:', imageUrl);
                      return (
                        <Image
                          key={index}
                          src={imageUrl}
                          alt={`Hàng hóa hư hại ${index + 1}`}
                          style={{ 
                            width: '100%',
                            height: 'auto',
                            maxHeight: '250px',
                            objectFit: 'contain',
                            borderRadius: '4px',
                            border: '1px solid #ef5350',
                            cursor: 'pointer'
                          }}
                          preview={{
                            mask: 'Xem full size',
                          }}
                          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                          onError={(e) => {
                            console.error('Image load error:', imageUrl, e);
                          }}
                        />
                      );
                    })
                  ) : newIssueForModal.issueCategory === 'PENALTY' && newIssueForModal.issueImages ? (
                    newIssueForModal.issueImages.map((imageUrl, index) => {
                      console.log('Rendering penalty image:', imageUrl);
                      return (
                        <Image
                          key={index}
                          src={imageUrl}
                          alt={`Biên bản vi phạm ${index + 1}`}
                          style={{ 
                            width: '100%',
                            height: 'auto',
                            maxHeight: '250px',
                            objectFit: 'contain',
                            borderRadius: '4px',
                            border: '1px solid #9333ea',
                            cursor: 'pointer'
                          }}
                          preview={{
                            mask: 'Xem full size',
                          }}
                          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                          onError={(e) => {
                            console.error('Penalty image load error:', imageUrl, e);
                          }}
                        />
                      );
                    })
                  ) : newIssueForModal.sealRemovalImage ? (
                    <Image
                      src={newIssueForModal.sealRemovalImage}
                      alt="Seal bị gỡ"
                      style={{ 
                        width: '100%',
                        height: 'auto',
                        maxHeight: '250px',
                        objectFit: 'contain',
                        borderRadius: '4px',
                        border: '1px solid #f59e0b',
                        cursor: 'pointer'
                      }}
                      preview={{
                        mask: 'Xem full size',
                      }}
                      fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                      onError={(e) => {
                        console.error('Seal image load error:', newIssueForModal.sealRemovalImage, e);
                      }}
                    />
                  ) : null}
                </div>
              </Image.PreviewGroup>
            </div>
          )}
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
