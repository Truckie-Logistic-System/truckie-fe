import React, { useState, useEffect } from 'react';
import { Card, Tag, Button, Spin, Badge, Alert } from 'antd';
import { 
  ExclamationCircleOutlined, 
  DollarOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined 
} from '@ant-design/icons';
import customerIssueService, { type ReturnShippingIssue } from '@/services/issue/customerIssueService';
import ReturnPaymentModal from './ReturnPaymentModal';
import dayjs from 'dayjs';

interface ReturnShippingIssuesSectionProps {
  orderId: string;
  onIssuesLoaded?: (count: number) => void;
}

/**
 * Section to display return shipping issues for an order
 * Shows pending payments and allows customer to pay or reject
 */
const ReturnShippingIssuesSection: React.FC<ReturnShippingIssuesSectionProps> = ({
  orderId,
  onIssuesLoaded
}) => {
  const [issues, setIssues] = useState<ReturnShippingIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<ReturnShippingIssue | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Fetch issues
  const fetchIssues = async () => {
    setLoading(true);
    try {
      const data = await customerIssueService.getReturnShippingIssuesByOrder(orderId);
      setIssues(data);
      if (onIssuesLoaded) {
        onIssuesLoaded(data.length);
      }
    } catch (error) {
      console.error('Error fetching return shipping issues:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [orderId]);

  // Get status badge
  const getStatusBadge = (status: string, transactionStatus?: string) => {
    if (status === 'RESOLVED' && transactionStatus === 'PAID') {
      return <Tag color="success" icon={<CheckCircleOutlined />}>Đã thanh toán</Tag>;
    }
    if (status === 'IN_PROGRESS' && transactionStatus === 'PENDING') {
      return <Tag color="warning" icon={<ClockCircleOutlined />}>Chờ thanh toán</Tag>;
    }
    if (status === 'RESOLVED' && transactionStatus !== 'PAID') {
      return <Tag color="error">Đã hủy</Tag>;
    }
    if (status === 'OPEN') {
      return <Tag color="blue">Mới báo cáo</Tag>;
    }
    return <Tag>{status}</Tag>;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Check if deadline is passed
  const isDeadlinePassed = (deadline?: string) => {
    if (!deadline) return false;
    return dayjs(deadline).isBefore(dayjs());
  };

  // Handle payment modal
  const handlePaymentClick = (issue: ReturnShippingIssue) => {
    setSelectedIssue(issue);
    setShowPaymentModal(true);
  };

  if (loading) {
    return (
      <Card title="Sự cố trả hàng" className="mb-4">
        <div className="text-center py-8">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (issues.length === 0) {
    return null; // Don't show section if no issues
  }

  // Count pending payments
  const pendingPayments = issues.filter(
    issue => issue.status === 'IN_PROGRESS' && issue.returnTransaction?.status === 'PENDING'
  ).length;

  return (
    <>
      <Card 
        title={
          <div className="flex items-center justify-between">
            <span>
              <ExclamationCircleOutlined className="mr-2 text-orange-500" />
              Sự cố trả hàng
            </span>
            {pendingPayments > 0 && (
              <Badge count={pendingPayments} showZero={false}>
                <Tag color="warning">Cần thanh toán</Tag>
              </Badge>
            )}
          </div>
        }
        className="mb-4"
      >
        {/* Pending Payments Alert */}
        {pendingPayments > 0 && (
          <Alert
            message="Có giao dịch chờ thanh toán"
            description="Bạn có phí trả hàng cần thanh toán. Vui lòng thanh toán trước hạn để tài xế có thể trả hàng về cho bạn."
            type="warning"
            showIcon
            className="mb-4"
          />
        )}

        {/* Issues List */}
        <div className="space-y-3">
          {issues.map((issue) => (
            <div
              key={issue.issueId}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-base mb-1">
                    Mã sự cố: {issue.issueCode}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Báo cáo lúc: {dayjs(issue.reportedAt).format('DD/MM/YYYY HH:mm')}
                  </p>
                </div>
                {getStatusBadge(issue.status, issue.returnTransaction?.status)}
              </div>

              {/* Description */}
              {issue.description && (
                <p className="text-sm text-gray-700 mb-3">{issue.description}</p>
              )}

              {/* Affected Packages */}
              <div className="mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Các kiện hàng bị từ chối: {issue.affectedOrderDetails.length} kiện
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {issue.affectedOrderDetails.slice(0, 3).map((detail, index) => (
                    <Tag key={index} color="blue">{detail.trackingCode}</Tag>
                  ))}
                  {issue.affectedOrderDetails.length > 3 && (
                    <Tag>+{issue.affectedOrderDetails.length - 3} kiện</Tag>
                  )}
                </div>
              </div>

              {/* Payment Info */}
              {issue.finalFee && (
                <div className="bg-blue-50 p-3 rounded mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Phí trả hàng:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(issue.finalFee)}
                    </span>
                  </div>
                  {issue.paymentDeadline && issue.returnTransaction?.status === 'PENDING' && (
                    <div className="mt-2 text-sm">
                      <ClockCircleOutlined className="mr-1" />
                      Hạn thanh toán:{' '}
                      <span className={isDeadlinePassed(issue.paymentDeadline) ? 'text-red-600 font-semibold' : ''}>
                        {dayjs(issue.paymentDeadline).format('DD/MM/YYYY HH:mm')}
                      </span>
                      {isDeadlinePassed(issue.paymentDeadline) && (
                        <span className="text-red-600 ml-2">(Đã hết hạn)</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {issue.status === 'IN_PROGRESS' && issue.returnTransaction?.status === 'PENDING' && (
                <Button
                  type="primary"
                  icon={<DollarOutlined />}
                  onClick={() => handlePaymentClick(issue)}
                  block
                  size="large"
                  danger={isDeadlinePassed(issue.paymentDeadline)}
                >
                  {isDeadlinePassed(issue.paymentDeadline) ? 'Thanh toán ngay (Quá hạn)' : 'Thanh toán'}
                </Button>
              )}

              {issue.status === 'RESOLVED' && issue.returnTransaction?.status === 'PAID' && (
                <Alert
                  message="Đã thanh toán thành công"
                  description="Tài xế đang tiến hành trả hàng về điểm lấy hàng."
                  type="success"
                  showIcon
                />
              )}

              {issue.status === 'RESOLVED' && issue.returnTransaction?.status !== 'PAID' && (
                <Alert
                  message="Đã hủy"
                  description="Các kiện hàng bị từ chối đã được hủy do không thanh toán phí trả hàng."
                  type="info"
                  showIcon
                />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Payment Modal */}
      {selectedIssue && (
        <ReturnPaymentModal
          visible={showPaymentModal}
          issue={selectedIssue}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedIssue(null);
          }}
          onPaymentSuccess={() => {
            // Refresh issues after payment
            fetchIssues();
          }}
        />
      )}
    </>
  );
};

export default ReturnShippingIssuesSection;
