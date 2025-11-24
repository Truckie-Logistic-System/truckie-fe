import React, { useState, useEffect } from 'react';
import { Modal, Button, Descriptions, Alert, Statistic, Tag, message, QRCode, Divider } from 'antd';
import { DollarOutlined, ClockCircleOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import customerIssueService, { type ReturnShippingIssue } from '@/services/issue/customerIssueService';
import dayjs from 'dayjs';
import { TransactionStatusTag } from '@/components/common/tags';
import { TransactionEnum } from '@/constants/enums';

const { Countdown } = Statistic;

interface ReturnPaymentModalProps {
  visible: boolean;
  issue: ReturnShippingIssue;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

/**
 * Modal for customer to pay return shipping fee
 * Shows fee details, payment deadline, and payment options
 */
const ReturnPaymentModal: React.FC<ReturnPaymentModalProps> = ({
  visible,
  issue,
  onClose,
  onPaymentSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Calculate if deadline is close (< 10 minutes)
  const isDeadlineClose = () => {
    if (!issue.paymentDeadline) return false;
    const deadline = dayjs(issue.paymentDeadline);
    const now = dayjs();
    const minutesLeft = deadline.diff(now, 'minute');
    return minutesLeft < 10;
  };

  // Handle payment - Create transaction and redirect to PayOS (same pattern as deposit/full payment)
  const handlePayment = async () => {
    if (!issue.finalFee || !issue.customerInfo) {
      message.error('Không tìm thấy thông tin thanh toán');
      return;
    }

    setLoading(true);
    try {
      // Call API to create transaction (similar to deposit flow)
      // Need to get contractId from issue's order
      const response = await customerIssueService.createReturnPaymentLink(issue.issueId);
      
      // Parse the response to get checkoutUrl
      const checkoutUrl = response.checkoutUrl;
      
      // Extract QR code if available
      if (response.qrCode) {
        setQrCode(response.qrCode);
      }

      // If we have a checkout URL, redirect to it
      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank');
        message.success('Đã mở trang thanh toán. Vui lòng hoàn tất thanh toán.');
      } else {
        message.error('Không tìm thấy link thanh toán. Vui lòng thử lại sau.');
      }
      
      // Note: Payment status will be updated via webhook
      
    } catch (error: any) {
      message.error(error.message || 'Không thể tạo link thanh toán');
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };


  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setQrCode(null);
    }
  }, [visible]);

  return (
    <Modal
      title={
        <div className="flex items-center">
          <DollarOutlined className="mr-2 text-blue-500" />
          <span>Thanh toán cước trả hàng</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      centered
    >
      {/* Payment Status */}
      {issue.returnTransaction && (
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Trạng thái thanh toán:</span>
            <TransactionStatusTag status={issue.returnTransaction.status as TransactionEnum} />
          </div>
        </div>
      )}

      {/* Show pending payment message if no transaction yet */}
      {!issue.returnTransaction && (
        <Alert
          message="Chưa có giao dịch thanh toán"
          description="Nhấn nút 'Thanh toán ngay' để tạo giao dịch và thanh toán cước trả hàng."
          type="info"
          showIcon
          className="mb-4"
        />
      )}

      {/* Affected Packages */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Các kiện hàng cần trả ({issue.affectedOrderDetails.length} kiện)</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {issue.affectedOrderDetails.map((detail, index) => (
            <div key={index} className="bg-gray-50 p-2 rounded flex justify-between">
              <span>
                <Tag color="blue">{detail.trackingCode}</Tag>
                {detail.description && <span className="text-gray-600">{detail.description}</span>}
              </span>
              {detail.weightBaseUnit && (
                <span className="text-gray-500">
                  {detail.weightBaseUnit} {detail.unit || 'kg'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <Divider />

      {/* Fee Information */}
      <Descriptions bordered size="small" column={1} className="mb-4">
        <Descriptions.Item label="Phí trả hàng (tính toán)">
          {issue.calculatedFee ? formatCurrency(issue.calculatedFee) : 'N/A'}
        </Descriptions.Item>
        {issue.adjustedFee && (
          <Descriptions.Item label="Phí điều chỉnh (ưu đãi)">
            <span className="text-green-600">{formatCurrency(issue.adjustedFee)}</span>
          </Descriptions.Item>
        )}
        <Descriptions.Item label={<strong>Tổng phải thanh toán</strong>}>
          <span className="text-xl font-bold text-red-600">
            {issue.finalFee ? formatCurrency(issue.finalFee) : 'N/A'}
          </span>
        </Descriptions.Item>
      </Descriptions>

      {/* Payment Deadline */}
      {issue.paymentDeadline && issue.returnTransaction?.status === 'PENDING' && (
        <Alert
          message={
            <div className="flex items-center justify-between">
              <span className="font-semibold">
                <ClockCircleOutlined className="mr-2" />
                Hạn thanh toán
              </span>
              <Countdown
                value={dayjs(issue.paymentDeadline).valueOf()}
                format="HH:mm:ss"
                valueStyle={{ 
                  fontSize: isDeadlineClose() ? '20px' : '16px',
                  color: isDeadlineClose() ? '#ff4d4f' : '#1890ff',
                  fontWeight: 'bold'
                }}
              />
            </div>
          }
          description={
            <div>
              <p>Hết hạn lúc: <strong>{dayjs(issue.paymentDeadline).format('DD/MM/YYYY HH:mm:ss')}</strong></p>
              {isDeadlineClose() && (
                <p className="text-red-500 mt-2">
                  <WarningOutlined className="mr-1" />
                  Sắp hết hạn! Vui lòng thanh toán ngay.
                </p>
              )}
            </div>
          }
          type={isDeadlineClose() ? 'error' : 'warning'}
          showIcon
          className="mb-4"
        />
      )}

      {/* Payment QR Code (if available) */}
      {qrCode && (
        <div className="text-center mb-4">
          <p className="mb-2 font-semibold">Quét mã QR để thanh toán</p>
          <QRCode value={qrCode} size={200} />
        </div>
      )}

      {/* Action Buttons */}
      {(!issue.returnTransaction || issue.returnTransaction?.status === 'PENDING') && (
        <div className="flex justify-end">
          <Button
            type="primary"
            icon={<DollarOutlined />}
            onClick={handlePayment}
            loading={loading}
            size="large"
            block
            danger
            style={{ height: '48px' }}
            className="font-semibold"
          >
            Thanh toán ngay qua PayOS
          </Button>
        </div>
      )}

      {/* Paid Status */}
      {issue.returnTransaction?.status === 'PAID' && (
        <Alert
          message={
            <div className="flex items-center">
              <CheckCircleOutlined className="mr-2" />
              <span>Đã thanh toán thành công</span>
            </div>
          }
          description="Tài xế sẽ tiến hành trả hàng về điểm lấy hàng ban đầu."
          type="success"
          showIcon
        />
      )}

      {/* Help Text */}
      <Alert
        message="💡 Lưu ý quan trọng"
        description={
          <ul className="list-disc ml-4 mt-2 space-y-1">
            <li>Phí trả hàng được tính dựa trên trọng lượng và khoảng cách vận chuyển</li>
            <li>Sau khi thanh toán, tài xế sẽ nhận được thông báo và tiến hành trả hàng</li>
            <li><strong>Nếu không thanh toán trong thời hạn, các kiện hàng sẽ tự động bị hủy</strong></li>
            <li>Bạn có thể theo dõi quá trình trả hàng trong chi tiết đơn hàng</li>
          </ul>
        }
        type="info"
        showIcon
        className="mt-4"
      />
    </Modal>
  );
};

export default ReturnPaymentModal;
