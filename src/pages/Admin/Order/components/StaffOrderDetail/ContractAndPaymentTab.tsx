import React from "react";
import StaffContractSection from "../StaffContractSection";
import TransactionSection from "../../../../Orders/components/CustomerOrderDetail/TransactionSection";

interface ContractAndPaymentTabProps {
  contract?: {
    id: string;
    contractName: string;
    effectiveDate: string;
    expirationDate: string;
    totalValue: number;
    adjustedValue: number;
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
  onRefetch?: () => void; // Callback to refresh parent component data
}

const ContractAndPaymentTab: React.FC<ContractAndPaymentTabProps> = ({
  contract,
  transactions,
  orderId,
  depositAmount,
  onRefetch,
}) => {
  return (
    <div>
      {/* Contract Information */}
      {contract && (
        <StaffContractSection 
          contract={contract} 
          orderId={orderId} 
          depositAmount={depositAmount} 
          onRefetch={onRefetch}
        />
      )}

      {/* Transaction Information */}
      <TransactionSection transactions={transactions} />
    </div>
  );
};

export default ContractAndPaymentTab;
