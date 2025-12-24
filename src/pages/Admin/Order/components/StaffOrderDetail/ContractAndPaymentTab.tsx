import React from "react";
import StaffContractSection from "../StaffContractSection";
import TransactionSection from "../../../../Orders/components/CustomerOrderDetail/TransactionSection";
import InsuranceInfo from "../../../../../components/common/InsuranceInfo";

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
    gatewayOrderCode: string;
    amount: number;
    currencyCode: string;
    status: string;
    paymentDate: string;
    transactionType?: string;
  }[];
  orderId?: string; // Add orderId for contract creation
  depositAmount?: number;
  onRefetch?: () => void; // Callback to refresh parent component data
  // Insurance fields
  hasInsurance?: boolean;
  totalInsuranceFee?: number;
  totalDeclaredValue?: number;
  readOnly?: boolean;
  // Order category for insurance rate calculation
  categoryName?: string;
  orderStatus?: string; // Order status to control button visibility
}

const ContractAndPaymentTab: React.FC<ContractAndPaymentTabProps> = ({
  contract,
  transactions,
  orderId,
  depositAmount,
  onRefetch,
  hasInsurance,
  totalInsuranceFee,
  totalDeclaredValue,
  readOnly,
  categoryName,
  orderStatus,
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
          hasInsurance={hasInsurance}
          totalInsuranceFee={totalInsuranceFee}
          totalDeclaredValue={totalDeclaredValue}
          readOnly={readOnly}
          categoryName={categoryName}
          orderStatus={orderStatus}
        />
      )}

      {/* Insurance Information */}
      <InsuranceInfo
        hasInsurance={hasInsurance}
        totalInsuranceFee={totalInsuranceFee}
        totalDeclaredValue={totalDeclaredValue}
      />

      {/* Transaction Information */}
      <TransactionSection 
        transactions={transactions}
        hasInsurance={hasInsurance}
        totalInsuranceFee={totalInsuranceFee}
        totalDeclaredValue={totalDeclaredValue}
      />
    </div>
  );
};

export default ContractAndPaymentTab;
