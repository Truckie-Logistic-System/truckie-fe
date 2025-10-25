import React from "react";
import type { ContractData } from "../../../services/contract/contractTypes";
import { formatCurrency, formatDate } from "../../../utils/formatters";

interface ContractCustomization {
  effectiveDate: string;
  expirationDate: string;
  hasAdjustedValue: boolean;
  adjustedValue: number;
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
}

const StaffContractPreview: React.FC<StaffContractPreviewProps> = ({
  contractData,
  customization,
  content,
}) => {
  const currentDate = new Date().toLocaleDateString("vi-VN");

  // Use customization dates if provided, otherwise use default
  const effectiveDate = customization?.effectiveDate
    ? new Date(customization.effectiveDate).toLocaleDateString("vi-VN")
    : currentDate;
  const expirationDate = customization?.expirationDate
    ? new Date(customization.expirationDate).toLocaleDateString("vi-VN")
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(
        "vi-VN"
      );
  const adjustedValue = customization?.hasAdjustedValue
    ? customization.adjustedValue
    : 0;

  // Use content customization if provided, otherwise use defaults
  const companyName = content?.companyName || "TRUCKIE LOGISTICS";
  const companyAddress =
    content?.companyAddress || "Số 123, Đường ABC, Quận XYZ, TP. Hồ Chí Minh";
  const companyPhone = content?.companyPhone || "0123 456 789";
  const companyEmail = content?.companyEmail || "contact@truckie.vn";
  const representativeName =
    content?.representativeName || "[Tên người đại diện]";
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

  // Calculate deposit amount
  const depositAmount =
    (contractData.priceDetails.finalTotal *
      contractData.contractSettings.depositPercent) /
    100;

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
            {contractData.priceDetails.steps.map((step, index) => (
              <tr key={index}>
                <td>{step.vehicleRuleName}</td>
                <td>{step.numOfVehicles}</td>
                <td>{step.distanceRange}</td>
                <td>{formatCurrency(step.unitPrice)}</td>
                <td>{step.appliedKm.toFixed(2)}</td>
                <td>{formatCurrency(step.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div
          style={{
            marginTop: "20px",
            border: "1px solid #d9d9d9",
            padding: "15px",
            borderRadius: "4px",
            backgroundColor: "#fafafa",
          }}
        >
          <div
            style={{
              marginBottom: "12px",
              paddingBottom: "12px",
              borderBottom: "1px dashed #d9d9d9",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div style={{ flex: 1 }}>
                <strong>Tổng tiền trước điều chỉnh:</strong>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#666",
                    marginTop: "4px",
                    fontStyle: "italic",
                  }}
                >
                  {contractData.priceDetails.steps.map((step, index) => (
                    <span key={index}>
                      {index > 0 && " + "}({formatCurrency(step.unitPrice)} ×{" "}
                      {step.appliedKm.toFixed(2)} km)
                    </span>
                  ))}
                </div>
              </div>
              <div
                style={{
                  textAlign: "right",
                  fontWeight: "bold",
                  minWidth: "150px",
                }}
              >
                {formatCurrency(
                  contractData.priceDetails.totalBeforeAdjustment
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              marginBottom: "8px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>
              <strong>Phí danh mục thêm:</strong>
            </span>
            <span>
              {formatCurrency(contractData.priceDetails.categoryExtraFee)}
            </span>
          </div>

          <div
            style={{
              marginBottom: "8px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>
              <strong>Hệ số danh mục:</strong>
            </span>
            <span>{contractData.priceDetails.categoryMultiplier}</span>
          </div>

          <div
            style={{
              marginBottom: "12px",
              paddingBottom: "12px",
              borderBottom: "1px dashed #d9d9d9",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>
              <strong>Giảm giá khuyến mãi:</strong>
            </span>
            <span style={{ color: "#52c41a", fontWeight: "bold" }}>
              -{formatCurrency(contractData.priceDetails.promotionDiscount)}
            </span>
          </div>

          <div
            className="highlight"
            style={{
              padding: "10px",
              backgroundColor: "#fff2cc",
              borderRadius: "4px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <strong style={{ fontSize: "14px" }}>TỔNG GIÁ TRỊ HỢP ĐỒNG:</strong>
            <strong style={{ fontSize: "16px", color: "#d4380d" }}>
              {formatCurrency(contractData.priceDetails.finalTotal)}
            </strong>
          </div>
        </div>

        <div style={{ marginTop: "20px" }}>
          <p>
            <strong>Điều kiện thanh toán:</strong>
          </p>
          <p>
            - Đặt cọc: {contractData.contractSettings.depositPercent}% (
            {formatCurrency(depositAmount)}) trong vòng{" "}
            {contractData.contractSettings.expiredDepositDate} ngày
          </p>
          <p>
            - Thanh toán còn lại:{" "}
            {formatCurrency(
              contractData.priceDetails.finalTotal - depositAmount
            )}{" "}
            khi hoàn thành dịch vụ
          </p>
          <p>- Phương thức thanh toán: {paymentMethod}</p>
          <p>
            - Phí bảo hiểm: {contractData.contractSettings.insuranceRate}% giá
            trị hàng hóa
          </p>
          {adjustedValue > 0 && (
            <p style={{ color: "#059669", fontWeight: "bold" }}>
              - Giá trị điều chỉnh: {formatCurrency(adjustedValue)} (đã bao gồm
              trong tổng giá trị hợp đồng)
            </p>
          )}
        </div>
      </div>

      <div className="terms-section">
        <div className="terms-title">ĐIỀU 4: PHÂN CÔNG XE VÀ TÀI XẾ</div>
        {contractData.assignResult && contractData.assignResult.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Chỉ số xe</th>
                <th>Loại xe</th>
                <th>Tải trọng hiện tại</th>
                <th>Số chi tiết được giao</th>
              </tr>
            </thead>
            <tbody>
              {contractData.assignResult.map((assign, index) => (
                <tr key={index}>
                  <td>{assign.vehicleIndex}</td>
                  <td>{assign.vehicleRuleName}</td>
                  <td>{assign.currentLoad}</td>
                  <td>{assign.assignedDetails.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
          <em>Hợp đồng được lập tại TP. Hồ Chí Minh, ngày {currentDate}</em>
        </p>
      </div>
    </div>
  );
};

export default StaffContractPreview;
