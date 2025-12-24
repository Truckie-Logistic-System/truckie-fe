import React from "react";
import type { ContractData } from "../../../services/contract/contractTypes";
import type {
  ContractSettings,
  StipulationSettings,
} from "../../../models/Contract";
import { formatCurrency, formatDate } from "../../../utils/formatters";

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

interface ContractCustomization {
  effectiveDate: string;
  expirationDate: string;
  hasAdjustedValue: boolean;
  adjustedValue: number;
  contractName?: string;
  description?: string;
}

interface ContractExportContentProps {
  contractData: ContractData;
  customization: ContractCustomization;
  content?: ContractContent;
  contractSettings?: ContractSettings;
  stipulationSettings?: StipulationSettings;
}

const ContractExportContent: React.FC<ContractExportContentProps> = ({
  contractData,
  customization,
  content,
  contractSettings,
  stipulationSettings,
}) => {
  // Use content customization if provided, otherwise use carrierInfo from response, then defaults
  const companyName = contractData.carrierInfo?.carrierName || content?.companyName || "TRUCKIE LOGISTICS";
  const companyAddress =
    contractData.carrierInfo?.carrierAddressLine || content?.companyAddress || "Số 123, Đường ABC, Quận XYZ, TP. Hồ Chí Minh";
  const companyPhone = contractData.carrierInfo?.carrierPhone || content?.companyPhone || "0123 456 789";
  const companyEmail = contractData.carrierInfo?.carrierEmail || content?.companyEmail || "contact@truckie.vn";
  const carrierTaxCode = contractData.carrierInfo?.carrierTaxCode || "N/A";
  const representativeName =
    contractData.carrierInfo?.representativeName || content?.representativeName || "[Tên người đại diện]";
  const representativeTitle = content?.representativeTitle || "Giám đốc";
  const serviceDescription =
    content?.serviceDescription ||
    "Dịch vụ bao gồm: Vận chuyển hàng hóa từ điểm lấy hàng đến điểm giao hàng theo yêu cầu của Bên B.";
  const paymentMethod = content?.paymentMethod || "Chuyển khoản";
  const warrantyTerms =
    content?.warrantyTerms || "Cung cấp bảo hiểm hàng hóa theo tỷ lệ quy định";
  const generalTerms =
    content?.generalTerms ||
    "Hợp đồng có hiệu lực kể từ ngày ký và thanh toán đặt cọc.";

  // Format dates for display
  const effectiveDate = new Date(
    customization.effectiveDate
  ).toLocaleDateString("vi-VN");
  const expirationDate = new Date(
    customization.expirationDate
  ).toLocaleDateString("vi-VN");
  const adjustedValue = customization.hasAdjustedValue
    ? customization.adjustedValue
    : 0;

  return (
    <div
      className="contract-export-content"
      style={{ padding: "20px", fontFamily: "Times New Roman, serif" }}
    >
      <style>{`
        /* Page break control for html2pdf.js */
        .contract-export-content {
          font-family: 'Times New Roman', serif !important;
          line-height: 1.5;
          color: #000;
          background: white;
          font-size: 12pt;
        }
        .contract-export-content .avoid-break,
        .contract-export-content .info-box,
        .contract-export-content .section {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .contract-export-content p {
          orphans: 3;
          widows: 3;
        }
        .contract-export-content .header {
          text-align: center;
          margin-bottom: 40pt;
        }
        .contract-export-content .title {
          font-size: 16pt;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 12pt;
          letter-spacing: 1pt;
        }
        .contract-export-content .subtitle {
          font-size: 12pt;
          margin-bottom: 6pt;
        }
        .contract-export-content .contract-info {
          margin-bottom: 30pt;
        }
        .contract-export-content .party-info {
          margin-bottom: 24pt;
          page-break-inside: avoid;
        }
        .contract-export-content .party-title {
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 12pt;
          font-size: 13pt;
        }
        .contract-export-content .terms-section {
          margin-bottom: 24pt;
          page-break-inside: avoid;
        }
        .contract-export-content .terms-title {
          font-weight: bold;
          margin-bottom: 12pt;
          text-transform: uppercase;
          font-size: 13pt;
        }
        .contract-export-content .signature-section {
          margin-top: 60pt;
          display: flex;
          justify-content: space-between;
          page-break-inside: avoid;
        }
        .contract-export-content .signature-box {
          text-align: center;
          width: 200pt;
        }
        .contract-export-content .table {
          width: 100%;
          border-collapse: collapse;
          margin: 20pt 0;
          page-break-inside: avoid;
        }
        .contract-export-content .table th,
        .contract-export-content .table td {
          border: 1pt solid #000;
          padding: 8pt;
          text-align: left;
          font-size: 11pt;
        }
        .contract-export-content .table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        .contract-export-content .table tr {
          page-break-inside: avoid;
        }
        .contract-export-content .price-summary {
          margin: 20pt 0;
          page-break-inside: avoid;
        }
        .contract-export-content .price-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8pt;
          padding: 4pt 0;
        }
        .contract-export-content .price-divider {
          border-top: 1pt solid #000;
          margin: 12pt 0;
        }
        .contract-export-content .total-section {
          border-top: 2pt solid #000;
          border-bottom: 2pt solid #000;
          padding: 12pt 0;
          margin: 16pt 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          page-break-inside: avoid;
        }
        .contract-export-content .adjusted-value {
          margin-top: 12pt;
          font-weight: bold;
        }
        @media print {
          .contract-export-content {
            size: A4;
            margin: 0;
          }
          .contract-export-content .table {
            page-break-inside: avoid;
          }
          .contract-export-content .terms-section {
            page-break-inside: avoid;
          }
          .contract-export-content .signature-section {
            page-break-inside: avoid;
          }
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
          <strong>Tên công ty:</strong> {companyName}
        </p>
        <p>
          <strong>Địa chỉ:</strong> {companyAddress}
        </p>
        <p>
          <strong>Điện thoại:</strong> {companyPhone}
        </p>
        <p>
          <strong>Email:</strong> {companyEmail}
        </p>
        <p>
          <strong>Mã số thuế:</strong> {carrierTaxCode}
        </p>
        <p>
          <strong>Người đại diện:</strong> {representativeName}
        </p>
        <p>
          <strong>Chức vụ:</strong> {representativeTitle}
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
        <p>1.2. {serviceDescription}</p>
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
              <td>{formatDate(contractData.orderInfo.createdAt)}</td>
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
          {contractData.orderInfo.category.categoryName}
        </p>
        <p>
          <strong>Mô tả danh mục:</strong>{" "}
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
                          ? formatDate(detail.estimatedStartTime)
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
              // Group steps by sizeRuleName to use rowSpan for vehicle type columns
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
                steps.forEach((step, stepIndex) => {
                  rows.push(
                    <tr key={`${sizeRuleName}-${stepIndex}`}>
                      {/* Only render vehicle type and count on first row of each group */}
                      {stepIndex === 0 && (
                        <>
                          <td rowSpan={steps.length} style={{ verticalAlign: 'middle' }}>
                            {sizeRuleName}
                          </td>
                          <td rowSpan={steps.length} style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                            {step.numOfVehicles}
                          </td>
                        </>
                      )}
                      <td>{step.distanceRange}</td>
                      <td>{formatCurrency(step.unitPrice)}</td>
                      <td>{step.appliedKm.toFixed(2)}</td>
                      <td>{formatCurrency(step.subtotal)}</td>
                    </tr>
                  );
                });
              });
              return rows;
            })()}
          </tbody>
        </table>

        {/* Price Breakdown Section - Professional Text-based Contract Style */}
        <div style={{ marginTop: "15pt", lineHeight: "1.8" }}>
          <p style={{ marginBottom: "10pt" }}>
            <strong>3.1. Chi phí vận chuyển:</strong>
          </p>
          
          {/* Base transport calculation - grouped by vehicle type with detailed breakdown */}
          <p style={{ marginLeft: "15pt", marginBottom: "6pt" }}>
            a) Cước vận chuyển cơ bản theo quãng đường {contractData.distanceKm.toFixed(2)} km:
          </p>
          {(() => {
            // Group steps by sizeRuleName to show detailed breakdown and totals per vehicle type
            const groupedSteps: {
              [key: string]: { steps: typeof contractData.priceDetails.steps; total: number; vehicleCount: number };
            } = {};

            contractData.priceDetails.steps.forEach((step) => {
              const key = step.sizeRuleName;
              if (!groupedSteps[key]) {
                groupedSteps[key] = { steps: [], total: 0, vehicleCount: step.numOfVehicles };
              }
              groupedSteps[key].steps.push(step);
              groupedSteps[key].total += step.subtotal;
              // Giả định numOfVehicles là số xe cố định theo loại
              groupedSteps[key].vehicleCount = step.numOfVehicles;
            });

            return Object.entries(groupedSteps).map(([sizeRuleName, data]) => (
              <p
                key={sizeRuleName}
                style={{ marginLeft: "30pt", marginBottom: "4pt" }}
              >
                - {sizeRuleName} ({data.vehicleCount} xe):{" "}
                {data.steps.map((step, idx) => (
                  <span key={`${sizeRuleName}-detail-${idx}`}>
                    {idx > 0 && " + "}
                    ({formatCurrency(step.unitPrice)}/km × {step.appliedKm.toFixed(2)} km)
                  </span>
                ))}
                {" = "}
                <strong>{formatCurrency(data.total)}</strong>
              </p>
            ));
          })()}
          
          {(() => {
            // Tính tổng theo từng loại xe để hiển thị công thức cộng rõ ràng
            const groupedTotals: { [key: string]: number } = {};
            contractData.priceDetails.steps.forEach((step) => {
              const key = step.sizeRuleName;
              groupedTotals[key] = (groupedTotals[key] || 0) + step.subtotal;
            });

            const perVehicleTotals = Object.values(groupedTotals);
            const basicTotal = perVehicleTotals.reduce((sum, val) => sum + val, 0);

            return (
              <p style={{ marginLeft: "30pt", marginBottom: "6pt" }}>
                Tổng cước cơ bản: {perVehicleTotals.map((val, idx) => (
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
          <p style={{ marginLeft: "15pt", marginBottom: "6pt" }}>
            b) Hệ số danh mục hàng hóa ({contractData.orderInfo.category.description}): × {contractData.priceDetails.categoryMultiplier}
          </p>

          {/* Category extra fee - applied once per order */}
          {contractData.priceDetails.categoryExtraFee > 0 && (
            <p style={{ marginLeft: "15pt", marginBottom: "6pt" }}>
              c) Phụ thu danh mục ({contractData.orderInfo.category.description}): + <strong>{formatCurrency(contractData.priceDetails.categoryExtraFee)}</strong>
              <span style={{ fontSize: "9pt", color: "#666", marginLeft: "6pt" }}>(tính 1 lần)</span>
            </p>
          )}

          {/* Note: No promotionDiscount - adjustedValue replaces grandTotal if set */}

          {/* Transport subtotal - USE API VALUES */}
          {(() => {
            // Display formula components
            const baseTotal = contractData.priceDetails.steps.reduce((sum, step) => sum + step.subtotal, 0);
            // Use API finalTotal (transport cost A) to ensure consistency
            const transportTotal = contractData.priceDetails.finalTotal || 0;
            
            return (
              <p style={{ marginLeft: "15pt", marginBottom: "12pt", paddingTop: "6pt", borderTop: "1pt dashed #000" }}>
                <strong>Tổng chi phí vận chuyển (A):</strong> {formatCurrency(baseTotal)} × {contractData.priceDetails.categoryMultiplier}
                {contractData.priceDetails.categoryExtraFee > 0 && ` + ${formatCurrency(contractData.priceDetails.categoryExtraFee)}`}
                {" = "}<strong style={{ fontSize: "12pt" }}>{formatCurrency(transportTotal)}</strong>
              </p>
            );
          })()}

          {/* Insurance Section */}
          {contractData.priceDetails.hasInsurance && (
            <>
              <p style={{ marginBottom: "10pt" }}>
                <strong>3.2. Chi phí bảo hiểm hàng hóa:</strong>
              </p>
              <p style={{ marginLeft: "15pt", marginBottom: "6pt" }}>
                - Giá trị hàng hóa khai báo: <strong>{formatCurrency(contractData.priceDetails.totalDeclaredValue || 0)}</strong>
              </p>
              <p style={{ marginLeft: "15pt", marginBottom: "6pt" }}>
                - Tỷ lệ phí bảo hiểm ({contractData.orderInfo.category.description}): {(contractData.priceDetails.insuranceRate || 0).toFixed(2)}%
              </p>
              <p style={{ marginLeft: "15pt", marginBottom: "6pt" }}>
                - Thuế GTGT: {((contractData.priceDetails.vatRate || 0.1) * 100).toFixed(0)}%
              </p>
              <p style={{ marginLeft: "15pt", marginBottom: "12pt", paddingTop: "6pt", borderTop: "1pt dashed #000" }}>
                <strong>Tổng chi phí bảo hiểm (B):</strong> {formatCurrency(contractData.priceDetails.totalDeclaredValue || 0)} × {(contractData.priceDetails.insuranceRate || 0).toFixed(2)}% × (1 + {((contractData.priceDetails.vatRate || 0.1) * 100).toFixed(0)}%) = <strong style={{ fontSize: "12pt" }}>{formatCurrency(contractData.priceDetails.insuranceFee || 0)}</strong>
              </p>
            </>
          )}

          {/* No insurance notice */}
          {!contractData.priceDetails.hasInsurance && (
            <p style={{ marginBottom: "12pt" }}>
              <strong>3.2. Chi phí bảo hiểm hàng hóa (B):</strong> Khách hàng không đăng ký bảo hiểm = <strong>0 đ</strong>
            </p>
          )}

          {/* Display adjusted value if enabled */}
          {customization.hasAdjustedValue && adjustedValue > 0 && (
            <p style={{ marginBottom: "12pt" }}>
              <strong>Giá trị điều chỉnh:</strong> <strong>{formatCurrency(adjustedValue)}</strong>
            </p>
          )}

          {/* Grand Total */}
          <p style={{ 
            marginTop: "12pt", 
            paddingTop: "10pt", 
            borderTop: "2pt solid #000",
            fontSize: "12pt"
          }}>
            <strong>3.3. TỔNG GIÁ TRỊ HỢP ĐỒNG (A + B):</strong>{" "}
            <strong style={{ fontSize: "14pt", textDecoration: "underline" }}>
              {formatCurrency(contractData.priceDetails.grandTotal || contractData.priceDetails.finalTotal)}
            </strong>
            <span style={{ marginLeft: "6pt" }}>
              (Bằng chữ: {numberToVietnameseWords(contractData.priceDetails.grandTotal || contractData.priceDetails.finalTotal)})
            </span>
          </p>
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
                    <span style={{ marginLeft: "6pt", color: "#666" }}>
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
          <p>- Phương thức thanh toán: {paymentMethod}</p>
          <p>
            - Quy định bảo hiểm: Hàng thông thường {(contractData.contractSettings.insuranceRateNormal || 0.08).toFixed(2)}%, 
            hàng dễ vỡ {(contractData.contractSettings.insuranceRateFragile || 0.15).toFixed(2)}% giá trị khai báo 
            (đã bao gồm 10% VAT)
          </p>
          {adjustedValue > 0 && (
            <p style={{ fontWeight: "bold" }}>
              - Giá trị điều chỉnh: {formatCurrency(adjustedValue)} (đã bao gồm trong tổng giá trị hợp đồng)
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
        <p>- {warrantyTerms}</p>

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
        <p>6.4. {generalTerms}</p>
        <div>
          <p style={{ marginBottom: "5px" }}>
            <strong>Thời gian hiệu lực:</strong> Từ ngày {effectiveDate} đến
            ngày {expirationDate}
          </p>
        </div>
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
            <strong>{companyName}</strong>
          </p>
          <p style={{ marginTop: "60px" }}>________________</p>
          <p>{representativeName}</p>
          <p>
            <em>{representativeTitle}</em>
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

export default ContractExportContent;
