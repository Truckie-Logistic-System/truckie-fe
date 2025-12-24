import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { message } from "antd";
import type { ContractData } from "../../../services/contract/contractTypes";
import type {
  ContractSettings,
  StipulationSettings,
} from "../../../models/Contract";
import { formatCurrency } from "../../../utils/formatters";

// Helper function to convert number to Vietnamese words
const numberToVietnameseWords = (num: number): string => {
  if (num === 0) return "không đồng";
  
  const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const teens = ["mười", "mười một", "mười hai", "mười ba", "mười bốn", "mười lăm", "mười sáu", "mười bảy", "mười tám", "mười chín"];
  
  const convertHundreds = (n: number): string => {
    if (n === 0) return "";
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const unit = n % 10;
      if (unit === 0) return units[ten] + " mươi";
      if (unit === 1) return units[ten] + " mươi mốt";
      if (unit === 5) return units[ten] + " mươi lăm";
      return units[ten] + " mươi " + units[unit];
    }
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    if (remainder === 0) return units[hundred] + " trăm";
    if (remainder < 10) return units[hundred] + " trăm lẻ " + units[remainder];
    return units[hundred] + " trăm " + convertHundreds(remainder);
  };

  const parts: string[] = [];
  const billion = Math.floor(num / 1000000000);
  const million = Math.floor((num % 1000000000) / 1000000);
  const thousand = Math.floor((num % 1000000) / 1000);
  const remainder = Math.floor(num % 1000);

  if (billion > 0) parts.push(convertHundreds(billion) + " tỷ");
  if (million > 0) parts.push(convertHundreds(million) + " triệu");
  if (thousand > 0) parts.push(convertHundreds(thousand) + " nghìn");
  if (remainder > 0) parts.push(convertHundreds(remainder));

  return parts.join(" ") + " đồng";
};

interface ContractCustomization {
  effectiveDate: string;
  expirationDate: string;
  hasAdjustedValue: boolean;
  adjustedValue: number;
  contractName?: string;
  description?: string;
}

interface ContractContent {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  representativeName: string;
  representativeTitle: string;
  serviceDescription: string;
  paymentMethod: string;
  warrantyTerms: string;
  generalTerms: string;
}

interface StaffContractPreviewProps {
  contractData: ContractData;
  customization?: ContractCustomization;
  content?: ContractContent;
  contractSettings?: ContractSettings;
  stipulationSettings?: StipulationSettings;
  onCustomizationChange?: (customization: ContractCustomization) => void;
}

