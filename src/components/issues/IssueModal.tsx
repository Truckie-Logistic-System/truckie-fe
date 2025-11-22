import React from 'react';
import { Modal, Button, Tag, Typography, Divider, Image } from 'antd';
import { AlertOutlined, CarOutlined, UserOutlined, PictureOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
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
      hideNewIssueModal();
      navigate(`/staff/issues/${newIssueForModal.id}`);
    }
  };

  const handleClose = () => {
    hideNewIssueModal();
  };

  if (!newIssueForModal) return null;

  // Debug log to check issue data
  console.log('IssueModal - newIssueForModal data:', newIssueForModal);
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

        {/* Report Time */}
        {newIssueForModal.reportedAt && (
          <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded">
            <div className="text-xs text-gray-600 mb-1">Thời gian báo cáo</div>
            <Text className="text-blue-700 text-sm">
              {new Date(newIssueForModal.reportedAt).toLocaleString('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </div>
        )}

        {/* Issue Type, Description & Order Detail - 3 columns if order detail exists, 2 columns otherwise */}
        <div className={`grid grid-cols-2 gap-2 mb-2`}>
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CarOutlined className="text-blue-600 flex-shrink-0" />
                      <Text className="text-sm">
                        <strong>{va.vehicle.licensePlateNumber}</strong>
                        {' - '}
                        <span className="text-gray-600">{va.vehicle.manufacturer} {va.vehicle.model}</span>
                      </Text>
                    </div>
                    {va.trackingCode && (
                      <Tag color="purple" className="text-xs">
                        {va.trackingCode}
                      </Tag>
                    )}
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
        <div className={`grid ${['DAMAGE', 'PENALTY', 'SEAL_REPLACEMENT', 'ORDER_REJECTION'].includes(newIssueForModal.issueCategory) ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
          {/* Left Column - Location Map */}
          <div className={['DAMAGE', 'PENALTY', 'SEAL_REPLACEMENT', 'ORDER_REJECTION'].includes(newIssueForModal.issueCategory) ? '' : 'flex justify-center'}>
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

          {/* Right Column - Category-specific content - Only show if there's additional info */}
          {['DAMAGE', 'PENALTY', 'SEAL_REPLACEMENT', 'ORDER_REJECTION'].includes(newIssueForModal.issueCategory) && (
            <div>
              {/* DAMAGE: Show damage images */}
              {newIssueForModal.issueCategory === 'DAMAGE' && (
                <div className="p-2 rounded border bg-red-50 border-red-200">
                  <div className="flex items-center gap-1 mb-1">
                    <PictureOutlined style={{ fontSize: '14px', color: '#ef4444' }} />
                    <Text strong style={{ fontSize: '11px', color: '#dc2626' }}>
                      Hình hư hại
                    </Text>
                  </div>
                  {newIssueForModal.issueImages && newIssueForModal.issueImages.length > 0 ? (
                    <Image.PreviewGroup>
                      <div className="grid grid-cols-2 gap-2">
                        {newIssueForModal.issueImages.map((imageUrl, index) => (
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
                            preview={{ mask: 'Xem full size' }}
                            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                          />
                        ))}
                      </div>
                    </Image.PreviewGroup>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-xs">
                      Chưa có hình ảnh hư hại
                    </div>
                  )}
                  
                  {/* Package Information for DAMAGE */}
                  {newIssueForModal.orderDetail ? (
                    <div className="mt-3 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                      <div className="font-bold text-blue-800 mb-2 text-sm">📦 THÔNG TIN KIỆN HÀNG BỊ HƯ HẠI:</div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center bg-white p-2 rounded border">
                          <span className="text-gray-700 font-medium text-sm">Mã vận đơn:</span>
                          <span className="font-bold text-blue-900 text-sm">{newIssueForModal.orderDetail.trackingCode}</span>
                        </div>
                        {newIssueForModal.orderDetail.description && (
                          <div className="flex justify-between items-center bg-white p-2 rounded border">
                            <span className="text-gray-700 font-medium text-sm">Mô tả:</span>
                            <span className="font-bold text-gray-900 text-sm">{newIssueForModal.orderDetail.description}</span>
                          </div>
                        )}
                        {newIssueForModal.orderDetail.weightBaseUnit && newIssueForModal.orderDetail.unit && (
                          <div className="flex justify-between items-center bg-white p-2 rounded border">
                            <span className="text-gray-700 font-medium text-sm">Khối lượng:</span>
                            <span className="font-bold text-green-700 text-sm">
                              {newIssueForModal.orderDetail.weightBaseUnit} {newIssueForModal.orderDetail.unit}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 p-3 bg-gray-100 border-2 border-gray-300 rounded-lg text-center">
                      <div className="text-red-600 font-bold text-sm">⚠️ KHÔNG TÌM THẤY THÔNG TIN KIỆN HÀNG</div>
                      <div className="text-gray-600 text-xs mt-1">orderDetail không tồn tại trong response</div>
                    </div>
                  )}
                </div>
              )}

              {/* PENALTY: Show penalty images */}
              {newIssueForModal.issueCategory === 'PENALTY' && (
                <div className="p-2 rounded border bg-purple-50 border-purple-200">
                  <div className="flex items-center gap-1 mb-1">
                    <PictureOutlined style={{ fontSize: '14px', color: '#9333ea' }} />
                    <Text strong style={{ fontSize: '11px', color: '#7e22ce' }}>
                      Biên bản vi phạm
                    </Text>
                  </div>
                  {newIssueForModal.issueImages && newIssueForModal.issueImages.length > 0 ? (
                    <Image.PreviewGroup>
                      <div className="grid grid-cols-2 gap-2">
                        {newIssueForModal.issueImages.map((imageUrl, index) => (
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
                            preview={{ mask: 'Xem full size' }}
                            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                          />
                        ))}
                      </div>
                    </Image.PreviewGroup>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-xs">
                      Chưa có hình biên bản vi phạm
                    </div>
                  )}
                </div>
              )}

              {/* SEAL_REPLACEMENT: Show seal removal image */}
              {newIssueForModal.issueCategory === 'SEAL_REPLACEMENT' && (
                <div className="p-2 rounded border bg-yellow-50 border-yellow-200">
                  <div className="flex items-center gap-1 mb-1">
                    <PictureOutlined style={{ fontSize: '14px', color: '#f59e0b' }} />
                    <Text strong style={{ fontSize: '11px', color: '#d97706' }}>
                      Hình seal bị gỡ
                    </Text>
                  </div>
                  {newIssueForModal.sealRemovalImage ? (
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
                      preview={{ mask: 'Xem full size' }}
                      fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                    />
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-xs">
                      Chưa có hình seal bị gỡ
                    </div>
                  )}
                </div>
              )}

              {/* ORDER_REJECTION: Show rejection info */}
              {newIssueForModal.issueCategory === 'ORDER_REJECTION' && (
                <div className="p-2 rounded border bg-orange-50 border-orange-200">
                  <div className="flex items-center gap-1 mb-1">
                    <ExclamationCircleOutlined style={{ fontSize: '14px', color: '#ea580c' }} />
                    <Text strong style={{ fontSize: '11px', color: '#c2410c' }}>
                      Thông tin trả hàng
                    </Text>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded p-3 text-center">
                    {/* <ExclamationCircleOutlined 
                      style={{ 
                        fontSize: '32px', 
                        color: '#ea580c',
                        marginBottom: '8px'
                      }} 
                    />
                    <div className="text-orange-700 font-semibold text-sm mb-2">
                      Người nhận từ chối nhận hàng
                    </div>
                    <div className="text-orange-600 text-xs">
                      Cần xử lý trả hàng và tính phí
                    </div> */}
                    {newIssueForModal.orderDetail ? (
                      <div className="mt-3 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                        <div className="font-bold text-orange-800 mb-2 text-sm">📦 THÔNG TIN KIỆN HÀNG BỊ TỪ CHỐI:</div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center bg-white p-2 rounded border">
                            <span className="text-gray-700 font-medium text-sm">Mã vận đơn:</span>
                            <span className="font-bold text-orange-900 text-sm">{newIssueForModal.orderDetail.trackingCode}</span>
                          </div>
                          {newIssueForModal.orderDetail.description && (
                            <div className="flex justify-between items-center bg-white p-2 rounded border">
                              <span className="text-gray-700 font-medium text-sm">Mô tả:</span>
                              <span className="font-bold text-gray-900 text-sm">{newIssueForModal.orderDetail.description}</span>
                            </div>
                          )}
                          {newIssueForModal.orderDetail.weightBaseUnit && newIssueForModal.orderDetail.unit && (
                            <div className="flex justify-between items-center bg-white p-2 rounded border">
                              <span className="text-gray-700 font-medium text-sm">Khối lượng:</span>
                              <span className="font-bold text-green-700 text-sm">
                                {newIssueForModal.orderDetail.weightBaseUnit} {newIssueForModal.orderDetail.unit}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 p-3 bg-gray-100 border-2 border-gray-300 rounded-lg text-center">
                        <div className="text-red-600 font-bold text-sm">⚠️ KHÔNG TÌM THẤY THÔNG TIN KIỆN HÀNG</div>
                        <div className="text-gray-600 text-xs mt-1">orderDetail không tồn tại trong response</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
