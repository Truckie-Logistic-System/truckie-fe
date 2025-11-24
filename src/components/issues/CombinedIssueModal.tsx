import React from 'react';
import { Modal, Button, Tag, Typography, Divider, Image } from 'antd';
import { AlertOutlined, PictureOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useIssuesContext } from '@/context/IssuesContext';
import type { Issue } from '@/models/Issue';

const { Title, Paragraph, Text } = Typography;

interface CombinedIssueModalProps {
  issues: Issue[];
}

/**
 * Combined modal for displaying multiple issues that occurred at the same time
 * Shows tabs for damage and rejection issues
 */
const CombinedIssueModal: React.FC<CombinedIssueModalProps> = ({ issues }) => {
  const navigate = useNavigate();
  const { hideNewIssueModal } = useIssuesContext();

  const handleViewDetail = (issueId: string) => {
    navigate(`/staff/issues/${issueId}`);
    hideNewIssueModal();
  };

  const handleClose = () => {
    hideNewIssueModal();
  };

  if (!issues || issues.length === 0) return null;

  // Group issues by category
  const damageIssues = issues.filter(i => i.issueCategory === 'DAMAGE');
  const rejectionIssues = issues.filter(i => i.issueCategory === 'ORDER_REJECTION');

  // Get order info from first issue
  const firstIssue = issues[0];
  const orderId = firstIssue.orderDetailEntity?.orderId || firstIssue.orderDetail?.orderId;

  return (
    <Modal
      open={true}
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
              NHIỀU SỰ CỐ CÙNG LÚC!
            </Title>
          </div>
          <Paragraph type="secondary" className="mb-0">
            {issues.length} sự cố được báo cáo đồng thời từ tài xế
          </Paragraph>
        </div>

        <Divider className="my-3" />

        {/* Issue Type Tags */}
        <div className="mb-3 flex gap-2 justify-center">
          {damageIssues.length > 0 && (
            <Tag color="red" className="text-sm" icon={<PictureOutlined />}>
              Hàng hư hại ({damageIssues.length})
            </Tag>
          )}
          {rejectionIssues.length > 0 && (
            <Tag color="orange" className="text-sm" icon={<CloseCircleOutlined />}>
              Hàng bị trả ({rejectionIssues.length})
            </Tag>
          )}
        </div>

        {/* Issue List */}
        <div className="max-h-96 overflow-y-auto space-y-3">
          {damageIssues.map((issue, index) => (
            <div key={`damage-${index}`} className="border border-red-200 rounded-lg p-3 bg-red-50">
              <div className="flex items-center gap-2 mb-2">
                <PictureOutlined style={{ color: '#ef4444', fontSize: '18px' }} />
                <Text strong className="text-red-700">Hàng hư hại #{index + 1}</Text>
              </div>
              <div className="pl-6">
                <div className="mb-1">
                  <Text type="secondary" className="text-xs">Kiện hàng: </Text>
                  <Text strong className="text-sm">{issue.orderDetail?.trackingCode || 'N/A'}</Text>
                </div>
                <div className="mb-1">
                  <Text type="secondary" className="text-xs">Mô tả: </Text>
                  <Text className="text-sm">{issue.description}</Text>
                </div>
                {issue.issueImages && issue.issueImages.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {issue.issueImages.slice(0, 3).map((img, i) => (
                      <Image key={i} src={img} alt="Hư hại" width={60} height={60} className="rounded" />
                    ))}
                  </div>
                )}
                <Button size="small" type="link" onClick={() => handleViewDetail(issue.id)}>Xem chi tiết</Button>
              </div>
            </div>
          ))}
          
          {rejectionIssues.map((issue, index) => (
            <div key={`rejection-${index}`} className="border border-orange-200 rounded-lg p-3 bg-orange-50">
              <div className="flex items-center gap-2 mb-2">
                <CloseCircleOutlined style={{ color: '#ea580c', fontSize: '18px' }} />
                <Text strong className="text-orange-700">Hàng bị trả #{index + 1}</Text>
              </div>
              <div className="pl-6">
                <div className="mb-1">
                  <Text type="secondary" className="text-xs">Kiện hàng: </Text>
                  <Text strong className="text-sm">{issue.orderDetail?.trackingCode || 'N/A'}</Text>
                </div>
                <div className="mb-1">
                  <Text type="secondary" className="text-xs">Lý do: </Text>
                  <Text className="text-sm">{issue.description}</Text>
                </div>
                <Button size="small" type="link" onClick={() => handleViewDetail(issue.id)}>Xem chi tiết</Button>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <Divider className="my-3" />
        <div className="flex justify-center gap-3">
          <Button size="large" onClick={handleClose}>
            Đóng
          </Button>
          <Button 
            type="primary" 
            size="large" 
            onClick={() => {
              // Navigate to order detail with issue highlights
              if (orderId) {
                navigate(`/staff/orders/${orderId}`);
                hideNewIssueModal();
              }
            }}
            danger
          >
            Xem chi tiết đơn hàng
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CombinedIssueModal;