const StaffContractPreview: React.FC<StaffContractPreviewProps> = ({
  contractData,
  customization,
  content,
  contractSettings,
  stipulationSettings,
  onCustomizationChange,
}) => {
  const currentDate = new Date().toISOString();
  const oneYearLater = new Date(
    Date.now() + 365 * 24 * 60 * 60 * 1000
  ).toISOString();

  // Local state for inline editing
  const [localCustomization, setLocalCustomization] =
    useState<ContractCustomization>({
      effectiveDate: customization?.effectiveDate || currentDate,
      expirationDate: customization?.expirationDate || oneYearLater,
      hasAdjustedValue: customization?.hasAdjustedValue || false,
      adjustedValue: customization?.adjustedValue || 0,
      contractName: customization?.contractName || "",
      description: customization?.description || "",
    });

  // Sync with external customization prop changes
  useEffect(() => {
    if (customization) {
      setLocalCustomization(customization);
    }
  }, [customization]);

  // Handle date changes with validation
  const handleEffectiveDateChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      const newEffectiveDate = date.toISOString();
      const expirationDateObj = new Date(localCustomization.expirationDate);

      // Validate that expiration date is after effective date
      if (expirationDateObj <= date.toDate()) {
        message.error("Ngày hết hạn phải sau ngày bắt đầu hiệu lực");
        return;
      }

      const updated = {
        ...localCustomization,
        effectiveDate: newEffectiveDate,
      };
      setLocalCustomization(updated);
      onCustomizationChange?.(updated);
    }
  };

  const handleExpirationDateChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      const effectiveDateObj = new Date(localCustomization.effectiveDate);

      // Validate that expiration date is after effective date
      if (date.toDate() <= effectiveDateObj) {
        message.error("Ngày hết hạn phải sau ngày bắt đầu hiệu lực");
        return;
      }

      const newExpirationDate = date.toISOString();
      const updated = {
        ...localCustomization,
        expirationDate: newExpirationDate,
      };
      setLocalCustomization(updated);
      onCustomizationChange?.(updated);
    }
  };

  const handleAdjustedValueChange = (value: number | null) => {
    const updated = {
      ...localCustomization,
      adjustedValue: value || 0,
      hasAdjustedValue: (value || 0) > 0,
    };
    setLocalCustomization(updated);
    onCustomizationChange?.(updated);
  };

  const handleHasAdjustedValueChange = (checked: boolean) => {
    const updated = {
      ...localCustomization,
      hasAdjustedValue: checked,
      adjustedValue: checked ? localCustomization.adjustedValue : 0,
    };
    setLocalCustomization(updated);
    onCustomizationChange?.(updated);
  };

  return (
    <div className="contract-preview bg-white p-8 max-w-4xl mx-auto">
      <style>{`
        .contract-preview {
          font-family: 'Times New Roman', serif !important;
          line-height: 1.6;
          color: #000;
        }
        .contract-preview .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .contract-preview .title {
          font-size: 18px;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .contract-preview .subtitle {
          font-size: 14px;
          margin-bottom: 5px;
        }
        .contract-preview .contract-info {
          margin-bottom: 30px;
        }
        .contract-preview .party-info {
          margin-bottom: 20px;
        }
        .contract-preview .party-title {
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .contract-preview .terms-section {
          margin-bottom: 20px;
        }
        .contract-preview .terms-title {
          font-weight: bold;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        .contract-preview .signature-section {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
        }
        .contract-preview .signature-box {
          text-align: center;
          width: 200px;
        }
        .contract-preview .table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .contract-preview .table th,
        .contract-preview .table td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
          font-size: 12px;
        }
        .contract-preview .table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        .contract-preview .highlight {
          background-color: #fff2cc;
          font-weight: bold;
        }
      `}</style>

      {/* Header */}
      <div className="header">
        <div className="title">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
        <div className="subtitle">Độc lập - Tự do - Hạnh phúc</div>
        <div
          style={{
            borderBottom: "2px solid #000",
            width: "200px",
            margin: "20px auto",
          }}
        ></div>
        <div className="title" style={{ marginTop: "30px" }}>
          HỢP ĐỒNG DỊCH VỤ LOGISTICS
        </div>
        <div className="subtitle">Số: {contractData.orderInfo.orderCode}</div>
        <div className="subtitle">Mã hợp đồng: {contractData.contractId}</div>
      </div>

      {/* Contract Basic Info */}
      <div className="contract-info">
        <p>
          <strong>Căn cứ:</strong> Bộ luật Dân sự năm 2015;
        </p>
        <p>
          <strong>Căn cứ:</strong> Luật Thương mại năm 2005;
        </p>
        <p>
          <strong>Căn cứ:</strong> Các văn bản pháp luật khác có liên quan;
        </p>
        <p>
          <strong>Căn cứ:</strong> Nhu cầu và khả năng của các bên;
        </p>
      </div>

      {/* Parties Information */}
      <div className="party-info">
        <div className="party-title">
          BÊN A: CÔNG TY DỊCH VỤ LOGISTICS (Bên cung cấp dịch vụ)
        </div>
        <p>
          <strong>Tên công ty:</strong>{" "}
          {contractData.carrierInfo?.carrierName || content?.companyName || "TRUCKIE LOGISTICS"}
        </p>
        <p>
          <strong>Địa chỉ:</strong>{" "}
          {contractData.carrierInfo?.carrierAddressLine || content?.companyAddress || "Số 123, Đường ABC, Quận XYZ, TP. Hồ Chí Minh"}
        </p>
        <p>
          <strong>Điện thoại:</strong>{" "}
          {contractData.carrierInfo?.carrierPhone || content?.companyPhone || "0123 456 789"}
        </p>
        <p>
          <strong>Email:</strong>{" "}
          {contractData.carrierInfo?.carrierEmail || content?.companyEmail || "contact@truckie.vn"}
        </p>
        <p>
          <strong>Mã số thuế:</strong>{" "}
          {contractData.carrierInfo?.carrierTaxCode || "N/A"}
        </p>
        <p>
          <strong>Người đại diện:</strong>{" "}
          {contractData.carrierInfo?.representativeName || content?.representativeName || "[Tên người đại diện]"}
        </p>
        <p>
          <strong>Chức vụ:</strong> {content?.representativeTitle || "Giám đốc"}
        </p>
      </div>

      <div className="party-info">
        <div className="party-title">
          BÊN B: KHÁCH HÀNG (Bên sử dụng dịch vụ)
        </div>
        <p>
          <strong>Tên công ty:</strong> {contractData.customerInfo.companyName}
        </p>
        <p>
          <strong>Người đại diện:</strong>{" "}
          {contractData.customerInfo.representativeName}
        </p>
        <p>
          <strong>Địa chỉ:</strong> {contractData.customerInfo.businessAddress}
        </p>
        <p>
          <strong>Điện thoại:</strong>{" "}
          {contractData.customerInfo.representativePhone}
        </p>
        <p>
          <strong>Email:</strong>{" "}
          {contractData.customerInfo.userResponse?.email || "N/A"}
        </p>
        <p>
          <strong>Số giấy phép kinh doanh:</strong>{" "}
          {contractData.customerInfo.businessLicenseNumber}
        </p>
      </div>

      {/* Contract Terms */}
      <div className="terms-section">
        <div className="terms-title">ĐIỀU 1: ĐĂNG KÝ DỊCH VỤ</div>
        <p>
          1.1. Bên A đồng ý cung cấp dịch vụ logistics cho Bên B theo các điều
          khoản được quy định trong hợp đồng này.
        </p>
        <p>
          1.2.{" "}
          {content?.serviceDescription ||
            "Dịch vụ bao gồm: Vận chuyển hàng hóa từ điểm lấy hàng đến điểm giao hàng theo yêu cầu của Bên B."}
        </p>
      </div>

      <div className="terms-section">
        <div className="terms-title">ĐIỀU 2: CHI TIẾT ĐƠN HÀNG</div>
        <table className="table">
          <thead>
            <tr>
              <th>Mã đơn hàng</th>
              <th>Ngày tạo</th>
              <th>Người nhận</th>
              <th>Số điện thoại</th>
              <th>Tổng số lượng kiện hàng</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{contractData.orderInfo.orderCode}</td>
              <td>
                {new Date(contractData.orderInfo.createdAt).toLocaleDateString(
                  "vi-VN"
                )}
              </td>
              <td>{contractData.orderInfo.receiverName}</td>
              <td>{contractData.orderInfo.receiverPhone}</td>
              <td>{contractData.orderInfo.totalQuantity}</td>
            </tr>
          </tbody>
        </table>

        <p>
          <strong>Địa chỉ lấy hàng:</strong>
        </p>
        <p>
          {contractData.orderInfo.pickupAddress.street},{" "}
          {contractData.orderInfo.pickupAddress.ward},{" "}
          {contractData.orderInfo.pickupAddress.province}
        </p>

        <p>
          <strong>Địa chỉ giao hàng:</strong>
        </p>
        <p>
          {contractData.orderInfo.deliveryAddress.street},{" "}
          {contractData.orderInfo.deliveryAddress.ward},{" "}
          {contractData.orderInfo.deliveryAddress.province}
        </p>

        <p>
          <strong>Khoảng cách vận chuyển:</strong>{" "}
          {contractData.distanceKm.toFixed(2)} km
        </p>

        <p>
          <strong>Danh mục hàng hóa:</strong>{" "}
          {contractData.orderInfo.category.description}
        </p>

        {contractData.orderInfo.orderDetails &&
          contractData.orderInfo.orderDetails.length > 0 && (
            <>
              <p>
                <strong>Chi tiết hàng hóa:</strong>
              </p>
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã tracking</th>
                    <th>Mô tả</th>
                    <th>Trọng lượng</th>
                    <th>Đơn vị</th>
                    <th>Kích thước (Dài x Cao x Rộng)</th>
                    <th>Thời gian dự kiến</th>
                  </tr>
                </thead>
                <tbody>
                  {contractData.orderInfo.orderDetails.map((detail, index) => (
                    <tr key={index}>
                      <td>{detail.trackingCode}</td>
                      <td>{detail.description}</td>
                      <td>{detail.weightBaseUnit}</td>
                      <td>{detail.unit}</td>
                      <td>
                        {detail.orderSizeId.minLength} x{" "}
                        {detail.orderSizeId.minHeight} x{" "}
                        {detail.orderSizeId.minWidth} -{" "}
                        {detail.orderSizeId.maxLength} x{" "}
                        {detail.orderSizeId.maxHeight} x{" "}
                        {detail.orderSizeId.maxWidth} (m)
                      </td>
                      <td>
                        {detail.estimatedStartTime
                          ? new Date(
                              detail.estimatedStartTime
                            ).toLocaleDateString("vi-VN")
                          : "Chưa xác định"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

        {contractData.orderInfo.notes && (
          <p>
            <strong>Ghi chú:</strong> {contractData.orderInfo.notes}
          </p>
        )}
      </div>

      <div className="terms-section">
        <div className="terms-title">ĐIỀU 3: CHI TIẾT GIÁ CẢ VÀ THANH TOÁN</div>

        <table className="table">
          <thead>
            <tr>
              <th>Loại xe</th>
              <th>Số lượng xe</th>
              <th>Phạm vi km</th>
              <th>Đơn giá (VNĐ)</th>
              <th>Km áp dụng</th>
              <th>Thành tiền (VNĐ)</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              // Group steps by sizeRuleName
              const groupedSteps: { [key: string]: typeof contractData.priceDetails.steps } = {};
              contractData.priceDetails.steps.forEach((step) => {
                const key = step.sizeRuleName;
                if (!groupedSteps[key]) {
                  groupedSteps[key] = [];
                }
                groupedSteps[key].push(step);
              });

              const rows: React.ReactNode[] = [];
              Object.entries(groupedSteps).forEach(([sizeRuleName, steps]) => {
                // Find unique price tiers (by distanceRange + unitPrice)
                const uniqueTiers: { [key: string]: typeof contractData.priceDetails.steps[0] } = {};
                steps.forEach((step) => {
                  const tierKey = `${step.distanceRange}_${step.unitPrice}`;
                  if (!uniqueTiers[tierKey]) {
                    uniqueTiers[tierKey] = step;
                  }
                });
                
                const tiersArray = Object.values(uniqueTiers);
                const numUniqueTiers = tiersArray.length;
                const numVehicles = steps.length / numUniqueTiers;
                
                tiersArray.forEach((tier, tierIndex) => {
                  rows.push(
                    <tr key={`${sizeRuleName}-${tierIndex}`}>
                      {/* Only render vehicle type and count on first row of each group */}
                      {tierIndex === 0 && (
                        <>
                          <td rowSpan={numUniqueTiers} style={{ verticalAlign: 'middle' }}>
                            {sizeRuleName}
                          </td>
                          <td rowSpan={numUniqueTiers} style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                            {numVehicles}
                          </td>
                        </>
                      )}
                      <td>{tier.distanceRange}</td>
                      <td>{formatCurrency(tier.unitPrice)}</td>
                      <td>{tier.appliedKm.toFixed(2)}</td>
                      <td>{formatCurrency(tier.subtotal)}</td>
                    </tr>
                  );
                });
              });
              return rows;
            })()}
          </tbody>
        </table>

        {/* Price Breakdown Section - Professional Text-based Contract Style */}
        <div style={{ marginTop: "20px", lineHeight: "1.8" }}>
          <p style={{ marginBottom: "12px" }}>
            <strong>3.1. Chi phí vận chuyển:</strong>
          </p>
          
          {/* Base transport calculation - show each vehicle separately */}
          <p style={{ marginLeft: "20px", marginBottom: "8px" }}>
            a) Cước vận chuyển cơ bản theo quãng đường {(() => {
              // Calculate actual distance (unique price tiers only, not multiplied by vehicles)
              const groupedSteps: { [key: string]: typeof contractData.priceDetails.steps } = {};
              contractData.priceDetails.steps.forEach((step) => {
                const key = step.sizeRuleName;
                if (!groupedSteps[key]) {
                  groupedSteps[key] = [];
                }
                groupedSteps[key].push(step);
              });
              
              const firstGroup = Object.values(groupedSteps)[0] || [];
              const uniqueTiers: { [key: string]: typeof contractData.priceDetails.steps[0] } = {};
              firstGroup.forEach((step) => {
                const tierKey = `${step.distanceRange}_${step.unitPrice}`;
                if (!uniqueTiers[tierKey]) {
                  uniqueTiers[tierKey] = step;
                }
              });
              
              const actualDistance = Object.values(uniqueTiers).reduce((sum, step) => sum + step.appliedKm, 0);
              return actualDistance.toFixed(2);
            })()} km:
          </p>
          {(() => {
            // Group steps by sizeRuleName
            const groupedSteps: {
              [key: string]: { steps: typeof contractData.priceDetails.steps; };
            } = {};

            contractData.priceDetails.steps.forEach((step) => {
              const key = step.sizeRuleName;
              if (!groupedSteps[key]) {
                groupedSteps[key] = { steps: [] };
              }
              groupedSteps[key].steps.push(step);
            });

            let globalVehicleIndex = 0;
            const vehicleElements: React.ReactNode[] = [];
            
            Object.entries(groupedSteps).forEach(([sizeRuleName, data]) => {
              // Find unique (distanceRange, unitPrice) combinations
              const uniqueTiers: { [key: string]: typeof contractData.priceDetails.steps[0] } = {};
              data.steps.forEach((step) => {
                const tierKey = `${step.distanceRange}_${step.unitPrice}`;
                if (!uniqueTiers[tierKey]) {
                  uniqueTiers[tierKey] = step;
                }
              });
              
              const numUniqueTiers = Object.keys(uniqueTiers).length;
              const numVehicles = data.steps.length / numUniqueTiers;
              const tiersPerVehicle = Object.values(uniqueTiers);
              const costPerVehicle = tiersPerVehicle.reduce((sum, step) => sum + step.subtotal, 0);
              
              for (let i = 0; i < numVehicles; i++) {
                globalVehicleIndex++;
                vehicleElements.push(
                  <p
                    key={`vehicle-${globalVehicleIndex}`}
                    style={{ marginLeft: "40px", marginBottom: "4px" }}
                  >
                    - Xe {globalVehicleIndex} ({sizeRuleName}):{" "}
                    {tiersPerVehicle.map((step, idx) => (
                      <span key={`tier-${idx}`}>
                        {idx > 0 && " + "}
                        ({formatCurrency(step.unitPrice)}/km × {step.appliedKm.toFixed(2)} km)
                      </span>
                    ))}
                    {" = "}
                    <strong>{formatCurrency(costPerVehicle)}</strong>
                  </p>
                );
              }
            });
            
            return vehicleElements;
          })()}

          {(() => {
            // Calculate per-vehicle costs for the total formula
            const groupedSteps: { [key: string]: typeof contractData.priceDetails.steps } = {};
            contractData.priceDetails.steps.forEach((step) => {
              const key = step.sizeRuleName;
              if (!groupedSteps[key]) {
                groupedSteps[key] = [];
              }
              groupedSteps[key].push(step);
            });

            const vehicleCosts: number[] = [];
            Object.values(groupedSteps).forEach((steps) => {
              const uniqueTiers: { [key: string]: typeof contractData.priceDetails.steps[0] } = {};
              steps.forEach((step) => {
                const tierKey = `${step.distanceRange}_${step.unitPrice}`;
                if (!uniqueTiers[tierKey]) {
                  uniqueTiers[tierKey] = step;
                }
              });
              
              const numUniqueTiers = Object.keys(uniqueTiers).length;
              const numVehicles = steps.length / numUniqueTiers;
              const costPerVehicle = Object.values(uniqueTiers).reduce((sum, step) => sum + step.subtotal, 0);
              
              for (let i = 0; i < numVehicles; i++) {
                vehicleCosts.push(costPerVehicle);
              }
            });
            
            const basicTotal = vehicleCosts.reduce((sum, val) => sum + val, 0);

            return (
              <p style={{ marginLeft: "40px", marginBottom: "8px" }}>
                Tổng cước cơ bản: {vehicleCosts.map((val, idx) => (
                  <span key={idx}>
                    {idx > 0 && " + "}
                    {formatCurrency(val)}
                  </span>
                ))}
                {" = "}
                <strong>{formatCurrency(basicTotal)}</strong>
              </p>
            );
          })()}

          {/* Category multiplier */}
          <p style={{ marginLeft: "20px", marginBottom: "8px" }}>
            b) Hệ số danh mục hàng hóa ({contractData.orderInfo.category.description}): × {contractData.priceDetails.categoryMultiplier}
          </p>

          {/* Category extra fee - applied once per order */}
          {contractData.priceDetails.categoryExtraFee > 0 && (
            <p style={{ marginLeft: "20px", marginBottom: "8px" }}>
              c) Phụ thu danh mục ({contractData.orderInfo.category.description}): + <strong>{formatCurrency(contractData.priceDetails.categoryExtraFee)}</strong>
            </p>
          )}

          {/* Note: No promotionDiscount - adjustedValue replaces grandTotal if set */}

          {/* Transport subtotal - USE API VALUES */}
          {(() => {
            // Display formula components from API data
            const baseTotal = contractData.priceDetails.steps.reduce((sum, step) => sum + step.subtotal, 0);
            // Use API finalTotal (transport cost A) to ensure consistency
            const transportTotal = contractData.priceDetails.finalTotal || 0;
            
            return (
              <p style={{ marginLeft: "20px", marginBottom: "16px", paddingTop: "8px", borderTop: "1px dashed #000" }}>
                <strong>Tổng chi phí vận chuyển (A):</strong> {formatCurrency(baseTotal)} × {contractData.priceDetails.categoryMultiplier}
                {contractData.priceDetails.categoryExtraFee > 0 && ` + ${formatCurrency(contractData.priceDetails.categoryExtraFee)}`}
                {" = "}<strong style={{ fontSize: "13px" }}>{formatCurrency(transportTotal)}</strong>
              </p>
            );
          })()}

          {/* Insurance Section */}
          {contractData.priceDetails.hasInsurance && (
            <>
              <p style={{ marginBottom: "12px" }}>
                <strong>3.2. Chi phí bảo hiểm hàng hóa:</strong>
              </p>
              <p style={{ marginLeft: "20px", marginBottom: "8px" }}>
                - Giá trị hàng hóa khai báo: <strong>{formatCurrency(contractData.priceDetails.totalDeclaredValue || 0)}</strong>
              </p>
              <p style={{ marginLeft: "20px", marginBottom: "8px" }}>
                - Tỷ lệ phí bảo hiểm ({contractData.orderInfo.category.description}): {(contractData.priceDetails.insuranceRate || 0).toFixed(2)}%
              </p>
              <p style={{ marginLeft: "20px", marginBottom: "8px" }}>
                - Thuế GTGT: {((contractData.priceDetails.vatRate || 0.1) * 100).toFixed(0)}%
              </p>
              <p style={{ marginLeft: "20px", marginBottom: "16px", paddingTop: "8px", borderTop: "1px dashed #000" }}>
                <strong>Tổng chi phí bảo hiểm (B):</strong> {formatCurrency(contractData.priceDetails.totalDeclaredValue || 0)} × {(contractData.priceDetails.insuranceRate || 0).toFixed(2)}% × (1 + {((contractData.priceDetails.vatRate || 0.1) * 100).toFixed(0)}%) = <strong style={{ fontSize: "13px" }}>{formatCurrency(contractData.priceDetails.insuranceFee || 0)}</strong>
              </p>
            </>
          )}

          {/* No insurance notice */}
          {!contractData.priceDetails.hasInsurance && (
            <p style={{ marginBottom: "16px" }}>
              <strong>3.2. Chi phí bảo hiểm hàng hóa (B):</strong> Khách hàng không đăng ký bảo hiểm = <strong>0 đ</strong>
            </p>
          )}

          {/* Grand Total - USE API VALUES */}
          {(() => {
            // Display formula components from API data
            const baseTotal = contractData.priceDetails.steps.reduce((sum, step) => sum + step.subtotal, 0);
            // Use API values to ensure consistency
            const transportTotal = contractData.priceDetails.finalTotal || 0;
            const insuranceTotal = contractData.priceDetails.hasInsurance ? (contractData.priceDetails.insuranceFee || 0) : 0;
            // Use API grandTotal
            const grandTotal = contractData.priceDetails.grandTotal || 0;
            
            return (
              <p style={{ 
                marginTop: "16px", 
                paddingTop: "12px", 
                borderTop: "2px solid #000",
                fontSize: "14px"
              }}>
                <strong>3.3. TỔNG GIÁ TRỊ HỢP ĐỒNG (A + B):</strong>{" "}
                {formatCurrency(transportTotal)} + {formatCurrency(insuranceTotal)} = {" "}
                <strong style={{ fontSize: "16px", textDecoration: "underline" }}>
                  {formatCurrency(grandTotal)}
                </strong>
                <span style={{ marginLeft: "8px" }}>
                  (Bằng chữ: {numberToVietnameseWords(grandTotal)})
                </span>
              </p>
            );
          })()}
        </div>

        <div style={{ marginTop: "20px" }}>
          <p>
            <strong>Điều kiện thanh toán:</strong>
          </p>
          {(() => {
            const grandTotal = contractData.priceDetails.grandTotal || contractData.priceDetails.finalTotal;
            // Use custom deposit percent if available, otherwise use global setting
            const effectiveDepositPercent = (contractData.customDepositPercent && contractData.customDepositPercent > 0 && contractData.customDepositPercent <= 100)
              ? contractData.customDepositPercent
              : contractData.contractSettings.depositPercent;
            const depositAmount = (grandTotal * effectiveDepositPercent) / 100;
            const remainingAmount = grandTotal - depositAmount;
            const depositDeadlineHours = contractData.contractSettings.depositDeadlineHours || 24;
            const signingDeadlineHours = contractData.contractSettings.signingDeadlineHours || 24;
            
            // Get estimated pickup date from first order detail
            const firstOrderDetail = contractData.orderInfo.orderDetails?.[0];
            const estimatedPickupDate = firstOrderDetail?.estimatedStartTime 
              ? new Date(firstOrderDetail.estimatedStartTime) 
              : null;
            
            // Calculate payment deadline (1 day before pickup)
            const paymentDeadlineDate = estimatedPickupDate 
              ? new Date(estimatedPickupDate.getTime() - 24 * 60 * 60 * 1000)
              : null;
            
            return (
              <>
                <p>
                  - Thời hạn ký hợp đồng: {signingDeadlineHours} giờ kể từ khi nhận được hợp đồng
                </p>
                <p>
                  - Đặt cọc: {effectiveDepositPercent}% ({formatCurrency(depositAmount)}) - Thanh toán trong vòng {depositDeadlineHours} giờ kể từ khi ký hợp đồng
                </p>
                <p>
                  - Thanh toán còn lại: {formatCurrency(remainingAmount)} - Thanh toán trước ngày lấy hàng dự kiến 1 ngày
                  {paymentDeadlineDate && (
                    <span style={{ marginLeft: "8px", color: "#666" }}>
                      (trước ngày {paymentDeadlineDate.toLocaleDateString('vi-VN', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                      })})
                    </span>
                  )}
                </p>
              </>
            );
          })()}
          <p>
            - Phương thức thanh toán: {content?.paymentMethod || "Chuyển khoản"}
          </p>
          <p>
            - Quy định bảo hiểm: Hàng thông thường {(contractData.contractSettings.insuranceRateNormal || 0.08).toFixed(2)}%, 
            hàng dễ vỡ {(contractData.contractSettings.insuranceRateFragile || 0.15).toFixed(2)}% giá trị khai báo 
            (đã bao gồm 10% VAT)
          </p>
          {localCustomization.hasAdjustedValue &&
            localCustomization.adjustedValue > 0 && (
              <p style={{ fontWeight: "bold" }}>
                - Giá trị điều chỉnh:{" "}
                {formatCurrency(localCustomization.adjustedValue)} (đã bao gồm
                trong tổng giá trị hợp đồng)
              </p>
            )}
        </div>
      </div>

      <div className="terms-section">
        <div className="terms-title">ĐIỀU 4: PHÂN CÔNG XE</div>

        {/* Optimal Assignment */}
        {contractData.assignResult &&
          contractData.assignResult.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <p
                style={{
                  fontWeight: "600",
                  marginBottom: "10px",
                  color: "#1890ff",
                }}
              >
                4.1. Phương án tối ưu (Đề xuất):
              </p>
              <p
                style={{
                  marginLeft: "20px",
                  marginBottom: "10px",
                  fontStyle: "italic",
                }}
              >
                Phương án này tối ưu chi phí và hiệu suất vận chuyển cho khách
                hàng.
              </p>
              <table className="table">
                <thead>
                  <tr>
                    <th>Loại xe</th>
                    <th>Tải trọng hiện tại</th>
                    <th>Số chi tiết được giao</th>
                  </tr>
                </thead>
                <tbody>
                  {contractData.assignResult.map((assign, index) => (
                    <tr key={index}>
                      <td>{assign.sizeRuleName}</td>
                      <td>
                        {assign.currentLoad} {assign.currentLoadUnit}
                      </td>
                      <td>{assign.assignedDetails.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        {/* Realistic Assignment */}
        {contractData.assignResult &&
          contractData.assignResult.length > 0 && (
            <div>
              <p
                style={{
                  fontWeight: "600",
                  marginBottom: "10px",
                  color: "#52c41a",
                }}
              >
                4.2. Phương án thực tế (Bắt buộc):
              </p>
              <p
                style={{
                  marginLeft: "20px",
                  marginBottom: "10px",
                  fontStyle: "italic",
                }}
              >
                Phương án này dựa trên tình trạng sẵn có của xe và lịch trình
                thực tế. Đây là phương án khách hàng cần đặt để đảm bảo giao
                hàng đúng thời gian.
              </p>
              <table className="table">
                <thead>
                  <tr>
                    <th>Loại xe</th>
                    <th>Tải trọng hiện tại</th>
                    <th>Số chi tiết được giao</th>
                  </tr>
                </thead>
                <tbody>
                  {contractData.assignResult.map((assign, index) => (
                    <tr key={index}>
                      <td>{assign.sizeRuleName}</td>
                      <td>
                        {assign.currentLoad} {assign.currentLoadUnit}
                      </td>
                      <td>{assign.assignedDetails.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        {/* End of assignment sections */}
      </div>

      <div className="terms-section">
        <div className="terms-title">ĐIỀU 5: QUYỀN VÀ NGHĨA VỤ CỦA CÁC BÊN</div>
        <p>
          <strong>5.1. Quyền và nghĩa vụ của Bên A:</strong>
        </p>
        <p>
          - Cung cấp dịch vụ vận chuyển đúng chất lượng, thời gian đã thỏa thuận
        </p>
        <p>- Bảo đảm an toàn hàng hóa trong quá trình vận chuyển</p>
        <p>- Thông báo kịp thời cho Bên B về tình trạng hàng hóa</p>
        <p>
          -{" "}
          {content?.warrantyTerms ||
            "Cung cấp bảo hiểm hàng hóa theo tỷ lệ quy định"}
        </p>

        <p>
          <strong>5.2. Quyền và nghĩa vụ của Bên B:</strong>
        </p>
        <p>- Cung cấp đầy đủ, chính xác thông tin về hàng hóa</p>
        <p>- Thanh toán đầy đủ chi phí dịch vụ theo thỏa thuận</p>
        <p>- Phối hợp với Bên A trong quá trình thực hiện dịch vụ</p>
        <p>- Đặt cọc đúng hạn theo quy định</p>
      </div>

      <div className="terms-section">
        <div className="terms-title">ĐIỀU 6: ĐIỀU KHOẢN CHUNG</div>
        <p>
          6.1. Hợp đồng này được lập thành 02 (hai) bản có giá trị pháp lý như
          nhau, mỗi bên giữ 01 bản.
        </p>
        <p>
          6.2. Mọi thay đổi, bổ sung hợp đồng phải được hai bên thỏa thuận bằng
          văn bản.
        </p>
        <p>
          6.3. Trong quá trình thực hiện hợp đồng, nếu có tranh chấp, các bên sẽ
          giải quyết bằng thương lượng. Nếu không thỏa thuận được, tranh chấp sẽ
          được giải quyết tại Tòa án có thẩm quyền.
        </p>
        <p>
          6.4.{" "}
          {content?.generalTerms ||
            "Hợp đồng có hiệu lực kể từ ngày ký và thanh toán đặt cọc."}
        </p>
        <p>
          <strong>Thời gian hiệu lực:</strong> Từ ngày{" "}
          {dayjs(localCustomization.effectiveDate).format("DD/MM/YYYY")} đến
          ngày {dayjs(localCustomization.expirationDate).format("DD/MM/YYYY")}
        </p>
      </div>

      {/* Custom Stipulation Terms from Settings */}
      {stipulationSettings &&
        stipulationSettings.contents &&
        Object.keys(stipulationSettings.contents).length > 0 && (
          <div className="terms-section">
            <div className="terms-title">ĐIỀU 7: CÁC ĐIỀU KHOẢN BỔ SUNG</div>
            {Object.entries(stipulationSettings.contents).map(
              ([key, value], index) => (
                <div key={key} style={{ marginBottom: "12px" }}>
                  <div
                    style={{ textAlign: "justify", lineHeight: "1.6" }}
                    dangerouslySetInnerHTML={{ __html: value }}
                  />
                </div>
              )
            )}
          </div>
        )}

      {/* Signature Section */}
      <div className="signature-section">
        <div className="signature-box">
          <p>
            <strong>BÊN A</strong>
          </p>
          <p>
            <strong>{content?.companyName || "TRUCKIE LOGISTICS"}</strong>
          </p>
          <p style={{ marginTop: "60px" }}>________________</p>
          <p>{content?.representativeName || "[Tên người đại diện]"}</p>
          <p>
            <em>{content?.representativeTitle || "Giám đốc"}</em>
          </p>
        </div>
        <div className="signature-box">
          <p>
            <strong>BÊN B</strong>
          </p>
          <p>
            <strong>{contractData.customerInfo.companyName}</strong>
          </p>
          <p style={{ marginTop: "60px" }}>________________</p>
          <p>{contractData.customerInfo.representativeName}</p>
          <p>
            <em>Người đại diện hợp pháp</em>
          </p>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "30px" }}>
        <p>
          <em>
            Hợp đồng được lập tại TP. Hồ Chí Minh, ngày{" "}
            {new Date().toLocaleDateString("vi-VN")}
          </em>
        </p>
      </div>
    </div>
  );
};

export default StaffContractPreview;
