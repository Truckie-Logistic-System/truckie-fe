import React from "react";
import StaffContractSection from "../StaffContractSection";
import TransactionSection from "../../../../Orders/components/CustomerOrderDetail/TransactionSection";

interface ContractAndPaymentTabProps {
  contract?: {
    id: string;
    contractName: string;
    effectiveDate: string;
    expirationDate: string;
    totalValue: string;
    adjustedValue: string;
    description: string;
    attachFileUrl: string;
    status: string;
    staffName: string;
  };
  transactions?: {
    id: string;
    paymentProvider: string;
    orderCode: string;
    amount: number;
    currencyCode: string;
    status: string;
    paymentDate: string;
  }[];
  orderId?: string; // Add orderId for contract creation
  depositAmount?: number;
}

const ContractAndPaymentTab: React.FC<ContractAndPaymentTabProps> = ({
  contract,
  transactions,
  orderId,
  depositAmount,
}) => {
  return (
    <div>
      {/* Contract Information */}
      {contract && (
        <StaffContractSection contract={contract} orderId={orderId} depositAmount={depositAmount} />
      )}

      {/* Transaction Information */}
      <TransactionSection transactions={transactions} />
    </div>
  );
};

export default ContractAndPaymentTab;
