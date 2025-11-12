import React, { useState } from 'react';
import { Modal, Row, Col, Card, Tag, Image } from 'antd';
import { SwapOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';

interface SealConfirmationData {
  driverName: string;
  newSealCode: string;
  oldSealCode?: string;
  timestamp: string;
  sealImageUrl?: string;
  oldSealImage?: string;
  message?: string;
  // Additional fields for better context
  vehicleAssignmentId?: string;
  trackingCode?: string;
  orderId?: string;
  tripInfo?: string;
  journeyCode?: string;
}

interface SealConfirmationModalProps {
  data: SealConfirmationData;
  onClose?: () => void;
}

/**
 * Modal component for displaying seal confirmation notifications
 * Separated from context to avoid React rendering issues
 */
export const SealConfirmationModal: React.FC<SealConfirmationModalProps> = ({ 
  data, 
  onClose 
}) => {
  const formatDateTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return timestamp;
    }
  };

  const getJourneyDisplay = () => {
    if (data.journeyCode) {
      return data.journeyCode;
    }
    if (data.trackingCode) {
      return data.trackingCode;
    }
    if (data.tripInfo && data.tripInfo !== 'Chuyến #N/A') {
      return data.tripInfo;
    }
    if (data.vehicleAssignmentId) {
      return `Chuyến #${data.vehicleAssignmentId.substring(0, 8)}`;
    }
    return 'Đang cập nhật...';
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SwapOutlined style={{ color: 'white', fontSize: '18px' }} />
          <span style={{ color: 'white' }}>Xác nhận gắn seal mới</span>
        </div>
      }
      open={true}
      onOk={onClose}
      onCancel={onClose}
      width={700}
      okText="Đã hiểu"
      cancelButtonProps={{ style: { display: 'none' } }}
      centered
      styles={{
        content: {
          backgroundColor: '#1890ff',
          padding: 0,
          overflow: 'hidden'
        },
        header: {
          backgroundColor: '#1890ff',
          borderBottom: 'none',
          padding: '16px 24px',
          margin: 0
        },
        body: {
          backgroundColor: 'white',
          padding: '24px'
        },
        footer: {
          backgroundColor: 'white',
          borderTop: 'none',
          padding: '16px 24px'
        }
      }}
    >
      <div style={{ padding: '8px 0' }}>
        {/* Driver và Journey Info */}
        <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#999' }}>Tài xế:</span>
            <span style={{ fontWeight: 600, color: '#1890ff' }}>
              {data.driverName}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#999' }}>Mã chuyến:</span>
            <span style={{ fontWeight: 600, color: '#52c41a' }}>
              {getJourneyDisplay()}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#999' }}>Thời gian:</span>
            <span style={{ fontWeight: 600, color: '#666' }}>
              {formatDateTime(data.timestamp)}
            </span>
          </div>
        </div>

        {/* Seal Comparison */}
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          {/* Old Seal */}
          <Col span={12}>
            <div style={{ 
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              padding: '12px'
            }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                marginBottom: '8px',
                color: '#ff4d4f'
              }}>
                <UnlockOutlined style={{ marginRight: '6px' }} />
                Seal cũ (đã gỡ)
              </div>
              <div style={{ 
                fontSize: '16px',
                fontWeight: 600,
                fontFamily: 'monospace',
                color: '#ff4d4f',
                marginBottom: '8px'
              }}>
                {data.oldSealCode || 'Không có thông tin'}
              </div>
              
              {data.oldSealImage ? (
                <Image
                  src={data.oldSealImage}
                  alt="Seal cũ"
                  style={{ 
                    width: '100%',
                    maxHeight: '120px',
                    objectFit: 'contain',
                    borderRadius: '4px',
                    border: '1px solid #d9d9d9',
                    cursor: 'pointer'
                  }}
                  preview={{
                    mask: 'Xem'
                  }}
                />
              ) : (
                <div style={{ 
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#bfbfbf',
                  fontSize: '12px',
                  border: '1px dashed #d9d9d9',
                  borderRadius: '4px'
                }}>
                  Không có hình ảnh
                </div>
              )}
            </div>
          </Col>

          {/* New Seal */}
          <Col span={12}>
            <div style={{ 
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              padding: '12px'
            }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                marginBottom: '8px',
                color: '#52c41a'
              }}>
                <LockOutlined style={{ marginRight: '6px' }} />
                Seal mới (đã gắn)
              </div>
              <div style={{ 
                fontSize: '16px',
                fontWeight: 600,
                fontFamily: 'monospace',
                color: '#52c41a',
                marginBottom: '8px'
              }}>
                {data.newSealCode}
              </div>
              
              {data.sealImageUrl ? (
                <Image
                  src={data.sealImageUrl}
                  alt="Seal mới"
                  style={{ 
                    width: '100%',
                    maxHeight: '120px',
                    objectFit: 'contain',
                    borderRadius: '4px',
                    border: '1px solid #d9d9d9',
                    cursor: 'pointer'
                  }}
                  preview={{
                    mask: 'Xem'
                  }}
                  onError={() => {
                    console.error('Failed to load seal image:', data.sealImageUrl);
                  }}
                />
              ) : (
                <div style={{ 
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#bfbfbf',
                  fontSize: '12px',
                  border: '1px dashed #d9d9d9',
                  borderRadius: '4px'
                }}>
                  Đang tải hình ảnh...
                </div>
              )}
            </div>
          </Col>
        </Row>

        {/* Success Message */}
        <div style={{ 
          padding: '12px',
          backgroundColor: '#f6ffed',
          border: '1px solid #b7eb8f',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{ color: '#52c41a' }}>✅</span>
            <span style={{ color: '#389e0d', fontWeight: 500 }}>
              {data.message || 'Driver đã hoàn thành việc gắn seal mới thành công!'}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SealConfirmationModal;
