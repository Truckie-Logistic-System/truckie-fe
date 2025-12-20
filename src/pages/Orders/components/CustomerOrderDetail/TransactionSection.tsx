import React from "react";
import { Card, Empty, Divider } from "antd";
import { CreditCardOutlined } from "@ant-design/icons";
import InsuranceInfo from "../../../../components/common/InsuranceInfo";
import PaymentCard from "../../../../components/common/PaymentCard";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { TransactionEnum } from "../../../../constants/enums";

// Configure dayjs to use timezone
dayjs.extend(utc);
dayjs.extend(timezone);

interface TransactionProps {
  transactions?: {
    id: string;
    paymentProvider: string;
    gatewayOrderCode: string;
    amount: number;
    currencyCode: string;
    status: string;
    paymentDate: string;
    transactionType?: string;
  }[];
  // Insurance fields
  hasInsurance?: boolean;
  totalInsuranceFee?: number;
  totalDeclaredValue?: number;
}

const TransactionSection: React.FC<TransactionProps> = ({ 
  transactions,
  hasInsurance,
  totalInsuranceFee,
  totalDeclaredValue,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Chưa có thông tin";
    return dayjs(dateString)
      .tz("Asia/Ho_Chi_Minh")
      .format("DD/MM/YYYY");
  };

  const getTransactionTypeName = (type?: string) => {
    switch (type) {
      case "DEPOSIT":
        return "Thanh toán cọc";
      case "FULL_PAYMENT":
        return "Thanh toán toàn bộ";
      case "RETURN_SHIPPING":
        return "Cước phí trả hàng";
      default:
        return "Chưa xác định";
    }
  };

  return (
    <Card
      title={
        <div className="flex items-center">
          <CreditCardOutlined className="mr-2 text-blue-500" />
          <span>Thông tin thanh toán ({transactions?.length || 0})</span>
        </div>
      }
      className="shadow-md mb-6 rounded-xl"
    >
      {transactions && transactions.length > 0 ? (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <PaymentCard
              key={transaction.id}
              transaction={transaction}
              compact={false}
            />
          ))}
        </div>
      ) : (
        <Empty description="Chưa có thông tin thanh toán" />
      )}
    </Card>
  );
};

export default TransactionSection;
