import React, { useState, useEffect } from "react";
import {
  Card,
  Empty,
  Button,
  App,
  Alert,
  Divider,
  Statistic,
  Row,
  Col,
  Spin,
  Skeleton,
} from "antd";
import {
  FileTextOutlined,
  EditOutlined,
  CreditCardOutlined,
  DollarOutlined,
  LoadingOutlined,
  InfoCircleOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import { ContractStatusTag } from "../../../../components/common/tags";
import InsuranceInfo from "../../../../components/common/InsuranceInfo";
import { ContractStatusEnum, OrderStatusEnum } from "../../../../constants/enums";
import { useRefreshOrderDetail, useContractOperations } from "../../../../hooks";
import type { PriceDetails } from "../../../../services/contract/contractTypes";
import type { PaymentBreakdownSnapshot } from "../../../../services/contract/types";
import contractSettingService from "../../../../services/contract/contractSettingService";
import contractService from "../../../../services/contract/contractService";
import type { ContractSettings } from "../../../../models/Contract";
import { CategoryName, isFragileCategory } from "../../../../models/CategoryName";

// Utility function to safely parse contract values
const parseContractValue = (value: string | number | undefined): number => {
  if (!value) return 0;
  if (typeof value === "number") return value;
  const numericValue = parseFloat(value.replace(/[^0-9.-]+/g, ""));
  return isNaN(numericValue) ? 0 : numericValue;
};


interface ContractProps {
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
    paymentBreakdownSnapshot?: string; // JSON string
  };
  orderStatus?: string;
  depositAmount?: number;
  priceDetails?: PriceDetails;
  loadingPriceDetails?: boolean;
  onContractSigned?: () => void;
  // Insurance fields
  hasInsurance?: boolean;
  totalInsuranceFee?: number;
  totalDeclaredValue?: number;
  // Order category for insurance rate calculation
  categoryName?: string;
}

