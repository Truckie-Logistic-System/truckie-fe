import React from "react";
import type { Order } from "../../../models";
import { formatCurrency, formatDate } from "../../../utils/formatters";

interface ContractPreviewProps {
  order: Order;
  contractData?: {
    contractName?: string;
    effectiveDate?: string;
    expirationDate?: string;
    supportedValue?: number;
    description?: string;
  };
}

const ContractPreview: React.FC<ContractPreviewProps> = ({
  order,
  contractData,
}) => {
  const currentDate = new Date().toLocaleDateString("vi-VN");

  return (
    <div className="contract-preview bg-white p-8 max-w-4xl mx-auto">
      <style jsx>{`
        .contract-preview {
          font-family: "Times New Roman", serif;
          line-height: 1.6;
          color: #000;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .title {
          font-size: 18px;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .subtitle {
          font-size: 14px;
          margin-bottom: 5px;
        }
        .contract-info {
          margin-bottom: 30px;
        }
        .party-info {
          margin-bottom: 20px;
        }
        .party-title {
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .terms-section {
          margin-bottom: 20px;
        }
        .terms-title {
          font-weight: bold;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        .signature-section {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
        }
        .signature-box {
          text-align: center;
          width: 200px;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .table th,
        .table td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
        }
        .table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
      `}</style>

      {/* Header */}
      <div className="header">
        <div className="title">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
        <div className="subtitle">Độc lập - Tự do - Hạnh phúc</div>
        <div
          style={{
            margin: "20px 0",
            borderBottom: "2px solid #000",
            width: "200px",
            margin: "20px auto",
          }}
        ></div>
        <div className="title" style={{ marginTop: "30px" }}>
          HỢP ĐỒNG DỊCH VỤ LOGISTICS
        </div>
        <div className="subtitle">Số: {order.orderCode}</div>
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
          <strong>Tên công ty:</strong> TRUCKIE LOGISTICS
        </p>
        <p>
          <strong>Địa chỉ:</strong> Số 123, Đường ABC, Quận XYZ, TP. Hồ Chí Minh
        </p>
        <p>
          <strong>Điện thoại:</strong> 0123 456 789
        </p>
        <p>
          <strong>Email:</strong> contact@truckie.vn
        </p>
        <p>
          <strong>Người đại diện:</strong> [Tên người đại diện]
        </p>
        <p>
          <strong>Chức vụ:</strong> Giám đốc
        </p>
      </div>

      <div className="party-info">
        <div className="party-title">
          BÊN B: KHÁCH HÀNG (Bên sử dụng dịch vụ)
        </div>
        {order.sender ? (
          <>
            <p>
              <strong>Tên khách hàng:</strong> {order.sender.representativeName}
            </p>
            <p>
              <strong>Địa chỉ:</strong> {order.pickupAddress?.street} {", "}
              {order.pickupAddress?.ward} {", "} {order.pickupAddress?.province}
            </p>
            <p>
              <strong>Điện thoại:</strong> {order.sender.representativePhone}
            </p>
            <p>
              <strong>Email:</strong>{" "}
              {order.sender.representativeEmail || "N/A"}
            </p>
          </>
        ) : (
          <p>Thông tin khách hàng không có sẵn</p>
        )}
      </div>

      {/* Contract Terms */}
      <div className="terms-section">
        <div className="terms-title">ĐIỀU 1: ĐĂNG KÝ DỊCH VỤ</div>
        <p>
          1.1. Bên A đồng ý cung cấp dịch vụ logistics cho Bên B theo các điều
          khoản được quy định trong hợp đồng này.
        </p>
        <p>
          1.2. Dịch vụ bao gồm: Vận chuyển hàng hóa từ điểm lấy hàng đến điểm
          giao hàng theo yêu cầu của Bên B.
        </p>
      </div>

      <div className="terms-section">
        <div className="terms-title">ĐIỀU 2: CHI TIẾT ĐĂN HÀNG</div>
        <table className="table">
          <thead>
            <tr>
              <th>Mã đơn hàng</th>
              <th>Ngày tạo</th>
              <th>Địa chỉ lấy hàng</th>
              <th>Địa chỉ giao hàng</th>
              <th>Tổng giá trị</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{order.orderCode}</td>
              <td>{formatDate(order.createdAt)}</td>
              <td>{order.pickupAddress?.address || "N/A"}</td>
              <td>{order.deliveryAddress?.address || "N/A"}</td>
              <td>{formatCurrency(order.totalPrice || 0)}</td>
            </tr>
          </tbody>
        </table>

        {order.orderDetails && order.orderDetails.length > 0 && (
          <>
            <p>
              <strong>Chi tiết hàng hóa:</strong>
            </p>
            <table className="table">
              <thead>
                <tr>
                  <th>Tên hàng hóa</th>
                  {/* <th>Số lượng</th> */}
                  <th>Trọng lượng (kg)</th>
                  <th>Giá trị (VNĐ)</th>
                </tr>
              </thead>
              <tbody>
                {order.orderDetails.map((detail, index) => (
                  <tr key={index}>
                    <td>{detail.trackingCode}</td>
                    {/* <td>{detail.quantity}</td> */}
                    <td>{detail.weight}</td>
                    <td>{formatCurrency(detail.value || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      <div className="terms-section">
        <div className="terms-title">
          ĐIỀU 3: GIÁ TRỊ HỢP ĐỒNG VÀ ĐIỀU KIỆN THANH TOÁN
        </div>
        <p>
          3.1. Tổng giá trị hợp đồng:{" "}
          <strong>
            {formatCurrency(
              contractData?.supportedValue || order.totalPrice || 0
            )}
          </strong>
        </p>
        <p>3.2. Phương thức thanh toán: Chuyển khoản hoặc tiền mặt</p>
        <p>
          3.3. Thời hạn thanh toán: Trong vòng 7 ngày kể từ khi hoàn thành dịch
          vụ
        </p>
      </div>

      <div className="terms-section">
        <div className="terms-title">ĐIỀU 4: THỜI GIAN HIỆU LỰC</div>
        <p>
          4.1. Hợp đồng có hiệu lực từ ngày:{" "}
          <strong>
            {contractData?.effectiveDate
              ? formatDate(contractData.effectiveDate)
              : currentDate}
          </strong>
        </p>
        <p>
          4.2. Hợp đồng hết hiệu lực vào ngày:{" "}
          <strong>
            {contractData?.expirationDate
              ? formatDate(contractData.expirationDate)
              : "Khi hoàn thành dịch vụ"}
          </strong>
        </p>
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
          <strong>5.2. Quyền và nghĩa vụ của Bên B:</strong>
        </p>
        <p>- Cung cấp đầy đủ, chính xác thông tin về hàng hóa</p>
        <p>- Thanh toán đầy đủ chi phí dịch vụ theo thỏa thuận</p>
        <p>- Phối hợp với Bên A trong quá trình thực hiện dịch vụ</p>
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
      </div>

      {contractData?.description && (
        <div className="terms-section">
          <div className="terms-title">GHI CHÚ THÊM</div>
          <p>{contractData.description}</p>
        </div>
      )}

      {/* Signature Section */}
      <div className="signature-section">
        <div className="signature-box">
          <p>
            <strong>BÊN A</strong>
          </p>
          <p>
            <strong>TRUCKIE LOGISTICS</strong>
          </p>
          <p style={{ marginTop: "60px" }}>________________</p>
          <p>[Tên người đại diện]</p>
        </div>
        <div className="signature-box">
          <p>
            <strong>BÊN B</strong>
          </p>
          <p>
            <strong>KHÁCH HÀNG</strong>
          </p>
          <p style={{ marginTop: "60px" }}>________________</p>
          <p>{order.sender?.representativeName || "[Tên khách hàng]"}</p>
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

export default ContractPreview;
