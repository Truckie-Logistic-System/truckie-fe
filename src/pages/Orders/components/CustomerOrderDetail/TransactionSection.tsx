import React from "react";
import { Card, Descriptions, Empty } from "antd";
import { CreditCardOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { TransactionStatusTag } from "../../../../components/common/tags";
import { TransactionEnum } from "../../../../constants/enums";

// Configure dayjs to use timezone
dayjs.extend(utc);
dayjs.extend(timezone);

interface TransactionProps {
  transactions?: {
    id: string;
    paymentProvider: string;
    orderCode: string;
    amount: number;
    currencyCode: string;
    status: string;
    paymentDate: string;
  }[];
}

const TransactionSection: React.FC<TransactionProps> = ({ transactions }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Chưa có thông tin";
    return dayjs(dateString)
      .tz("Asia/Ho_Chi_Minh")
      .format("DD/MM/YYYY HH:mm:ss");
  };

  return (
    <Card
      title={
        <div className="flex items-center">
          <CreditCardOutlined className="mr-2 text-blue-500" />
          <span>Thông tin thanh toán</span>
        </div>
      }
      className="shadow-md mb-6 rounded-xl"
    >
      {transactions && transactions.length > 0 ? (
        transactions.map((transaction, index) => (
          <div
            key={transaction.id}
            className={index > 0 ? "mt-6 pt-6 border-t" : ""}
          >
            <Descriptions
              bordered
              column={{ xs: 1, sm: 2, md: 3 }}
              size="small"
            >
              <Descriptions.Item label="Nhà cung cấp thanh toán">
                {transaction.paymentProvider || "Chưa có thông tin"}
              </Descriptions.Item>
              <Descriptions.Item label="Mã đơn hàng">
                {transaction.orderCode || "Chưa có thông tin"}
              </Descriptions.Item>
              <Descriptions.Item label="Số tiền">
                {transaction.amount !== null && transaction.amount !== undefined
                  ? `${transaction.amount.toLocaleString("vi-VN")} ${
                      transaction.currencyCode || ""
                    }`
                  : "Chưa có thông tin"}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {transaction.status ? (
                  <TransactionStatusTag status={transaction.status as TransactionEnum} />
                ) : (
                  "Chưa có thông tin"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày thanh toán">
                {formatDate(transaction.paymentDate)}
              </Descriptions.Item>
            </Descriptions>
          </div>
        ))
      ) : (
        <Empty description="Chưa có thông tin thanh toán" />
      )}
    </Card>
  );
};

export default TransactionSection;