const ContractSection: React.FC<ContractProps> = ({
  contract,
  orderStatus,
  depositAmount,
  priceDetails,
  loadingPriceDetails = false,
  onContractSigned,
  hasInsurance,
  totalInsuranceFee,
  totalDeclaredValue,
  categoryName,
}) => {
  const messageApi = App.useApp().message;
  const [contractSettings, setContractSettings] = useState<ContractSettings | null>(null);
  const [fetchedPriceDetails, setFetchedPriceDetails] = useState<PriceDetails | null>(null);
  const [loadingPriceData, setLoadingPriceData] = useState<boolean>(false);
  
  // Helper function to get grandTotal from API data
  // USE API VALUE DIRECTLY - do not recalculate to avoid data mismatch
  const calculateGrandTotalFromFormula = (priceDetails: any): number => {
    // Return API value directly - backend already calculated correctly
    return priceDetails?.grandTotal || 0;
  };
  
  // Fetch contract settings and price details on component mount
  useEffect(() => {
    const fetchContractSettings = async () => {
      try {
        const response = await contractSettingService().getContractSettings();
        // API returns array, take first element as it's always unique
        if (response.data && response.data.length > 0) {
          setContractSettings(response.data[0]);
        }
      } catch (error) {
        console.error("Error fetching contract settings:", error);
      }
    };
    
    const fetchPriceDetails = async () => {
      if (!contract?.id) return;
      
      setLoadingPriceData(true);
      try {
        // Priority 1: Use snapshot if available
        if (contract.paymentBreakdownSnapshot) {
          try {
            const snapshot: PaymentBreakdownSnapshot = JSON.parse(contract.paymentBreakdownSnapshot);
            console.log("[Customer] ✅ Using payment breakdown snapshot:", snapshot);
            
            // Transform snapshot to match expected format
            const transformedData: PriceDetails = {
              steps: snapshot.steps,
              totalPrice: snapshot.totalPrice,
              totalBeforeAdjustment: snapshot.totalBeforeAdjustment,
              categoryExtraFee: snapshot.categoryExtraFee,
              categoryMultiplier: snapshot.categoryMultiplier,
              promotionDiscount: 0, // Default value if not in snapshot
              finalTotal: snapshot.finalTotal,
              grandTotal: snapshot.grandTotal,
              summary: '', // Default empty summary
              insuranceFee: snapshot.insuranceFee,
              insuranceRate: snapshot.insuranceRate,
              totalDeclaredValue: snapshot.totalDeclaredValue,
              hasInsurance: snapshot.hasInsurance,
              totalTollFee: snapshot.totalTollFee,
              totalTollCount: snapshot.totalTollCount,
              vehicleType: snapshot.vehicleType,
              vatRate: snapshot.vatRate,
              // Add contract-specific fields from snapshot
              adjustedValue: snapshot.adjustedValue ?? undefined,
              effectiveTotal: snapshot.effectiveTotal ?? undefined,
              depositAmount: snapshot.depositAmount ?? undefined,
              depositPercent: snapshot.depositPercent ?? undefined,
              remainingAmount: snapshot.remainingAmount ?? undefined,
              // Add snapshot metadata
              isSnapshot: true,
              snapshotDate: snapshot.snapshotDate,
              snapshotVersion: snapshot.snapshotVersion,
            };
            
            setFetchedPriceDetails(transformedData);
            return; // Exit early if snapshot loaded successfully
          } catch (parseError) {
            console.error("[Customer] ❌ Failed to parse snapshot:", parseError);
          }
        }
        
        // Priority 2: Fallback to API (legacy contracts without snapshot)
        console.warn("[Customer] ⚠️ No snapshot found, using API fallback");
        const response = await contractService.getContractPdfData(contract.id);
        if (response.data?.priceDetails) {
          setFetchedPriceDetails(response.data.priceDetails);
        }
      } catch (error) {
        console.error("Error fetching price details:", error);
      } finally {
        setLoadingPriceData(false);
      }
    };
    
    fetchContractSettings();
    fetchPriceDetails();
  }, [contract?.id]);
  
  const { refetch: refetchOrderDetail } = useRefreshOrderDetail('customer');
  const {
    signingContract,
    payingDeposit,
    payingFullAmount,
    signContract: signContractFn,
    payDeposit: payDepositFn,
    payFullAmount: payFullAmountFn,
  } = useContractOperations();

  const hasAdjustedValue = Boolean(
    contract?.adjustedValue && contract.adjustedValue !== 0
  );

  const hasDepositAmount = typeof depositAmount === "number" && depositAmount > 0;

  // Hide contract information when order status is "processing"
  if (orderStatus?.toUpperCase() === OrderStatusEnum.PROCESSING) {
    return null;
  }

  const handleSignContract = async () => {
    if (!contract?.id) {
      messageApi.error("Không tìm thấy thông tin hợp đồng");
      return;
    }

    try {
      await signContractFn(contract.id);
      messageApi.success({
        content:
          "Ký hợp đồng thành công! Vui lòng thanh toán đặt cọc để tiếp tục.",
        duration: 5,
      });
      // Refetch order detail to reflect the updated contract status
      setTimeout(() => {
        refetchOrderDetail();
        // Call onContractSigned callback to switch tab
        onContractSigned?.();
      }, 1500);
    } catch (error) {
      console.error("Error signing contract:", error);
      messageApi.error("Có lỗi xảy ra khi ký hợp đồng");
    }
  };

  const handlePayDeposit = async () => {
    if (!contract?.id) {
      messageApi.error("Không tìm thấy thông tin hợp đồng");
      return;
    }

    try {
      const response = await payDepositFn(contract.id);
      messageApi.success("Khởi tạo thanh toán đặt cọc thành công!");

      // Parse the gatewayResponse to get the checkoutUrl
      let checkoutUrl = null;
      if (response?.data?.gatewayResponse) {
        try {
          const gatewayData = JSON.parse(response.data.gatewayResponse);
          checkoutUrl = gatewayData.checkoutUrl;
        } catch (parseError) {
          console.error("Error parsing gatewayResponse:", parseError);
        }
      }

      // If we have a checkout URL, redirect to it
      if (checkoutUrl) {
        window.open(checkoutUrl, "_blank");
      } else {
        messageApi.info("Đang cập nhật dữ liệu...");
        // Refetch order detail to reflect any status changes
        refetchOrderDetail();
      }
    } catch (error) {
      console.error("Error paying deposit:", error);
      messageApi.error("Có lỗi xảy ra khi thanh toán đặt cọc");
    }
  };

  const handlePayFullAmount = async () => {
    if (!contract?.id) {
      messageApi.error("Không tìm thấy thông tin hợp đồng");
      return;
    }

    try {
      const response = await payFullAmountFn(contract.id);
      messageApi.success("Khởi tạo thanh toán toàn bộ thành công!");

      // Parse the gatewayResponse to get the checkoutUrl
      let checkoutUrl = null;
      if (response?.data?.gatewayResponse) {
        try {
          const gatewayData = JSON.parse(response.data.gatewayResponse);
          checkoutUrl = gatewayData.checkoutUrl;
        } catch (parseError) {
          console.error("Error parsing gatewayResponse:", parseError);
        }
      }

      // If we have a checkout URL, redirect to it
      if (checkoutUrl) {
        window.open(checkoutUrl, "_blank");
      } else {
        messageApi.info("Đang cập nhật dữ liệu...");
        // Refetch order detail to reflect any status changes
        refetchOrderDetail();
      }
    } catch (error) {
      console.error("Error paying full amount:", error);
      messageApi.error("Có lỗi xảy ra khi thanh toán toàn bộ");
    }
  };


  return (
    <>
      <Card
      title={
        <div className="flex items-center">
          <FileTextOutlined className="mr-2 text-blue-500" />
          <span>Thông tin hợp đồng</span>
        </div>
      }
      className="shadow-md mb-6 rounded-xl"
    >
      {contract ? (
        <>
          {/* Payment Summary - Only show when snapshot exists */}
          {hasDepositAmount && fetchedPriceDetails?.isSnapshot && (
            <div className="mb-6">
              <Alert
                message="Thông tin thanh toán"
                description={
                  <div className="space-y-4">
                    <Row gutter={[16, 16]} className="mt-3">
                      {/* Show both original and adjusted values if there's a discount */}
                      {fetchedPriceDetails.adjustedValue && 
                       fetchedPriceDetails.grandTotal &&
                       fetchedPriceDetails.adjustedValue > 0 && 
                       fetchedPriceDetails.grandTotal > 0 &&
                       fetchedPriceDetails.grandTotal !== fetchedPriceDetails.adjustedValue && (
                        <>
                          <Col xs={24} sm={12} md={6}>
                            <Statistic
                              title="Giá niêm yết"
                              value={(fetchedPriceDetails.grandTotal || 0).toLocaleString("vi-VN")}
                              suffix="VNĐ"
                              prefix={<DollarOutlined />}
                              valueStyle={{ color: "#8c8c8c", textDecoration: "line-through" }}
                            />
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <Statistic
                              title="Giá thực tế"
                              value={(fetchedPriceDetails.adjustedValue || 0).toLocaleString("vi-VN")}
                              suffix="VNĐ"
                              prefix={<DollarOutlined />}
                              valueStyle={{ color: "#722ed1", fontSize: "18px", fontWeight: "600" }}
                            />
                            <div className="text-xs text-gray-500 mt-1">
                              Giá ưu đãi áp dụng cho hợp đồng này
                            </div>
                          </Col>
                        </>
                      )}

                      {/* If no adjusted value, show grand total only */}
                      {(!fetchedPriceDetails.adjustedValue || 
                        fetchedPriceDetails.adjustedValue <= 0 || 
                        fetchedPriceDetails.grandTotal === fetchedPriceDetails.adjustedValue) && 
                        fetchedPriceDetails.grandTotal && fetchedPriceDetails.grandTotal > 0 && (
                        <Col xs={24} sm={12} md={6}>
                          <Statistic
                            title="Tổng giá trị đơn hàng"
                            value={(fetchedPriceDetails.grandTotal || 0).toLocaleString("vi-VN")}
                            suffix="VNĐ"
                            prefix={<DollarOutlined />}
                            valueStyle={{ color: "#1890ff", fontSize: "18px", fontWeight: "600" }}
                          />
                        </Col>
                      )}

                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="Số tiền cọc cần thanh toán"
                          value={(fetchedPriceDetails.depositAmount || depositAmount || 0).toLocaleString("vi-VN")}
                          suffix="VNĐ"
                          prefix={<CreditCardOutlined />}
                          valueStyle={{ color: "#52c41a", fontSize: "18px", fontWeight: "bold" }}
                        />
                      </Col>

                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="Số tiền còn lại"
                          value={(fetchedPriceDetails.remainingAmount || (() => {
                            const baseValue = fetchedPriceDetails.adjustedValue || fetchedPriceDetails.grandTotal || 0;
                            return baseValue - (fetchedPriceDetails.depositAmount || depositAmount || 0);
                          })()).toLocaleString("vi-VN")}
                          suffix="VNĐ"
                          prefix={<DollarOutlined />}
                          valueStyle={{ color: "#faad14", fontSize: "18px", fontWeight: "600" }}
                        />
                      </Col>
                    </Row>

                    {/* Price Breakdown - Show detailed calculation */}
                    {loadingPriceData ? (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <Skeleton active paragraph={{ rows: 8, width: ['100%', '80%', '60%', '100%', '70%', '50%', '100%', '80%'] }} />
                      </div>
                    ) : fetchedPriceDetails?.isSnapshot && fetchedPriceDetails.steps && fetchedPriceDetails.steps.length > 0 ? (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        {/* Snapshot indicator */}
                        {fetchedPriceDetails.isSnapshot && fetchedPriceDetails.snapshotDate && (
                          <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded">
                            <span className="text-xs text-green-700">
                              ✓ Thông tin thanh toán đã được lưu trữ tại thời điểm xuất hợp đồng ({new Date(fetchedPriceDetails.snapshotDate).toLocaleString('vi-VN')})
                            </span>
                          </div>
                        )}
                        
                        <div className="mb-3">
                          <span className="font-semibold text-gray-700">Chi phí vận chuyển:</span>
                        </div>
                        
                        {/* a) Base shipping cost by distance */}
                        <div className="mb-3">
                          <div className="text-sm text-gray-700 mb-2">
                            {(() => {
                              // Calculate actual distance (unique price tiers only, not multiplied by vehicles)
                              const groupedSteps: { [key: string]: any[] } = {};
                              fetchedPriceDetails?.steps?.forEach((step: any) => {
                                const key = step.sizeRuleName;
                                if (!groupedSteps[key]) {
                                  groupedSteps[key] = [];
                                }
                                groupedSteps[key].push(step);
                              });
                              
                              // Get unique price tiers for one vehicle type
                              const firstGroup = Object.values(groupedSteps)[0] || [];
                              // Find unique tiers by distanceRange + unitPrice
                              const uniqueTiers: { [key: string]: any } = {};
                              firstGroup.forEach((step: any) => {
                                const tierKey = `${step.distanceRange}_${step.unitPrice}`;
                                if (!uniqueTiers[tierKey]) {
                                  uniqueTiers[tierKey] = step;
                                }
                              });
                              const actualDistance = Object.values(uniqueTiers).reduce((sum: number, step: any) => sum + step.appliedKm, 0);
                              
                              return `a) Cước vận chuyển cơ bản theo quãng đường ${actualDistance.toFixed(2)} km:`;
                            })()}
                          </div>
                          
                          {/* Breakdown by individual vehicles */}
                          <div className="space-y-2 ml-4">
                            {(() => {
                              // Group steps by sizeRuleName
                              const groupedSteps: { [key: string]: any[] } = {};
                              fetchedPriceDetails?.steps?.forEach((step: any) => {
                                const key = step.sizeRuleName;
                                if (!groupedSteps[key]) {
                                  groupedSteps[key] = [];
                                }
                                groupedSteps[key].push(step);
                              });

                              let globalVehicleIndex = 0;
                              const vehicleElements: React.ReactNode[] = [];
                              
                              Object.entries(groupedSteps).forEach(([sizeRuleName, steps]) => {
                                // Determine number of vehicles and price tiers per vehicle
                                // Find unique (distanceRange, unitPrice) combinations
                                const uniqueTiers: { [key: string]: any } = {};
                                steps.forEach((step: any) => {
                                  const tierKey = `${step.distanceRange}_${step.unitPrice}`;
                                  if (!uniqueTiers[tierKey]) {
                                    uniqueTiers[tierKey] = step;
                                  }
                                });
                                
                                const numUniqueTiers = Object.keys(uniqueTiers).length;
                                const numVehicles = steps.length / numUniqueTiers;
                                const tiersPerVehicle = Object.values(uniqueTiers);
                                const costPerVehicle = tiersPerVehicle.reduce((sum: number, step: any) => sum + step.subtotal, 0);
                                
                                for (let i = 0; i < numVehicles; i++) {
                                  globalVehicleIndex++;
                                  const calcParts = tiersPerVehicle.map((step: any) => 
                                    `${step.unitPrice.toLocaleString("vi-VN")}/km × ${step.appliedKm.toFixed(2)} km`
                                  );
                                  
                                  vehicleElements.push(
                                    <div key={`vehicle-${globalVehicleIndex}`} className="text-sm text-gray-700">
                                      - Xe {globalVehicleIndex} ({sizeRuleName}): ({calcParts.join(" + ")}) = <strong>{costPerVehicle.toLocaleString("vi-VN")} VNĐ</strong>
                                    </div>
                                  );
                                }
                              });
                              
                              return vehicleElements;
                            })()}
                          </div>
                          
                          {/* Total base cost with formula */}
                          <div className="text-sm text-gray-700 mt-2">
                            {(() => {
                              const groupedSteps: { [key: string]: any[] } = {};
                              fetchedPriceDetails?.steps?.forEach((step: any) => {
                                const key = step.sizeRuleName;
                                if (!groupedSteps[key]) {
                                  groupedSteps[key] = [];
                                }
                                groupedSteps[key].push(step);
                              });
                              
                              const vehicleCosts: number[] = [];
                              Object.values(groupedSteps).forEach((steps: any[]) => {
                                const uniqueTiers: { [key: string]: any } = {};
                                steps.forEach((step: any) => {
                                  const tierKey = `${step.distanceRange}_${step.unitPrice}`;
                                  if (!uniqueTiers[tierKey]) {
                                    uniqueTiers[tierKey] = step;
                                  }
                                });
                                
                                const numUniqueTiers = Object.keys(uniqueTiers).length;
                                const numVehicles = steps.length / numUniqueTiers;
                                const costPerVehicle = Object.values(uniqueTiers).reduce((sum: number, step: any) => sum + step.subtotal, 0);
                                
                                for (let i = 0; i < numVehicles; i++) {
                                  vehicleCosts.push(costPerVehicle);
                                }
                              });
                              
                              const total = vehicleCosts.reduce((sum, cost) => sum + cost, 0);
                              
                              return (
                                <>
                                  Tổng cước cơ bản: {vehicleCosts.map(c => c.toLocaleString("vi-VN")).join(" + ")} = <strong>{total.toLocaleString("vi-VN")} VNĐ</strong>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* b) Category multiplier */}
                        {fetchedPriceDetails?.categoryMultiplier && fetchedPriceDetails.categoryMultiplier > 1 && (
                          <div className="mb-3">
                            <div className="text-sm text-gray-700">
                              b) Hệ số danh mục (Hàng dễ vỡ): × <strong>{fetchedPriceDetails.categoryMultiplier}</strong>
                            </div>
                          </div>
                        )}

                        {/* c) Category extra fee - applied once per order */}
                        {fetchedPriceDetails?.categoryExtraFee && fetchedPriceDetails.categoryExtraFee > 0 && (
                          <div className="mb-3">
                            <div className="text-sm text-gray-700">
                              c) Phụ thu danh mục (Hàng dễ vỡ): + <strong>{fetchedPriceDetails.categoryExtraFee.toLocaleString("vi-VN")} VNĐ</strong>
                            </div>
                          </div>
                        )}

                        {/* Total transport cost with formula - USE API VALUE */}
                        <div className="border-t-2 border-dashed border-gray-400 pt-2 mt-2">
                          <div className="text-base font-semibold text-gray-800">
                            {(() => {
                              const baseCost = fetchedPriceDetails?.steps?.reduce((sum: number, step: any) => sum + step.subtotal, 0) || 0;
                              const hasMultiplier = fetchedPriceDetails?.categoryMultiplier && fetchedPriceDetails.categoryMultiplier > 1;
                              const multiplier = hasMultiplier ? fetchedPriceDetails.categoryMultiplier : 1;
                              const extraFee = fetchedPriceDetails?.categoryExtraFee || 0;
                              
                              // Use API finalTotal (transport cost A) to ensure consistency
                              const transportTotal = fetchedPriceDetails?.finalTotal || 0;
                              
                              if (hasMultiplier && extraFee > 0) {
                                // Both multiplier and extra fee
                                return `Tổng chi phí vận chuyển (A): (${baseCost.toLocaleString("vi-VN")} × ${multiplier}) + ${extraFee.toLocaleString("vi-VN")} = ${transportTotal.toLocaleString("vi-VN")} VNĐ`;
                              } else if (hasMultiplier) {
                                // Only multiplier
                                return `Tổng chi phí vận chuyển (A): ${baseCost.toLocaleString("vi-VN")} × ${multiplier} = ${transportTotal.toLocaleString("vi-VN")} VNĐ`;
                              } else if (extraFee > 0) {
                                // Only extra fee
                                return `Tổng chi phí vận chuyển (A): ${baseCost.toLocaleString("vi-VN")} + ${extraFee.toLocaleString("vi-VN")} = ${transportTotal.toLocaleString("vi-VN")} VNĐ`;
                              } else {
                                // No adjustments
                                return `Tổng chi phí vận chuyển (A): ${transportTotal.toLocaleString("vi-VN")} VNĐ`;
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Insurance Breakdown - Use snapshot data only */}
                    {fetchedPriceDetails?.isSnapshot && fetchedPriceDetails?.hasInsurance && fetchedPriceDetails?.insuranceFee && fetchedPriceDetails.insuranceFee > 0 && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <div className="mb-3">
                          <span className="font-semibold text-gray-700">Chi phí bảo hiểm hàng hóa (B):</span>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm text-gray-700">
                            - Giá trị khai báo: <strong>{(fetchedPriceDetails.totalDeclaredValue || 0).toLocaleString("vi-VN")} VNĐ</strong>
                          </div>
                          <div className="text-sm text-gray-700">
                            - Tỷ lệ bảo hiểm (đã bao gồm VAT): <strong>{((fetchedPriceDetails.insuranceRate || 0) * (1 + (fetchedPriceDetails.vatRate || 0))).toFixed(5).replace('.', ',')}%</strong>
                          </div>
                        </div>
                        <div className="border-t-2 border-dashed border-gray-400 pt-2 mt-2">
                          <div className="text-base font-semibold text-gray-800">
                            Tổng chi phí bảo hiểm (B): {(fetchedPriceDetails.totalDeclaredValue || 0).toLocaleString("vi-VN")} × {((fetchedPriceDetails.insuranceRate || 0) * (1 + (fetchedPriceDetails.vatRate || 0))).toFixed(5).replace('.', ',')}% = <strong>{(fetchedPriceDetails.insuranceFee || 0).toLocaleString("vi-VN")} VNĐ</strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fallback insurance display for old contracts without snapshot */}
                    {!fetchedPriceDetails?.isSnapshot && hasInsurance && totalInsuranceFee && totalInsuranceFee > 0 && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <div className="mb-3">
                          <span className="font-semibold text-gray-700">Chi phí bảo hiểm hàng hóa (B):</span>
                        </div>
                        {loadingPriceData || !contractSettings ? (
                          <Skeleton active paragraph={{ rows: 3, width: ['100%', '80%', '60%'] }} />
                        ) : (
                          <div className="space-y-2">
                            <div className="text-sm text-gray-700">
                              - Giá trị khai báo: <strong>{totalDeclaredValue?.toLocaleString("vi-VN")} VNĐ</strong>
                            </div>
                            <div className="text-sm text-gray-700">
                              - Tỷ lệ bảo hiểm: <strong>{loadingPriceData || !contractSettings ? (
                                <Skeleton.Input style={{ width: 100 }} size="small" active />
                              ) : (() => {
                                // Determine insurance rate based on cargo category
                                let baseRate = 0.15; // Default fallback
                                
                                if (contractSettings) {
                                  // Use the appropriate rate based on category
                                  if (categoryName && isFragileCategory(categoryName as CategoryName)) {
                                    baseRate = contractSettings.insuranceRateFragile || 0.15;
                                  } else {
                                    baseRate = contractSettings.insuranceRateNormal || 0.08;
                                  }
                                } else if (fetchedPriceDetails?.insuranceRate) {
                                  // Fallback to priceDetails if available
                                  baseRate = fetchedPriceDetails.insuranceRate;
                                }
                                
                                // Get VAT rate from contract settings (already in decimal form, e.g., 0.1 = 10%)
                                const vatRate = contractSettings?.vatRate || 0.1;
                                // Since baseRate is already a percentage (e.g., 0.15%), we just add VAT
                                const rateWithVat = baseRate * (1 + vatRate);
                                
                                return rateWithVat.toFixed(5).replace('.', ',');
                              })()}%</strong> {loadingPriceData || !contractSettings ? '' : `(đã bao gồm ${(contractSettings?.vatRate || 0.1) * 100}% VAT)`}
                            </div>
                            <div className="text-sm text-gray-700">
                              - Phí bảo hiểm: <strong>{totalInsuranceFee?.toLocaleString("vi-VN")} VNĐ</strong>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Grand Total - Show total contract value with formula */}
                    {loadingPriceData ? (
                      <div className="mt-4 pt-4 border-t-2 border-black">
                        <Skeleton.Input style={{ width: 300 }} size="small" active />
                      </div>
                    ) : fetchedPriceDetails && ((fetchedPriceDetails?.grandTotal ?? 0) > 0 || (fetchedPriceDetails?.finalTotal ?? 0) > 0) ? (
                      <div className="mt-4 pt-4 border-t-2 border-black">
                        <div className="text-lg font-bold text-gray-900">
                          {(() => {
                            // Use API values directly to avoid data mismatch
                            const transportCost = fetchedPriceDetails?.finalTotal || 0;
                            const insuranceCost = fetchedPriceDetails?.insuranceFee || 0;
                            const grandTotal = fetchedPriceDetails?.grandTotal || 0;
                            
                            if (insuranceCost > 0) {
                              return `TỔNG GIÁ TRỊ (A + B): ${transportCost.toLocaleString("vi-VN")} + ${insuranceCost.toLocaleString("vi-VN")} = ${grandTotal.toLocaleString("vi-VN")} VNĐ`;
                            } else {
                              return `TỔNG GIÁ TRỊ: ${grandTotal.toLocaleString("vi-VN")} VNĐ`;
                            }
                          })()}
                        </div>
                      </div>
                    ) : null}
                  </div>
                }
                type="info"
                icon={<InfoCircleOutlined />}
                showIcon
                className="payment-summary-alert"
              />
            </div>
          )}

          {/* Payment Success Notification */}
          {(contract.status === "CONTRACT_SIGNED" ||
            contract.status === "DEPOSITED" ||
            contract.status === "PAID") && (
            <div className="mb-6">
              <Alert
                message={
                  <div className="flex items-center">
                    <span className="font-semibold text-lg">
                      {contract.status === "CONTRACT_SIGNED"
                        ? "✅ Hợp đồng đã được ký thành công!"
                        : contract.status === "DEPOSITED"
                        ? "✅ Thanh toán đặt cọc thành công!"
                        : "✅ Thanh toán hoàn tất thành công!"}
                    </span>
                  </div>
                }
                description={
                  <div className="mt-3">
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={8}>
                        <div className="bg-white p-4 rounded border-l-4 border-l-green-500">
                          <div className="text-sm text-gray-600 mb-1">
                            Trạng thái hiện tại
                          </div>
                          <div className="font-semibold text-green-600 text-lg">
                            {contract.status === "CONTRACT_SIGNED"
                              ? "Đã ký hợp đồng"
                              : contract.status === "DEPOSITED"
                              ? "Đã đặt cọc"
                              : "Đã thanh toán"}
                          </div>
                        </div>
                      </Col>
                      {hasDepositAmount && (
                        <Col xs={24} sm={8}>
                          <div className="bg-white p-4 rounded border-l-4 border-l-blue-500">
                            <div className="text-sm text-gray-600 mb-1">
                              {contract.status === "PAID"
                                ? "Tổng đã thanh toán"
                                : "Số tiền cọc"}
                            </div>
                            <div className="font-semibold text-blue-600 text-lg">
                              {contract.status === "PAID"
                                ? (() => {
                                    const baseValue = hasAdjustedValue
                                      ? parseContractValue(contract.adjustedValue)
                                      : parseContractValue(contract.totalValue);
                                    return (
                                      baseValue.toLocaleString("vi-VN") +
                                      " VNĐ"
                                    );
                                  })()
                                : depositAmount.toLocaleString("vi-VN") +
                                  " VNĐ"}
                            </div>
                          </div>
                        </Col>
                      )}
                      {contract.status !== "PAID" && hasDepositAmount && (
                        <Col xs={24} sm={8}>
                          <div className="bg-white p-4 rounded border-l-4 border-l-orange-500">
                            <div className="text-sm text-gray-600 mb-1">
                              Số tiền còn lại
                            </div>
                            <div className="font-semibold text-orange-600 text-lg">
                              {(() => {
                                const baseValue = hasAdjustedValue
                                  ? parseContractValue(contract.adjustedValue)
                                  : parseContractValue(contract.totalValue);
                                return (baseValue - depositAmount).toLocaleString(
                                  "vi-VN"
                                ) + " VNĐ";
                              })()}
                            </div>
                          </div>
                        </Col>
                      )}
                    </Row>

                    {/* Status specific information */}
                    {contract.status === "CONTRACT_SIGNED" && hasDepositAmount && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-800 mb-2">
                              Bước tiếp theo: Thanh toán đặt cọc
                            </h4>
                            <p className="text-gray-600 mb-2">
                              Để kích hoạt hợp đồng, bạn cần thanh toán
                              số tiền đặt cọc
                            </p>
                            <div className="text-sm text-blue-700">
                              • Số tiền:{" "}
                              <strong>
                                {depositAmount.toLocaleString("vi-VN")} VNĐ
                              </strong>
                              <br />• Thời hạn: <strong>24 giờ</strong> kể từ
                              khi ký hợp đồng
                              <br />• Phương thức: Chuyển khoản ngân hàng
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {contract.status === "DEPOSITED" && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center text-green-800 mb-2">
                          <span className="text-lg">✅</span>
                          <span className="font-semibold ml-2">
                            Thông tin thanh toán đặt cọc
                          </span>
                        </div>
                        <div className="text-sm text-green-700">
                          • Bạn đã thanh toán thành công số tiền đặt cọc
                          <br />
                          • Hợp đồng đã được kích hoạt và có hiệu lực
                          <br />
                          • Chúng tôi sẽ bắt đầu thực hiện dịch vụ theo hợp đồng
                          <br />• Số tiền còn lại sẽ được thanh toán sau khi
                          hoàn thành dịch vụ
                        </div>
                      </div>
                    )}

                    {contract.status === "PAID" && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center text-green-800 mb-2">
                          <span className="text-lg">🎊</span>
                          <span className="font-semibold ml-2">
                            Thanh toán hoàn tất
                          </span>
                        </div>
                        <div className="text-sm text-green-700">
                          • Bạn đã thanh toán đầy đủ toàn bộ giá trị hợp
                          đồng
                          <br />
                          • Tất cả dịch vụ đã được hoàn thành theo hợp đồng
                          <br />
                          • Hợp đồng đã được thực hiện thành công
                          <br />• Cảm ơn bạn đã tin tưởng và sử dụng dịch
                          vụ
                        </div>
                      </div>
                    )}
                  </div>
                }
                type="success"
                showIcon={false}
                className="border-green-200 bg-green-50"
              />
            </div>
          )}

          {/* Contract Details with Enhanced UI */}
          <div className="contract-details-section">
            {/* Contract Status and Key Dates */}
            <div className="mb-6">
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <FileTextOutlined className="text-blue-500 text-xl mr-3" />
                      <h3 className="text-lg font-semibold text-gray-800">Thông tin hợp đồng</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tên hợp đồng:</span>
                        <span className="font-medium text-gray-900">{contract.contractName || "Chưa có thông tin"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Mô tả:</span>
                        <span className="font-medium text-gray-900">{contract.description || "Chưa có thông tin"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Trạng thái:</span>
                        <ContractStatusTag
                          status={contract.status as ContractStatusEnum}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Nhân viên phụ trách:</span>
                        <span className="font-medium text-gray-900">{contract.staffName || "Chưa có thông tin"}</span>
                      </div>
                    </div>
                  </div>
                </Col>
                
                <Col xs={24} lg={12}>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <div className="bg-green-500 text-white rounded-full p-2 mr-3">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">Thời hạn hiệu lực</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3 border-l-4 border-green-500">
                        <div className="flex items-center mb-1">
                          <span className="text-xs text-green-600 font-semibold">NGÀY HIỆU LỰC</span>
                        </div>
                        <div className="text-lg font-bold text-green-700">
                          {contract.effectiveDate ? new Date(contract.effectiveDate).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          }) : "Chưa có thông tin"}
                        </div>
                        {contract.effectiveDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(contract.effectiveDate).toLocaleDateString('vi-VN', {
                              weekday: 'long'
                            })}
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 border-l-4 border-red-500">
                        <div className="flex items-center mb-1">
                          <span className="text-xs text-red-600 font-semibold">NGÀY HẾT HẠN</span>
                        </div>
                        <div className="text-lg font-bold text-red-700">
                          {contract.expirationDate ? new Date(contract.expirationDate).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          }) : "Chưa có thông tin"}
                        </div>
                        {contract.expirationDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(contract.expirationDate).toLocaleDateString('vi-VN', {
                              weekday: 'long'
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </div>

  

          {/* Action Guidance */}
          {(contract.status === "CONTRACT_DRAFT" ||
            contract.status === "PENDING") && (
            <Alert
              message="Hướng dẫn"
              description="Vui lòng xem và ký hợp đồng để tiếp tục quá trình vận chuyển."
              type="warning"
              showIcon
              className="mt-4"
            />
          )}
          {(contract.status === "CONTRACT_SIGNED" ||
            contract.status === "UNPAID") &&
            hasDepositAmount && (
              <Alert
                message="Bước tiếp theo"
                description={`Hợp đồng đã được ký thành công! Vui lòng thanh toán đặt cọc ${depositAmount.toLocaleString(
                  "vi-VN"
                )} VNĐ để chúng tôi bắt đầu xử lý đơn hàng.`}
                type="success"
                showIcon
                className="mt-4"
              />
            )}
          {contract.status === "DEPOSITED" &&
            orderStatus === "ASSIGNED_TO_DRIVER" && (
              <Alert
                message="Sẵn sàng vận chuyển"
                description="Đơn hàng đã được phân công cho tài xế. Vui lòng thanh toán số tiền còn lại để hoàn tất."
                type="info"
                showIcon
                className="mt-4"
              />
            )}

          {/* Các nút hành động cho customer */}
          <div className="mt-4 flex flex-wrap gap-3">
            
            {contract.attachFileUrl && contract.attachFileUrl !== "N/A" && (
              <Button
                type="primary"
                icon={<FileTextOutlined />}
                href={contract.attachFileUrl}
                target="_blank"
                size="large"
              >
                Xem file đính kèm
              </Button>
            )}

                {/* Nút ký hợp đồng chỉ hiện khi có file và trạng thái phù hợp */}
            {(contract.status === "CONTRACT_DRAFT" ||
              contract.status === "PENDING") && (
              <Button
                type="default"
                icon={<EditOutlined />}
                onClick={handleSignContract}
                loading={signingContract}
                size="large"
              >
                Ký hợp đồng
              </Button>
            )}

            {/* Nút thanh toán đặt cọc chỉ hiện khi hợp đồng đã ký */}
            {(contract.status === "CONTRACT_SIGNED" ||
              contract.status === "UNPAID") && (
              <Button
                type="primary"
                icon={<CreditCardOutlined />}
                onClick={handlePayDeposit}
                loading={payingDeposit}
                size="large"
                className="bg-green-500 hover:bg-green-600 border-green-500"
              >
                {depositAmount
                  ? `Thanh Toán Đặt Cọc ${depositAmount.toLocaleString(
                      "vi-VN"
                    )} VNĐ`
                  : "Thanh Toán Đặt Cọc"}
              </Button>
            )}

            {/* Nút thanh toán toàn bộ chỉ hiện khi contract status là DEPOSITED và order status là ASSIGNED_TO_DRIVER */}
            {contract.status === "DEPOSITED" &&
              orderStatus === "ASSIGNED_TO_DRIVER" && (
                <Button
                  type="primary"
                  icon={<CreditCardOutlined />}
                  onClick={handlePayFullAmount}
                  loading={payingFullAmount}
                  size="large"
                  style={{ backgroundColor: "#52c41a" }}
                >
                  Thanh Toán Toàn Bộ
                </Button>
              )}
          </div>
        </>
      ) : (
        <Empty description="Không có thông tin hợp đồng" />
      )}
    </Card>
    
    {/* Insurance Information */}
    <InsuranceInfo
      hasInsurance={hasInsurance}
      totalInsuranceFee={totalInsuranceFee}
      totalDeclaredValue={totalDeclaredValue}
    />
    </>
  );
};

export default ContractSection;
